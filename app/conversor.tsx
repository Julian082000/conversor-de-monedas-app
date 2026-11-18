import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Accelerometer } from "expo-sensors";
import * as Haptics from "expo-haptics";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { apiFetch } from "../src/api/cliente";
import { limpiarSesion } from "../src/auth/sesion";
import {
  guardarTasasCache,
  leerTasasCache,
  listarFavoritos,
  guardarFavoritoLocal,
  eliminarFavoritoLocal,
  limpiarDatosLocales,
  ParFavorito,
} from "../src/db/sqlite";
import { calcularMontoConvertido, ejecutarSincronizacion } from "../src/sync/motor";
import { GraficaHistorial } from "../src/components/GraficaHistorial";
import { useTema } from "../src/theme/TemaContext";

interface InfoMoneda {
  codigo: string;
  bandera: string;
  nombre: string;
}

const MONEDAS: InfoMoneda[] = [
  { codigo: "USD", bandera: "🇺🇸", nombre: "Dólar EE.UU." },
  { codigo: "COP", bandera: "🇨🇴", nombre: "Peso Colombiano" },
  { codigo: "EUR", bandera: "🇪🇺", nombre: "Euro" },
  { codigo: "HKD", bandera: "🇭🇰", nombre: "Dólar Hongkonés" },
  { codigo: "MXN", bandera: "🇲🇽", nombre: "Peso Mexicano" },
  { codigo: "GBP", bandera: "🇬🇧", nombre: "Libra Esterlina" },
  { codigo: "BRL", bandera: "🇧🇷", nombre: "Real Brasileño" },
  { codigo: "CAD", bandera: "🇨🇦", nombre: "Dólar Canadiense" },
  { codigo: "JPY", bandera: "🇯🇵", nombre: "Yen Japonés" },
  { codigo: "CHF", bandera: "🇨🇭", nombre: "Franco Suizo" },
];

const obtenerBandera = (codigo: string) =>
  MONEDAS.find((m) => m.codigo === codigo)?.bandera ?? "💱";

export default function PantallaConversor() {
  const router = useRouter();
  const { tema } = useTema();
  const [base, setBase] = useState("USD");
  const [destino, setDestino] = useState("COP");
  const [monto, setMonto] = useState("100");
  const [tasas, setTasas] = useState<Record<string, number>>({});
  const [fechaTasa, setFechaTasa] = useState("");
  const [estadoSync, setEstadoSync] = useState<"sincronizado" | "offline">("offline");
  const [favoritos, setFavoritos] = useState<ParFavorito[]>([]);
  const [historial, setHistorial] = useState<{ fecha: string; valor: number }[]>([]);

  const invertirMonedas = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBase((prevBase) => {
      setDestino(prevBase);
      return destino;
    });
  }, [destino]);

  const cargarDatos = useCallback(async () => {
    const cache = await leerTasasCache(base);
    if (cache) {
      setTasas(cache.valores);
      setFechaTasa(cache.fecha);
    }
    setFavoritos(await listarFavoritos());

    try {
      const res = await apiFetch(`/api/tasas?base=${base}`);
      if (res.ok) {
        const data = await res.json();
        setTasas(data.valores);
        setFechaTasa(data.fecha);
        await guardarTasasCache(base, data.fecha, data.valores);
      }
      const histRes = await apiFetch(`/api/tasas/historial?base=${base}&moneda=${destino}`);
      if (histRes.ok) {
        const hData = await histRes.json();
        setHistorial(hData.puntos || []);
      }
      const estado = await ejecutarSincronizacion();
      setEstadoSync(estado);
      setFavoritos(await listarFavoritos());
    } catch {
      setEstadoSync("offline");
    }
  }, [base, destino]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    let ultimoShake = 0;
    Accelerometer.setUpdateInterval(250);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const fuerza = Math.sqrt(x * x + y * y + z * z);
      const ahora = Date.now();
      if (fuerza > 2.3 && ahora - ultimoShake > 1200) {
        ultimoShake = ahora;
        invertirMonedas();
      }
    });
    return () => sub.remove();
  }, [invertirMonedas]);

  const gestoSwipe = Gesture.Fling().direction(1 | 2).onEnd(() => {
    invertirMonedas();
  });

  async function agregarFavorito() {
    await guardarFavoritoLocal(base, destino);
    setFavoritos(await listarFavoritos());
    const estado = await ejecutarSincronizacion();
    setEstadoSync(estado);
  }

  async function quitarFavorito(id: string) {
    await eliminarFavoritoLocal(id);
    setFavoritos(await listarFavoritos());
    const estado = await ejecutarSincronizacion();
    setEstadoSync(estado);
  }

  async function cerrarSesion() {
    await limpiarDatosLocales();
    await limpiarSesion();
    router.replace("/");
  }

  const tasaActual = base === destino ? 1 : (tasas[destino] ?? 0);
  const resultado = calcularMontoConvertido(Number(monto), tasaActual);
  const infoBase = MONEDAS.find((m) => m.codigo === base);
  const infoDestino = MONEDAS.find((m) => m.codigo === destino);

  return (
    <ScrollView style={[styles.contenedor, { backgroundColor: tema.fondo }]}>
      <View style={styles.barraEstado}>
        <Text style={[styles.badge, { color: tema.texto }]}>
          {estadoSync === "sincronizado" ? "🟢 Sincronizado" : "🟠 Modo Offline (SQLite)"}
        </Text>
        <TouchableOpacity onPress={cerrarSesion}>
          <Text style={styles.salir}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      <GestureDetector gesture={gestoSwipe}>
        <View style={[styles.tarjeta, { backgroundColor: tema.tarjeta }]}>
          <Text style={[styles.etiqueta, { color: tema.subtexto }]}>
            Monto en {infoBase?.bandera} {base} ({infoBase?.nombre})
          </Text>
          <TextInput
            style={[styles.inputMonto, { borderColor: tema.primario, color: tema.texto }]}
            keyboardType="numeric"
            value={monto}
            onChangeText={setMonto}
          />
          <View style={styles.filaMonedas}>
            {MONEDAS.map((m) => {
              const activo = base === m.codigo;
              return (
                <TouchableOpacity
                  key={`b-${m.codigo}`}
                  style={[
                    styles.chip,
                    { backgroundColor: activo ? tema.primario : tema.chipFondo },
                  ]}
                  onPress={() => setBase(m.codigo)}
                >
                  <Text style={[styles.chipTexto, { color: activo ? "#FFFFFF" : tema.chipTexto }]}>
                    {m.bandera} {m.codigo}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.btnInvertir, { backgroundColor: tema.invertirFondo }]}
            onPress={invertirMonedas}
          >
            <Text style={[styles.btnInvertirTexto, { color: tema.invertirTexto }]}>
              ⇅ Invertir (o agita / desliza)
            </Text>
          </TouchableOpacity>

          <Text style={[styles.etiqueta, { color: tema.subtexto }]}>
            Convertir a {infoDestino?.bandera} {destino} ({infoDestino?.nombre})
          </Text>
          <View style={styles.filaMonedas}>
            {MONEDAS.map((m) => {
              const activo = destino === m.codigo;
              return (
                <TouchableOpacity
                  key={`d-${m.codigo}`}
                  style={[
                    styles.chip,
                    { backgroundColor: activo ? tema.primario : tema.chipFondo },
                  ]}
                  onPress={() => setDestino(m.codigo)}
                >
                  <Text style={[styles.chipTexto, { color: activo ? "#FFFFFF" : tema.chipTexto }]}>
                    {m.bandera} {m.codigo}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.resultado, { color: tema.texto }]}>
            {infoDestino?.bandera} {resultado.toLocaleString()} {destino}
          </Text>
          <Text style={[styles.subtexto, { color: tema.subtexto }]}>
            1 {infoBase?.bandera} {base} = {tasaActual} {infoDestino?.bandera} {destino} • Tasa del {fechaTasa || "caché"}
          </Text>

          <TouchableOpacity
            style={[styles.btnFav, { backgroundColor: tema.oscuro ? "#020617" : "#0F172A" }]}
            onPress={agregarFavorito}
          >
            <Text style={styles.btnFavTexto}>
              ★ Guardar par {infoBase?.bandera} {base}/{infoDestino?.bandera} {destino}
            </Text>
          </TouchableOpacity>
        </View>
      </GestureDetector>

      <GraficaHistorial puntos={historial} moneda={`${infoDestino?.bandera ?? ""} ${destino}`} />

      <Text style={[styles.subtitulo, { color: tema.texto }]}>Pares Favoritos (Offline-First)</Text>
      {favoritos.map((f) => (
        <View key={f.id} style={[styles.itemFav, { backgroundColor: tema.tarjeta }]}>
          <TouchableOpacity onPress={() => { setBase(f.base); setDestino(f.destino); }}>
            <Text style={[styles.favTexto, { color: tema.primario }]}>
              {obtenerBandera(f.base)} {f.base} → {obtenerBandera(f.destino)} {f.destino}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => quitarFavorito(f.id)}>
            <Text style={styles.eliminar}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 16 },
  barraEstado: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  badge: { fontWeight: "700", fontSize: 13 },
  salir: { color: "#EF4444", fontWeight: "700" },
  tarjeta: { padding: 18, borderRadius: 16, elevation: 3 },
  etiqueta: { fontSize: 13, fontWeight: "700", marginTop: 8 },
  inputMonto: { fontSize: 28, fontWeight: "800", borderBottomWidth: 2, paddingVertical: 6, marginBottom: 10 },
  filaMonedas: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginVertical: 6 },
  chip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  chipTexto: { fontWeight: "700", fontSize: 12 },
  btnInvertir: { padding: 10, borderRadius: 10, alignItems: "center", marginVertical: 10 },
  btnInvertirTexto: { fontWeight: "700" },
  resultado: { fontSize: 28, fontWeight: "900", marginTop: 12, textAlign: "center" },
  subtexto: { fontSize: 12, textAlign: "center", marginTop: 4 },
  btnFav: { padding: 12, borderRadius: 10, alignItems: "center", marginTop: 14 },
  btnFavTexto: { color: "#FFFFFF", fontWeight: "700" },
  subtitulo: { fontSize: 16, fontWeight: "800", marginTop: 18, marginBottom: 8 },
  itemFav: { padding: 14, borderRadius: 10, flexDirection: "row", justifyContent: "space-between", marginBottom: 8, elevation: 1 },
  favTexto: { fontWeight: "700", fontSize: 15 },
  eliminar: { color: "#EF4444", fontWeight: "600" },
});
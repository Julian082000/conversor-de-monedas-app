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
    <ScrollView style={styles.contenedor}>
      <View style={styles.barraEstado}>
        <Text style={styles.badge}>
          {estadoSync === "sincronizado" ? "● Sincronizado" : "● Modo Offline (SQLite)"}
        </Text>
        <TouchableOpacity onPress={cerrarSesion}>
          <Text style={styles.salir}>Salir</Text>
        </TouchableOpacity>
      </View>

      <GestureDetector gesture={gestoSwipe}>
        <View style={styles.tarjeta}>
          <Text style={styles.etiqueta}>
            Monto en {infoBase?.bandera} {base} ({infoBase?.nombre})
          </Text>
          <TextInput
            style={styles.inputMonto}
            keyboardType="numeric"
            value={monto}
            onChangeText={setMonto}
          />
          <View style={styles.filaMonedas}>
            {MONEDAS.map((m) => (
              <TouchableOpacity
                key={`b-${m.codigo}`}
                style={[styles.chip, base === m.codigo && styles.chipActivo]}
                onPress={() => setBase(m.codigo)}
              >
                <Text style={base === m.codigo ? styles.chipTextoActivo : styles.chipTexto}>
                  {m.bandera} {m.codigo}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.btnInvertir} onPress={invertirMonedas}>
            <Text style={styles.btnInvertirTexto}>⇅ Invertir (o agita / desliza)</Text>
          </TouchableOpacity>

          <Text style={styles.etiqueta}>
            Convertir a {infoDestino?.bandera} {destino} ({infoDestino?.nombre})
          </Text>
          <View style={styles.filaMonedas}>
            {MONEDAS.map((m) => (
              <TouchableOpacity
                key={`d-${m.codigo}`}
                style={[styles.chip, destino === m.codigo && styles.chipActivo]}
                onPress={() => setDestino(m.codigo)}
              >
                <Text style={destino === m.codigo ? styles.chipTextoActivo : styles.chipTexto}>
                  {m.bandera} {m.codigo}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.resultado}>
            {infoDestino?.bandera} {resultado.toLocaleString()} {destino}
          </Text>
          <Text style={styles.subtexto}>
            1 {infoBase?.bandera} {base} = {tasaActual} {infoDestino?.bandera} {destino} • Tasa del {fechaTasa || "caché"}
          </Text>

          <TouchableOpacity style={styles.btnFav} onPress={agregarFavorito}>
            <Text style={styles.btnFavTexto}>
              ★ Guardar par {infoBase?.bandera} {base}/{infoDestino?.bandera} {destino}
            </Text>
          </TouchableOpacity>
        </View>
      </GestureDetector>

      <GraficaHistorial puntos={historial} moneda={`${infoDestino?.bandera ?? ""} ${destino}`} />

      <Text style={styles.subtitulo}>Pares Favoritos (Offline-First)</Text>
      {favoritos.map((f) => (
        <View key={f.id} style={styles.itemFav}>
          <TouchableOpacity onPress={() => { setBase(f.base); setDestino(f.destino); }}>
            <Text style={styles.favTexto}>
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
  contenedor: { flex: 1, backgroundColor: "#F1F5F9", padding: 16 },
  barraEstado: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  badge: { fontWeight: "700", color: "#0F172A", fontSize: 13 },
  salir: { color: "#DC2626", fontWeight: "700" },
  tarjeta: { backgroundColor: "#FFFFFF", padding: 18, borderRadius: 16, elevation: 2 },
  etiqueta: { fontSize: 13, fontWeight: "700", color: "#475569", marginTop: 8 },
  inputMonto: { fontSize: 28, fontWeight: "800", borderBottomWidth: 2, borderColor: "#1E40AF", paddingVertical: 6, marginBottom: 10 },
  filaMonedas: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginVertical: 6 },
  chip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: "#E2E8F0" },
  chipActivo: { backgroundColor: "#1E40AF" },
  chipTexto: { fontWeight: "700", color: "#1E293B", fontSize: 12 },
  chipTextoActivo: { fontWeight: "700", color: "#FFFFFF", fontSize: 12 },
  btnInvertir: { backgroundColor: "#EFF6FF", padding: 10, borderRadius: 10, alignItems: "center", marginVertical: 10 },
  btnInvertirTexto: { color: "#1D4ED8", fontWeight: "700" },
  resultado: { fontSize: 28, fontWeight: "900", color: "#0F172A", marginTop: 12, textAlign: "center" },
  subtexto: { fontSize: 12, color: "#64748B", textAlign: "center", marginTop: 4 },
  btnFav: { backgroundColor: "#0F172A", padding: 12, borderRadius: 10, alignItems: "center", marginTop: 14 },
  btnFavTexto: { color: "#FFFFFF", fontWeight: "700" },
  subtitulo: { fontSize: 16, fontWeight: "800", color: "#0F172A", marginTop: 18, marginBottom: 8 },
  itemFav: { backgroundColor: "#FFFFFF", padding: 14, borderRadius: 10, flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  favTexto: { fontWeight: "700", fontSize: 15, color: "#1E40AF" },
  eliminar: { color: "#DC2626", fontWeight: "600" },
});
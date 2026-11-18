import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, PanResponder } from "react-native";
import Svg, { Polyline, Circle, Line } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { useTema } from "../theme/TemaContext";

interface Punto {
  fecha: string;
  valor: number;
}

export function GraficaHistorial({ puntos, moneda }: { puntos: Punto[]; moneda: string }) {
  const { tema } = useTema();
  const [indiceActivo, setIndiceActivo] = useState<number | null>(null);
  const ultimoIndice = useRef<number | null>(null);

  const ancho = 280;
  const alto = 100;

  const actualizarDesdeX = (xTocado: number) => {
    if (puntos.length < 2) return;
    const xLimitado = Math.max(0, Math.min(ancho, xTocado));
    const idx = Math.round((xLimitado / ancho) * (puntos.length - 1));
    if (idx !== ultimoIndice.current) {
      ultimoIndice.current = idx;
      setIndiceActivo(idx);
      Haptics.selectionAsync();
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => actualizarDesdeX(evt.nativeEvent.locationX),
    onPanResponderMove: (evt) => actualizarDesdeX(evt.nativeEvent.locationX),
  });

  if (puntos.length < 2) {
    return (
      <View style={[styles.caja, { backgroundColor: tema.tarjeta }]}>
        <Text style={[styles.texto, { color: tema.subtexto }]}>
          Historial de 7 días disponible al conectar con la red.
        </Text>
      </View>
    );
  }

  const valores = puntos.map((p) => p.valor);
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const rango = max - min || 1;

  const coordenadas = puntos.map((p, i) => {
    const x = (i / (puntos.length - 1)) * ancho;
    const y = alto - ((p.valor - min) / rango) * (alto - 24) - 12;
    return { x, y, fecha: p.fecha, valor: p.valor };
  });

  const puntoSeleccionado = indiceActivo !== null ? coordenadas[indiceActivo] : null;

  return (
    <View style={[styles.caja, { backgroundColor: tema.tarjeta }]}>
      <Text style={[styles.titulo, { color: tema.texto }]}>Últimos 7 días ({moneda})</Text>

      <View style={[styles.visorDato, { backgroundColor: tema.fondo }]}>
        {puntoSeleccionado ? (
          <Text style={[styles.textoDato, { color: tema.primario }]}>
            📅 {puntoSeleccionado.fecha}  •  1 = {puntoSeleccionado.valor.toLocaleString()}
          </Text>
        ) : (
          <Text style={[styles.textoGuia, { color: tema.subtexto }]}>
            👆 Desliza el dedo sobre la gráfica para inspeccionar cada día
          </Text>
        )}
      </View>

      <View {...panResponder.panHandlers} style={{ width: ancho, height: alto }}>
        <Svg width={ancho} height={alto}>
          <Polyline
            fill="none"
            stroke={tema.primario}
            strokeWidth="3"
            points={coordenadas.map((c) => `${c.x},${c.y}`).join(" ")}
          />
          {puntoSeleccionado && (
            <Line
              x1={puntoSeleccionado.x}
              y1={0}
              x2={puntoSeleccionado.x}
              y2={alto}
              stroke={tema.subtexto}
              strokeWidth="1.5"
              strokeDasharray="4,4"
            />
          )}
          {coordenadas.map((c, idx) => {
            const esActivo = idx === indiceActivo;
            return (
              <Circle
                key={idx}
                cx={c.x}
                cy={c.y}
                r={esActivo ? "7" : "4"}
                fill={esActivo ? "#F59E0B" : tema.primario}
                stroke={esActivo ? "#FFFFFF" : "none"}
                strokeWidth={esActivo ? "2" : "0"}
              />
            );
          })}
        </Svg>
      </View>

      <View style={styles.pie}>
        <Text style={[styles.fecha, { color: tema.subtexto }]}>{puntos[0]?.fecha}</Text>
        <Text style={[styles.fecha, { color: tema.subtexto }]}>
          Mín: {min.toFixed(2)} | Máx: {max.toFixed(2)}
        </Text>
        <Text style={[styles.fecha, { color: tema.subtexto }]}>{puntos[puntos.length - 1]?.fecha}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  caja: { padding: 14, borderRadius: 14, marginTop: 14, alignItems: "center", elevation: 2 },
  titulo: { fontWeight: "700", marginBottom: 6, fontSize: 15 },
  visorDato: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, marginBottom: 10, width: "100%", alignItems: "center" },
  textoDato: { fontWeight: "800", fontSize: 13 },
  textoGuia: { fontSize: 12 },
  texto: { fontSize: 13 },
  pie: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginTop: 8 },
  fecha: { fontSize: 11 },
});
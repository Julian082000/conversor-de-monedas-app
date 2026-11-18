import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Polyline, Circle } from "react-native-svg";

interface Punto {
  fecha: string;
  valor: number;
}

export function GraficaHistorial({ puntos, moneda }: { puntos: Punto[]; moneda: string }) {
  if (puntos.length < 2) {
    return (
      <View style={styles.caja}>
        <Text style={styles.texto}>Historial de 7 días disponible al conectar con la red.</Text>
      </View>
    );
  }

  const valores = puntos.map((p) => p.valor);
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const rango = max - min || 1;
  const ancho = 280;
  const alto = 90;

  const coords = puntos.map((p, i) => {
    const x = (i / (puntos.length - 1)) * ancho;
    const y = alto - ((p.valor - min) / rango) * (alto - 20) - 10;
    return `${x},${y}`;
  });

  return (
    <View style={styles.caja}>
      <Text style={styles.titulo}>Últimos 7 días ({moneda})</Text>
      <Svg width={ancho} height={alto}>
        <Polyline fill="none" stroke="#1E40AF" strokeWidth="3" points={coords.join(" ")} />
        {coords.map((c, idx) => {
          const [cx, cy] = c.split(",");
          return <Circle key={idx} cx={cx} cy={cy} r="4" fill="#1D4ED8" />;
        })}
      </Svg>
      <View style={styles.pie}>
        <Text style={styles.fecha}>{puntos[0]?.fecha}</Text>
        <Text style={styles.fecha}>Mín: {min.toFixed(4)} | Máx: {max.toFixed(4)}</Text>
        <Text style={styles.fecha}>{puntos[puntos.length - 1]?.fecha}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  caja: { backgroundColor: "#F8FAFC", padding: 14, borderRadius: 12, marginTop: 14, alignItems: "center" },
  titulo: { fontWeight: "700", color: "#0F172A", marginBottom: 8 },
  texto: { color: "#64748B", fontSize: 13 },
  pie: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginTop: 6 },
  fecha: { fontSize: 11, color: "#475569" },
});
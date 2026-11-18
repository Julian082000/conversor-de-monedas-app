import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Polyline, Circle } from "react-native-svg";
import { useTema } from "../theme/TemaContext";

interface Punto {
  fecha: string;
  valor: number;
}

export function GraficaHistorial({ puntos, moneda }: { puntos: Punto[]; moneda: string }) {
  const { tema } = useTema();

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
  const ancho = 280;
  const alto = 90;

  const coords = puntos.map((p, i) => {
    const x = (i / (puntos.length - 1)) * ancho;
    const y = alto - ((p.valor - min) / rango) * (alto - 20) - 10;
    return `${x},${y}`;
  });

  return (
    <View style={[styles.caja, { backgroundColor: tema.tarjeta }]}>
      <Text style={[styles.titulo, { color: tema.texto }]}>Últimos 7 días ({moneda})</Text>
      <Svg width={ancho} height={alto}>
        <Polyline fill="none" stroke={tema.primario} strokeWidth="3" points={coords.join(" ")} />
        {coords.map((c, idx) => {
          const [cx, cy] = c.split(",");
          return <Circle key={idx} cx={cx} cy={cy} r="4" fill={tema.primario} />;
        })}
      </Svg>
      <View style={styles.pie}>
        <Text style={[styles.fecha, { color: tema.subtexto }]}>{puntos[0]?.fecha}</Text>
        <Text style={[styles.fecha, { color: tema.subtexto }]}>
          Mín: {min.toFixed(4)} | Máx: {max.toFixed(4)}
        </Text>
        <Text style={[styles.fecha, { color: tema.subtexto }]}>{puntos[puntos.length - 1]?.fecha}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  caja: { padding: 14, borderRadius: 14, marginTop: 14, alignItems: "center", elevation: 2 },
  titulo: { fontWeight: "700", marginBottom: 8 },
  texto: { fontSize: 13 },
  pie: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginTop: 6 },
  fecha: { fontSize: 11 },
});
import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Circle, Path, Text as SvgText, Defs, LinearGradient, Stop } from "react-native-svg";

export function LogoConversor() {
  return (
    <View style={styles.contenedor}>
      <Svg width={150} height={115} viewBox="0 0 150 115">
        <Defs>
          <LinearGradient id="gradAzul" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#1D4ED8" />
            <Stop offset="100%" stopColor="#0F172A" />
          </LinearGradient>
          <LinearGradient id="gradOro" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#F59E0B" />
            <Stop offset="100%" stopColor="#D97706" />
          </LinearGradient>
        </Defs>

        {/* Moneda izquierda (Dólar) */}
        <Circle cx="52" cy="58" r="36" fill="url(#gradAzul)" stroke="#93C5FD" strokeWidth="2.5" />
        <SvgText x="52" y="69" fontSize="30" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">
          $
        </SvgText>

        {/* Moneda derecha (Euro / Divisa global) */}
        <Circle cx="98" cy="58" r="36" fill="url(#gradOro)" stroke="#FDE68A" strokeWidth="2.5" />
        <SvgText x="98" y="69" fontSize="28" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">
          €
        </SvgText>

        {/* Flechas circulares de intercambio */}
        <Path
          d="M 55 16 Q 75 4 95 16"
          fill="none"
          stroke="#3B82F6"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <Path d="M 91 10 L 97 17 L 88 19 Z" fill="#3B82F6" />

        <Path
          d="M 95 100 Q 75 112 55 100"
          fill="none"
          stroke="#F59E0B"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <Path d="M 59 106 L 53 99 L 62 97 Z" fill="#F59E0B" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { alignItems: "center", marginBottom: 12 },
});
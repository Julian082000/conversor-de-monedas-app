import React, { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Stop, Text as SvgText } from "react-native-svg";

export function LogoConversor() {
  const giro = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animacion = Animated.loop(
      Animated.timing(giro, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animacion.start();
    return () => animacion.stop();
  }, [giro]);

  const rotacion = giro.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={{ alignItems: "center", marginBottom: 12 }}>
      <Animated.View style={{ transform: [{ rotate: rotacion }] }}>
        <Svg width={92} height={92} viewBox="0 0 100 100">
          <Defs>
            <LinearGradient id="gradMoneda" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#10B981" />
              <Stop offset="100%" stopColor="#2563EB" />
            </LinearGradient>
          </Defs>
          <Circle cx="50" cy="50" r="44" fill="url(#gradMoneda)" />
          <Circle cx="50" cy="50" r="36" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeDasharray="6 4" />
          <Path
            d="M32 36 C38 26, 62 26, 68 36 M68 64 C62 74, 38 74, 32 64"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <SvgText
            x="50"
            y="57"
            fontSize="24"
            fontWeight="bold"
            fill="#FFFFFF"
            textAnchor="middle"
          >
            $ ⇄ €
          </SvgText>
        </Svg>
      </Animated.View>
    </View>
  );
}
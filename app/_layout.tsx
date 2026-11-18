import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { TouchableOpacity, Text } from "react-native";
import { TemaProvider, useTema } from "../src/theme/TemaContext";

function NavegacionConTema() {
  const { tema, alternarTema } = useTema();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: tema.oscuro ? "#020617" : "#0F172A" },
        headerTintColor: "#FFFFFF",
        headerRight: () => (
          <TouchableOpacity
            onPress={alternarTema}
            style={{
              backgroundColor: tema.oscuro ? "#1E293B" : "#1E40AF",
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 12 }}>
              {tema.oscuro ? "☀️ Claro" : "🌙 Oscuro"}
            </Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen name="index" options={{ title: "Divisas Offline" }} />
      <Stack.Screen name="conversor" options={{ title: "Conversor" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TemaProvider>
        <NavegacionConTema />
      </TemaProvider>
    </GestureHandlerRootView>
  );
}
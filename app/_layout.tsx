import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerStyle: { backgroundColor: "#0F172A" }, headerTintColor: "#FFF" }}>
        <Stack.Screen name="index" options={{ title: "Iniciar Sesión" }} />
        <Stack.Screen name="conversor" options={{ title: "Conversor de Monedas" }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
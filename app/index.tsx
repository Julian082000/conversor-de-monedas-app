import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { LogoConversor } from "../src/components/LogoConversor";
import { obtenerSesion, guardarSesion } from "../src/auth/sesion";
import { peticionApi } from "../src/api/cliente";
import { useTema } from "../src/theme/TemaContext";

export default function PantallaLogin() {
  const router = useRouter();
  const { colores } = useTema();
  const [modoRegistro, setModoRegistro] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    obtenerSesion().then((sesion) => {
      if (sesion?.token) {
        router.replace("/conversor");
      } else {
        setVerificando(false);
      }
    });
  }, [router]);

  const manejarEnvio = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Campos incompletos", "Ingresa tu correo y contraseña.");
      return;
    }
    setCargando(true);
    try {
      const ruta = modoRegistro ? "/api/auth/registro" : "/api/auth/login";
      const datos = await peticionApi<{
        token: string;
        refreshToken: string;
        email: string;
      }>(ruta, {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      await guardarSesion(datos.token, datos.refreshToken, datos.email || email.trim());
      router.replace("/conversor");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo iniciar sesión";
      Alert.alert("Error de acceso", msg);
    } finally {
      setCargando(false);
    }
  };

  if (verificando) {
    return (
      <View style={[styles.centrado, { backgroundColor: colores.fondo }]}>
        <ActivityIndicator size="large" color={colores.primario} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colores.fondo }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContenido}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.tarjeta, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
          <LogoConversor />

          <Text style={[styles.titulo, { color: colores.texto }]}>
            Conversor Offline-First
          </Text>
          <Text style={[styles.subtitulo, { color: colores.textoSecundario }]}>
            {modoRegistro ? "Crea tu cuenta para sincronizar divisas" : "Inicia sesión para gestionar tus tasas"}
          </Text>

          <Text style={[styles.etiqueta, { color: colores.texto }]}>Correo electrónico</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colores.fondo,
                color: colores.texto,
                borderColor: colores.borde,
              },
            ]}
            placeholder="usuario@correo.com"
            placeholderTextColor={colores.textoSecundario}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={[styles.etiqueta, { color: colores.texto }]}>Contraseña</Text>
          <View
            style={[
              styles.contenedorClave,
              { backgroundColor: colores.fondo, borderColor: colores.borde },
            ]}
          >
            <TextInput
              style={[styles.inputClave, { color: colores.texto }]}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={colores.textoSecundario}
              secureTextEntry={!verClave}
              value={password}
              onChangeText={setPassword}
            />
            <Pressable onPress={() => setVerClave(!verClave)} style={styles.botonOjo}>
              <Text style={{ color: colores.primario, fontWeight: "600", fontSize: 13 }}>
                {verClave ? "Ocultar" : "Ver"}
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={manejarEnvio}
            disabled={cargando}
            style={[styles.botonPrincipal, { backgroundColor: colores.primario, opacity: cargando ? 0.7 : 1 }]}
          >
            {cargando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.textoBoton}>
                {modoRegistro ? "Registrarme" : "Entrar"}
              </Text>
            )}
          </Pressable>

          <Pressable onPress={() => setModoRegistro(!modoRegistro)} style={styles.enlaceCambio}>
            <Text style={{ color: colores.primario, fontWeight: "600", textAlign: "center" }}>
              {modoRegistro ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate aquí"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centrado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContenido: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 32,
  },
  tarjeta: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 22,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 14,
  },
  contenedorClave: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 20,
  },
  inputClave: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  botonOjo: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  botonPrincipal: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  textoBoton: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  enlaceCambio: {
    marginTop: 16,
    paddingVertical: 6,
  },
});
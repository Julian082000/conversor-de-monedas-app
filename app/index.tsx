import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { API_URL } from "../src/api/cliente";
import { guardarSesion, obtenerToken } from "../src/auth/sesion";

export default function PantallaAuth() {
  const router = useRouter();
  const [esRegistro, setEsRegistro] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerToken().then((t) => {
      if (t) router.replace("/conversor");
      else setCargando(false);
    });
  }, [router]);

  async function enviar() {
    setError("");
    setCargando(true);
    try {
      const ruta = esRegistro ? "/api/auth/registro" : "/api/auth/login";
      const res = await fetch(`${API_URL}${ruta}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error de autenticación");
        setCargando(false);
        return;
      }
      await guardarSesion(data.token, data.refreshToken, data.usuario.email);
      router.replace("/conversor");
    } catch {
      setError("Sin conexión con el servidor");
      setCargando(false);
    }
  }

  if (cargando) return <View style={styles.centro}><ActivityIndicator size="large" color="#1E40AF" /></View>;

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>{esRegistro ? "Crear Cuenta" : "Bienvenido"}</Text>
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña (mín. 8 caracteres)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.boton} onPress={enviar}>
        <Text style={styles.botonTexto}>{esRegistro ? "Registrarme" : "Entrar"}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setEsRegistro(!esRegistro)}>
        <Text style={styles.enlace}>
          {esRegistro ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, justifyContent: "center", alignItems: "center" },
  contenedor: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#FFFFFF" },
  titulo: { fontSize: 26, fontWeight: "800", color: "#0F172A", marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 16 },
  boton: { backgroundColor: "#1E40AF", padding: 16, borderRadius: 10, alignItems: "center", marginTop: 8 },
  botonTexto: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  enlace: { color: "#1E40AF", textAlign: "center", marginTop: 18, fontWeight: "600" },
  error: { color: "#DC2626", marginBottom: 10, textAlign: "center" },
});
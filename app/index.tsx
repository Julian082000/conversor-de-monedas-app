import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { API_URL } from "../src/api/cliente";
import { guardarSesion, obtenerToken } from "../src/auth/sesion";
import { LogoConversor } from "../src/components/LogoConversor";
import { useTema } from "../src/theme/TemaContext";

export default function PantallaAuth() {
  const router = useRouter();
  const { tema } = useTema();
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

  if (cargando) {
    return (
      <View style={[styles.centro, { backgroundColor: tema.fondo }]}>
        <ActivityIndicator size="large" color={tema.primario} />
      </View>
    );
  }

  return (
    <View style={[styles.contenedor, { backgroundColor: tema.fondo }]}>
      <View style={[styles.tarjeta, { backgroundColor: tema.tarjeta }]}>
        <LogoConversor />
        <Text style={[styles.titulo, { color: tema.texto }]}>
          {esRegistro ? "Crear Cuenta" : "Conversor Global"}
        </Text>
        <Text style={[styles.subtitulo, { color: tema.subtexto }]}>
          Tasas de cambio en tiempo real y sincronización offline
        </Text>

        <TextInput
          style={[
            styles.input,
            { backgroundColor: tema.inputFondo, borderColor: tema.borde, color: tema.texto },
          ]}
          placeholder="Correo electrónico"
          placeholderTextColor={tema.subtexto}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={[
            styles.input,
            { backgroundColor: tema.inputFondo, borderColor: tema.borde, color: tema.texto },
          ]}
          placeholder="Contraseña (mín. 8 caracteres)"
          placeholderTextColor={tema.subtexto}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={[styles.boton, { backgroundColor: tema.primario }]} onPress={enviar}>
          <Text style={styles.botonTexto}>{esRegistro ? "Registrarme" : "Iniciar Sesión"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setEsRegistro(!esRegistro)}>
          <Text style={[styles.enlace, { color: tema.primario }]}>
            {esRegistro ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, justifyContent: "center", alignItems: "center" },
  contenedor: { flex: 1, padding: 20, justifyContent: "center" },
  tarjeta: { padding: 24, borderRadius: 20, elevation: 4 },
  titulo: { fontSize: 26, fontWeight: "800", textAlign: "center" },
  subtitulo: { fontSize: 13, textAlign: "center", marginBottom: 20, marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 16 },
  boton: { padding: 16, borderRadius: 12, alignItems: "center", marginTop: 8 },
  botonTexto: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  enlace: { textAlign: "center", marginTop: 18, fontWeight: "600" },
  error: { color: "#EF4444", marginBottom: 10, textAlign: "center", fontWeight: "600" },
});
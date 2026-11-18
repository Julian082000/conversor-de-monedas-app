import { obtenerToken, obtenerRefreshToken, guardarSesion, obtenerEmail } from "../auth/sesion";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://26-conversor-de-monedas-api.vercel.app";

export async function apiFetch(ruta: string, opciones: RequestInit = {}): Promise<Response> {
  const token = await obtenerToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opciones.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res = await fetch(`${API_URL}${ruta}`, { ...opciones, headers });
  if (res.status === 401 && token) {
    const renovado = await intentarRenovar();
    if (renovado) {
      headers["Authorization"] = `Bearer ${renovado}`;
      res = await fetch(`${API_URL}${ruta}`, { ...opciones, headers });
    }
  }
  return res;
}

async function intentarRenovar(): Promise<string | null> {
  const refreshToken = await obtenerRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return null;

  const data = await res.json();
  const email = (await obtenerEmail()) || "";
  await guardarSesion(data.token, data.refreshToken, email);
  return data.token;
}

export { API_URL };
# Conversor de Monedas Offline-First (App Móvil)

Aplicación móvil en **React Native + Expo** para conversión de divisas en tiempo real con funcionamiento **Offline-First** mediante **SQLite**, tokens cifrados en **SecureStore** y sincronización **Last-Write-Wins (LWW)** contra la API en Vercel (`https://26-conversor-de-monedas-api.vercel.app`).

## Comandos de Ejecución y Calidad
- `npm install` — Instalar dependencias
- `npx expo start` — Iniciar servidor de desarrollo Expo Go
- `npm run typecheck` — Verificar tipos con TypeScript (`tsc --noEmit`)
- `npm run lint` — Verificar reglas de estilo con ESLint
- `npm test` — Ejecutar pruebas unitarias con Vitest
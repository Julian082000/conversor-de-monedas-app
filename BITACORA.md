# Bitácora de Desarrollo — Actividad #26: Conversor de Monedas Offline-First

**Autor:** Julián Serna  
**Repositorios:**
- **API Backend:** https://github.com/Julian082000/26-conversor-de-monedas-api (Desplegada en https://26-conversor-de-monedas-api.vercel.app)
- **App Móvil:** https://github.com/Julian082000/conversor-de-monedas-app

## 1. Arquitectura y Decisiones Técnicas
El sistema se dividió en dos repositorios independientes bajo una arquitectura cliente-servidor desacoplada:
- **Backend REST (`26-conversor-de-monedas-api`):** Desarrollado con Next.js (TypeScript) y desplegado en Vercel. Gestiona autenticación JWT con Firebase, validación estricta con Zod, persistencia en Cloud Firestore aislada por `uid` y consulta de tasas reales.
- **App Móvil (`conversor-de-monedas-app`):** Desarrollada con React Native y Expo Router bajo enfoque **Offline-First**. Utiliza SQLite (`conversor26.db`) para persistencia local (`tasas_cache`, `par_favorito`, `cola_sync`, `meta_sync`), `SecureStore` para tokens cifrados y sincronización bidireccional **Last-Write-Wins (LWW)** con borrado lógico (`deleted_at`).

## 2. Mejoras Funcionales y UX
- **Soporte para COP y HKD:** Integración con `open.er-api.com` en `/api/tasas` para soportar Peso Colombiano (`COP`) y Dólar Hongkonés (`HKD`), manteniendo Frankfurter para el historial de 7 días.
- **Identidad visual y Modo Oscuro:** Banderas por divisa, logotipo vectorial SVG en el inicio de sesión (`LogoConversor.tsx`) y selector global de Modo Claro/Oscuro (`TemaContext.tsx`).
- **Gráfica interactiva y sensores:** Gráfica SVG arrastrable de 7 días con `PanResponder`, además de inversión de monedas por acelerómetro (*shake*), gesto *swipe* y respuesta háptica.

## 3. Problemas Encontrados y Soluciones
- **Despliegue en Vercel:** Actualización de Next.js a `16.4.6` y migración de ESLint a *Flat Config* (`eslint.config.mjs`).
- **Autenticación Firebase:** Registro de aplicación web en Firebase Console, activación de Correo/Contraseña y vinculación de `FIREBASE_WEB_API_KEY` en Vercel.
- **Compatibilidad Metro / Expo Go:** Fijación de `query-string@7` e instalación de `expo-asset` y `react-native-svg`.
- **Codificación en Windows:** Uso de UTF-8 sin BOM en PowerShell para evitar errores de análisis en TypeScript.

## 4. Agentes y Herramientas de I.A. Utilizados
- **Agente de Arquitectura y Generación de Código (Gemini):** Estructuración de repositorios, endpoints protegidos, esquema SQLite, motor de sincronización LWW y componentes visuales SVG.
- **Agente de Diagnóstico y Depuración:** Resolución de conflictos de dependencias en Metro, rutas en TypeScript (`@/lib/firebase`) y despliegue en Vercel.
- **Verificación Estática Automatizada:** Validación continua con `tsc --noEmit`, `eslint --max-warnings 0` y pruebas unitarias en **Vitest** (3/3 en API y 3/3 en App).
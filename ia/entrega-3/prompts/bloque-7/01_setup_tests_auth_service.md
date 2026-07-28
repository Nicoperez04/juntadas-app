# Prompt 01 — Bloque 7: Configuración de Entorno de Testing y Pruebas Unitarias para authService

## Contexto de la tarea
Estamos en la rama `feature/bloque-7-testing` trabajando en el Bloque 7 (Casos Borde y Testing).
El objetivo principal de esta primera tarea es configurar el entorno de pruebas unitarias (Jest / React Native Testing Library / Mocks de Supabase) e implementar los tests unitarios automatizados para `src/features/auth/services/authService.ts`.

## Tarea 1 - Análisis previo (NO MODIFICAR NINGÚN ARCHIVO AÚN)
1. Revisa el archivo `package.json` para verificar si Jest, ts-jest o jest-expo ya están instalados y configurados.
2. Revisa el archivo `src/features/auth/services/authService.ts` y reporta brevemente todos los métodos exportados (signUp, signIn, signOut, resetPassword, changePassword, deleteAccount, etc.).
3. Reporta a través del chat los paquetes que sea necesario instalar o la estrategia propuesta para mockear el cliente de Supabase (`src/lib/supabase/client.ts`) sin alterar la base de datos real.

## Tareas de Implementación
1. Configuración de Testing:
   - Configurar Jest en `package.json` o `jest.config.js` orientado a Expo SDK 55 / TypeScript.
   - Crear el setup de mocks para el cliente de Supabase (por ejemplo en `src/lib/supabase/__mocks__/client.ts` o mediante `jest.mock`).
2. Implementación de Tests Unitarios:
   - Crear el archivo de test `src/features/auth/services/__tests__/authService.test.ts`.
   - Cobertura completa de casos de éxito y de error para los métodos clave de `authService.ts`:
     * Inicio de sesión con credenciales válidas e inválidas.
     * Registro de usuario nuevo.
     * Envío de mail de recuperación de contraseña.
     * Cambio de contraseña (validación previa de contraseña actual).
     * Proceso de Hard Delete de cuenta (delegación/transferencia y llamado a la Edge Function).
3. Restricciones explícitas:
   - NO usar `any` en TypeScript bajo ninguna circunstancia.
   - Mantener comentarios en español.
   - NO realizar ningún `git commit` automático.

## Detalles Técnicos Acordados y Decisiones de Diseño
* **Paquetes instalados (SDK 55 compatible):** `jest`, `jest-expo`, `@testing-library/react-native`, `@testing-library/jest-native`, `@types/jest`.
* **Configuración Jest:** Configurado en `mobile/jest.config.js` heredando el preset `jest-expo` y añadiendo mapeo de alias de rutas `^@/(.*)$`.
* **Mock del Cliente de Supabase:** Creado en `mobile/src/lib/supabase/__mocks__/client.ts` implementando un mock fuertemente tipado (sin usar `any`) que imita toda la API utilizada por el servicio, incluyendo encadenamiento builder para consultas (`.select().eq().is()`) implementado como Thenable para resolver promesas directamente, y soporte para subida de Storage (`storage.from.upload`) y Edge Functions (`functions.invoke`).

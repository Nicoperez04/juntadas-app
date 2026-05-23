# Conversación Bloque 1 — Autenticación

**Herramienta:** Cursor Agent (Claude Sonnet 4.6)
**Fecha:** 23/05/2026
**Rama:** entrega-1

---

## Resumen

En este bloque se implementó el módulo completo de autenticación de la app Juntadas, seguido de una revisión de calidad con sistema de diseño centralizado.

### Lo que se implementó
- Tipos e interfaces del módulo auth (`types.ts`)
- Schemas de validación con Zod (login, register, forgotPassword, completeProfile)
- Servicio de autenticación con Supabase (signUp, signIn, signOut, resetPassword, updateProfile)
- Hook `useAuth` con manejo de loading y errores, funciones memorizadas con `useCallback`
- Componentes compartidos: `AppButton`, `AppInput`, `AppLogo`
- Sistema de diseño centralizado en `theme.ts` (única fuente de verdad visual)
- Pantallas: WelcomeScreen, LoginScreen, RegisterScreen, ForgotPasswordScreen, CompleteProfileScreen
- Actualización de `AuthNavigator` con pantallas reales

### Decisiones tomadas
- `mapAuthError` en el servicio traduce errores de Supabase Auth al español
- `useAuth` retorna `{ error }` de cada operación para evitar race conditions con el estado de React
- `useCallback` en todas las funciones del hook para evitar re-renders innecesarios
- `theme.ts` como única fuente de verdad del sistema de diseño
- `@expo/vector-icons` se instala como dependencia directa (`npx expo install @expo/vector-icons`)

### Puntos pendientes
- Verificar que el trigger de Supabase lea `full_name` desde `raw_user_meta_data` y permita `username` null en el registro inicial
- Verificar configuración de URL en Supabase Authentication > URL Configuration para forgot password en desarrollo
- Evaluar verificación de username duplicado en tiempo real con debounce antes de submit

---

## Sesión 1 — Implementación del módulo de autenticación

### Prompt

Implementación — Bloque 1: Autenticación

Contexto del proyecto
Estoy desarrollando una app móvil llamada Juntadas con React Native + Expo SDK 55 + TypeScript. El backend es Supabase (Auth + PostgreSQL). La navegación usa React Navigation con native-stack.
La arquitectura es modular por features. Todo el código de autenticación vive en mobile/src/features/auth/. Los componentes reutilizables van en mobile/src/shared/components/. La navegación está en mobile/src/navigation/.
El cliente de Supabase ya está configurado en mobile/src/lib/supabase/client.ts y se importa como @/lib/supabase/client. El path alias @/ apunta a mobile/src/.
La navegación base ya está implementada. AppNavigator.tsx escucha cambios de sesión de Supabase y redirige automáticamente entre AuthNavigator y MainNavigator. No hay que tocar esa lógica.

Diseño
Tenés acceso al archivo de Figma del proyecto via MCP. Los tokens visuales principales son:
- Color primario: #7C3AED (violeta)
- Color secundario: #EC4899 (rosa, usado en detalles)
- Fondo general: #F8F7FF
- Texto principal: #1A1A1A, secundario: #6B7280
- Border radius botones y cards: 12-16px
- Botón primario: fondo #7C3AED, texto blanco, ancho completo, height 52px
- Inputs: borde #E5E7EB, border radius 12px, height 52px, padding horizontal 16px
- Tipografía: pesos 400, 500, 600 y 700. Tamaños: 14, 16, 18, 24, 32px

Lo que necesito que implementes:
1. Tipos en mobile/src/features/auth/types.ts
2. Schemas Zod en mobile/src/features/auth/schemas/authSchemas.ts
3. Servicio en mobile/src/features/auth/services/authService.ts
4. Hook useAuth en mobile/src/features/auth/hooks/useAuth.ts
5. Componentes compartidos: AppButton.tsx, AppInput.tsx, AppLogo.tsx
6. Pantallas: WelcomeScreen, LoginScreen, RegisterScreen, ForgotPasswordScreen, CompleteProfileScreen
7. Actualizar AuthNavigator.tsx con imports reales

Restricciones: no instalar dependencias nuevas, no modificar app.json/tsconfig/package.json, no modificar client.ts/env.ts/AppNavigator.tsx, no commits, usar StyleSheet.create, usar constantes de Routes.

### Respuesta

Se implementaron todos los archivos solicitados. Archivos creados o modificados:

| Archivo | Estado |
|---|---|
| `mobile/src/features/auth/types.ts` | Modificado |
| `mobile/src/features/auth/schemas/authSchemas.ts` | Creado |
| `mobile/src/features/auth/services/authService.ts` | Creado |
| `mobile/src/features/auth/hooks/useAuth.ts` | Creado |
| `mobile/src/shared/components/AppButton.tsx` | Creado |
| `mobile/src/shared/components/AppInput.tsx` | Creado |
| `mobile/src/shared/components/AppLogo.tsx` | Creado |
| `mobile/src/features/auth/screens/WelcomeScreen.tsx` | Creado |
| `mobile/src/features/auth/screens/LoginScreen.tsx` | Creado |
| `mobile/src/features/auth/screens/RegisterScreen.tsx` | Creado |
| `mobile/src/features/auth/screens/ForgotPasswordScreen.tsx` | Creado |
| `mobile/src/features/auth/screens/CompleteProfileScreen.tsx` | Creado |
| `mobile/src/navigation/AuthNavigator.tsx` | Modificado |
| `mobile/src/config/appConfig.ts` | Modificado (tokens agregados) |

**Decisiones tomadas no especificadas en el prompt:**

1. `useAuth` retorna `{ error }` de cada operación — necesario para que `ForgotPasswordScreen` pueda saber si el envío fue exitoso sin depender del ciclo de render (la variable de estado no se actualiza síncronamente en el mismo render donde se llama a setState).
2. `mapAuthError` en el servicio mapea los errores de Supabase Auth al español directamente en la capa de servicio.
3. `CompleteProfileScreen` no se agregó a `AuthNavigator` — está en `MainNavigator` según el archivo existente.
4. Tokens visuales guardados en `appConfig.ts`.
5. `@expo/vector-icons` está disponible como dependencia anidada de `expo` en `node_modules/expo/node_modules/@expo/vector-icons`.

**Validaciones pendientes:**

- **Trigger de Supabase**: El `signUp` envía `full_name` en `raw_user_meta_data`. Verificar manualmente en el dashboard que el trigger lee `new.raw_user_meta_data->>'full_name'` y que `username` admite null al momento del registro.
- **Username duplicado**: No hay verificación previa. La constraint UNIQUE de la BD rechaza el insert y el error se muestra en español via `mapAuthError`. Suficiente para MVP.
- **ForgotPassword en desarrollo**: Requiere `Site URL` configurado en Supabase Authentication > URL Configuration.

**Puntos flojos evaluados:**

- El manejo de errores incluye `mapAuthError` que cubre los casos más comunes. Suficiente para MVP.
- `useCallback` implementado en todas las funciones del hook.
- `KeyboardAvoidingView`: iOS usa `behavior="padding"`, Android usa `behavior={undefined}`. Candidato a ajuste: `CompleteProfileScreen`.
- `AppButton` y `AppInput` son suficientemente genéricos para bloques siguientes.

**Limitación técnica:** `@expo/vector-icons` no está como dependencia directa en `package.json`. Disponible transitivamente pero puede causar error de TypeScript. Solución: `npx expo install @expo/vector-icons`.

---

## Sesión 2 — Fix: dependencia @expo/vector-icons

### Prompt

For the code present, we get this error:
```
Cannot find module '@expo/vector-icons' or its corresponding type declarations.
```
Fix it, verify, and then give a concise explanation. Existe un error de dependencias, si la solución es simplemente la instalación de la misma, pasame el comando para ejecutarla.

### Respuesta

La solución es instalar el paquete como dependencia directa:

```bash
npx expo install @expo/vector-icons
```

**Por qué este comando y no `npm install`:** `npx expo install` resuelve automáticamente la versión de `@expo/vector-icons` compatible con Expo SDK 55, evitando conflictos de versión.

**Por qué el error ocurre:** El paquete existe en `node_modules/expo/node_modules/@expo/vector-icons` (dependencia transitiva de `expo`), pero TypeScript no lo puede resolver desde ahí — el compilador solo busca en `node_modules/@expo/vector-icons` (dependencias directas del proyecto). Al instalarlo como dependencia directa, aparece en el `package.json` y TypeScript lo encuentra correctamente.

---

## Sesión 3 — Revisión: comentarios, calidad y consistencia visual

### Prompt

Revisión — Bloque 1: Comentarios, calidad y consistencia visual

Contexto: El Bloque 1 de autenticación ya fue implementado. Necesito una revisión completa aplicando las reglas del proyecto y mejorando la calidad general.

**Tarea 1 — Comentarios profesionales:** Comentar todos los archivos del Bloque 1 en español, explicando el "por qué" no el "qué". Cada función, hook y servicio debe tener comentario de cabecera. Los tipos deben tener comentario en cada campo no evidente.

**Tarea 2 — Sistema de diseño:** Crear `mobile/src/shared/constants/theme.ts` como única fuente de verdad con: `colors`, `spacing`, `radius`, `typography`, `components`, `shadows`. Reemplazar todos los valores hardcodeados en los 13 archivos del Bloque 1 por referencias al theme. Normalizar headers, footers, inputs y botones entre pantallas.

**Tarea 3 — Verificación de reglas:** Reportar violaciones de: `any` en TypeScript, rutas hardcodeadas, queries Supabase fuera de servicios, inline styles complejos, `console.log` sin marcar.

Restricciones: no instalar dependencias, no modificar app.json/tsconfig/package.json/client.ts/env.ts/AppNavigator.tsx, no commits, solo los archivos listados.

### Respuesta

**Archivos creados o modificados:**

| Archivo | Cambios |
|---|---|
| `mobile/src/shared/constants/theme.ts` | **Creado** — sistema de diseño completo |
| `mobile/src/features/auth/types.ts` | Comentarios por campo |
| `mobile/src/features/auth/schemas/authSchemas.ts` | Comentarios de cabecera y por schema |
| `mobile/src/features/auth/services/authService.ts` | Comentarios JSDoc, `mapAuthError` documentado |
| `mobile/src/features/auth/hooks/useAuth.ts` | Comentarios por función |
| `mobile/src/shared/components/AppButton.tsx` | Theme + comentarios |
| `mobile/src/shared/components/AppInput.tsx` | Theme + comentarios, `inputWithIcon` eliminado |
| `mobile/src/shared/components/AppLogo.tsx` | Theme + comentarios |
| `mobile/src/features/auth/screens/WelcomeScreen.tsx` | Theme + comentarios |
| `mobile/src/features/auth/screens/LoginScreen.tsx` | Theme + comentarios, `keyboardVerticalOffset` redundante eliminado |
| `mobile/src/features/auth/screens/RegisterScreen.tsx` | Theme + comentarios |
| `mobile/src/features/auth/screens/ForgotPasswordScreen.tsx` | Theme + comentarios, tipo de navegación agregado |
| `mobile/src/features/auth/screens/CompleteProfileScreen.tsx` | Theme + comentarios, sombra con `theme.shadows.sm` |
| `mobile/src/navigation/AuthNavigator.tsx` | Comentarios de cabecera |

**Violaciones encontradas y corregidas:**

| Violación | Archivo | Corrección |
|---|---|---|
| `keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}` — ambos valores iguales | `LoginScreen` | Eliminado |
| `useNavigation()` sin tipo | `ForgotPasswordScreen` | Agregado `useNavigation<NavProp>()` |
| Todos los colores hardcodeados | Todos los archivos | Reemplazados por `theme.colors.*` |
| Espaciados sueltos fuera de escala | Todos los archivos | Reemplazados por `theme.spacing.*` |
| `inputWithIcon` — paddingLeft: 0 redundante | `AppInput` | Eliminado |
| Títulos `fontSize: 28` en ForgotPassword y CompleteProfile | Ambas pantallas | Normalizados a `theme.typography.sizes.xxl` (32px) |
| Subtítulos `fontSize: 15` | Ambas pantallas | Normalizados a `theme.typography.sizes.md` (16px) |

**Sin violaciones de:** `any` en TypeScript, rutas hardcodeadas, queries Supabase fuera de servicios, `console.log`.

**Decisiones de diseño para consistencia visual:**
- Todos los títulos hero usan `xxl: 32px` — eliminada inconsistencia donde Forgot y CompleteProfile usaban 28px
- Header estandarizado: botón atrás 40×40px + `marginBottom: 24` + título bold + subtítulo regular + `marginBottom: 32` del bloque completo
- Footer de navegación: `fontSize: 14px`, `marginTop: 24`, texto + link en fila centrada
- Banner de error: `errorLight` bg, `radius.md`, padding uniforme en todas las pantallas
- Card de reglas en CompleteProfile usa `theme.shadows.sm`

**Punto para revisión manual:** `errorLight` cambió de `#FEF2F2` a `#FEE2E2` según el sistema de diseño especificado. Revisar en dispositivo físico.

---

## Sesión 4 — Documentación y cierre del Bloque 1

### Prompt

Documentación — Cierre del Bloque 1: Autenticación

Necesito que organices toda la evidencia del Bloque 1 dentro de la carpeta ia/entrega-1/. Crear la estructura: `prompts/bloque-1/` con los tres archivos de prompts y `conversaciones/bloque-1/cursor-bloque-1-completo.md`. Actualizar `indice_ia.md` con las entradas del Bloque 1.

Restricciones: no tocar archivos de código, no commits, solo archivos dentro de ia/entrega-1/.

### Respuesta

**Archivos creados:**

| Archivo | Estado |
|---|---|
| `prompts/bloque-1/cursor-01-auth-implementacion.md` | Creado — placeholder |
| `prompts/bloque-1/cursor-02-auth-revision-comentarios.md` | Creado — placeholder |
| `prompts/bloque-1/cursor-03-documentar-bloque-1.md` | Creado — placeholder |
| `conversaciones/bloque-1/cursor-bloque-1-completo.md` | Creado — estructura base |

**Archivos modificados:**

| Archivo | Cambio |
|---|---|
| `indice_ia.md` | Agregada sección "Bloque 1 — Autenticación" con 3 links a prompts y conversación |

**Inconsistencias encontradas:**
- Las exportaciones automáticas de SpecStory (`2026-05-23_13-07-43Z-...md`, `2026-05-23_13-40-29Z-...md`) están sueltas en `conversaciones/` sin subdirectorio — son los exports brutos del Bloque 1 y pueden moverse a `conversaciones/bloque-1/` si se quiere consolidar todo.
- El subdirectorio `bloque-1/` no sigue el patrón previo de sesiones de prueba (que estaban directamente en `conversaciones/` y `prompts/`), pero es intencional según la estructura pedida.

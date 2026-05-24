# Conversación Bloque 6 — Perfil de usuario

**Herramienta:** Cursor Agent  
**Rama:** feature/bloque-6-perfil  
**Transcript ID:** `fe54c11e-b2e1-4b72-86fe-b9bad5e10a75`  
**Export SpecStory (crudo):** [`../2026-05-24_14-53-51Z-perfil-de-usuario-implementación-en-juntadas.md`](../2026-05-24_14-53-51Z-perfil-de-usuario-implementación-en-juntadas.md)

---

## Resumen

### Lo que se implementó

- `getProfile`, `updateProfile` extendido, `uploadAvatar`, `getUserStats` en `authService`
- `profile`, `stats`, `loadProfile`, `uploadAvatar`, `logout` en `useAuth`
- `ProfileScreen` con modo vista y modo edición inline
- Avatar editable con `expo-image-picker` (cámara o galería)
- Upload de avatar a Supabase Storage bucket `avatars`
- Estadísticas: juntadas organizadas y como invitado
- Banner de perfil incompleto para usuarios con username autogenerado (`user_*`)
- Modal de confirmación para cerrar sesión
- Toast de éxito al guardar cambios
- Bucket `avatars` documentado en migración SQL con políticas RLS
- Ajuste visual de `ProfileScreen` alineado a `MeetupHomeScreen` / `GamesScreen`
- Token `warningLight` agregado a `theme.ts` para el banner de perfil incompleto

### Decisiones tomadas

- Edición inline en lugar de pantalla separada para mejor UX
- Cache-bust en URL de avatar (`?t=timestamp`) para forzar refresco de imagen
- `warningLight` agregado a `theme.ts` para el banner de perfil incompleto
- Figma MCP no disponible desde el agente — diseño basado en patrones existentes de la app
- `ProfileScreen` incluye `ImpostorTabBar` con tab activo en Perfil (coherencia con `GamesScreen`)
- Verificación previa de username con `isUsernameTaken` antes del update (feedback inline sin depender solo del UNIQUE de la DB)

### Problemas encontrados y resueltos

- **Figma MCP timeout / no visible para el agente** — la UI se implementó según spec y `theme.ts`; luego se refinó visualmente sin acceso al mockup
- **Error 42501 al ejecutar SQL del bucket** — resuelto ejecutando solo las políticas con role `postgres`
- **El INSERT del bucket falló porque ya existía** — bucket creado manualmente desde el dashboard de Supabase Storage

### Pendientes para entregas futuras

- Cambiar contraseña (E2)
- Ver perfil de otros usuarios (E2)
- Ajuste pixel-perfect contra Figma cuando MCP esté disponible para el agente
- Convertir `useAuth` a store global (Zustand/Context) si otras pantallas necesitan el perfil en tiempo real
- Validar upload de avatar y estadísticas en dispositivo real con bucket `avatars` configurado

---

## Sesión 1 — Implementación del perfil de usuario

### Prompt (archivo guardado: `prompts/bloque-6/cursor-01-perfil-implementacion.md`)

Implementación — Bloque 6: Perfil de usuario

Contexto del proyecto: App móvil Juntadas, React Native + Expo SDK 55 + TypeScript. Backend Supabase. Rama activa: `feature/bloque-6-perfil`.

Implementar en `mobile/src/features/auth/`:

1. **Servicio** — `getProfile`, `updateProfile` extendido, `uploadAvatar`, `getUserStats`, verificar `signOut`
2. **Hook** — `profile`, `stats`, `isLoadingProfile`, `loadProfile`, `updateProfile`, `uploadAvatar`, `logout`
3. **Pantalla** — `ProfileScreen.tsx` con modo vista/edición, avatar, estadísticas, banner incompleto, logout con modal, Toast
4. **Storage** — bucket `avatars` + políticas RLS (migración SQL)
5. **Navegación** — reemplazar placeholder en `MainNavigator.tsx`

Ver prompt completo en [`prompts/bloque-6/cursor-01-perfil-implementacion.md`](../../prompts/bloque-6/cursor-01-perfil-implementacion.md).

### Respuesta

## Bloque 6 implementado

Figma MCP requirió autenticación (timeout) — la UI se implementó según el spec y los tokens de `theme.ts`, alineada al patrón visual de pantallas existentes como `GamesScreen` y `MeetupDetailScreen`.

### Archivos creados o modificados

| Archivo | Acción |
|---------|--------|
| `mobile/src/features/auth/services/authService.ts` | Modificado — `getProfile`, `updateProfile` extendido, `uploadAvatar`, `getUserStats`, `isUsernameTaken` |
| `mobile/src/features/auth/hooks/useAuth.ts` | Modificado — `profile`, `stats`, `loadProfile`, `updateProfile`, `uploadAvatar` |
| `mobile/src/features/auth/types.ts` | Modificado — `UpdateProfileData`, `ProfileEditFormData`, `UserStats` |
| `mobile/src/features/auth/schemas/authSchemas.ts` | Modificado — `profileEditSchema` |
| `mobile/src/features/auth/screens/ProfileScreen.tsx` | **Creado** |
| `mobile/src/navigation/MainNavigator.tsx` | Modificado — import real de `ProfileScreen` |
| `supabase/migrations/003_avatars_storage.sql` | **Creado** |
| `ia/entrega-1/prompts/bloque-6/cursor-01-perfil-implementacion.md` | **Creado** |

### Flujo de edición inline

1. Modo vista: email, nombre y username son solo lectura; header con ícono lápiz.
2. Al tocar lápiz (o "Completar" en el banner): entra modo edición → header muestra **Cancelar** / **Guardar**.
3. Nombre y username pasan a `AppInput` con validación Zod (`profileEditSchema`).
4. **Guardar** → `updateProfile()` → si el username está en uso, error inline bajo el campo; si ok, toast "Perfil actualizado" y vuelve a modo vista.
5. **Cancelar** → restaura valores del perfil cargado y sale del modo edición.

### Upload de avatar

1. Solo en modo edición: overlay con ícono cámara sobre el avatar.
2. `Alert` con opciones Cámara / Galería (`expo-image-picker`).
3. `uploadAvatar(uri)` en el hook: sube a `avatars/{userId}/avatar.jpg` con `upsert: true`, persiste `avatar_url` en `profiles`, actualiza estado local.
4. URL pública con cache-bust (`?t=timestamp`) para refrescar la imagen.

TypeScript compila sin errores (`tsc --noEmit` ✓).

---

## Sesión 2 — Intento de consulta Figma MCP

### Prompt (mensaje en chat)

Ahora si pude conectar el mcp de figma

### Respuesta

Intenté usar el MCP de Figma, pero **desde la sesión del agente no estaba disponible** (servidores activos: `cursor-ide-browser`, `plugin-prisma-Prisma-Local`, `user-highagency.pencildev-extension-pencil`).

Se indicaron pasos para habilitarlo: verificar MCP en Settings, abrir archivo Figma, recargar Cursor o iniciar chat nuevo, y opcionalmente compartir link al frame "Mi perfil".

La implementación del Bloque 6 ya estaba hecha según spec y `theme.ts`.

---

## Sesión 3 — Ajuste de diseño de ProfileScreen

### Prompt (mensaje en chat)

Ajusta el diseño en caso de ser necesario

### Respuesta

Ajusté el diseño de `ProfileScreen` para alinearlo con el resto de la app. El MCP de Figma siguió sin estar disponible; los cambios se basaron en `MeetupHomeScreen`, `GamesScreen` y el sistema de diseño.

**Cambios aplicados:**

- Header blanco con borde inferior, título `xxl`, botón editar circular en `primaryLight`
- Banner incompleto horizontal con fondo `warningLight`
- Card de identidad (avatar + nombre + username) con anillo y badge de cámara
- Stat cards con íconos (calendario / personas)
- Sección información en card blanca; email con fondo atenuado
- Espaciado uniforme con `gap` entre secciones

**Archivos modificados:**

- `mobile/src/features/auth/screens/ProfileScreen.tsx`
- `mobile/src/shared/constants/theme.ts` — `warningLight: '#FEF3C7'`

---

## Sesión 4 — Documentación y cierre del Bloque 6

### Prompt (archivo guardado: `prompts/bloque-6/cursor-02-documentar-bloque-6.md`)

Documentación — Cierre del Bloque 6: Perfil de usuario. Organizar evidencia en `ia/entrega-1/`, crear conversación completa, verificar prompts y actualizar `indice_ia.md`.

### Respuesta

Documentación del Bloque 6 organizada en `ia/entrega-1/conversaciones/bloque-6/cursor-bloque-6-completo.md`, prompt de cierre guardado y índice actualizado con entrada **26**.

---

## Conversación completa (export crudo)

La conversación íntegra con tool calls está disponible en:

[`../2026-05-24_14-53-51Z-perfil-de-usuario-implementación-en-juntadas.md`](../2026-05-24_14-53-51Z-perfil-de-usuario-implementación-en-juntadas.md)

Este archivo resume prompts y respuestas finales por sesión (sin tool calls), siguiendo el formato de los bloques anteriores.

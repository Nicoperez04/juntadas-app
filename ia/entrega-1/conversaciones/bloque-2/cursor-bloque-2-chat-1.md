# Conversación Bloque 2 — Juntadas (Chat 1)

**Herramienta:** Cursor Agent
**Fecha:** 23/05/2026
**Rama:** feature/bloque-2-meetups

---

## Resumen

Implementación completa del módulo de juntadas.

### Lo que se implementó

- Tipos, schemas, servicio y hook del módulo meetups
- MeetupHomeScreen con empty state, cards y tab bar
- CreateMeetupScreen con formulario completo (fecha/hora inicialmente como inputs)
- JoinMeetupScreen con validación de código
- MeetupDetailScreen con participantes y código compartible
- Fix de RLS circular en meetup_participants
- Fix de formato de fecha DD/MM/YYYY ↔ YYYY-MM-DD
- Instalación de expo-clipboard y @react-native-community/datetimepicker

### Decisiones tomadas

- `join_code` generado con 6 caracteres alfanuméricos en mayúsculas con verificación de unicidad
- Rollback manual en `createMeetup` si falla la inserción del participante
- `useFocusEffect` para recargar juntadas al volver al home
- DateTimePicker nativo en lugar de inputs de texto para fecha y hora

### Problemas encontrados y resueltos

- RLS circular en `meetup_participants` — corregido con política directa por `user_id`
- Pantalla en blanco en home — corregido arrancando `isLoading` en `true`
- Juntadas no aparecían al volver — resuelto con `useFocusEffect` + clear de caché de Metro

---

## Sesión 1 — Implementación del módulo de juntadas

### Prompt

→ [`prompts/bloque-2/cursor-01-meetups-implementacion.md`](../../prompts/bloque-2/cursor-01-meetups-implementacion.md)

Implementación completa del feature meetups: tipos, schemas Zod, `meetupService`, `useMeetups`, pantallas (Home, Create, Join, Detail) y navegación en `MainNavigator`.

### Respuesta

Se crearon los archivos del módulo en `mobile/src/features/meetups/` y se registraron las rutas en el stack principal. El servicio incluye `createMeetup`, `joinMeetup`, `getUserMeetups`, `getMeetupById` y `getMeetupParticipants`.

**Archivos principales creados:**

| Archivo | Descripción |
|---|---|
| `types.ts` | Tipos del dominio meetups |
| `schemas/meetupSchemas.ts` | Validación Zod de formularios |
| `services/meetupService.ts` | Queries Supabase |
| `hooks/useMeetups.ts` | Estado y operaciones del módulo |
| `screens/MeetupHomeScreen.tsx` | Lista y empty state |
| `screens/CreateMeetupScreen.tsx` | Formulario de creación |
| `screens/JoinMeetupScreen.tsx` | Unirse por código |
| `screens/MeetupDetailScreen.tsx` | Detalle y participantes |

---

## Sesión 2 — Fixes previos al test

### Prompt

→ [`prompts/bloque-2/cursor-02-meetups-fixes-previos-test.md`](../../prompts/bloque-2/cursor-02-meetups-fixes-previos-test.md)

Fix de formato de fecha para PostgreSQL, integración de `expo-clipboard`, join explícito con `profiles` y revisión de comentarios.

### Respuesta

- `formatDateForDB` / `formatDateForDisplay` en `meetupService.ts`
- Copia al portapapeles con feedback visual (checkmark 2 s) en `MeetupDetailScreen`
- Join corregido: `profiles:user_id (full_name, username, avatar_url)`

**Archivos modificados:** `meetupService.ts`, `MeetupDetailScreen.tsx` y pantallas del bloque (comentarios)

---

## Sesión 3 — Fix de refresh al volver al home

### Prompt

→ [`prompts/bloque-2/cursor-05-meetups-refresh.md`](../../prompts/bloque-2/cursor-05-meetups-refresh.md)

Reemplazar carga única por `useFocusEffect` que llame a `refresh()` en `MeetupHomeScreen`.

### Respuesta

Se agregó `useFocusEffect` con `refresh()` del hook `useMeetups`. La función `refresh` ya existía y llamaba a `loadMeetups(userId)` — no fue necesario modificar el hook.

**Archivo modificado:** `mobile/src/features/meetups/screens/MeetupHomeScreen.tsx`

---

## Sesión 4 — Diagnóstico de lista vacía en home

### Contexto

Tras implementar `useFocusEffect`, la lista seguía vacía. Se agregaron logs temporales en `useMeetups.ts` y `meetupService.ts` para diagnosticar `getUserMeetups`.

### Hallazgo

Los logs revelaron error en la query (`"Ocurrió un error inesperado — intentá de nuevo"`), no un problema de refresh. Tras corregir la causa raíz (RLS / caché de Metro) y limpiar logs, el flujo funcionó correctamente.

---

## Conversación completa

La evidencia consolidada de este chat está en este archivo y en los prompts referenciados arriba (`cursor-01`, `cursor-02`, `cursor-05`).

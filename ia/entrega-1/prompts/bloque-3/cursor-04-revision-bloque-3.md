# Revisión — Bloque 3: Participantes y acciones sobre juntadas

## Contexto

Revisión completa del Bloque 3 antes de cerrarlo. Solo análisis — sin modificaciones de código.

## Checklist de revisión

### 1. Archivos y estructura

Verificá que existen y están completos:

- `mobile/src/features/participants/services/participantService.ts`
- `mobile/src/features/participants/hooks/useParticipants.ts`
- `mobile/src/features/participants/screens/ParticipantListScreen.tsx`
- `mobile/src/features/participants/screens/ModifyAttendanceScreen.tsx`
- `mobile/src/features/meetups/screens/EditMeetupScreen.tsx`
- `mobile/src/features/meetups/screens/MeetupHistoryScreen.tsx`
- `mobile/src/shared/components/Toast.tsx`

### 2. Reglas del proyecto

Revisá todos los archivos del bloque y reportá violaciones de:

- Uso de `any` en TypeScript
- Strings de rutas hardcodeados (deben usar constantes de `Routes`)
- Queries a Supabase fuera de servicios
- Inline styles fuera de `StyleSheet.create`
- `console.log` sin marcar con `// TODO: remover`
- Código sin comentar o con comentarios en inglés

### 3. Lógica de negocio

Verificá que se cumplen estas reglas:

- Un organizador NO puede abandonar su propia juntada
- Un organizador NO puede modificar su propio estado de asistencia
- Solo el organizador puede editar o cancelar una juntada
- Una juntada cancelada no puede editarse
- El historial incluye juntadas donde el usuario fue organizador o participante
- `leaveMeetup` usa soft delete (`left_at = NOW()`) y no borra el registro

### 4. Manejo de errores

Verificá que:

- Todos los servicios retornan `{ data, error }` con `error: string | null`
- Los errores de Supabase están mapeados al español
- No hay llamadas a servicios sin manejo de error en los hooks y pantallas

### 5. Consistencia visual

Verificá que:

- Ningún valor de color, espaciado, radio o tipografía está hardcodeado — todo usa `theme.*`
- El Toast usa el diseño centrado con animación fade
- El modal de asistencia usa animación slide con overlay suave
- Los nombres de participantes muestran `full_name` si existe, sino `username`
- El botón "Modificar asistencia" está correctamente ubicado y es ghost violeta
- El banner de estado aparece en juntadas canceladas/finalizadas
- La sección "Compartir juntada" está oculta en juntadas no activas

### 6. Navegación

Verificá en `MainNavigator.tsx`:

- `ParticipantListScreen` está importada y usa `Routes.ParticipantList`
- `EditMeetupScreen` está importada y usa `Routes.EditMeetup`
- `MeetupHistoryScreen` está importada y usa `Routes.MeetupHistory`
- Los params de navegación están tipados correctamente

### 7. Comentarios

Verificá que todos los archivos del bloque tienen:

- Comentario de módulo al inicio explicando el propósito
- Comentario de cabecera en cada función y hook (propósito, params, retorno)
- Comentarios en español en bloques de lógica compleja

---

## Resultado de la revisión

### 1. Archivos y estructura

| Archivo | Estado |
|---------|--------|
| `participants/services/participantService.ts` | ✅ OK — 4 métodos: `updateAttendance`, `updateParticipantAttendanceByOrganizer`, `leaveMeetup`, `getParticipants` |
| `participants/hooks/useParticipants.ts` | ✅ OK |
| `participants/screens/ParticipantListScreen.tsx` | ✅ OK |
| `participants/screens/ModifyAttendanceScreen.tsx` | ✅ OK |
| `meetups/screens/EditMeetupScreen.tsx` | ✅ OK |
| `meetups/screens/MeetupHistoryScreen.tsx` | ✅ OK |
| `shared/components/Toast.tsx` | ✅ OK |

**Adicionales del bloque (no en checklist pero presentes):**

- ✅ `shared/components/ModifyAttendanceLink.tsx`
- ✅ `participants/utils/participantDisplay.ts`
- ✅ `shared/utils/haptics.ts`
- ✅ `supabase/migrations/002_fix_rls_circular.sql`

**⚠️ Faltante según arquitectura del proyecto (`project.mdc`):**

- No existe `participants/schemas/` (el bloque no define schemas Zod propios; la validación de asistencia es en UI/servicio).

---

### 2. Reglas del proyecto

| Regla | Estado |
|-------|--------|
| Uso de `any` | ✅ OK — no hay `any` ni `as any` en archivos del bloque |
| Rutas hardcodeadas | ✅ OK — todas usan `Routes.*` |
| Queries Supabase fuera de servicios | ⚠️ `supabase.auth.getSession()` en `MeetupDetailScreen.tsx` (L275) y `ParticipantListScreen.tsx` (L203). Patrón repetido en home/hooks; no es query de datos pero viola la regla estricta de "toda lógica Supabase en servicios" |
| Inline styles fuera de `StyleSheet` | ✅ OK — no hay `style={{...}}` complejos; solo arrays dinámicos con tokens (`backgroundColor: config.bgColor`) |
| `console.log` sin TODO | ✅ OK — ninguno en el bloque |
| Comentarios en español | ⚠️ En general bien; algunos handlers sin cabecera en `EditMeetupScreen` (`handleDateChange`, `handleTimeChange`, `onSubmit` parcial) |

**⚠️ Colores hardcodeados (regla "todo desde `theme.*`"):**

- `#FEF3C7`, `#92400E` en badges "pendiente/organizador" en varias pantallas
- Paletas de avatares con hex fijos (`#0EA5E9`, `#D97706`, etc.) en `MeetupDetailScreen`, `ParticipantListScreen`, `MeetupHomeScreen`
- `rgba(0,0,0,0.15)` / `rgba(0,0,0,0.4)` en Toast y modal (aceptable para overlays, pero no están en `theme`)

---

### 3. Lógica de negocio

| Regla | Estado |
|-------|--------|
| Organizador NO puede abandonar su juntada | ✅ OK — `leaveMeetup` bloquea `role === 'organizer'`; UI no muestra "Abandonar" al organizador |
| Organizador NO puede modificar su propia asistencia | ✅ OK — `updateAttendance` rechaza organizador; modal propio no se muestra al organizador |
| Solo organizador puede editar o cancelar | ✅ OK — servicio + UI (`isOrganizer && isActive` para cancelar; navegación a edit solo organizador) |
| Juntada cancelada no puede editarse | ✅ OK en servicio y redirect en `EditMeetupScreen`; botón Editar deshabilitado en detalle |
| Juntada **finalizada** no puede editarse | ❌ Servicio bloquea (`editMeetup`), pero **UI permite entrar**: botón Editar activo en detalle si `finished`; `EditMeetupScreen` solo redirige si `cancelled`, no si `finished` |
| Historial incluye organizador y participante | ✅ OK — `getFinishedMeetups` parte de participaciones del usuario |
| `leaveMeetup` soft delete | ✅ OK — `left_at = new Date().toISOString()`, sin DELETE |
| Organizador edita asistencia de otros | ✅ OK — `updateParticipantAttendanceByOrganizer` + tap en filas |

**⚠️ Historial:** `getFinishedMeetups` no filtra `left_at IS NULL` en participaciones del usuario; quien abandonó una juntada puede seguir viéndola en historial (puede ser deseable, pero no está documentado).

---

### 4. Manejo de errores

| Punto | Estado |
|-------|--------|
| Servicios retornan `{ data, error }` | ✅ OK — `participantService` y métodos de bloque en `meetupService` |
| Errores mapeados al español | ✅ OK — `translateError` en ambos servicios |
| Hooks/pantallas manejan errores | ✅ OK — estados de error, toasts, throws al modal, `Alert` en abandono |
| Errores RLS genéricos | ⚠️ Muchos errores de Postgres caen en "Ocurrió un error inesperado" por matching limitado en `translateError` |

---

### 5. Consistencia visual

| Punto | Estado |
|-------|--------|
| Tokens `theme.*` | ⚠️ Mayoría OK; hex hardcodeados en badges y avatares (ver §2) |
| Toast centrado con fade | ✅ OK — card ~140px, fade in/out 200ms, overlay sutil |
| Modal asistencia slide + overlay | ⚠️ Overlay suave ✅; animación es **`animationType="none"` + `translateY` custom**, no `slide` nativo del spec original |
| Nombres `full_name` → `username` | ✅ OK — `getParticipantDisplayName()` en detalle y listado |
| Botón "Modificar asistencia" ghost violeta | ⚠️ Reemplazado por **`ModifyAttendanceLink`** (texto violeta + ícono, no `AppButton variant="ghost"`) — mejora UX acordada, distinto al spec inicial |
| Banner cancelada/finalizada | ✅ OK — rojo/gris en `MeetupDetailScreen` |
| "Compartir juntada" oculta si no activa | ✅ OK — `{isActive && ...}` |

---

### 6. Navegación

| Punto | Estado |
|-------|--------|
| `ParticipantListScreen` importada | ✅ OK — L25, L49 |
| `EditMeetupScreen` importada | ✅ OK — L23, L48 |
| `MeetupHistoryScreen` importada | ✅ OK — L24, L50 |
| Uso de `Routes.*` | ✅ OK |
| Params tipados | ⚠️ `MainStackParamList` define params correctamente en pantallas (`useRoute<RoutePropType>`), pero **`MainNavigator.tsx` usa `createNativeStackNavigator()` sin genérico** — pierde type-safety en el navigator |

`ModifyAttendanceScreen` no va en el stack (es modal) — ✅ correcto.

---

### 7. Comentarios

| Archivo | Estado |
|---------|--------|
| `participantService.ts` | ✅ Comentario de módulo + cabeceras en métodos |
| `useParticipants.ts` | ✅ |
| `ModifyAttendanceScreen.tsx` | ✅ |
| `ParticipantListScreen.tsx` | ✅ |
| `EditMeetupScreen.tsx` | ⚠️ Módulo OK; faltan cabeceras en algunos handlers internos |
| `MeetupHistoryScreen.tsx` | ✅ |
| `MeetupDetailScreen.tsx` | ✅ (archivo extenso, bien documentado) |
| `Toast.tsx`, `ModifyAttendanceLink.tsx`, `haptics.ts` | ✅ |
| `participantDisplay.ts` | ✅ |

---

## Fixes necesarios antes de commitear

Solo los ❌ con cambio exacto sugerido:

### ❌ 1. Editar juntada finalizada desde el detalle

**Archivo:** `MeetupDetailScreen.tsx`  
**Problema:** El botón "Editar" solo se deshabilita si `isCancelled`; en juntadas `finished` sigue activo.  
**Fix:**

```typescript
// Condición del botón Editar — incluir finished
disabled={isCancelled || isFinished}
onPress={() =>
  !isCancelled && !isFinished &&
  navigation.navigate(Routes.EditMeetup, { meetupId })
}
// Y estilos disabled cuando isCancelled || isFinished
```

### ❌ 2. `EditMeetupScreen` no bloquea juntadas finalizadas

**Archivo:** `EditMeetupScreen.tsx`  
**Problema:** Solo redirige si `status === 'cancelled'`; `finished` carga el formulario innecesariamente.  
**Fix:** En `loadMeetup`, después del check de cancelada:

```typescript
if (data.status === 'cancelled' || data.status === 'finished') {
  navigation.replace(Routes.MeetupDetail, { meetupId });
  return;
}
```

---

## Resumen ejecutivo

El Bloque 3 está **funcionalmente completo** y alineado con la mayoría de reglas de negocio y arquitectura. Los puntos críticos antes de cerrar son **dos gaps en juntadas finalizadas** (UI + pantalla de edición). El resto son mejoras de consistencia (colores en `theme`, tipado del navigator, `getSession` fuera de servicios, spec visual del botón ghost vs link) que no bloquean el cierre pero conviene registrar en el backlog.

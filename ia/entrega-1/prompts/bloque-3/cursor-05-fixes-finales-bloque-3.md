# Fixes finales — Bloque 3 antes de commitear

## Prompt

Fixes finales — Bloque 3 antes de commitear

### Fix 1 — Botón Editar activo en juntadas finalizadas (MeetupDetailScreen.tsx)

El botón "Editar" en el header del detalle solo se deshabilitaba cuando `isCancelled`. Debe deshabilitarse también cuando `isFinished`.

### Fix 2 — EditMeetupScreen no bloquea juntadas finalizadas

En `EditMeetupScreen.tsx`, la función `loadMeetup` solo redirigía si `status === 'cancelled'`. Debe redirigir también si `status === 'finished'`.

---

## Confirmación de fixes aplicados

| Fix | Archivo | Estado |
|-----|---------|--------|
| Fix 1 — Botón Editar deshabilitado en juntadas finalizadas | `MeetupDetailScreen.tsx` | ✅ Aplicado |
| Fix 2 — Redirección en `loadMeetup` para juntadas finalizadas | `EditMeetupScreen.tsx` | ✅ Aplicado |

---

## Líneas exactas modificadas

### Fix 1 — `mobile/src/features/meetups/screens/MeetupDetailScreen.tsx`

**Líneas 419–444** — Botón "Editar" del header:

```typescript
onPress={() =>
  !isCancelled &&
  !isFinished &&
  navigation.navigate(Routes.EditMeetup, { meetupId })
}
style={[
  styles.editBtn,
  (isCancelled || isFinished) && styles.editBtnDisabled,
]}
activeOpacity={isCancelled || isFinished ? 1 : 0.7}
disabled={isCancelled || isFinished}
// ...
color={
  isCancelled || isFinished
    ? theme.colors.textDisabled
    : theme.colors.primary
}
// ...
(isCancelled || isFinished) && styles.editBtnTextDisabled,
```

**Cambios concretos:**
- Línea 420–422: `onPress` ahora verifica `!isCancelled && !isFinished`
- Línea 425: estilo `editBtnDisabled` cuando `isCancelled || isFinished`
- Línea 427: `activeOpacity` deshabilitado cuando `isCancelled || isFinished`
- Línea 428: `disabled={isCancelled || isFinished}`
- Líneas 433–435: color del ícono deshabilitado cuando `isCancelled || isFinished`
- Línea 440: estilo `editBtnTextDisabled` cuando `isCancelled || isFinished`

### Fix 2 — `mobile/src/features/meetups/screens/EditMeetupScreen.tsx`

**Línea 198** — Guard en `loadMeetup`:

```typescript
// Antes:
if (data.status === 'cancelled') {

// Después:
if (data.status === 'cancelled' || data.status === 'finished') {
```

---

## Archivos modificados

1. `mobile/src/features/meetups/screens/MeetupDetailScreen.tsx`
2. `mobile/src/features/meetups/screens/EditMeetupScreen.tsx`

## Decisiones no especificadas en el prompt

Ninguna. Se aplicaron exactamente los dos cambios solicitados, sin tocar lógica adicional.

## Pendientes de validación

- [ ] Abrir detalle de una juntada con `status === 'finished'` como organizador y verificar que el botón "Editar" aparece deshabilitado visualmente y no navega.
- [ ] Intentar acceder directamente a `EditMeetupScreen` con un `meetupId` finalizado (deep link o navegación manual) y verificar que redirige a `MeetupDetail`.

## Commits

No se realizó commit (según restricción del prompt).

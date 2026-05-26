# Fix cursor-09 — Botón "Finalizar juntada" solo visible cuando la juntada ya comenzó

## Contexto

App Ronda App, React Native + Expo SDK 55 + TypeScript. Pantalla:
`MeetupDetailScreen.tsx`.

## Prompt

Fix — Botón "Finalizar juntada" solo visible cuando la juntada ya comenzó.

### Problema

En `MeetupDetailScreen.tsx`, el botón "Finalizar juntada" aparece para el
organizador independientemente de si la fecha y hora de la juntada ya pasaron
o no. Debe aparecer únicamente cuando la juntada ya comenzó, es decir cuando
la fecha y hora de inicio ya se cumplieron.

### Fix

En `MeetupDetailScreen.tsx`, agregar una función que determine si la juntada ya
comenzó:

```typescript
// Determina si la juntada ya comenzó comparando fecha y hora con el momento actual
const hasMeetupStarted = (date: string, time: string): boolean => {
  // date viene en formato YYYY-MM-DD desde Supabase
  // time viene en formato HH:MM:SS desde Supabase
  const meetupDateTime = new Date(`${date}T${time}`);
  return new Date() >= meetupDateTime;
};

const canFinish = isOrganizer && isActive && hasMeetupStarted(meetup.date, meetup.time);
```

Reemplazar la condición actual del botón "Finalizar juntada" por `canFinish`:

```typescript
{canFinish && (
  // botón de finalizar juntada existente
)}
```

### Restricciones

- Solo modificar `MeetupDetailScreen.tsx`
- No tocar ningún otro archivo
- No hacer commits
- Comentar el cambio en español

## Cambios aplicados

- Función `hasMeetupStarted(date, time)` a nivel de módulo con comentario JSDoc.
- Variable `canFinish` que combina rol organizador, estado activo y fecha/hora
  de inicio ya cumplida.
- Condición del botón "Finalizar juntada" actualizada de
  `isOrganizer && isActive` a `canFinish`.
- El botón "Cancelar juntada" mantiene su condición original sin cambios.

## Archivos modificados

- `mobile/src/features/meetups/screens/MeetupDetailScreen.tsx`
- `ia/entrega-1/prompts/bloque-debugging/cursor-09-fix-finalizar-juntada.md` (este archivo)

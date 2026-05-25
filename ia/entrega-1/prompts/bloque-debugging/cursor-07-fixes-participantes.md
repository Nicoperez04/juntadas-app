# Fix cursor-07 — Abandonar juntada, volver a unirse e historial

## Contexto

App Juntadas, React Native + Expo SDK 55 + TypeScript. Rama entrega-1. Sistema de diseño en theme.ts.

## Prompt

Fixes — Botón abandonar, volver a unirse y historial

### Fix 1 — Botón "Abandonar juntada" en MeetupDetailScreen

Problema: El botón "Abandonar juntada" solo aparece en ParticipantListScreen. Debe aparecer también en MeetupDetailScreen para usuarios con rol participant (no organizador).

Fix: En MeetupDetailScreen.tsx, agregar el botón "Abandonar juntada" en la misma sección donde aparece el botón "Cancelar juntada" para el organizador. Mismo diseño — fondo rojo claro (theme.colors.errorLight), borde rojo, texto rojo, ícono exit-outline.

Implementar modal de confirmación igual al de cancelar juntada:

- Título: "Abandonar juntada"
- Subtítulo: "¿Estás seguro? Podés volver a unirte con el código si cambiás de opinión."
- Botones: "No, volver" (ghost) y "Sí, abandonar" (destructivo rojo)
- Al confirmar: llamar a leaveMeetup() del hook de participantes y navegar al home

### Fix 2 — Volver a unirse después de abandonar

Problema: joinMeetup verifica si existe un registro en meetup_participants y devuelve error sin distinguir si el usuario abandonó (left_at IS NOT NULL) o está activo.

Fix: Modificar joinMeetup para reactivar participación con UPDATE si left_at no es null; INSERT normal si no existe registro.

### Fix 3 — Historial: juntada abandonada con acceso restringido

**Parte A — Badge "Abandonada" en MeetupHistoryScreen:**

Detectar si el usuario abandonó verificando left_at en getFinishedMeetups. Mostrar badge "Abandonada" en gris.

**Parte B — Acceso restringido en MeetupDetailScreen:**

Si el usuario abandonó (leftAt !== null):

- Banner: "Abandonaste esta juntada. Podés volver a unirte con el código."
- Ocultar sección Participantes, Recuerdos y Jugar
- Mostrar botón "Volver a unirme" → JoinMeetupScreen (si la juntada está activa)
- El código puede seguir visible

## Restricciones

- No instalar dependencias nuevas
- No hacer commits
- Comentar cambios en español
- No modificar AppNavigator.tsx, client.ts, env.ts

## Archivos modificados

- `mobile/src/features/meetups/screens/MeetupDetailScreen.tsx`
- `mobile/src/features/meetups/screens/MeetupHistoryScreen.tsx`
- `mobile/src/features/meetups/services/meetupService.ts`
- `mobile/src/features/meetups/types.ts`
- `mobile/src/features/participants/services/participantService.ts`

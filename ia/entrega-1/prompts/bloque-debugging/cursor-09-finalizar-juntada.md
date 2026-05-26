# Fix cursor-09 — Botón finalizar juntada

## Contexto

App Juntadas, React Native + Expo SDK 55 + TypeScript. Rama entrega-1. Sistema de diseño en `theme.ts`.

## Prompt

En el detalle de una juntada, refiriéndose a las acciones sobre una juntada, se puede solo cancelar la juntada. Tenemos que agregar un botón para finalizar la juntada.

Poner el botón con los mismos estilos que el botón de cancelar, pero por encima de este.

Este prompt va a `bloque-debugging`. Mirar lo que hay para respetar el formato.

## Restricciones asumidas

- No instalar dependencias nuevas.
- No hacer commits.
- Mantener el patrón existente de servicios, hooks y pantalla.
- Usar estilos ya existentes del botón de cancelar.
- Registrar el prompt y la conversación en `ia/entrega-1/`.

## Archivos modificados

- `mobile/src/features/meetups/services/meetupService.ts`
- `mobile/src/features/meetups/hooks/useMeetups.ts`
- `mobile/src/features/meetups/screens/MeetupDetailScreen.tsx`
- `ia/entrega-1/conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`
- `ia/entrega-1/indice_ia.md`
- `ia/entrega-1/prompts/bloque-debugging/cursor-09-finalizar-juntada.md` (este archivo)

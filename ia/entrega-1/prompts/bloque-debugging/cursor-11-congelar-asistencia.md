# Fix cursor-11 — Congelar asistencia en juntadas finalizadas o canceladas

## Contexto

App Juntadas, React Native + Expo SDK 55 + TypeScript. Rama entrega-1. Sistema de diseño en `theme.ts`.

## Prompt

Necesito arreglar el hecho de que sobre una juntada finalizada o cancelada se pueda seguir modificando la asistencia. Esta debería quedar congelada una vez la juntada esté en estos estados.

## Restricciones asumidas

- No instalar dependencias nuevas.
- No hacer commits.
- Bloquear el flujo desde la UI y desde la capa de servicio.
- Mantener la asistencia como snapshot cuando la juntada pasa a `finished` o `cancelled`.

## Archivos modificados

- `mobile/src/features/participants/services/participantService.ts`
- `mobile/src/features/participants/screens/ParticipantListScreen.tsx`
- `ia/entrega-1/conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`
- `ia/entrega-1/indice_ia.md`
- `ia/entrega-1/prompts/bloque-debugging/cursor-11-congelar-asistencia.md` (este archivo)

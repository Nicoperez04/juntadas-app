# Prompt 02 — Bloque 4.4b: Implementación — Listado de juntadas del grupo

## Archivos creados/modificados

- `mobile/src/features/meetups/components/MeetupCard.tsx` (nuevo) —
  `MeetupCard` extraído tal cual de `MeetupHomeScreen.tsx` (antes `const`
  privado), ahora exportado para reusarse también en
  `GroupMeetupsScreen`. Incluye su propia copia de `AVATAR_PALETTE` y
  `formatDate` (antes locales a `MeetupHomeScreen`) y reusa
  `isPastMeetup` de `../utils/meetupDateTime`.
- `mobile/src/features/meetups/screens/MeetupHomeScreen.tsx` — se quitó
  la definición local de `MeetupCard`/`MeetupCardProps`/`formatDate` y
  los estilos que solo usaba esa card (`card`, `cardTopRow`,
  `roleBadge`, `avatarStack`, etc.); ahora importa `MeetupCard` desde el
  componente compartido. Sin cambios de lógica ni de render — mismo
  comportamiento visual.
- `mobile/src/features/groups/services/groupService.ts` — nueva función
  `getGroupMeetups(groupId, userId)`: trae juntadas `status = 'active'`
  de `group_id = groupId`, ordenadas por fecha, con el mismo patrón de 3
  pasos que `meetupService.getUserMeetups` (juntadas → participantes →
  combinar) para calcular rol/conteos por juntada. Incluye un mapeo
  propio `mapMeetupRowForGroup` (duplica el mapeo equivalente de
  `meetupService.mapMeetupRow`, que no está exportado) y solo importa
  tipos de `@/features/meetups/types`.
- `mobile/src/features/groups/hooks/useGroupMeetups.ts` (nuevo) — query
  simple sin mutaciones, mismo criterio que `useGroupMembers`.
- `mobile/src/features/groups/screens/GroupMeetupsScreen.tsx` (nuevo) —
  header + lista de `MeetupCard` (navega a `MeetupDetail` al tocar cada
  una) + pull-to-refresh + skeleton (`MeetupCardSkeleton` reusado) +
  estado vacío ("Este grupo todavía no tiene juntadas" con botón
  "+ Crear juntada" que navega a `CreateMeetup` con `{ groupId,
  groupName }`, mismo destino que el botón del detalle de 4.4).
- `mobile/src/navigation/{routes.ts,types.ts,MainNavigator.tsx}` — ruta
  nueva `GroupMeetups: { groupId: string; groupName: string }`.
- `mobile/src/features/groups/screens/GroupDetailScreen.tsx` — la card
  "Juntadas" navega a `GroupMeetups` en vez de `GroupPlaceholder`, y su
  ícono pasa de `game-controller` a `calendar-outline` (mismo ícono que
  la fila "Creado el...").

## ¿Hizo falta RLS nueva?

**No.** Confirmado en la Tarea 1: la policy `"meetups: select by
join_code"` ya permite leer cualquier juntada activa a cualquier usuario
autenticado (sin validar membresía), así que el filtro
`.eq('group_id', groupId).eq('status', 'active')` funciona directo
desde el cliente sin política ni función nueva.

## Hallazgo reportado (Tarea 1, punto 2) — no resuelto

Un usuario que se une a un grupo **después** de que una juntada de ese
grupo ya terminó o fue cancelada **no la ve** en este listado: la policy
que aplica a juntadas no activas exige ser organizador o tener una fila
propia en `meetup_participants` para esa juntada puntual, y
`invite_group_to_meetup` solo inscribe a los miembros activos *al momento
de crear* la juntada. Confirmado como caso real con el esquema actual.
**No se solucionó** — queda para evaluar aparte (podría requerir una
policy adicional basada en membresía histórica del grupo, o aceptar la
limitación como comportamiento esperado).

## Qué NO se tocó

- El caso reportado arriba: sin cambios de RLS.
- `GroupPlaceholderScreen.tsx`: sigue existiendo tal cual, todavía usado
  por la card "Multimedia".
- `meetupService.ts`: sin cambios más allá de los tipos que ya
  importaba `groupService.ts` (no se tocó ese archivo en absoluto en
  este prompt).
- Sin commits.

## Cómo probarlo

1. `npx tsc --noEmit` en `mobile/` — sin errores (verificado).
2. Desde el grupo con la juntada creada en 4.4, entrar al detalle y
   confirmar que la card "Juntadas" ahora muestra el ícono de calendario
   (mismo que "Creado el...").
3. Tocar la card "Juntadas" → confirmar que navega a la lista real y
   aparece la juntada creada en 4.4, con fecha y conteo de confirmados.
4. Tocar la juntada en la lista → confirmar que navega a su detalle.
5. Con un grupo sin juntadas, confirmar el estado vacío ("Este grupo
   todavía no tiene juntadas") y que su botón "+ Crear juntada" navega
   a `CreateMeetup` con el contexto del grupo.
6. Confirmar que `MeetupHomeScreen` (listado de juntadas propias) se ve
   y se comporta exactamente igual que antes de la extracción de
   `MeetupCard`.

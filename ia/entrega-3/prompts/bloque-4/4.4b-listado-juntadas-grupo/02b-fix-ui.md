# Prompt 02b — Bloque 4.4b: Fix UI — ícono e íconos redundantes

Tres correcciones de UI detectadas al probar en dispositivo.

## Tarea 1 — Ícono en info del grupo

`GroupDetailScreen.tsx` — la fila "{N} juntada(s) activa(s)" dentro de la
card de info del grupo usaba `game-controller-outline` (heredado del
clon original). Se cambió a `calendar-outline`, mismo ícono ya corregido
en la card "Juntadas" (4.4b) y en la fila "Creado el...".

## Tarea 3 — Diferenciar los íconos de calendario duplicados

Tras la Tarea 1, "Creado el..." y "{N} juntada(s) activa(s)" quedaron con
el mismo ícono `calendar-outline`, sintiéndose redundantes. Se cambió el
de "{N} juntada(s) activa(s)" a `calendar` (versión sólida, sin
"-outline") — mismo patrón outline/sólido que ya usa `AppTabBar.tsx` para
distinguir estado. "Creado el..." se mantiene con `calendar-outline`.

## Tarea 2 — Sacar botones redundantes de Miembros

`GroupMembersScreen.tsx` — se quitaron "Compartir código de invitación"
(`MeetupShareButton`) y "Salir del grupo" (botón + modal de confirmación
+ estado `showLeaveModal`/`leaveError` + `confirmLeave` + el hook
`useGroupDetail`, ya no usado en esta pantalla) del final de la lista.
Esas acciones ya viven en `GroupDetailScreen` (pantalla padre) y no
correspondían acá — se alinea con el criterio real de
`ParticipantListScreen`, que es solo la lista sin acciones adicionales.

También se limpiaron los estilos que solo usaban esos elementos
(`footer`, `leaveErrorText`, `leaveBtn*`, `modal*`) y el comentario del
encabezado del archivo, que documentaba la duplicación ahora eliminada.
La ruta `GroupMembers` sigue recibiendo `groupName`/`joinCode` como
params (no se tocó `navigation/types.ts`) — simplemente ya no se usan
dentro de esta pantalla.

## Qué NO se tocó

- Sin cambios en la regla de "juntada activa" ni lógica de finalización
  por tiempo (D20, definitiva).
- Sin commits.

## Cómo probarlo

1. `npx tsc --noEmit` en `mobile/` — sin errores (verificado).
2. Entrar al detalle de un grupo → confirmar que la fila "{N} juntada(s)
   activa(s)" muestra el ícono de calendario sólido (no el de control de
   videojuego), y que se distingue a simple vista del `calendar-outline`
   de la fila "Creado el..." justo arriba, sin dejar de sentirse parte
   del mismo lenguaje visual.
3. Entrar a "Ver miembros" → confirmar que la lista termina en el último
   miembro, sin botones de "Compartir código" ni "Salir del grupo" al
   pie de la pantalla.
4. Confirmar que "Compartir código" y "Salir del grupo" siguen
   funcionando igual que antes, pero solo desde `GroupDetailScreen`.

# Prompt 02 — Bloque 4.2: Implementación — Crear, unirse y listar grupos

## Diseño usado

El prompt original citaba una página "MockUps" con zona "Grupos" que no
existía en el archivo de Figma configurado en theme.ts
(`Iu9DQtttfYfcuWrFqmJuwb`, página única "Wireframes"). El usuario aportó
la URL correcta:
`https://www.figma.com/design/Iu9DQtttfYfcuWrFqmJuwb/Diseño-de-Wireframes---MockUps---Ronda-App?node-id=73-23`

Frames usados (obtenidos vía Figma MCP `get_design_context`):

- `267:10` — Mockup - Crear Grupo
- `273:8` — Mockup - Elegir Tipo de Union
- `267:141` — Mockup - Unirse a Grupo
- `280:3` — Mockup - Mis grupos

(`267:448` Detalle de Grupo y `267:614` Miembros del Grupo existen en el
mismo archivo pero son del sub-bloque 4.3, fuera de este alcance.)

## Archivos creados

Migración:
- `supabase/migrations/015_groups_search_by_code.sql` — policy
  `groups_select_by_join_code` (SELECT abierto a cualquier usuario
  autenticado), replicando el patrón real de meetups confirmado en la
  Tarea 1.

Feature `src/features/groups/` (mobile):
- `types.ts` — `Group`, `GroupRole`, `GroupWithRole`, `GroupMemberPreview`,
  `JoinGroupFormData`
- `schemas/groupSchemas.ts` — `createGroupSchema`, `joinGroupSchema`
- `services/groupService.ts` — `createGroup`, `findGroupByJoinCode`,
  `joinGroupByCode`, `getMyGroups`
- `hooks/useGroups.ts` — hook combinado (lista + mutaciones), mismo
  patrón que `useMeetups`
- `components/GroupCardSkeleton.tsx` — skeleton de carga para la lista
- `screens/CreateGroupScreen.tsx`
- `screens/JoinGroupScreen.tsx`
- `screens/ChooseJoinTypeScreen.tsx`
- `screens/GroupHomeScreen.tsx` ("Mis grupos")

Navegación:
- `src/navigation/routes.ts` — rutas `ChooseJoinType`, `GroupHome`,
  `CreateGroup`, `JoinGroup`
- `src/navigation/types.ts` — entradas correspondientes en
  `MainStackParamList`
- `src/navigation/MainNavigator.tsx` — registro de las 4 pantallas nuevas

Sistema de diseño:
- `src/shared/constants/theme.ts` — se agregaron `colors.info` /
  `colors.infoLight` (azul), siguiendo el mismo patrón que
  `primary`/`primaryLight`. Es el color que Figma usa para diferenciar
  visualmente las acciones de "Grupo" (azul) de las de "Juntada"
  (violeta) en los mockups Elegir Tipo de Union y Mis grupos.

## Por qué se tocaron 2 archivos de `src/features/meetups/` pese a la restricción del prompt

El prompt pide explícitamente "No modificar meetupService.ts ni nada de
src/features/meetups/" pero al mismo tiempo pide, en la misma Tarea 2:
"Agregar card 'Tus grupos' en HomeScreen" y "Agregar pantalla Mockup -
Elegir Tipo de Union como paso intermedio en el tab Unirse". HomeScreen es
`MeetupHomeScreen.tsx`, que vive en `src/features/meetups/screens/`, y el
tab bar "Unirse" está definido tanto ahí (una copia local del tab bar) como
en el componente compartido `AppTabBar.tsx`. Ambos cambios son necesarios
para que el punto de entrada pedido funcione, así que se interpretó la
restricción como "no tocar la lógica de negocio de juntadas" y se hicieron
los dos cambios mínimos e indispensables:

1. `src/shared/components/AppTabBar.tsx`: el tab "join" ahora navega a
   `Routes.ChooseJoinType` en vez de `Routes.JoinMeetup` directamente.
   `JoinMeetupScreen.tsx` no se tocó — sigue siendo el mismo destino desde
   el nuevo paso intermedio.
2. `src/features/meetups/screens/MeetupHomeScreen.tsx`:
   - Se corrigió el `handleTabPress` local (esta pantalla no reutiliza
     `AppTabBar`, tiene su propio tab bar duplicado) para que "join"
     navegue también a `Routes.ChooseJoinType`.
   - Se agregó una card "Tus grupos" debajo de las dos quick actions
     existentes, que navega a `Routes.GroupHome`.

No se tocó `meetupService.ts` ni ningún archivo de
`src/features/meetups/hooks|schemas|services|types.ts`.

## Otras decisiones tomadas por diferencias/ambigüedades encontradas

1. **Portada de grupo (cover) no implementada en 4.2.** El mockup
   "Crear Grupo" muestra un selector de portada opcional, igual al de
   `CreateMeetupScreen`. Subir esa imagen requiere un bucket de Storage
   dedicado para grupos (análogo a `005_meetup_cover.sql` para
   `meetup-covers`), que no estaba autorizado en el alcance de este
   prompt (que solo preveía la migración 015 de RLS). Se implementó el
   formulario sin el picker de portada; `groups.cover_url` queda en
   `NULL` al crear. Queda pendiente para un sub-bloque futuro (junto con
   4.3, que también necesitará Storage para fotos de grupo).
2. **Cards de "Mis grupos" no son interactivas.** El mockup no define una
   acción de tap, y la pantalla de detalle de grupo es explícitamente del
   sub-bloque 4.3. Se dejaron como `View` informativo en vez de
   `Pressable` con destino inexistente.
3. **"Ver historial" del mockup "Mis grupos" se omitió.** No hay un
   historial de grupo definido todavía ni una pantalla destino; agregar
   un enlace sin funcionalidad real se consideró peor que omitirlo.
4. **Rejoin tras salir de un grupo:** a diferencia de `joinMeetup` (que
   reactiva la fila existente con `left_at = null`), `joinGroupByCode`
   inserta una fila nueva en `group_members`. Motivo: desde el fix de
   escalamiento de privilegios (01b), ya no existe una policy de UPDATE
   genérica sobre la propia fila (solo `leave_group()` vía función, y
   `group_members_admin_manage` para admins). El índice único parcial
   `group_members_active_unique` solo protege duplicados con
   `left_at IS NULL`, así que una fila nueva convive sin conflicto con
   las filas históricas de una salida anterior.
5. **Íconos:** los assets de Figma son SVGs propios exportados, no
   nombres de Ionicons. Se eligieron íconos de Ionicons semánticamente
   equivalentes (`people`, `person-add-outline`, `enter`), siguiendo el
   mismo criterio que ya usa `JoinMeetupScreen` (su ilustración usa
   `enter`, no el asset original de Figma).

## Cómo probarlo

1. Correr `015_groups_search_by_code.sql` en Supabase Dashboard → SQL
   Editor (después de confirmar que 014 ya está aplicada).
2. `npx tsc --noEmit` en `mobile/` — sin errores (verificado).
3. Levantar la app (`npm run start` en `mobile/`) y probar el flujo con
   dos cuentas:
   - Cuenta A: Home → card "Tus grupos" → "Crear grupo" → completar
     nombre → confirmar que aparece en "Mis grupos" con badge "Admin".
   - Copiar el `join_code` generado (revisar en Supabase Table Editor,
     columna `groups.join_code`, ya que la UI de 4.2 no expone un botón
     "compartir código" — queda para 4.3 junto con el detalle de grupo).
   - Cuenta B: tab "Unirse" (o card "Unirse a juntada" del tab bar) →
     pantalla "Unirse" → "Unirse a un Grupo" → ingresar el código → 6
     dígitos → confirmar que redirige a "Mis grupos" y el grupo aparece
     con badge "Miembro".
   - Confirmar en ambas cuentas que el conteo de miembros, el stack de
     avatares con iniciales y "X personas" coinciden.
   - Confirmar que el flujo existente "Unirse a una Juntada" desde la
     misma pantalla intermedia sigue funcionando sin cambios.

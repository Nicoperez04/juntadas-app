# Prompt 02 — Bloque 4.3: Implementación — Detalle y miembros de grupo

## Diseño usado

Frames de Figma (mismo archivo que 4.1/4.2, `Iu9DQtttfYfcuWrFqmJuwb`):
- `267:448` — Mockup - Detalle de Grupo
- `267:614` — Mockup - Miembros del Grupo

## Archivos modificados/creados

`src/features/groups/`:
- `types.ts` — agregado `GroupDetail`, `GroupMember`
- `services/groupService.ts` — agregado `getGroupDetail`, `getGroupMembers`,
  `deleteGroup`, `leaveGroup`
- `hooks/useGroupDetail.ts` (nuevo) — query de detalle + mutaciones
  `deleteGroup`/`leaveGroup`, mismo criterio que `useMeetupDetail.ts`
- `hooks/useGroupMembers.ts` (nuevo) — query simple de miembros, mismo
  criterio que `useParticipants` (sin mutaciones: gestión de miembros es
  4.4/4.5)
- `screens/GroupDetailScreen.tsx` (nuevo)
- `screens/GroupMembersScreen.tsx` (nuevo)
- `screens/GroupPlaceholderScreen.tsx` (nuevo)
- `screens/GroupHomeScreen.tsx` — la card de grupo pasó de `View` a
  `Pressable`, navega a `GroupDetail`

Navegación:
- `routes.ts` / `navigation/types.ts` — rutas `GroupDetail { groupId }`,
  `GroupMembers { groupId, groupName, joinCode }`, `GroupPlaceholder
  { groupId, section }`
- `MainNavigator.tsx` — registro de las 3 pantallas nuevas

## Decisiones tomadas

1. **Sin botón "Editar grupo".** El mockup de detalle lo muestra en el
   header, pero no hay `EditGroupScreen` en el alcance de este prompt (ni
   fue pedido en la Tarea 2). Se omitió.
2. **Sin "Transferir administración".** Explícitamente fuera de alcance.
   El botón del mockup no se implementó.
3. **`groupName`/`joinCode` viajan como route params** de `GroupDetail` →
   `GroupMembers` en vez de que `GroupMembersScreen` vuelva a pedir el
   detalle del grupo — evita una query redundante ya que
   `GroupDetailScreen` los tiene cargados al momento de navegar.
4. **Chip de rol unificado en `GroupMembersScreen`.** El mockup mostraba
   para el admin un chip "Admin" (ámbar, bajo el username) + un chip
   "Desde may 2026" (verde, a la derecha), pero para el miembro normal
   solo un chip "Miembro" (verde, a la derecha) — dos variantes visuales
   distintas sin una regla clara. Se unificó a un solo chip de rol a la
   derecha de cada fila (Admin/Miembro/Invitado), coherente para todas
   las filas.
5. **Menú "⋮" sin acción.** Se renderiza en cada fila de
   `GroupMembersScreen` (`Ionicons name="ellipsis-vertical"`) sin
   `onPress`, con comentario `// TODO 4.4/4.5: expulsar miembro`, tal
   como pidió el prompt.
6. **"Salir del grupo" se duplica en `GroupDetailScreen` y
   `GroupMembersScreen`**, siguiendo el mismo patrón que
   `MeetupDetailScreen`/`ParticipantListScreen` (ambas también duplican
   "Abandonar juntada"). No se creó un componente compartido nuevo para
   no romper esa convención ya establecida.
7. **Mensaje específico cuando un admin intenta salir.** `leaveGroup()`
   en `groupService.ts` detecta el substring `'debe transferir su rol'`
   en el error del RPC `leave_group` y lo devuelve tal cual (mismo patrón
   que `translateError` en `meetupService.ts`); cualquier otro error cae
   al genérico "No se pudo salir del grupo". `GroupDetailScreen` muestra
   ese mensaje en el toast de error sin modificarlo — es comportamiento
   esperado (transferir administración es 4.5), no un error a esconder.
8. **Bug propio detectado y corregido antes de terminar:** el
   `SuccessAnimation` de `GroupDetailScreen` se comparte entre el toast de
   "grupo eliminado" (que debe navegar a `GroupHome`) y los toasts de
   `MeetupShareButton` (copiar código / compartir, que deben quedarse en
   la pantalla). La primera versión navegaba siempre al cerrar el toast,
   lo que habría sacado al usuario de la pantalla apenas copiaba el
   código. Se agregó el flag `shouldNavigateAfterToast`, seteado solo en
   el flujo de eliminación (mismo patrón que
   `shouldNavigateBackAfterToast` en `MeetupDetailScreen`).
9. **`getGroupDetail` usa el RPC `get_user_group_role`** (ya existente,
   `014_groups.sql`, `GRANT EXECUTE ... TO authenticated`) para resolver
   el rol del usuario — no hizo falta ninguna migración nueva.

## Qué NO se tocó

- Expulsar miembros, transferir administración: sin implementar.
- Contenido real de "Juntadas"/"Multimedia" del grupo: solo el
  placeholder genérico.
- `meetupService.ts`, migraciones existentes: sin cambios.
- Sin commits.

## Cómo probarlo

1. `npx tsc --noEmit` en `mobile/` — sin errores (verificado).
2. Con una cuenta **admin** de un grupo: entrar al detalle → confirmar
   que aparece "Eliminar grupo" además de "Salir del grupo".
   - Tocar "Salir del grupo" → confirmar en el modal → debe aparecer el
     toast de error "El admin debe transferir su rol antes de salir del
     grupo" (no un mensaje genérico), y la pantalla no debe navegar.
3. Con una cuenta **miembro normal**: entrar al detalle del mismo grupo →
   confirmar que "Eliminar grupo" **no aparece**.
   - Tocar "Salir del grupo" → confirmar → debe salir sin error y volver
     a "Mis grupos"; verificar en Supabase que la fila de
     `group_members` quedó con `left_at` seteado y no se duplicó
     (mismo chequeo de `left_at` ya validado en 4.2/4.2b).
4. Tocar "Ver miembros" desde el detalle → confirmar que la lista
   completa carga con roles correctos y que el ícono "⋮" no hace nada al
   tocarlo.
5. Tocar "Juntadas" y "Multimedia" desde el detalle → confirmar que cada
   una navega a su placeholder con el título correcto y el mensaje
   "Próximamente".

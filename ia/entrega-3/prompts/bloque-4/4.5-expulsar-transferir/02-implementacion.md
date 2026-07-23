# Prompt 02 — Bloque 4.5: Implementación — Expulsar y transferir administración

## Archivos creados/modificados

- `supabase/migrations/018_group_admin_actions.sql` (nuevo) —
  `expel_group_member(p_group_id, p_target_user_id)`: solo el admin
  puede ejecutarla, no puede expulsarse a sí mismo (para eso está
  `leave_group`), marca `left_at = now()` en la fila del destinatario.
  `transfer_group_admin(p_group_id, p_new_admin_user_id)`: valida que
  quien llama sea admin y que el destinatario sea miembro activo, y
  dentro de la misma función degrada al admin actual a `member` y
  promueve al destinatario a `admin` — atómico de verdad, sin el riesgo
  de estado parcial de `meetupService.transferOrganizer`.
- `mobile/src/features/groups/services/groupService.ts` — agregado
  `expelMember(groupId, targetUserId)` y `transferAdmin(groupId,
  newAdminUserId)`, wrappers de los RPCs con el mismo patrón de
  extracción de mensaje por duck-typing que `leaveGroup` (no
  `instanceof Error`, no confiable en Hermes/React Native para
  `PostgrestError`).
- `mobile/src/features/groups/hooks/useGroupMembers.ts` — agregadas dos
  mutaciones (`expelMember`, `transferAdmin`) que, al tener éxito,
  invalidan `['groupMembers', groupId]`, `['groupDetail', groupId]`
  (el rol propio puede cambiar) y `['groups', currentUserId]` (la card
  de "Mis grupos" también muestra el rol).
- `mobile/src/features/groups/screens/GroupMembersScreen.tsx` —
  - `MemberRow` ahora recibe `canManage` (el usuario actual es Admin y
    la fila no es la suya propia) y renderiza el ícono "⋮" solo si es
    `true`; al tocarlo mide su posición (`measureInWindow`) y abre un
    dropdown anclado con "Transferir administración" / "Expulsar del
    grupo".
  - Modal de confirmación compartido entre ambas acciones (mismo set de
    estilos `modalOverlay`/`modalCard`/`modalIconBoxWarning`/
    `modalIconBoxDanger`/etc. que `GroupDetailScreen`, reagregado a este
    archivo tras haberse sacado en 4.4b).
  - Tras confirmar con éxito, la lista se refresca sola por la
    invalidación de query — no hace falta refetch manual.

## Confirmación de atomicidad de `transfer_group_admin`

Las dos actualizaciones (`UPDATE ... SET role = 'member'` sobre el admin
actual, luego `UPDATE ... SET role = 'admin'` sobre el destinatario)
corren dentro de la misma función `PL/pgSQL SECURITY DEFINER`, es decir,
en una única transacción implícita: o se ejecutan ambas, o ninguna (un
`RAISE EXCEPTION` en cualquier validación previa aborta antes de tocar
una sola fila). El índice único `one_admin_per_group` (`WHERE
role='admin' AND left_at IS NULL`, de 4.1b) nunca se viola porque el
orden de los UPDATEs garantiza que la cantidad de admins activos pasa de
1→0→1, nunca de 1→2 en ningún punto intermedio.

## Qué NO se tocó

- `meetupService.transferOrganizer`: sin cambios, es de otro feature.
- Migraciones anteriores: sin cambios.
- Sin commits.

## Cómo probarlo

1. `npx tsc --noEmit` en `mobile/` — sin errores (verificado).
2. Con 2 cuentas en un grupo (A = admin, B = member):
   - Desde A, entrar a "Ver miembros" → confirmar que la fila de A (el
     propio Admin) no muestra el ícono "⋮", y la fila de B sí.
   - Desde B, entrar a "Ver miembros" → confirmar que **ninguna** fila
     muestra el ícono "⋮" (B no es Admin).
3. Desde A, tocar "⋮" en la fila de B → "Expulsar del grupo" → confirmar
   → B debe desaparecer de la lista de miembros, y al refrescar
   `GroupHomeScreen`/`GroupDetailScreen` con la cuenta B, el grupo ya no
   debe aparecer en su lista.
4. Con un tercer miembro C, desde A tocar "⋮" en la fila de C →
   "Transferir administración" → confirmar → recargar `GroupDetailScreen`
   con ambas cuentas: A debe verse como "Miembro" y C como "Admin"; en
   "Ver miembros", el ícono "⋮" debe aparecer ahora en la fila de A (ya
   no en la de C) si se entra con la cuenta de C.

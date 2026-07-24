# Prompt 02b — Bloque 4.2: Fix — reactivar membresía al volver a unirse

## Contexto
Rama actual: feature/bloque-4-grupos. groupService.joinGroupByCode ya
funciona pero inserta una fila nueva en group_members cada vez que
alguien se une, incluso si ya tuvo una fila anterior marcada con left_at
(por haber salido antes). Esto genera filas duplicadas históricas para el
mismo usuario+grupo.

## Problema

Comparado con el patrón real de joinMeetup en meetupService.ts: ahí, antes
de insertar, se verifica si existe una fila previa (activa o con left_at)
y si existe con left_at no nulo, se reactiva (UPDATE ... SET left_at =
null) en vez de insertar una nueva. joinGroupByCode no hacía esta
verificación — siempre insertaba.

## Restricción de RLS

Las policies actuales de group_members (014 + fix de escalamiento de
privilegios de 4.1b) no incluyen una policy de UPDATE genérica sobre la
propia fila — se sacó deliberadamente para cerrar el vector de
auto-ascenso a admin (ver 01b-fix-escalamiento-privilegios.md). Solo
existen group_members_admin_manage (admin sobre cualquier fila) y
funciones SECURITY DEFINER dedicadas (leave_group). Por eso la
reactivación no puede hacerse con un UPDATE directo desde el cliente y
necesita una función SECURITY DEFINER dedicada, mismo patrón que
leave_group.

## Tarea 1 — Análisis previo (confirmado)

1. Firma de leave_group (014_groups.sql): `RETURNS VOID`, `LANGUAGE
   plpgsql`, `SECURITY DEFINER`, `SET search_path = public`, sin `STABLE`
   (tiene side effects). rejoin_group sigue exactamente el mismo estilo,
   solo cambia a `RETURNS BOOLEAN` porque el caller necesita saber si
   reactivó una fila o no.
2. joinGroupByCode armaba el INSERT así: tras confirmar que no hay
   membresía activa (`left_at IS NULL`), insertaba directo `{ group_id,
   user_id, role: 'member' }` sin chequear si existía una fila con
   `left_at` no nulo.

## Tarea 2 — Migración `016_rejoin_group.sql`

Se creó tal cual la propuesta del prompt: función
`public.rejoin_group(p_group_id UUID) RETURNS BOOLEAN`, SECURITY DEFINER,
que busca la fila más reciente con `left_at IS NOT NULL` para
`(group_id, auth.uid())`, la reactiva (`left_at = NULL, role = 'member',
joined_at = now()`) y devuelve `true`; si no encuentra ninguna, devuelve
`false` sin tocar nada. `GRANT EXECUTE ... TO authenticated`, mismo
patrón que el resto de las funciones del módulo.

## Tarea 3 — Ajuste en `groupService.joinGroupByCode`

Después de descartar membresía activa (mismo chequeo que ya existía), se
agregó:

```ts
const { data: rejoined, error: rejoinError } = await supabase.rpc(
  'rejoin_group',
  { p_group_id: group.id },
);
if (rejoinError) throw rejoinError;

if (!rejoined) {
  // INSERT normal como 'member' — mismo código que antes
}
```

El contrato `ServiceResult<Group>` y los mensajes de error existentes
("Grupo no encontrado o código inválido", "Ya sos miembro de este grupo",
"Error al unirse al grupo") no cambiaron.

## Qué NO se tocó

- `leave_group`, `get_user_group_role`, políticas existentes de
  `group_members`/`groups`: sin cambios.
- `meetupService.ts`: sin cambios.
- Sin commits.

## Cómo probarlo

1. Ejecutar `016_rejoin_group.sql` en Supabase Dashboard → SQL Editor
   (después de 014 y 015).
2. Con una cuenta B: unirse a un grupo de la cuenta A con el `join_code`.
3. Salir del grupo (`leave_group` — desde donde esté expuesto en la UI, o
   invocando el RPC directo si 4.3 todavía no tiene el botón).
4. Volver a unirse con el mismo código.
5. En Supabase SQL Editor:
   ```sql
   SELECT * FROM group_members WHERE user_id = '<uuid de B>' AND group_id = '<uuid del grupo>';
   ```
   Debe devolver **una sola fila**, con `left_at IS NULL` y `role =
   'member'` — no dos filas.

# Prompt 02 — Bloque 4.1: Implementación — Migración 014_groups.sql

## Tarea 2 — Implementación: Migración 014_groups.sql

Crear el archivo supabase/migrations/014_groups.sql con enum group_role,
tablas groups y group_members, columna group_id opcional en meetups,
función SECURITY DEFINER get_user_group_role y políticas RLS asociadas.
Ajustar nombres/columnas exactos según lo confirmado en la Tarea 1
(01-analisis-previo.md) en vez de inventar convenciones nuevas.

## Qué NO tocar
- No modificar ninguna migración existente (001-013)
- No tocar meetupService.ts ni ningún archivo de src/features/meetups/
- No modificar app.json, tsconfig.json, package.json
- No crear ningún archivo de src/features/groups/ todavía (sub-bloque 4.2)
- No hacer commit

## Resultado

Archivo creado: `supabase/migrations/014_groups.sql`

Contenido (resumen):
- `CREATE TYPE group_role AS ENUM ('admin', 'member', 'guest')`
- Tabla `groups` (id, name, description, cover_url, join_code, created_by,
  created_at, updated_at) + índice `idx_groups_created_by`
- Tabla `group_members` (id, group_id, user_id, role, joined_at, left_at)
  + índices `idx_group_members_group_id`, `idx_group_members_user_id`
  + índice único parcial `group_members_active_unique` (group_id, user_id)
  WHERE left_at IS NULL
- `ALTER TABLE meetups ADD COLUMN group_id UUID REFERENCES groups(id)`
  + índice `idx_meetups_group_id`
- Trigger `trg_groups_updated_at` reutilizando `update_updated_at()`
- Función `public.get_user_group_role(p_group_id, p_user_id)` —
  `SECURITY DEFINER`, `SET search_path = public`, `STABLE` — con su
  `GRANT EXECUTE ... TO authenticated` correspondiente
- RLS habilitado en `groups` y `group_members` con policies:
  - `groups_select` / `groups_update` / `groups_delete` / `groups_insert`
  - `group_members_select` / `group_members_insert_self` /
    `group_members_update_self_leave` / `group_members_admin_manage`

## Diferencias aplicadas respecto a la propuesta original del prompt

Todas surgen del análisis previo (ver 01-analisis-previo.md) para replicar
las convenciones ya establecidas en el proyecto, no por preferencia propia:

1. Función renombrada `get_user_group_role` → `public.get_user_group_role`
   y agregado `SET search_path = public` (patrón de 013 y 002).
2. Agregado `GRANT EXECUTE ON FUNCTION public.get_user_group_role(uuid, uuid)
   TO authenticated;` (013 lo hace explícitamente; sin este grant, clientes
   con rol `authenticated` no podrían invocar la función desde políticas
   evaluadas en su propio contexto de sesión con seguridad consistente
   con el resto del proyecto).
3. `ON DELETE CASCADE` agregado a `groups.created_by` y
   `group_members.user_id` (coincide con `meetups.created_by`,
   `impostor_games.created_by`, `meetup_participants.user_id`, etc.)
4. Índices agregados para las 4 columnas FK que no los tenían en la
   propuesta original: `idx_groups_created_by`, `idx_group_members_group_id`,
   `idx_group_members_user_id`, `idx_meetups_group_id` (toda columna FK en
   el esquema existente tiene su índice — ver 001_initial_schema.sql).
5. Trigger `trg_groups_updated_at` agregado, ya que `groups` tiene columna
   `updated_at` igual que `profiles`/`meetups`/`meetup_participants`, que
   sí tienen su trigger correspondiente en 001.

No se modificó ninguna migración existente (001-013). No se tocó
meetupService.ts ni archivos de src/features/meetups/. No se creó nada en
src/features/groups/. No se hizo commit.

## Cómo probarlo

1. Abrir Supabase Dashboard → SQL Editor.
2. Pegar y ejecutar el contenido completo de
   `supabase/migrations/014_groups.sql`.
3. Verificar que no rompe la lectura/escritura de `meetups` existente:
   ```sql
   -- Debe seguir devolviendo las juntadas del usuario logueado
   SELECT id, title, group_id FROM meetups LIMIT 5;
   ```
   (`group_id` debe existir y venir NULL en las juntadas actuales, sin
   afectar las policies `meetups: select as member or organizer` ya
   vigentes, que no dependen de la nueva columna.)
4. Probar el flujo básico de grupos con un usuario autenticado:
   ```sql
   INSERT INTO groups (name, join_code, created_by)
   VALUES ('Grupo de prueba', 'ABC123', auth.uid())
   RETURNING id;

   INSERT INTO group_members (group_id, user_id, role)
   VALUES ('<id devuelto arriba>', auth.uid(), 'admin');

   SELECT * FROM groups; -- debe verse a sí mismo por groups_select
   ```
5. Confirmar que un segundo usuario sin membresía no ve el grupo
   (`groups_select` debe filtrar correctamente vía
   `get_user_group_role`).

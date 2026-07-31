# Prompt 01 — Bloque 4.1: Análisis previo — Modelo de datos de Grupos

## Contexto
Rama actual: feature/bloque-4-grupos (creada desde entrega-3 actualizado).
Entrega 3, Bloque 4 (Grupos) — el feature más grande de la entrega. Este
sub-bloque (4.1) ataca solo la capa de base de datos, sin pantallas ni
componentes de UI.

Stack relevante: Supabase (PostgreSQL + RLS), migraciones en
supabase/migrations/ con numeración correlativa (última existente:
013_get_meetup_participant_ids.sql).

## Tarea 1 — Análisis previo (sin tocar archivos)

Antes de escribir nada, reportar:

1. Contenido completo de supabase/migrations/013_get_meetup_participant_ids.sql
   — confirmar el patrón exacto de función SECURITY DEFINER ya usado.
2. Contenido completo de supabase/migrations/002_fix_rls_circular.sql
   — entender el bug circular para no repetirlo con los roles de grupo.
3. Estructura de la tabla meetups actual (columnas exactas) — confirmar
   cómo agregar group_id sin conflicto.
4. Confirmar si existe algún enum de PostgreSQL ya definido en migraciones
   anteriores (buscar CREATE TYPE) — seguir la misma convención de nombres.

No modificar ningún archivo en esta tarea. Solo reportar lo encontrado y
esperar confirmación antes de continuar a la Tarea 2.

## Hallazgos

### 1. Patrón SECURITY DEFINER (013)
```sql
CREATE OR REPLACE FUNCTION public.get_meetup_participant_ids(...)
RETURNS TABLE(user_id UUID)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$ ... $$;

GRANT EXECUTE ON FUNCTION public.get_meetup_participant_ids(uuid, uuid) TO authenticated;
```
Patrón con 3 elementos de convención: prefijo `public.` explícito,
`SET search_path = public`, y `GRANT EXECUTE ... TO authenticated` después
del `CREATE FUNCTION`.

### 2. Bug circular (002)
Una política RLS de meetup_participants hacía SELECT sobre la propia tabla
dentro de su cláusula USING, causando "infinite recursion detected in
policy for relation meetup_participants". La solución fue una función
SECURITY DEFINER (is_active_meetup_member) que consulta la tabla
bypaseando RLS, más políticas separadas para fila propia (sin subquery) y
co-participantes (vía función).

### 3. Estructura de meetups (001_initial_schema.sql)
```
id, title, description, date, time, location, estimated_cost,
status (meetup_status), join_code, created_by (FK → profiles.id ON DELETE CASCADE),
created_at, updated_at, cancelled_at
```
Sin conflicto de nombre con group_id. Convención observada: todos los FKs
created_by/user_id/uploaded_by usan ON DELETE CASCADE, y toda columna FK
tiene un índice explícito asociado.

### 4. Enums existentes
meetup_status, participant_role, attendance_status, game_status,
media_type (001), notification_type (009). Convención: nombre singular
snake_case terminado en _status/_role/_type. group_role sigue esta
convención sin conflicto.

## Decisión — ajustes aplicados sobre la propuesta original
1. Función renombrada a public.get_user_group_role + SET search_path = public.
2. Agregado GRANT EXECUTE ON FUNCTION public.get_user_group_role(uuid, uuid) TO authenticated.
3. ON DELETE CASCADE agregado a groups.created_by y group_members.user_id.
4. Índices agregados: idx_groups_created_by, idx_group_members_group_id,
   idx_group_members_user_id, idx_meetups_group_id.
5. Trigger trg_groups_updated_at agregado (reutiliza update_updated_at()),
   para consistencia con profiles/meetups/meetup_participants.

Confirmado por el usuario para proceder a la Tarea 2.

# Prompt 01b — Bloque 4.1: Fix escalamiento de privilegios en group_members

## Contexto
Rama actual: feature/bloque-4-grupos. Archivo supabase/migrations/014_groups.sql
ya generado (Tarea 4.1) pero todavía no ejecutado en Supabase — revisión
previa a correr el SQL, no una corrección post-testeo.

## Problema identificado

Dos políticas RLS en group_members permitían escalamiento de privilegios:

1. **group_members_insert_self**: validaba `user_id = auth.uid()` pero no
   restringía el valor de `role` insertado. Cualquier usuario autenticado
   podía insertarse como `admin` en cualquier grupo existente, sin pasar
   por el join_code.

2. **group_members_update_self_leave**: pensada para que un usuario marque
   su propio `left_at` (salir del grupo), pero al no restringir columnas,
   permitía que cualquier miembro hiciera `UPDATE ... SET role = 'admin'`
   sobre su propia fila.

## Corrección aplicada

### 1. group_members_insert_self — ahora fuerza role = 'member'
```sql
CREATE POLICY "group_members_insert_self" ON group_members FOR INSERT
  WITH CHECK (user_id = auth.uid() AND role = 'member');
```
El auto-registro (unirse por join_code) solo puede crear la fila como
`member`, nunca `admin` ni `guest`.

### 2. group_members_update_self_leave — eliminada
Reemplazada por la función `public.leave_group(p_group_id)`
(SECURITY DEFINER, mismo patrón que `get_user_group_role` /
`is_active_meetup_member`), que:
- Verifica que el usuario no sea `admin` del grupo (si lo es, exige
  transferir el rol antes — se implementa en Bloque 4.2).
- Actualiza únicamente `left_at = now()` de la fila del propio usuario,
  sin exponer ninguna columna a modificación arbitraria por UPDATE directo.

```sql
CREATE OR REPLACE FUNCTION public.leave_group(p_group_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT role FROM group_members WHERE group_id = p_group_id AND user_id = auth.uid() AND left_at IS NULL) = 'admin' THEN
    RAISE EXCEPTION 'El admin debe transferir su rol antes de salir del grupo';
  END IF;

  UPDATE group_members
  SET left_at = now()
  WHERE group_id = p_group_id AND user_id = auth.uid() AND left_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.leave_group(uuid) TO authenticated;
```

### 3. Efecto colateral resuelto: el creador del grupo necesita ser admin

Como `group_members_insert_self` ya no permite crear filas con
`role != 'member'`, la app ya no puede insertar al creador del grupo como
`admin` directamente. Se agrega un trigger que lo hace automáticamente al
crear el grupo:

```sql
CREATE OR REPLACE FUNCTION public.assign_group_creator_as_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_assign_group_creator_as_admin
  AFTER INSERT ON groups
  FOR EACH ROW EXECUTE FUNCTION public.assign_group_creator_as_admin();
```

## Qué NO se tocó
- Resto de 014_groups.sql: tablas, índices, get_user_group_role,
  políticas de groups (select/update/delete/insert), group_members_select,
  group_members_admin_manage.
- Migraciones 001-013.
- Sin commits.

## Archivo modificado
- supabase/migrations/014_groups.sql (aún no ejecutado en Supabase)

## Cómo probarlo
1. Ejecutar el contenido completo de 014_groups.sql en Supabase Dashboard
   → SQL Editor.
2. Crear un grupo con un usuario A → verificar que el trigger lo insertó
   automáticamente como 'admin' en group_members (no hace falta INSERT
   manual desde la app).
3. Intentar como usuario B: `INSERT INTO group_members (group_id, user_id, role) VALUES (<id>, auth.uid(), 'admin')`
   → debe fallar (WITH CHECK viola role = 'member').
4. Como usuario B ya miembro: intentar `UPDATE group_members SET role = 'admin' WHERE user_id = auth.uid()`
   → debe fallar (ya no existe policy de UPDATE genérica sobre la propia fila).
5. Como usuario B miembro: `SELECT leave_group('<group_id>')` → debe
   marcar left_at correctamente.
6. Como usuario A admin: `SELECT leave_group('<group_id>')` → debe
   lanzar la excepción "El admin debe transferir su rol antes de salir
   del grupo".

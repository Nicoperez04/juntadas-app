-- ============================================================
-- 014_groups.sql
-- Bloque 4.1 — Modelo de datos de Grupos
--
-- Introduce grupos de usuarios con roles (admin/member/guest) y
-- asociación opcional de juntadas a un grupo. Sigue el patrón de
-- función SECURITY DEFINER ya establecido en 002_fix_rls_circular.sql
-- y 013_get_meetup_participant_ids.sql para evitar el bug de
-- recursión RLS documentado en 002.
-- ============================================================

-- ------------------------------------------------------------
-- ENUM de roles de grupo (3 valores: admin, member, guest — sin moderador)
-- ------------------------------------------------------------
CREATE TYPE group_role AS ENUM ('admin', 'member', 'guest');

-- ------------------------------------------------------------
-- TABLA: groups
-- ------------------------------------------------------------
CREATE TABLE groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  cover_url   TEXT,
  join_code   TEXT UNIQUE NOT NULL,
  created_by  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_groups_created_by ON groups(created_by);

-- ------------------------------------------------------------
-- TABLA: group_members — membresía + rol por usuario
-- ------------------------------------------------------------
CREATE TABLE group_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id  UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role      group_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT now(),
  left_at   TIMESTAMPTZ
);

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id  ON group_members(user_id);

-- Evita membresías activas duplicadas (permite volver a unirse después de salir)
CREATE UNIQUE INDEX group_members_active_unique
  ON group_members(group_id, user_id) WHERE left_at IS NULL;

-- ------------------------------------------------------------
-- meetups gana asociación opcional a grupo
-- (coexisten juntadas sueltas y de grupo)
-- ------------------------------------------------------------
ALTER TABLE meetups ADD COLUMN group_id UUID REFERENCES groups(id);

CREATE INDEX idx_meetups_group_id ON meetups(group_id);

-- ------------------------------------------------------------
-- Trigger: actualizar updated_at automáticamente en groups
-- (misma función update_updated_at() usada por profiles/meetups/
-- meetup_participants en 001_initial_schema.sql)
-- ------------------------------------------------------------
CREATE TRIGGER trg_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ------------------------------------------------------------
-- Función central para resolver el rol de un usuario en un grupo,
-- evitando el patrón de RLS circular documentado en
-- 002_fix_rls_circular.sql (equivalente a is_active_meetup_member).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_group_role(p_group_id UUID, p_user_id UUID)
RETURNS group_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM group_members
  WHERE group_id = p_group_id AND user_id = p_user_id AND left_at IS NULL
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_group_role(uuid, uuid) TO authenticated;

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ------------------------------------------------------------
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- groups: cualquier miembro activo puede leer; solo admin edita/elimina
CREATE POLICY "groups_select" ON groups FOR SELECT
  USING (get_user_group_role(id, auth.uid()) IS NOT NULL);

CREATE POLICY "groups_update" ON groups FOR UPDATE
  USING (get_user_group_role(id, auth.uid()) = 'admin');

CREATE POLICY "groups_delete" ON groups FOR DELETE
  USING (get_user_group_role(id, auth.uid()) = 'admin');

CREATE POLICY "groups_insert" ON groups FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- group_members: cualquier miembro activo puede leer la lista;
-- un usuario puede insertarse a sí mismo (unirse por código, vía service layer);
-- solo admin puede modificar roles ajenos o expulsar
CREATE POLICY "group_members_select" ON group_members FOR SELECT
  USING (get_user_group_role(group_id, auth.uid()) IS NOT NULL);

-- INSERT: el auto-registro solo puede crear la fila como 'member', nunca 'admin' ni 'guest'
CREATE POLICY "group_members_insert_self" ON group_members FOR INSERT
  WITH CHECK (user_id = auth.uid() AND role = 'member');

-- UPDATE: reemplazado — ya no se permite UPDATE genérico de la propia fila.
-- "Salir del grupo" pasa a ser una función dedicada (leave_group), no una policy de UPDATE abierta.

CREATE POLICY "group_members_admin_manage" ON group_members FOR UPDATE
  USING (get_user_group_role(group_id, auth.uid()) = 'admin');

-- Garantiza a nivel de base de datos que nunca haya más de un Admin activo
-- por grupo, sin depender de que la lógica de la app o las policies lo eviten
CREATE UNIQUE INDEX one_admin_per_group
  ON group_members(group_id)
  WHERE role = 'admin' AND left_at IS NULL;
  
-- ------------------------------------------------------------
-- Función: salir de un grupo (reemplaza la policy de UPDATE abierta
-- group_members_update_self_leave, que permitía a cualquier miembro
-- auto-promoverse a role = 'admin' vía UPDATE sobre su propia fila)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.leave_group(p_group_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Un Admin no puede salir sin transferir el rol antes (ver Bloque 4.2)
  IF (SELECT role FROM group_members WHERE group_id = p_group_id AND user_id = auth.uid() AND left_at IS NULL) = 'admin' THEN
    RAISE EXCEPTION 'El admin debe transferir su rol antes de salir del grupo';
  END IF;

  UPDATE group_members
  SET left_at = now()
  WHERE group_id = p_group_id AND user_id = auth.uid() AND left_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.leave_group(uuid) TO authenticated;

-- ------------------------------------------------------------
-- Trigger: asignar al creador del grupo como admin automáticamente.
-- Necesario porque group_members_insert_self ya no permite crear
-- filas con role distinto de 'member' (ver arriba), así que el
-- primer admin no puede insertarse vía policy de la app.
-- ------------------------------------------------------------
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

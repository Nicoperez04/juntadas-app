-- ============================================================
-- 015_groups_join_by_code_security_definer.sql (reemplazo de 015)
-- Bloque 4.1+ — Fix crítico de seguridad
--
-- BUG: 015 original permitía SELECT sobre groups a cualquier usuario
-- autenticado (USING auth.uid() IS NOT NULL sin filtro), exponiendo
-- IDs de todos los grupos del sistema. Combinado con
-- group_members_insert_self (que valida rol pero NO join_code),
-- un usuario podía listar todos los grupos e insertarse en
-- cualquiera sin validar el código de invitación.
--
-- FIX: Reemplazar el SELECT abierto por una función RPC SECURITY
-- DEFINER join_group_by_code(p_join_code) que:
-- 1. Recibe SOLO el código de invitación como parámetro
-- 2. Valida internamente que existe y pertenece a un grupo activo
-- 3. Inserta/reactiva la membresía si pasa la validación
-- 4. No expone ningún ID de grupo sin código válido
--
-- La policy sobre groups se restringe: sin SELECT público, solo RPC.
-- ============================================================

-- Eliminar la policy de SELECT que exponía la tabla
DROP POLICY IF EXISTS "groups_select_by_join_code" ON groups;

-- Nueva función RPC — único punto de entrada para unirse por código
CREATE OR REPLACE FUNCTION public.join_group_by_code(p_join_code TEXT)
RETURNS TABLE(group_id UUID, is_reactivation BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id UUID;
  v_already_member BOOLEAN;
  v_was_reactivation BOOLEAN;
BEGIN
  SELECT id INTO v_group_id
  FROM groups
  WHERE join_code = p_join_code;

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Código de acceso inválido';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = v_group_id AND gm.user_id = auth.uid() AND gm.left_at IS NULL
  ) INTO v_already_member;

  IF v_already_member THEN
    RAISE EXCEPTION 'Ya sos miembro activo de este grupo';
  END IF;

  UPDATE group_members gm
  SET left_at = NULL
  WHERE gm.group_id = v_group_id AND gm.user_id = auth.uid() AND gm.left_at IS NOT NULL;

  v_was_reactivation := FOUND;

  IF v_was_reactivation THEN
    RETURN QUERY SELECT v_group_id, true;
  ELSE
    INSERT INTO group_members (group_id, user_id, role, joined_at)
    VALUES (v_group_id, auth.uid(), 'member', now());
    RETURN QUERY SELECT v_group_id, false;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_group_by_code(text) TO authenticated;
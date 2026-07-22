-- ============================================================
-- 016_rejoin_group.sql
-- Bloque 4.2 — Reactivar membresía al volver a unirse a un grupo
--
-- PROBLEMA:
--   joinGroupByCode insertaba siempre una fila nueva en group_members,
--   incluso cuando el usuario ya tenía una fila anterior con left_at
--   (por haber salido del grupo antes), generando duplicados históricos.
--
-- POR QUÉ NO SE PUEDE HACER CON UPDATE DIRECTO DESDE EL CLIENTE:
--   Las policies de group_members (014 + fix de escalamiento de
--   privilegios de 4.1b) no incluyen una policy de UPDATE genérica sobre
--   la propia fila — se sacó deliberadamente para cerrar el vector de
--   auto-ascenso a admin. Solo existen group_members_admin_manage (admin
--   sobre cualquier fila) y funciones SECURITY DEFINER dedicadas
--   (leave_group). rejoin_group sigue el mismo patrón.
-- ============================================================

-- Reactiva la membresía de un usuario que había salido de un grupo
-- y vuelve a unirse con el join_code. Si no tiene fila previa,
-- no hace nada (el INSERT normal del cliente se encarga de ese caso).
-- Resetea el rol a 'member' siempre, sin importar qué rol tenía antes
-- de irse (evita que una fila vieja con un rol distinto se reactive
-- con privilegios que no correspondan hoy).
CREATE OR REPLACE FUNCTION public.rejoin_group(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_id UUID;
BEGIN
  SELECT id INTO v_existing_id
  FROM group_members
  WHERE group_id = p_group_id
    AND user_id = auth.uid()
    AND left_at IS NOT NULL
  ORDER BY left_at DESC
  LIMIT 1;

  IF v_existing_id IS NULL THEN
    RETURN FALSE; -- no había fila previa, el cliente debe hacer INSERT normal
  END IF;

  UPDATE group_members
  SET left_at = NULL, role = 'member', joined_at = now()
  WHERE id = v_existing_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rejoin_group(uuid) TO authenticated;

-- ============================================================
-- 022_fix_get_group_member_ids_shadowing.sql
-- Bloque 4.7 — Fix: get_group_member_ids (021) rechazaba a TODO
-- llamador, siempre, sin excepción.
--
-- BUG: RETURNS TABLE(user_id UUID) declara `user_id` como variable de
-- salida visible en TODO el cuerpo de la función, no solo en el
-- RETURN QUERY final. El EXISTS de validación de permisos usaba
-- "user_id = auth.uid()" sin calificar con el alias de tabla —
-- Postgres resolvió esa referencia como la variable de salida
-- (NULL, sin asignar todavía), no como la columna real de
-- group_members. NULL = auth.uid() siempre da NULL (falsy), el
-- EXISTS siempre daba false, y la función lanzaba
-- 'No tenés relación con este grupo' para cualquier llamador, en
-- cualquier caso — rompiendo tanto unión como salida por igual.
--
-- FIX: calificar la referencia con el alias de tabla (gm.user_id),
-- igual que ya se hacía correctamente en el RETURN QUERY.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_group_member_ids(
  p_group_id UUID,
  p_excluded_user_id UUID
)
RETURNS TABLE(user_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = p_group_id AND gm.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'No tenés relación con este grupo';
  END IF;

  RETURN QUERY
  SELECT gm.user_id
  FROM group_members gm
  WHERE gm.group_id = p_group_id
    AND gm.left_at IS NULL
    AND gm.user_id != p_excluded_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_group_member_ids(uuid, uuid) TO authenticated;
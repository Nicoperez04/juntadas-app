-- ============================================================
-- 021_get_group_member_ids.sql
-- Bloque 4.7 — Fix: notifyGroupMemberLeft no podía leer "los demás
-- miembros activos" porque leave_group ya había seteado left_at en
-- la fila de quien pregunta ANTES de que el cliente hiciera el SELECT.
--
-- La policy group_members_select evalúa si auth.uid() (quien consulta)
-- sigue siendo miembro activo del grupo — es un gate de todo o nada,
-- no filtra fila por fila. Como leave_group() ya lo dio de baja, RLS
-- bloquea la lectura completa (0 filas, sin error), y la notificación
-- se envía a una lista vacía en silencio.
--
-- Fix: función SECURITY DEFINER (mismo patrón que
-- get_meetup_participant_ids, 013_get_meetup_participant_ids.sql) que
-- bypasea RLS y devuelve los miembros activos de un grupo, excluyendo
-- a quien acaba de salir. Se valida adentro que quien llama a esta
-- función haya sido efectivamente miembro (activo o recién dado de
-- baja) del grupo en cuestión, para no exponer membresías de grupos
-- ajenos.
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
  -- Verifica que quien llama haya sido miembro de este grupo en algún
  -- momento (activo o recién dado de baja) — evita que cualquier
  -- usuario autenticado pueda consultar membresías de un grupo ajeno.
  IF NOT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = auth.uid()
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
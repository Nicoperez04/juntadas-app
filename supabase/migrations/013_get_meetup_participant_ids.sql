-- Retorna los user_id de participantes activos de una juntada
-- excluyendo a un usuario específico (generalmente el organizador).
-- SECURITY DEFINER permite ejecutar sin restricciones de RLS.
CREATE OR REPLACE FUNCTION public.get_meetup_participant_ids(
  p_meetup_id UUID,
  p_excluded_user_id UUID
)
RETURNS TABLE(user_id UUID)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT mp.user_id
  FROM meetup_participants mp
  WHERE mp.meetup_id = p_meetup_id
    AND mp.left_at IS NULL
    AND mp.user_id != p_excluded_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_meetup_participant_ids(uuid, uuid) TO authenticated;

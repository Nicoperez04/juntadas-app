-- ============================================================
-- 017_invite_group_to_meetup.sql
-- Bloque 4.4 — Invitar a todo el grupo al crear una juntada de grupo
--
-- PROBLEMA:
--   Al crear una juntada desde un grupo, hay que registrar como
--   participantes pendientes a todos los miembros activos del grupo
--   (excepto al organizador, que ya se auto-inscribe en createMeetup).
--
-- POR QUÉ NO SE PUEDE HACER CON INSERT DIRECTO DESDE EL CLIENTE:
--   La policy "meetup_participants: insert own" (001_initial_schema.sql)
--   exige WITH CHECK (user_id = auth.uid()) — un organizador no puede
--   insertar filas de meetup_participants para otros usuarios. Mismo
--   patrón que leave_group/rejoin_group (014/016): función SECURITY
--   DEFINER que valida el permiso adentro y bypasea RLS para el INSERT.
-- ============================================================

CREATE OR REPLACE FUNCTION public.invite_group_to_meetup(p_meetup_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id UUID;
BEGIN
  SELECT group_id INTO v_group_id
  FROM meetups
  WHERE id = p_meetup_id AND created_by = auth.uid();

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Juntada no encontrada, no sos el organizador, o no está asociada a un grupo';
  END IF;

  INSERT INTO meetup_participants (meetup_id, user_id, role, attendance_status)
  SELECT p_meetup_id, gm.user_id, 'participant', 'pending'
  FROM group_members gm
  WHERE gm.group_id = v_group_id
    AND gm.left_at IS NULL
    AND gm.user_id != auth.uid()
  ON CONFLICT (meetup_id, user_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.invite_group_to_meetup(uuid) TO authenticated;
-- ============================================================
-- 020_group_notifications.sql
-- Bloque 4.7 — Sistema de notificaciones de grupo (RF-41)
--
-- Agrega 5 tipos de notificación para eventos de grupo (unión,
-- expulsión, transferencia de admin, salida, invitación a juntada
-- de grupo), siguiendo el mismo patrón de 012 (ALTER TYPE ADD VALUE,
-- un valor por evento).
--
-- Agrega group_id nullable a notifications (mismo patrón que meetup_id)
-- para permitir deep-link a GroupDetailScreen al tocar una notificación
-- de grupo — hoy solo existe meetup_id, y las notificaciones de grupo
-- puro no tienen a dónde navegar sin esto.
--
-- invite_group_to_meetup cambia de RETURNS VOID a
-- RETURNS TABLE(invited_user_id UUID), mismo patrón ya usado en 019 con
-- expel_group_member: la función devuelve a quién agregó, para que el
-- cliente notifique sin re-derivar la lista y sin riesgo de desfasaje
-- si ON CONFLICT DO NOTHING saltó a alguien.
-- ============================================================

-- Parte 1: nuevos tipos de notificación
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'group_member_joined';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'group_member_expelled';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'group_admin_transferred';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'group_member_left';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'group_meetup_invite';

-- Parte 2: group_id nullable en notifications, para deep-link
ALTER TABLE notifications ADD COLUMN group_id UUID REFERENCES groups(id) ON DELETE SET NULL;

-- Parte 3: invite_group_to_meetup ahora devuelve a quién invitó
DROP FUNCTION public.invite_group_to_meetup(uuid);

CREATE OR REPLACE FUNCTION public.invite_group_to_meetup(p_meetup_id UUID)
RETURNS TABLE(invited_user_id UUID)
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

  RETURN QUERY
  INSERT INTO meetup_participants (meetup_id, user_id, role, attendance_status)
  SELECT p_meetup_id, gm.user_id, 'participant', 'pending'
  FROM group_members gm
  WHERE gm.group_id = v_group_id
    AND gm.left_at IS NULL
    AND gm.user_id != auth.uid()
  ON CONFLICT (meetup_id, user_id) DO NOTHING
  RETURNING meetup_participants.user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.invite_group_to_meetup(uuid) TO authenticated;
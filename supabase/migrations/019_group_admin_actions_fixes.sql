-- ============================================================
-- 019_group_admin_actions_fixes.sql
-- Bloque 4.5 — Fixes sobre expel_group_member y transfer_group_admin
-- (018_group_admin_actions.sql ya corrida en producción; esta migración
-- reemplaza ambas funciones con CREATE OR REPLACE / DROP+CREATE)
--
-- FIX 1 (seguridad — privilegio escalado):
--   La versión de 018 comparaba el rol del caller con "!= 'admin'" sobre
--   una subquery que devuelve NULL si auth.uid() no es miembro del grupo.
--   En PL/pgSQL, "IF NULL THEN" se evalúa como FALSE, así que un usuario
--   NO miembro del grupo pasaba el chequeo de autorización sin excepción
--   y ejecutaba la acción igual. Reemplazado por SELECT ... INTO variable
--   + "IS DISTINCT FROM 'admin'", que sí trata NULL como comparable.
--
-- FIX 2 (guest no promovible):
--   'guest' se mantiene en el enum group_role (se intentó eliminar en un
--   borrador de 019 que nunca llegó a correrse, por demasiadas
--   dependencias en cascada — índice, función, 6 policies — para el
--   tiempo disponible). transfer_group_admin ahora exige explícitamente
--   role = 'member' en el destinatario, así que un guest nunca puede
--   terminar admin por default (fail-closed ante un rol no cerrado).
--
-- FIX 3 (organizador huérfano al expulsar):
--   expel_group_member solo tocaba left_at en meetup_participants al
--   expulsar a alguien del grupo. Si el expulsado era organizador de una
--   juntada activa del grupo, quedaba con left_at seteado pero
--   useMeetupDetail.ts seguía leyéndolo como organizador (isOrganizer
--   sale de meetup_participants.role, nunca actualizado por la
--   expulsión) — mostraba "Transferir organización"/"Cancelar juntada"
--   a alguien que ya no era participante activo.
--   Ahora, antes de remover la participación: si el expulsado organizaba
--   una juntada activa del grupo, se transfiere la organización a otro
--   participante activo (el más antiguo por joined_at); si era el único
--   participante activo, la juntada se cancela (status = 'cancelled',
--   cancelled_at = now(), mismo patrón que cancelMeetup en
--   meetupService.ts).
--
-- CAMBIO DE FIRMA (requiere DROP, no solo CREATE OR REPLACE):
--   expel_group_member cambia de RETURNS VOID a
--   RETURNS TABLE(cancelled_meetup_id UUID, cancelled_meetup_title TEXT).
--   Postgres no permite cambiar el tipo de retorno de una función
--   existente sin DROP previo. El cliente (groupService.expelMember)
--   usa este resultado para disparar la notificación de cancelación vía
--   notificationService.sendNotification, ya que una función SQL no
--   puede invocar la Edge Function send-push-notification directamente.
-- ============================================================

DROP FUNCTION public.expel_group_member(uuid, uuid);

CREATE OR REPLACE FUNCTION public.expel_group_member(p_group_id UUID, p_target_user_id UUID)
RETURNS TABLE(cancelled_meetup_id UUID, cancelled_meetup_title TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role TEXT;
  v_meetup RECORD;
  v_new_organizer_id UUID;
BEGIN
  IF p_target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'No podés expulsarte a vos mismo, usá "Salir del grupo"';
  END IF;

  SELECT role INTO v_caller_role
  FROM group_members
  WHERE group_id = p_group_id AND user_id = auth.uid() AND left_at IS NULL;

  IF v_caller_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Solo el admin puede expulsar miembros';
  END IF;

  UPDATE group_members
  SET left_at = now()
  WHERE group_id = p_group_id AND user_id = p_target_user_id AND left_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El usuario no es miembro activo de este grupo';
  END IF;

  FOR v_meetup IN
    SELECT m.id, m.title
    FROM meetups m
    JOIN meetup_participants mp
      ON mp.meetup_id = m.id
     AND mp.user_id = p_target_user_id
     AND mp.left_at IS NULL
     AND mp.role = 'organizer'
    WHERE m.group_id = p_group_id
      AND m.status = 'active'
  LOOP
    SELECT mp.user_id INTO v_new_organizer_id
    FROM meetup_participants mp
    WHERE mp.meetup_id = v_meetup.id
      AND mp.user_id != p_target_user_id
      AND mp.left_at IS NULL
    ORDER BY mp.joined_at ASC
    LIMIT 1;

    IF v_new_organizer_id IS NOT NULL THEN
      UPDATE meetup_participants SET role = 'participant'
      WHERE meetup_id = v_meetup.id AND user_id = p_target_user_id;

      UPDATE meetup_participants SET role = 'organizer'
      WHERE meetup_id = v_meetup.id AND user_id = v_new_organizer_id;

      UPDATE meetups SET created_by = v_new_organizer_id
      WHERE id = v_meetup.id;
    ELSE
      UPDATE meetups SET status = 'cancelled', cancelled_at = now()
      WHERE id = v_meetup.id;

      cancelled_meetup_id := v_meetup.id;
      cancelled_meetup_title := v_meetup.title;
      RETURN NEXT;
    END IF;

    v_new_organizer_id := NULL;
  END LOOP;

  UPDATE meetup_participants mp
  SET left_at = now()
  FROM meetups m
  WHERE mp.meetup_id = m.id
    AND m.group_id = p_group_id
    AND m.status = 'active'
    AND mp.user_id = p_target_user_id
    AND mp.left_at IS NULL;

  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.expel_group_member(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.transfer_group_admin(p_group_id UUID, p_new_admin_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role TEXT;
BEGIN
  IF p_new_admin_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Ya sos admin de este grupo';
  END IF;

  SELECT role INTO v_caller_role
  FROM group_members
  WHERE group_id = p_group_id AND user_id = auth.uid() AND left_at IS NULL;

  IF v_caller_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Solo el admin puede transferir la administración';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id 
      AND user_id = p_new_admin_user_id 
      AND left_at IS NULL
      AND role = 'member'
  ) THEN
    RAISE EXCEPTION 'El usuario no es miembro activo con rol habilitado para ser admin';
  END IF;

  UPDATE group_members SET role = 'member'
  WHERE group_id = p_group_id AND user_id = auth.uid() AND left_at IS NULL;

  UPDATE group_members SET role = 'admin'
  WHERE group_id = p_group_id AND user_id = p_new_admin_user_id AND left_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.transfer_group_admin(uuid, uuid) TO authenticated;
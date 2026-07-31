-- ============================================================
-- 023_leave_group_meetup_cleanup.sql
-- Bloque 4.7 — Fix: leave_group (salida voluntaria) no removía al 
-- usuario de las juntadas activas del grupo, a diferencia de 
-- expel_group_member (019), que sí lo hace. Asimetría confirmada por 
-- decisión de producto: debe comportarse igual en ambos casos.
--
-- Se replica en leave_group la misma lógica ya usada en 
-- expel_group_member: si quien sale organizaba una juntada activa del 
-- grupo, se transfiere la organización a otro participante activo, o 
-- se cancela la juntada si era el único. Mismo motivo por el que 
-- expel_group_member cambió de VOID a RETURNS TABLE en 019: el cliente 
-- necesita saber qué juntadas se cancelaron para notificar a los 
-- participantes restantes.
-- ============================================================

DROP FUNCTION public.leave_group(uuid);
CREATE OR REPLACE FUNCTION public.leave_group(p_group_id UUID)
RETURNS TABLE(cancelled_meetup_id UUID, cancelled_meetup_title TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_meetup RECORD;
  v_new_organizer_id UUID;
BEGIN
  IF (SELECT role FROM group_members WHERE group_id = p_group_id AND user_id = auth.uid() AND left_at IS NULL) = 'admin' THEN
    RAISE EXCEPTION 'El admin debe transferir su rol antes de salir del grupo';
  END IF;

  UPDATE group_members
  SET left_at = now()
  WHERE group_id = p_group_id AND user_id = auth.uid() AND left_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No sos miembro activo de este grupo';
  END IF;

  FOR v_meetup IN
    SELECT m.id, m.title
    FROM meetups m
    JOIN meetup_participants mp
      ON mp.meetup_id = m.id
     AND mp.user_id = auth.uid()
     AND mp.left_at IS NULL
     AND mp.role = 'organizer'
    WHERE m.group_id = p_group_id
      AND m.status = 'active'
  LOOP
    SELECT mp.user_id INTO v_new_organizer_id
    FROM meetup_participants mp
    WHERE mp.meetup_id = v_meetup.id
      AND mp.user_id != auth.uid()
      AND mp.left_at IS NULL
    ORDER BY mp.joined_at ASC
    LIMIT 1;

    IF v_new_organizer_id IS NOT NULL THEN
      UPDATE meetup_participants SET role = 'participant'
      WHERE meetup_id = v_meetup.id AND user_id = auth.uid();

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
    AND mp.user_id = auth.uid()
    AND mp.left_at IS NULL;

  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.leave_group(uuid) TO authenticated;
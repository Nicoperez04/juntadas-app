-- ============================================================
-- 025_security_hardening_grupos.sql
-- Bloque 4 — Fix crítico de seguridad (3/3, segunda ronda de review 
-- de Santi)
--
-- P1: get_group_member_ids no exigía membresía activa (left_at IS
-- NULL) en el chequeo de autorización — cualquier ex-miembro, sin
-- importar cuánto tiempo hubiera pasado, podía seguir llamando la
-- función y obtener la lista de miembros activos actuales.
--
-- Fix: exigir left_at IS NULL en el chequeo. Como consecuencia,
-- leave_group ya no puede depender de esta función para notificar
-- al resto (auth.uid() deja de calificar apenas sale) — se
-- refactoriza para calcular y devolver los destinatarios ANTES de
-- remover la membresía, en la misma transacción.
--
-- P2: las funciones SECURITY DEFINER de Grupos no revocaban
-- EXECUTE de PUBLIC — en Postgres, por defecto, cualquier rol
-- (incluso no autenticado) puede ejecutar una función nueva salvo
-- que se revoque explícitamente. Se cierra para todas las funciones
-- de Grupos creadas en E3.
-- ============================================================

-- P1a: get_group_member_ids ahora exige membresía activa
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
    WHERE gm.group_id = p_group_id AND gm.user_id = auth.uid() AND gm.left_at IS NULL
  ) THEN
    RAISE EXCEPTION 'No tenés relación activa con este grupo';
  END IF;

  RETURN QUERY
  SELECT gm.user_id
  FROM group_members gm
  WHERE gm.group_id = p_group_id
    AND gm.left_at IS NULL
    AND gm.user_id != p_excluded_user_id;
END;
$$;

-- P1b: leave_group calcula destinatarios ANTES de remover la membresía,
-- y los devuelve — ya no depende de get_group_member_ids después de salir
DROP FUNCTION public.leave_group(uuid);

CREATE OR REPLACE FUNCTION public.leave_group(p_group_id UUID)
RETURNS TABLE(
  cancelled_meetup_id UUID,
  cancelled_meetup_title TEXT,
  recipient_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_meetup RECORD;
  v_new_organizer_id UUID;
  v_recipient_ids UUID[];
  v_returned_any BOOLEAN := false;
BEGIN
  IF (SELECT role FROM group_members WHERE group_id = p_group_id AND user_id = auth.uid() AND left_at IS NULL) = 'admin' THEN
    RAISE EXCEPTION 'El admin debe transferir su rol antes de salir del grupo';
  END IF;

  -- Capturar destinatarios MIENTRAS auth.uid() todavía es miembro activo
  SELECT array_agg(gm.user_id) INTO v_recipient_ids
  FROM group_members gm
  WHERE gm.group_id = p_group_id
    AND gm.left_at IS NULL
    AND gm.user_id != auth.uid();

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
      recipient_ids := v_recipient_ids;
      v_returned_any := true;
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

  -- Sin juntadas canceladas: igual devolver una fila con los destinatarios
  IF NOT v_returned_any THEN
    cancelled_meetup_id := NULL;
    cancelled_meetup_title := NULL;
    recipient_ids := v_recipient_ids;
    RETURN NEXT;
  END IF;

  RETURN;
END;
$$;

-- P2: cerrar ejecución pública en todas las funciones de Grupos de E3
GRANT EXECUTE ON FUNCTION public.get_group_member_ids(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_group(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_group_member_ids(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.join_group_by_code(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.leave_group(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rejoin_group(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.invite_group_to_meetup(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.expel_group_member(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.transfer_group_admin(uuid, uuid) FROM PUBLIC;
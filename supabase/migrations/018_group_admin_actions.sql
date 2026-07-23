-- ============================================================
-- 018_group_admin_actions.sql
-- Bloque 4.5 — Expulsar miembros y transferir administración de grupo
--
-- PRECEDENTE DESCARTADO A PROPÓSITO:
--   meetupService.transferOrganizer() hace 3 UPDATEs secuenciales desde
--   el cliente sin transacción real (degradar → promover → actualizar
--   meetups.created_by); un fallo entre el paso 1 y el 2 deja la
--   juntada sin organizador en meetup_participants mientras
--   meetups.created_by sigue apuntando al viejo. Ese patrón no se
--   replica acá: transfer_group_admin hace ambos UPDATEs dentro de la
--   misma función SECURITY DEFINER (mismo patrón que leave_group/
--   rejoin_group de 014/016), atómico de verdad.
--
-- one_admin_per_group (014_groups.sql, índice único WHERE role='admin'
-- AND left_at IS NULL): el primer UPDATE de transfer_group_admin
-- degrada al admin actual ANTES de que el segundo promueva al nuevo, así
-- que la cantidad de admins activos pasa de 1→0→1 y nunca hay dos filas
-- con role='admin' simultáneamente — el índice nunca se viola.
--
-- FIX DE SEGURIDAD (post-análisis, previo a correr en Supabase):
--   El chequeo de rol original usaba "!= 'admin'" sobre una subquery que
--   puede devolver NULL (si auth.uid() no es miembro del grupo). En
--   PL/pgSQL, "IF NULL THEN" se evalúa como FALSE, así que un usuario
--   NO miembro del grupo pasaba el chequeo sin excepción y ejecutaba
--   la acción igual. Reemplazado por SELECT ... INTO variable +
--   "IS DISTINCT FROM", que sí trata NULL como comparable.
--
-- GUEST NO PROMOVIBLE (decisión 2026-07-23):
--   'guest' se mantiene en el enum group_role (no se elimina — sacarlo
--   demostró tener demasiadas dependencias en cascada para el tiempo
--   disponible), pero nunca se asigna desde el código y no tiene UI de
--   selección de rol. transfer_group_admin exige explícitamente
--   role = 'member' en el destinatario, así un guest (si alguna vez
--   llegara a existir una fila con ese rol) nunca puede terminar admin
--   por default — fail closed ante un concepto de rol no cerrado.
--
-- LÓGICA AGREGADA (Tarea 3.5, confirmada por Agus):
--   expel_group_member también remueve al expulsado (soft-delete,
--   left_at = now()) de las juntadas ACTIVAS (status = 'active') del
--   grupo. Juntadas finished/cancelled no se tocan — no hay razón para
--   reescribir historial/estadísticas por una expulsión posterior.
--   Se hace en la misma transacción que la expulsión del grupo (todo
--   o nada), usando now() de Postgres, no timestamp de cliente.
-- ============================================================

-- Expulsar a un miembro del grupo. Solo el Admin puede ejecutar esta acción,
-- no puede expulsarse a sí mismo (para eso existe leave_group), y además de
-- sacarlo del grupo, lo remueve de las juntadas activas de ese grupo.
CREATE OR REPLACE FUNCTION public.expel_group_member(p_group_id UUID, p_target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role TEXT;
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

  -- Sacarlo de las juntadas ACTIVAS del grupo (soft-delete, mismo patrón
  -- que meetup_participants.left_at). Finalizadas/canceladas quedan intactas.
  UPDATE meetup_participants mp
  SET left_at = now()
  FROM meetups m
  WHERE mp.meetup_id = m.id
    AND m.group_id = p_group_id
    AND m.status = 'active'
    AND mp.user_id = p_target_user_id
    AND mp.left_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.expel_group_member(uuid, uuid) TO authenticated;

-- Transfiere la administración de forma atómica: baja al admin actual a member
-- y sube al destinatario a admin, en la misma transacción. Solo admite como
-- destinatario a un miembro con role = 'member' (guest queda excluido,
-- fail-closed por ser un concepto de rol no cerrado). Si el destinatario
-- no cumple, falla completo sin dejar estado parcial.
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
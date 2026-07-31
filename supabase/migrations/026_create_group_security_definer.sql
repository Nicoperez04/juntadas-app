-- ============================================================
-- 026_create_group_security_definer.sql
-- Bloque 4 — Fix: createGroup fallaba con RLS violation (42501)
--
-- BUG: groupService.createGroup() hacía
-- .from('groups').insert({...}).select().single() — un único
-- INSERT ... RETURNING *. El INSERT en sí pasa la policy
-- "groups_insert" (WITH CHECK created_by = auth.uid()), pero el
-- RETURNING de una fila bajo RLS se filtra con la policy de SELECT
-- ("groups_select": get_user_group_role(id, auth.uid()) IS NOT
-- NULL), no con la de INSERT. Esa policy solo se cumple si ya existe
-- una fila en group_members para el grupo recién creado — y esa fila
-- la crea el trigger trg_assign_group_creator_as_admin (AFTER INSERT
-- ON groups), que corre después de que la proyección del RETURNING
-- ya fue evaluada dentro de la misma sentencia. Resultado: el grupo
-- se crea y se comitea igual (el INSERT nunca falló), pero el cliente
-- recibe un 42501 en el RETURNING y nunca ve la fila.
--
-- Confirmado por diagnóstico manual: sacando el .select().single()
-- del INSERT, la creación se completa sin error.
--
-- FIX: crear el grupo vía una función RPC SECURITY DEFINER. Al correr
-- con los privilegios del owner de la función, sus propias consultas
-- (incluida la que arma el RETURNING) no están sujetas a RLS — no
-- importa el orden relativo entre el trigger y la proyección del
-- resultado, porque ninguna de las dos pasa por groups_select. Mismo
-- patrón que ya usan join_group_by_code, leave_group, etc.
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_group(
  p_name TEXT,
  p_description TEXT,
  p_join_code TEXT
)
RETURNS SETOF groups
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id UUID;
BEGIN
  INSERT INTO groups (name, description, join_code, created_by)
  VALUES (p_name, p_description, p_join_code, auth.uid())
  RETURNING id INTO v_group_id;

  RETURN QUERY SELECT * FROM groups WHERE id = v_group_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_group(text, text, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.create_group(text, text, text) FROM PUBLIC;

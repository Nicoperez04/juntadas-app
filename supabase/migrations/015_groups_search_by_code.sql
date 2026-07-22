-- ============================================================
-- 015_groups_search_by_code.sql
-- Bloque 4.2 — Permitir buscar/unirse a un grupo por join_code
-- antes de ser miembro.
--
-- Replica el patrón ya usado en meetups (002_fix_rls_circular.sql,
-- policy "meetups: select by join_code"): una policy SELECT adicional
-- y permisiva para usuarios autenticados, en vez de una función
-- SECURITY DEFINER acotada. groups no tiene columna status como
-- meetups, así que el equivalente es abrir el SELECT a cualquier
-- usuario autenticado (no solo a miembros).
-- ============================================================

CREATE POLICY "groups_select_by_join_code" ON groups FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- 002_fix_rls_circular.sql
-- Corrige recursión infinita en RLS de meetup_participants
--
-- PROBLEMA:
--   Políticas que consultan meetup_participants dentro de la
--   evaluación RLS de meetup_participants causan error
--   "infinite recursion detected in policy for relation meetup_participants"
--   y la app muestra "Ocurrió un error inesperado".
--
-- SOLUCIÓN:
--   Función SECURITY DEFINER que verifica membresía sin pasar
--   por RLS, más políticas separadas para fila propia y co-participantes.
--
-- EJECUTAR EN: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ------------------------------------------------------------
-- 1. Función helper: verifica membresía activa sin recursión RLS
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_active_meetup_member(p_meetup_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM meetup_participants
    WHERE meetup_id = p_meetup_id
      AND user_id = auth.uid()
      AND left_at IS NULL
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_active_meetup_member(uuid) TO authenticated;

-- ------------------------------------------------------------
-- 2. meetup_participants — SELECT (eliminar políticas rotas/circulares)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "meetup_participants: select" ON meetup_participants;
DROP POLICY IF EXISTS "meetup_participants: select own" ON meetup_participants;
DROP POLICY IF EXISTS "meetup_participants: select as participant" ON meetup_participants;
DROP POLICY IF EXISTS "meetup_participants: select own row" ON meetup_participants;
DROP POLICY IF EXISTS "meetup_participants: select co-participants" ON meetup_participants;

-- Cada usuario siempre puede leer su propio registro (sin subquery)
CREATE POLICY "meetup_participants: select own row"
  ON meetup_participants FOR SELECT
  USING (user_id = auth.uid());

-- Si sos miembro activo, podés ver a todos los participantes de esa juntada
CREATE POLICY "meetup_participants: select co-participants"
  ON meetup_participants FOR SELECT
  USING (is_active_meetup_member(meetup_id));

-- ------------------------------------------------------------
-- 3. meetup_participants — UPDATE (organizador puede editar asistencia de todos)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "meetup_participants: update as organizer" ON meetup_participants;

CREATE POLICY "meetup_participants: update as organizer"
  ON meetup_participants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM meetups
      WHERE id = meetup_participants.meetup_id
        AND created_by = auth.uid()
    )
  );

-- La política "meetup_participants: update own" de 001 sigue vigente
-- para que cada participante modifique su propia asistencia.

-- ------------------------------------------------------------
-- 4. meetups — SELECT (usar función en lugar de EXISTS circular)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "meetups: select as participant or organizer" ON meetups;

CREATE POLICY "meetups: select as member or organizer"
  ON meetups FOR SELECT
  USING (
    created_by = auth.uid()
    OR is_active_meetup_member(id)
  );

-- Mantener política para unirse por código (juntadas activas)
DROP POLICY IF EXISTS "meetups: select by join_code" ON meetups;

CREATE POLICY "meetups: select by join_code"
  ON meetups FOR SELECT
  USING (
    status = 'active'
    AND auth.uid() IS NOT NULL
  );

-- ------------------------------------------------------------
-- 5. profiles — SELECT (ver nombres de co-participantes)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "profiles: select co-participants" ON profiles;

CREATE POLICY "profiles: select co-participants"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT mp.user_id
      FROM meetup_participants mp
      WHERE is_active_meetup_member(mp.meetup_id)
    )
  );

-- La política "profiles: select own" de 001 sigue vigente.

-- ------------------------------------------------------------
-- 6. Tablas relacionadas — usar función en lugar de EXISTS
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "impostor_games: select" ON impostor_games;

CREATE POLICY "impostor_games: select"
  ON impostor_games FOR SELECT
  USING (is_active_meetup_member(meetup_id));

DROP POLICY IF EXISTS "memories: select" ON memories;

CREATE POLICY "memories: select"
  ON memories FOR SELECT
  USING (is_active_meetup_member(meetup_id));

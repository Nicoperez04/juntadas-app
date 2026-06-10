-- ============================================================
-- JUNTADAS — Reseñas post-juntada
-- Bloque 2 (E2) — Reseñas post-juntada
-- ============================================================
--
-- Ejecutar en Supabase Dashboard → SQL Editor → Run.
-- Requiere las funciones is_active_meetup_member de 002_fix_rls_circular.sql.
--
-- Verificación previa:
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'meetups' AND column_name = 'reviews_enabled';
-- SELECT * FROM pg_policies WHERE tablename = 'meetup_reviews';

-- ------------------------------------------------------------
-- 1. Columna reviews_enabled en meetups
-- ------------------------------------------------------------
-- El organizador elige al finalizar si los participantes pueden dejar reseñas.
-- Una vez habilitado (true), no se puede volver a false desde la app.
ALTER TABLE meetups
  ADD COLUMN IF NOT EXISTS reviews_enabled BOOLEAN NOT NULL DEFAULT false;

-- ------------------------------------------------------------
-- 2. Tabla meetup_reviews
-- ------------------------------------------------------------
-- Una reseña por usuario y juntada; rating obligatorio (1-5), comentario opcional.
CREATE TABLE IF NOT EXISTS meetup_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meetup_id   UUID NOT NULL REFERENCES meetups(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating      SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_meetup_review_per_user UNIQUE (meetup_id, user_id)
);

-- Índices para listar reseñas por juntada y buscar la reseña de un usuario
CREATE INDEX IF NOT EXISTS idx_meetup_reviews_meetup_id ON meetup_reviews(meetup_id);
CREATE INDEX IF NOT EXISTS idx_meetup_reviews_user_id ON meetup_reviews(user_id);

-- ------------------------------------------------------------
-- 3. Trigger updated_at en meetup_reviews
-- ------------------------------------------------------------
-- Reutiliza la función update_updated_at() definida en 001_initial_schema.sql.
CREATE TRIGGER trg_meetup_reviews_updated_at
  BEFORE UPDATE ON meetup_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ------------------------------------------------------------
-- 4. Función helper: verifica participación (activa o histórica)
-- ------------------------------------------------------------
-- Para SELECT de reseñas: cualquier miembro activo o quien haya participado
-- (incluso si abandonó la juntada) puede leer las reseñas.
CREATE OR REPLACE FUNCTION public.is_meetup_participant(p_meetup_id uuid)
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
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_meetup_participant(uuid) TO authenticated;

-- ------------------------------------------------------------
-- 5. Row Level Security en meetup_reviews
-- ------------------------------------------------------------
ALTER TABLE meetup_reviews ENABLE ROW LEVEL SECURITY;

-- SELECT: miembros activos o ex-participantes de la juntada
CREATE POLICY "meetup_reviews: select as participant"
  ON meetup_reviews FOR SELECT
  USING (is_meetup_participant(meetup_id));

-- INSERT: participante activo, juntada finished, reviews habilitadas y sin reseña previa
CREATE POLICY "meetup_reviews: insert as participant"
  ON meetup_reviews FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM meetup_participants mp
      INNER JOIN meetups m ON m.id = mp.meetup_id
      WHERE mp.meetup_id = meetup_reviews.meetup_id
        AND mp.user_id = auth.uid()
        AND mp.left_at IS NULL
        AND m.status = 'finished'
        AND m.reviews_enabled = true
    )
    AND NOT EXISTS (
      SELECT 1
      FROM meetup_reviews mr
      WHERE mr.meetup_id = meetup_reviews.meetup_id
        AND mr.user_id = auth.uid()
    )
  );

-- UPDATE: solo el autor de la reseña
CREATE POLICY "meetup_reviews: update own"
  ON meetup_reviews FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: solo el autor de la reseña
CREATE POLICY "meetup_reviews: delete own"
  ON meetup_reviews FOR DELETE
  USING (user_id = auth.uid());

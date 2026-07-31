-- ============================================================
-- JUNTADAS — Ocultar juntadas del historial individual
-- Bloque 3 (E2) — Historial mejorado
-- ============================================================
--
-- Ejecutar en Supabase Dashboard → SQL Editor → Run.
--
-- Permite que cada usuario oculte juntadas de su historial sin
-- afectar a los demás participantes. El organizador además puede
-- eliminar la juntada para todos (hard delete en meetups).

-- ------------------------------------------------------------
-- 1. Tabla meetup_hidden
-- ------------------------------------------------------------
-- Registra qué juntadas ocultó cada usuario de su historial.
-- La combinación (meetup_id, user_id) es única para evitar duplicados.
CREATE TABLE IF NOT EXISTS meetup_hidden (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meetup_id   UUID NOT NULL REFERENCES meetups(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_meetup_hidden_per_user UNIQUE (meetup_id, user_id)
);

-- Índice para filtrar rápidamente las juntadas ocultas de un usuario
CREATE INDEX IF NOT EXISTS idx_meetup_hidden_user_id ON meetup_hidden(user_id);

-- ------------------------------------------------------------
-- 2. Row Level Security en meetup_hidden
-- ------------------------------------------------------------
ALTER TABLE meetup_hidden ENABLE ROW LEVEL SECURITY;

-- SELECT: cada usuario solo ve sus propios registros de ocultamiento
CREATE POLICY "meetup_hidden: select own"
  ON meetup_hidden FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: cada usuario solo puede ocultar juntadas para sí mismo
CREATE POLICY "meetup_hidden: insert own"
  ON meetup_hidden FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- DELETE: cada usuario solo puede deshacer su propio ocultamiento
CREATE POLICY "meetup_hidden: delete own"
  ON meetup_hidden FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- 027_game_results.sql
-- Bloque 6 - Registro y estadisticas de juegos por juntada
--
-- Guarda resultados finales de juegos iniciados desde una juntada.
-- No implementa edicion ni borrado en esta etapa.
-- ============================================================

CREATE TABLE game_results (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meetup_id     UUID NOT NULL REFERENCES meetups(id) ON DELETE CASCADE,
  created_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  game_type     TEXT NOT NULL CHECK (
    game_type IN ('truco', 'generala', 'league', 'tournament', 'scorer', 'impostor')
  ),
  winner_name   TEXT NOT NULL,
  winner_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  participants  JSONB NOT NULL DEFAULT '[]'::jsonb,
  score_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_game_results_meetup_id ON game_results(meetup_id);
CREATE INDEX idx_game_results_game_type ON game_results(game_type);
CREATE INDEX idx_game_results_winner_name ON game_results(winner_name);
CREATE INDEX idx_game_results_created_at ON game_results(created_at);

ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;

-- SELECT: participantes activos o historicos de la juntada pueden ver resultados.
CREATE POLICY "game_results_select_as_meetup_participant"
  ON game_results FOR SELECT
  USING (is_meetup_participant(meetup_id));

-- INSERT: solo participantes activos de una juntada activa pueden registrar resultados.
CREATE POLICY "game_results_insert_as_active_participant"
  ON game_results FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM meetup_participants mp
      INNER JOIN meetups m ON m.id = mp.meetup_id
      WHERE mp.meetup_id = game_results.meetup_id
        AND mp.user_id = auth.uid()
        AND mp.left_at IS NULL
        AND m.status = 'active'
    )
  );

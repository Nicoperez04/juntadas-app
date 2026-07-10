-- ============================================================
-- JUNTADAS — impostor_games.created_by nullable
-- Bloque 1 E3 — Hard delete de cuenta (Prompt 04b)
-- ============================================================
--
-- Permite anonimizar partidas de impostor al eliminar cuenta
-- sin borrar el historial de la partida para otros participantes.

ALTER TABLE impostor_games
  ALTER COLUMN created_by DROP NOT NULL;

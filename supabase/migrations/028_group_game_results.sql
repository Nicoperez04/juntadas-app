-- ============================================================
-- 028_group_game_results.sql
-- Bloque 6 - Estadisticas historicas de juegos por grupo
--
-- Permite que cualquier miembro activo de un grupo vea los resultados
-- registrados en todas las juntadas asociadas a ese grupo, aunque no haya
-- participado en cada juntada individual.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_group_game_results(p_group_id UUID)
RETURNS TABLE(
  id UUID,
  meetup_id UUID,
  meetup_title TEXT,
  created_by UUID,
  game_type TEXT,
  winner_name TEXT,
  winner_user_id UUID,
  participants JSONB,
  score_summary JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM group_members gm
    WHERE gm.group_id = p_group_id
      AND gm.user_id = auth.uid()
      AND gm.left_at IS NULL
  ) THEN
    RAISE EXCEPTION 'No tenes acceso a las estadisticas de este grupo';
  END IF;

  RETURN QUERY
  SELECT
    gr.id,
    gr.meetup_id,
    m.title AS meetup_title,
    gr.created_by,
    gr.game_type,
    gr.winner_name,
    gr.winner_user_id,
    gr.participants,
    gr.score_summary,
    gr.metadata,
    gr.created_at
  FROM game_results gr
  INNER JOIN meetups m ON m.id = gr.meetup_id
  WHERE m.group_id = p_group_id
  ORDER BY gr.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_group_game_results(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_group_game_results(uuid) FROM PUBLIC;

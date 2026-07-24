import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { gameResultService } from '../services/gameResultService';
import type { CreateGameResultInput, GameResult, MeetupGameStats } from '../types';

interface OperationResult<T> {
  data: T | null;
  error: string | null;
}

export const useGameResults = (meetupId?: string) => {
  const queryClient = useQueryClient();
  const { userId } = useCurrentUser();

  const resultsQuery = useQuery({
    queryKey: ['gameResults', meetupId],
    enabled: !!meetupId,
    queryFn: async (): Promise<GameResult[]> => {
      if (!meetupId) return [];
      const { data, error } = await gameResultService.getResultsByMeetup(meetupId);
      if (error) throw new Error(error);
      return data ?? [];
    },
  });

  const statsQuery = useQuery({
    queryKey: ['gameStats', meetupId],
    enabled: !!meetupId,
    queryFn: async (): Promise<MeetupGameStats> => {
      if (!meetupId) {
        return {
          totalResults: 0,
          distinctGameTypes: 0,
          mostFrequentWinner: null,
          winnerRanking: [],
          gameTypeDistribution: [],
          results: [],
        };
      }

      const { data, error } = await gameResultService.getStatsByMeetup(meetupId);
      if (error) throw new Error(error);
      return (
        data ?? {
          totalResults: 0,
          distinctGameTypes: 0,
          mostFrequentWinner: null,
          winnerRanking: [],
          gameTypeDistribution: [],
          results: [],
        }
      );
    },
  });

  const invalidateGameResults = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['gameResults', meetupId] }),
      queryClient.invalidateQueries({ queryKey: ['gameStats', meetupId] }),
    ]);
  }, [meetupId, queryClient]);

  const createResultMutation = useMutation({
    mutationFn: async (
      input: CreateGameResultInput,
    ): Promise<OperationResult<GameResult>> => {
      if (!userId) {
        return { data: null, error: 'No hay usuario autenticado' };
      }
      if (!input.meetupId) {
        return { data: null, error: 'No hay una juntada asociada' };
      }
      return gameResultService.createResult(userId, input);
    },
    onSuccess: async (result) => {
      if (!result.error) {
        await invalidateGameResults();
      }
    },
  });

  const createResult = useCallback(
    (input: CreateGameResultInput): Promise<OperationResult<GameResult>> =>
      createResultMutation.mutateAsync(input),
    [createResultMutation],
  );

  return {
    results: resultsQuery.data ?? [],
    stats: statsQuery.data ?? null,
    isLoading:
      resultsQuery.isLoading ||
      resultsQuery.isFetching ||
      statsQuery.isLoading ||
      statsQuery.isFetching,
    error: resultsQuery.error?.message ?? statsQuery.error?.message ?? null,
    createResult,
    isCreating: createResultMutation.isPending,
    refresh: invalidateGameResults,
  };
};

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { gameResultService } from '../services/gameResultService';
import type { GroupGameStats } from '../types';

const EMPTY_GROUP_STATS: GroupGameStats = {
  totalResults: 0,
  distinctGameTypes: 0,
  mostFrequentWinner: null,
  winnerRanking: [],
  gameTypeDistribution: [],
  results: [],
};

export const useGroupGameResults = (groupId?: string) => {
  const queryClient = useQueryClient();

  const statsQuery = useQuery({
    queryKey: ['groupGameStats', groupId],
    enabled: !!groupId,
    queryFn: async (): Promise<GroupGameStats> => {
      if (!groupId) return EMPTY_GROUP_STATS;

      const { data, error } = await gameResultService.getStatsByGroup(groupId);
      if (error) throw new Error(error);
      return data ?? EMPTY_GROUP_STATS;
    },
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['groupGameStats', groupId] });
  }, [groupId, queryClient]);

  return {
    stats: statsQuery.data ?? null,
    isLoading: statsQuery.isLoading || statsQuery.isFetching,
    error: statsQuery.error?.message ?? null,
    refresh,
  };
};

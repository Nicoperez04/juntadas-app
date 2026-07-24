/**
 * Hook de la lista de juntadas de un grupo.
 *
 * Mismo criterio que useGroupMembers: query simple sin mutaciones — la
 * creación de juntadas del grupo se hace desde CreateMeetupScreen, no
 * desde esta pantalla.
 *
 * @param groupId - UUID del grupo
 */
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { groupService } from '../services/groupService';
import type { MeetupWithRole } from '@/features/meetups/types';

export const useGroupMeetups = (groupId: string) => {
  const { userId } = useCurrentUser();

  const meetupsQuery = useQuery({
    queryKey: ['groupMeetups', groupId],
    enabled: !!userId,
    queryFn: async (): Promise<MeetupWithRole[]> => {
      if (!userId) return [];
      const { data, error } = await groupService.getGroupMeetups(groupId, userId);
      if (error) throw new Error(error);
      return data ?? [];
    },
  });

  return {
    meetups: meetupsQuery.data ?? [],
    isLoading: meetupsQuery.isLoading || meetupsQuery.isFetching,
    error: meetupsQuery.error?.message ?? null,
    refresh: () => meetupsQuery.refetch(),
  };
};

/**
 * Hook de la lista de miembros de un grupo.
 *
 * Mismo criterio que useParticipants (feature de meetups): query simple
 * sin mutaciones — GroupMembersScreen todavía no expone acciones de
 * gestión de miembros (expulsar/transferir son 4.4/4.5).
 *
 * @param groupId - UUID del grupo
 */
import { useQuery } from '@tanstack/react-query';
import { groupService } from '../services/groupService';
import type { GroupMember } from '../types';

export const useGroupMembers = (groupId: string) => {
  const membersQuery = useQuery({
    queryKey: ['groupMembers', groupId],
    queryFn: async (): Promise<GroupMember[]> => {
      const { data, error } = await groupService.getGroupMembers(groupId);
      if (error) throw new Error(error);
      return data ?? [];
    },
  });

  return {
    members: membersQuery.data ?? [],
    isLoading: membersQuery.isLoading || membersQuery.isFetching,
    error: membersQuery.error?.message ?? null,
    refresh: () => membersQuery.refetch(),
  };
};

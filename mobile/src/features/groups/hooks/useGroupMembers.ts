/**
 * Hook de la lista de miembros de un grupo.
 *
 * Mismo criterio que useParticipants (feature de meetups): query simple
 * de lectura, más las mutaciones de gestión de miembros que llegan en
 * 4.5 (expulsar, transferir administración) — ambas invalidan la lista
 * de miembros, el detalle del grupo (el rol propio puede cambiar) y la
 * lista de "Mis grupos" (la card de cada grupo también muestra el rol).
 *
 * @param groupId - UUID del grupo
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { groupService } from '../services/groupService';
import type { GroupMember } from '../types';

interface OperationResult<T> {
  data: T | null;
  error: string | null;
}

/** Resultado de expelMember: juntadas del grupo canceladas automáticamente */
interface ExpelResult {
  cancelledMeetups: { id: string; title: string }[];
}

interface UseGroupMembersOptions {
  /**
   * Permite desactivar la query desde el caller — por ejemplo,
   * GroupDetailScreen ya sabe (vía useGroupDetail) que el usuario no es
   * miembro activo del grupo, así que no tiene sentido gastar esta
   * llamada: RLS la filtraría en silencio y devolvería una lista vacía
   * de todos modos.
   */
  enabled?: boolean;
}

export const useGroupMembers = (groupId: string, options?: UseGroupMembersOptions) => {
  const queryClient = useQueryClient();
  const { userId: currentUserId } = useCurrentUser();
  const enabled = options?.enabled ?? true;

  const membersQuery = useQuery({
    queryKey: ['groupMembers', groupId],
    enabled,
    queryFn: async (): Promise<GroupMember[]> => {
      const { data, error } = await groupService.getGroupMembers(groupId);
      if (error) throw new Error(error);
      return data ?? [];
    },
  });

  const invalidateAfterRoleChange = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['groupMembers', groupId] }),
      queryClient.invalidateQueries({ queryKey: ['groupDetail', groupId] }),
      queryClient.invalidateQueries({ queryKey: ['groups', currentUserId] }),
    ]);
  };

  const expelMutation = useMutation({
    mutationFn: async (targetUserId: string): Promise<OperationResult<ExpelResult>> => {
      if (!currentUserId) {
        return { data: null, error: 'No hay usuario autenticado' };
      }
      return groupService.expelMember(groupId, targetUserId, currentUserId);
    },
    onSuccess: async (result) => {
      if (!result.error) {
        await invalidateAfterRoleChange();
        // Si se canceló alguna juntada del grupo, refrescar su listado y detalle
        const cancelledMeetups = result.data?.cancelledMeetups ?? [];
        if (cancelledMeetups.length > 0) {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['groupMeetups', groupId] }),
            queryClient.invalidateQueries({ queryKey: ['meetups', currentUserId] }),
            ...cancelledMeetups.map((m) =>
              queryClient.invalidateQueries({ queryKey: ['meetup', m.id] }),
            ),
          ]);
        }
      }
    },
  });

  const transferMutation = useMutation({
    mutationFn: async (newAdminUserId: string): Promise<OperationResult<null>> =>
      groupService.transferAdmin(groupId, newAdminUserId),
    onSuccess: async (result) => {
      if (!result.error) {
        await invalidateAfterRoleChange();
      }
    },
  });

  return {
    members: membersQuery.data ?? [],
    isLoading: membersQuery.isLoading || membersQuery.isFetching,
    error: membersQuery.error?.message ?? null,
    refresh: () => membersQuery.refetch(),
    expelMember: (targetUserId: string) => expelMutation.mutateAsync(targetUserId),
    isExpelling: expelMutation.isPending,
    transferAdmin: (newAdminUserId: string) =>
      transferMutation.mutateAsync(newAdminUserId),
    isTransferring: transferMutation.isPending,
  };
};

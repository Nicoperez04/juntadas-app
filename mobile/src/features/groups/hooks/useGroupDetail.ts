/**
 * Hook de detalle de un grupo.
 *
 * Encapsula la lógica de datos que consume GroupDetailScreen:
 * - Obtención del grupo por ID con rol del usuario y conteos (caché ['groupDetail', groupId])
 * - Acciones de admin (eliminar grupo) y de cualquier miembro (salir del grupo)
 *
 * Mismo criterio que useMeetupDetail: la pantalla queda como orquestadora
 * de modales/toasts, la lógica de datos vive acá.
 *
 * @param groupId - UUID del grupo a mostrar
 */
import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { groupService } from '../services/groupService';
import type { GroupDetail } from '../types';

interface OperationResult<T> {
  data: T | null;
  error: string | null;
}

export const useGroupDetail = (groupId: string) => {
  const queryClient = useQueryClient();
  const { userId: currentUserId } = useCurrentUser();

  const groupQuery = useQuery({
    queryKey: ['groupDetail', groupId],
    enabled: !!currentUserId,
    queryFn: async (): Promise<GroupDetail> => {
      if (!currentUserId) throw new Error('No hay usuario autenticado');
      const { data, error } = await groupService.getGroupDetail(
        groupId,
        currentUserId,
      );
      if (error || !data) {
        throw new Error(error ?? 'No se pudo cargar el grupo');
      }
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (): Promise<OperationResult<null>> =>
      groupService.deleteGroup(groupId),
    onSuccess: async (result) => {
      if (!result.error) {
        await queryClient.invalidateQueries({ queryKey: ['groups', currentUserId] });
      }
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async (): Promise<OperationResult<null>> =>
      groupService.leaveGroup(groupId),
    onSuccess: async (result) => {
      if (!result.error) {
        await queryClient.invalidateQueries({ queryKey: ['groups', currentUserId] });
      }
    },
  });

  const group = groupQuery.data ?? null;
  const isAdmin = group?.userRole === 'admin';

  /** Recarga el detalle del grupo desde el servidor */
  const reload = useCallback(async () => {
    await groupQuery.refetch();
  }, [groupQuery.refetch]);

  return {
    group,
    isLoading: groupQuery.isLoading || groupQuery.isFetching,
    error: groupQuery.error?.message ?? null,
    isAdmin,
    deleteGroup: () => deleteMutation.mutateAsync(),
    isDeleting: deleteMutation.isPending,
    leaveGroup: () => leaveMutation.mutateAsync(),
    isLeaving: leaveMutation.isPending,
    reload,
  };
};

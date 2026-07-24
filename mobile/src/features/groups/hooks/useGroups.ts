/**
 * Hook principal del módulo de grupos — sigue el mismo patrón que useMeetups.ts
 * (TanStack Query, contrato { data, error } uniforme).
 *
 * La lista de grupos del usuario vive en la caché bajo la key ['groups', userId];
 * las mutaciones (crear, unirse) invalidan esa key para que la lista se
 * refresque automáticamente en todas las pantallas que la consumen.
 */
import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { groupService, notifyGroupMemberJoined } from '../services/groupService';
import type { GroupWithRole, CreateGroupFormData, Group } from '../types';

/** Contrato de retorno de las operaciones expuestas por el hook */
interface OperationResult<T> {
  data: T | null;
  error: string | null;
}

export const useGroups = () => {
  const queryClient = useQueryClient();
  const { userId, isLoading: isLoadingSession } = useCurrentUser();

  /**
   * Query de la lista de grupos activos del usuario.
   * Se habilita recién cuando la sesión está resuelta y hay usuario,
   * replicando el comportamiento de useMeetups.
   */
  const groupsQuery = useQuery({
    queryKey: ['groups', userId],
    enabled: !!userId,
    queryFn: async (): Promise<GroupWithRole[]> => {
      if (!userId) return [];
      const { data, error } = await groupService.getMyGroups(userId);
      if (error) throw new Error(error);
      return data ?? [];
    },
  });

  /** Invalida la lista de grupos del usuario y espera el refetch */
  const invalidateGroups = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['groups', userId] });
  }, [queryClient, userId]);

  /** Mutación de creación de grupo — refresca la lista si fue exitosa */
  const createGroupMutation = useMutation({
    mutationFn: async (
      formData: CreateGroupFormData,
    ): Promise<OperationResult<Group>> => groupService.createGroup(formData),
    onSuccess: async (result) => {
      if (!result.error) {
        await invalidateGroups();
      }
    },
  });

  /** Mutación para unirse a un grupo por código — refresca la lista si fue exitosa */
  const joinGroupMutation = useMutation({
    mutationFn: async (
      joinCode: string,
    ): Promise<OperationResult<{ groupId: string; isReactivation: boolean }>> =>
      groupService.joinGroupByCode(joinCode),
    onSuccess: async (result) => {
      if (!result.error) {
        await invalidateGroups();
        if (result.data && !result.data.isReactivation && userId) {
          await notifyGroupMemberJoined(result.data.groupId, userId);
        }
      }
    },
  });

  /**
   * Crea un nuevo grupo con los datos del formulario y recarga la lista.
   *
   * @param formData - Datos validados del formulario de creación
   * @returns El grupo creado o un mensaje de error
   */
  const createGroup = useCallback(
    (formData: CreateGroupFormData): Promise<OperationResult<Group>> =>
      createGroupMutation.mutateAsync(formData),
    [createGroupMutation.mutateAsync],
  );

  /**
   * Une al usuario a un grupo mediante su código de ingreso y recarga la lista.
   *
   * @param joinCode - Código de 6 caracteres del grupo
   * @returns El id del grupo al que se unió (y si fue una reactivación) o un mensaje de error
   */
  const joinGroup = useCallback(
    (
      joinCode: string,
    ): Promise<OperationResult<{ groupId: string; isReactivation: boolean }>> =>
      joinGroupMutation.mutateAsync(joinCode),
    [joinGroupMutation.mutateAsync],
  );

  /**
   * Recarga la lista de grupos del usuario desde el servidor.
   */
  const refresh = useCallback(() => {
    void groupsQuery.refetch();
  }, [groupsQuery.refetch]);

  return {
    groups: groupsQuery.data ?? [],
    isLoading:
      isLoadingSession || groupsQuery.isLoading || groupsQuery.isFetching,
    error: groupsQuery.error?.message ?? null,
    createGroup,
    joinGroup,
    refresh,
  };
};

/**
 * Hook principal del módulo de juntadas — migrado a TanStack Query.
 *
 * La lista de juntadas del usuario vive en la caché bajo la key
 * ['meetups', userId]; las mutaciones (crear, unirse, cancelar, finalizar,
 * editar) invalidan esa key para que la lista se refresque automáticamente
 * en todas las pantallas que la consumen.
 *
 * La interfaz pública se mantiene idéntica a la versión anterior basada
 * en useState/useEffect para que las pantallas no necesiten cambios.
 */
import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { meetupService } from '../services/meetupService';
import type {
  MeetupWithRole,
  MeetupParticipant,
  CreateMeetupFormData,
  Meetup,
} from '../types';

/** Contrato de retorno de las operaciones expuestas por el hook */
interface OperationResult<T> {
  data: T | null;
  error: string | null;
}

/** Variables de la mutación de edición: id de la juntada + datos del formulario */
interface EditMeetupVariables {
  meetupId: string;
  formData: CreateMeetupFormData;
}

export const useMeetups = () => {
  const queryClient = useQueryClient();
  const { userId, isLoading: isLoadingSession } = useCurrentUser();

  /**
   * Query de la lista de juntadas activas del usuario.
   * Se habilita recién cuando la sesión está resuelta y hay usuario,
   * replicando el comportamiento previo de esperar el userId.
   */
  const meetupsQuery = useQuery({
    queryKey: ['meetups', userId],
    enabled: !!userId,
    queryFn: async (): Promise<MeetupWithRole[]> => {
      // El guard de enabled garantiza userId, pero TypeScript no lo sabe
      if (!userId) return [];
      const { data, error } = await meetupService.getUserMeetups(userId);
      // El servicio nunca lanza; se relanza como excepción para que
      // TanStack Query gestione retry y estado de error.
      if (error) throw new Error(error);
      return data ?? [];
    },
  });

  /**
   * Invalida la lista de juntadas del usuario y espera el refetch,
   * replicando el "await loadMeetups(userId)" de la versión anterior.
   */
  const invalidateMeetups = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['meetups', userId] });
  }, [queryClient, userId]);

  /** Mutación de creación de juntada — refresca la lista si fue exitosa */
  const createMeetupMutation = useMutation({
    mutationFn: async (
      formData: CreateMeetupFormData,
    ): Promise<OperationResult<Meetup>> => {
      if (!userId) {
        return { data: null, error: 'No hay usuario autenticado' };
      }
      return meetupService.createMeetup(userId, formData);
    },
    onSuccess: async (result) => {
      if (!result.error) {
        await invalidateMeetups();
      }
    },
  });

  /** Mutación para unirse a una juntada por código — refresca la lista si fue exitosa */
  const joinMeetupMutation = useMutation({
    mutationFn: async (joinCode: string): Promise<OperationResult<Meetup>> => {
      if (!userId) {
        return { data: null, error: 'No hay usuario autenticado' };
      }
      return meetupService.joinMeetup(userId, joinCode);
    },
    onSuccess: async (result) => {
      if (!result.error) {
        await invalidateMeetups();
      }
    },
  });

  /** Mutación de cancelación — solo el organizador puede ejecutarla */
  const cancelMeetupMutation = useMutation({
    mutationFn: async (meetupId: string): Promise<OperationResult<Meetup>> => {
      if (!userId) {
        return { data: null, error: 'No hay usuario autenticado' };
      }
      return meetupService.cancelMeetup(meetupId, userId);
    },
    onSuccess: async (result) => {
      if (!result.error) {
        await invalidateMeetups();
      }
    },
  });

  /** Mutación de finalización — solo el organizador puede ejecutarla */
  const finishMeetupMutation = useMutation({
    mutationFn: async (meetupId: string): Promise<OperationResult<Meetup>> => {
      if (!userId) {
        return { data: null, error: 'No hay usuario autenticado' };
      }
      return meetupService.finishMeetup(meetupId, userId);
    },
    onSuccess: async (result) => {
      if (!result.error) {
        await invalidateMeetups();
      }
    },
  });

  /** Mutación de edición — solo el organizador puede ejecutarla */
  const editMeetupMutation = useMutation({
    mutationFn: async ({
      meetupId,
      formData,
    }: EditMeetupVariables): Promise<OperationResult<Meetup>> => {
      if (!userId) {
        return { data: null, error: 'No hay usuario autenticado' };
      }
      return meetupService.editMeetup(meetupId, userId, formData);
    },
    onSuccess: async (result) => {
      if (!result.error) {
        await invalidateMeetups();
      }
    },
  });

  /**
   * Crea una nueva juntada con los datos del formulario y recarga la lista.
   *
   * @param formData - Datos validados del formulario de creación
   * @returns La juntada creada o un mensaje de error
   */
  const createMeetup = useCallback(
    (formData: CreateMeetupFormData): Promise<OperationResult<Meetup>> =>
      createMeetupMutation.mutateAsync(formData),
    [createMeetupMutation.mutateAsync],
  );

  /**
   * Une al usuario a una juntada mediante su código de ingreso y recarga la lista.
   *
   * @param joinCode - Código de 6 caracteres de la juntada
   * @returns La juntada a la que se unió o un mensaje de error
   */
  const joinMeetup = useCallback(
    (joinCode: string): Promise<OperationResult<Meetup>> =>
      joinMeetupMutation.mutateAsync(joinCode),
    [joinMeetupMutation.mutateAsync],
  );

  /**
   * Cancela una juntada activa. Solo el organizador puede ejecutar esta acción.
   *
   * @param meetupId - UUID de la juntada a cancelar
   * @returns La juntada cancelada o mensaje de error
   */
  const cancelMeetup = useCallback(
    (meetupId: string): Promise<OperationResult<Meetup>> =>
      cancelMeetupMutation.mutateAsync(meetupId),
    [cancelMeetupMutation.mutateAsync],
  );

  /**
   * Finaliza una juntada activa. Solo el organizador puede ejecutar esta acción.
   *
   * @param meetupId - UUID de la juntada a finalizar
   * @returns La juntada finalizada o mensaje de error
   */
  const finishMeetup = useCallback(
    (meetupId: string): Promise<OperationResult<Meetup>> =>
      finishMeetupMutation.mutateAsync(meetupId),
    [finishMeetupMutation.mutateAsync],
  );

  /**
   * Edita los campos de una juntada activa. Solo el organizador puede editar.
   *
   * @param meetupId - UUID de la juntada
   * @param formData - Datos validados del formulario
   * @returns La juntada actualizada o mensaje de error
   */
  const editMeetup = useCallback(
    (
      meetupId: string,
      formData: CreateMeetupFormData,
    ): Promise<OperationResult<Meetup>> =>
      editMeetupMutation.mutateAsync({ meetupId, formData }),
    [editMeetupMutation.mutateAsync],
  );

  /**
   * Obtiene el detalle completo de una juntada por su ID.
   * No usa la caché de queries; la pantalla que llama maneja su propio loading.
   *
   * @param meetupId - UUID de la juntada
   * @returns La juntada con todos sus campos o un mensaje de error
   */
  const getMeetupById = useCallback(
    async (meetupId: string): Promise<OperationResult<Meetup>> => {
      return meetupService.getMeetupById(meetupId);
    },
    [],
  );

  /**
   * Obtiene la lista de participantes de una juntada con sus perfiles.
   * No usa la caché de queries; la pantalla que llama maneja su propio loading.
   *
   * @param meetupId - UUID de la juntada
   * @returns Lista de participantes con perfil o un mensaje de error
   */
  const getMeetupParticipants = useCallback(
    async (
      meetupId: string,
    ): Promise<OperationResult<MeetupParticipant[]>> => {
      return meetupService.getMeetupParticipants(meetupId);
    },
    [],
  );

  /**
   * Obtiene juntadas finalizadas o canceladas del historial del usuario.
   * No usa la caché de queries; la pantalla de historial maneja su loading.
   *
   * @returns Lista de juntadas históricas o mensaje de error
   */
  const getFinishedMeetups = useCallback(async (): Promise<
    OperationResult<MeetupWithRole[]>
  > => {
    if (!userId) {
      return { data: null, error: 'No hay usuario autenticado' };
    }
    return meetupService.getFinishedMeetups(userId);
  }, [userId]);

  /**
   * Recarga la lista de juntadas del usuario desde el servidor.
   * Llamar después de operaciones que modifican el estado de las juntadas.
   */
  const refresh = useCallback(() => {
    void meetupsQuery.refetch();
  }, [meetupsQuery.refetch]);

  return {
    meetups: meetupsQuery.data ?? [],
    /**
     * isLoading combina la resolución de sesión, la carga inicial y los
     * refetches para conservar la semántica anterior, donde cada recarga
     * volvía a encender el spinner de la lista.
     */
    isLoading:
      isLoadingSession || meetupsQuery.isLoading || meetupsQuery.isFetching,
    error: meetupsQuery.error?.message ?? null,
    createMeetup,
    joinMeetup,
    getMeetupById,
    getMeetupParticipants,
    cancelMeetup,
    finishMeetup,
    editMeetup,
    getFinishedMeetups,
    refresh,
  };
};

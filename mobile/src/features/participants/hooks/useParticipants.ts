/**
 * Hook de participantes de una juntada — migrado a TanStack Query.
 *
 * La lista de participantes vive en la caché bajo la key
 * ['participants', meetupId]; las mutaciones de asistencia la invalidan
 * para que todas las pantallas que la consumen se actualicen solas.
 *
 * La interfaz pública se mantiene idéntica a la versión anterior basada
 * en useState/useEffect para que las pantallas no necesiten cambios.
 *
 * @param meetupId - UUID de la juntada
 * @param userId - UUID del usuario autenticado (null mientras se resuelve la sesión)
 */
import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { participantService } from '../services/participantService';
import type { MeetupParticipant, AttendanceStatus } from '../types';

/** Contrato de retorno de las operaciones expuestas por el hook */
interface OperationResult<T> {
  data: T | null;
  error: string | null;
}

/** Variables de la mutación de asistencia de terceros (acción del organizador) */
interface OrganizerAttendanceVariables {
  targetUserId: string;
  status: AttendanceStatus;
}

export const useParticipants = (meetupId: string, userId: string | null) => {
  const queryClient = useQueryClient();

  /** Query de la lista de participantes activos de la juntada */
  const participantsQuery = useQuery({
    queryKey: ['participants', meetupId],
    queryFn: async (): Promise<MeetupParticipant[]> => {
      const { data, error } = await participantService.getParticipants(meetupId);
      // El servicio nunca lanza; se relanza como excepción para que
      // TanStack Query gestione retry y estado de error.
      if (error) throw new Error(error);
      return data ?? [];
    },
  });

  /**
   * Invalida la lista de participantes y espera el refetch, replicando
   * el "await refresh()" que hacía la versión anterior tras cada mutación.
   */
  const invalidateParticipants = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: ['participants', meetupId],
    });
  }, [queryClient, meetupId]);

  /** Mutación de asistencia propia del usuario autenticado */
  const updateAttendanceMutation = useMutation({
    mutationFn: async (
      status: AttendanceStatus,
    ): Promise<OperationResult<MeetupParticipant>> => {
      if (!userId) {
        return { data: null, error: 'No hay usuario autenticado' };
      }
      return participantService.updateAttendance(meetupId, userId, status);
    },
    onSuccess: async (result) => {
      if (!result.error) {
        await invalidateParticipants();
      }
    },
  });

  /** Mutación de asistencia de otro participante (solo organizador) */
  const updateParticipantAttendanceMutation = useMutation({
    mutationFn: async ({
      targetUserId,
      status,
    }: OrganizerAttendanceVariables): Promise<
      OperationResult<MeetupParticipant>
    > => {
      if (!userId) {
        return { data: null, error: 'No hay usuario autenticado' };
      }
      return participantService.updateParticipantAttendanceByOrganizer(
        meetupId,
        userId,
        targetUserId,
        status,
      );
    },
    onSuccess: async (result) => {
      if (!result.error) {
        await invalidateParticipants();
      }
    },
  });

  /**
   * Mutación de abandono (soft delete). No invalida la lista porque la
   * pantalla navega fuera del detalle inmediatamente después de abandonar,
   * igual que en la versión anterior del hook.
   */
  const leaveMeetupMutation = useMutation({
    mutationFn: async (): Promise<OperationResult<boolean>> => {
      if (!userId) {
        return { data: null, error: 'No hay usuario autenticado' };
      }
      return participantService.leaveMeetup(meetupId, userId);
    },
  });

  /**
   * Actualiza el estado de asistencia del usuario autenticado y refresca la lista.
   *
   * @param status - Nuevo estado de asistencia
   * @returns Resultado de la operación para feedback en la UI
   */
  const updateAttendance = useCallback(
    (status: AttendanceStatus): Promise<OperationResult<MeetupParticipant>> =>
      updateAttendanceMutation.mutateAsync(status),
    [updateAttendanceMutation.mutateAsync],
  );

  /**
   * Actualiza la asistencia de otro participante como organizador.
   *
   * @param targetUserId - UUID del participante a modificar
   * @param status - Nuevo estado de asistencia
   * @returns Resultado de la operación para feedback en la UI
   */
  const updateParticipantAttendance = useCallback(
    (
      targetUserId: string,
      status: AttendanceStatus,
    ): Promise<OperationResult<MeetupParticipant>> =>
      updateParticipantAttendanceMutation.mutateAsync({ targetUserId, status }),
    [updateParticipantAttendanceMutation.mutateAsync],
  );

  /**
   * Abandona la juntada como participante (soft delete).
   *
   * @returns Resultado de la operación para feedback en la UI
   */
  const leaveMeetup = useCallback(
    (): Promise<OperationResult<boolean>> => leaveMeetupMutation.mutateAsync(),
    [leaveMeetupMutation.mutateAsync],
  );

  /**
   * Recarga la lista de participantes activos desde el servicio.
   */
  const refresh = useCallback(async () => {
    await participantsQuery.refetch();
  }, [participantsQuery.refetch]);

  return {
    participants: participantsQuery.data ?? [],
    /**
     * isLoading incluye los refetches para conservar la semántica anterior,
     * donde cada recarga volvía a encender el indicador de carga.
     */
    isLoading: participantsQuery.isLoading || participantsQuery.isFetching,
    error: participantsQuery.error?.message ?? null,
    updateAttendance,
    updateParticipantAttendance,
    leaveMeetup,
    refresh,
  };
};

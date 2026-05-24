/**
 * Hook de participantes de una juntada.
 *
 * Centraliza la carga de la lista, la actualización de asistencia y el
 * abandono de la juntada para que las pantallas no manejen lógica async directamente.
 *
 * @param meetupId - UUID de la juntada
 * @param userId - UUID del usuario autenticado (null mientras se resuelve la sesión)
 */
import { useState, useEffect, useCallback } from 'react';
import { participantService } from '../services/participantService';
import type { MeetupParticipant, AttendanceStatus } from '../types';

export const useParticipants = (meetupId: string, userId: string | null) => {
  const [participants, setParticipants] = useState<MeetupParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Recarga la lista de participantes activos desde el servicio.
   */
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: err } = await participantService.getParticipants(meetupId);

    if (err) {
      setError(err);
    } else {
      setParticipants(data ?? []);
    }

    setIsLoading(false);
  }, [meetupId]);

  // Cargar participantes al montar o cuando cambia el meetupId
  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Actualiza el estado de asistencia del usuario autenticado y refresca la lista.
   *
   * @param status - Nuevo estado de asistencia
   * @returns Resultado de la operación para feedback en la UI
   */
  const updateAttendance = useCallback(
    async (status: AttendanceStatus) => {
      if (!userId) {
        return { data: null, error: 'No hay usuario autenticado' };
      }

      const result = await participantService.updateAttendance(
        meetupId,
        userId,
        status,
      );

      if (!result.error) {
        await refresh();
      }

      return result;
    },
    [meetupId, userId, refresh],
  );

  /**
   * Actualiza la asistencia de otro participante como organizador.
   *
   * @param targetUserId - UUID del participante a modificar
   * @param status - Nuevo estado de asistencia
   * @returns Resultado de la operación para feedback en la UI
   */
  const updateParticipantAttendance = useCallback(
    async (targetUserId: string, status: AttendanceStatus) => {
      if (!userId) {
        return { data: null, error: 'No hay usuario autenticado' };
      }

      const result = await participantService.updateParticipantAttendanceByOrganizer(
        meetupId,
        userId,
        targetUserId,
        status,
      );

      if (!result.error) {
        await refresh();
      }

      return result;
    },
    [meetupId, userId, refresh],
  );

  /**
   * Abandona la juntada como participante (soft delete).
   *
   * @returns Resultado de la operación para feedback en la UI
   */
  const leaveMeetup = useCallback(async () => {
    if (!userId) {
      return { data: null, error: 'No hay usuario autenticado' };
    }

    const result = await participantService.leaveMeetup(meetupId, userId);
    return result;
  }, [meetupId, userId]);

  return {
    participants,
    isLoading,
    error,
    updateAttendance,
    updateParticipantAttendance,
    leaveMeetup,
    refresh,
  };
};

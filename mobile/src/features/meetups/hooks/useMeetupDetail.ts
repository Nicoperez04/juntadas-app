/**
 * Hook de detalle de una juntada.
 *
 * Encapsula toda la lógica de datos que antes vivía en MeetupDetailScreen:
 * - Obtención del meetup por ID (caché ['meetup', meetupId])
 * - Lista de participantes (vía useParticipants)
 * - Estado del usuario actual en la juntada (rol, asistencia, abandono)
 * - Acciones del organizador (cancelar, finalizar; editar navega y queda en la pantalla)
 * - Acciones del participante (abandonar, modificar asistencia)
 *
 * La pantalla queda como orquestadora: consume este hook, maneja los
 * modales/toasts y renderiza los subcomponentes visuales.
 *
 * @param meetupId - UUID de la juntada a mostrar
 */
import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { useParticipants } from '@/features/participants/hooks/useParticipants';
import { participantService } from '@/features/participants/services/participantService';
import { meetupService } from '../services/meetupService';
import { useMeetups } from './useMeetups';
import type {
  Meetup,
  MeetupParticipant,
  ParticipantRole,
  AttendanceStatus,
} from '../types';

/** Contrato de retorno de las acciones expuestas por el hook */
interface OperationResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Determina si la juntada ya comenzó comparando fecha y hora con el momento actual.
 * Se usa para habilitar la acción de finalizar solo después del inicio.
 *
 * @param date - Fecha en formato YYYY-MM-DD desde Supabase
 * @param time - Hora en formato HH:MM:SS desde Supabase
 * @returns true si la fecha/hora de inicio ya pasó o es ahora
 */
const hasMeetupStarted = (date: string, time: string): boolean => {
  const meetupDateTime = new Date(`${date}T${time}`);
  return new Date() >= meetupDateTime;
};

export const useMeetupDetail = (meetupId: string) => {
  const { userId: currentUserId } = useCurrentUser();
  const {
    cancelMeetup: cancelMeetupAction,
    finishMeetup: finishMeetupAction,
  } = useMeetups();

  /** Query del detalle de la juntada */
  const meetupQuery = useQuery({
    queryKey: ['meetup', meetupId],
    queryFn: async (): Promise<Meetup> => {
      const { data, error } = await meetupService.getMeetupById(meetupId);
      // El servicio nunca lanza; se relanza como excepción para que
      // TanStack Query gestione retry y estado de error.
      if (error || !data) {
        throw new Error(error ?? 'No se pudo cargar la juntada');
      }
      return data;
    },
  });

  const {
    participants,
    isLoading: isLoadingParticipants,
    updateAttendance,
    updateParticipantAttendance,
    leaveMeetup,
    refresh: refreshParticipants,
  } = useParticipants(meetupId, currentUserId);

  /**
   * Participación del usuario aunque haya abandonado la juntada,
   * porque la lista activa de participantes no incluye registros con left_at.
   */
  const participationQuery = useQuery({
    queryKey: ['userParticipation', meetupId, currentUserId],
    enabled: !!currentUserId,
    queryFn: async (): Promise<{
      role: ParticipantRole;
      attendanceStatus: AttendanceStatus;
      leftAt: string | null;
    } | null> => {
      // El guard de enabled garantiza currentUserId, pero TypeScript no lo sabe
      if (!currentUserId) return null;
      const { data } = await participantService.getUserParticipation(
        meetupId,
        currentUserId,
      );
      return data;
    },
  });

  const meetup = meetupQuery.data ?? null;
  const userParticipation = participationQuery.data ?? null;

  /** Rol del usuario actual determinado desde la lista de participantes */
  const currentUserParticipant: MeetupParticipant | undefined =
    participants.find((p) => p.userId === currentUserId);
  const userRole: ParticipantRole =
    currentUserParticipant?.role ?? userParticipation?.role ?? 'participant';
  const hasAbandoned = userParticipation?.leftAt != null;

  const confirmedCount = participants.filter(
    (p) => p.attendanceStatus === 'confirmed',
  ).length;

  // Flags derivados de rol y estado, calculados una sola vez para toda la UI
  const isOrganizer = userRole === 'organizer';
  const isParticipant = userRole === 'participant' && !hasAbandoned;
  const isCancelled = meetup?.status === 'cancelled';
  const isFinished = meetup?.status === 'finished';
  const isActive = meetup?.status === 'active';
  const canFinish =
    isOrganizer &&
    isActive &&
    !!meetup &&
    hasMeetupStarted(meetup.date, meetup.time);
  const currentAttendance: AttendanceStatus =
    currentUserParticipant?.attendanceStatus ?? 'pending';

  /** Recarga el detalle de la juntada desde el servidor */
  const reload = useCallback(async () => {
    await meetupQuery.refetch();
  }, [meetupQuery.refetch]);

  /**
   * Recarga detalle y participantes en paralelo para evitar re-renders
   * intermedios por llamadas secuenciales. Se usa al cerrar el modal
   * de asistencia y tras acciones del organizador.
   */
  const refreshAll = useCallback(async () => {
    await Promise.all([meetupQuery.refetch(), refreshParticipants()]);
  }, [meetupQuery.refetch, refreshParticipants]);

  /**
   * Cancela la juntada (acción del organizador) y refresca los datos
   * del detalle si la operación fue exitosa.
   *
   * @returns Resultado de la operación para feedback en la UI
   */
  const cancel = useCallback(async (): Promise<OperationResult<Meetup>> => {
    const result = await cancelMeetupAction(meetupId);
    if (!result.error) {
      await refreshAll();
    }
    return result;
  }, [cancelMeetupAction, meetupId, refreshAll]);

  /**
   * Finaliza la juntada (acción del organizador) y refresca los datos
   * del detalle si la operación fue exitosa.
   *
   * @param reviewsEnabled - true si los participantes podrán dejar reseñas
   * @returns Resultado de la operación para feedback en la UI
   */
  const finish = useCallback(
    async (reviewsEnabled: boolean): Promise<OperationResult<null>> => {
      const result = await finishMeetupAction(meetupId, reviewsEnabled);
      if (!result.error) {
        await refreshAll();
      }
      return result;
    },
    [finishMeetupAction, meetupId, refreshAll],
  );

  /**
   * Abandona la juntada como participante (soft delete).
   * No refresca el detalle porque la pantalla navega fuera al confirmar.
   *
   * @returns Resultado de la operación para feedback en la UI
   */
  const leave = useCallback(
    (): Promise<OperationResult<boolean>> => leaveMeetup(),
    [leaveMeetup],
  );

  return {
    // Datos principales
    meetup,
    participants,
    confirmedCount,
    // Estados de carga y error del detalle
    isLoading: meetupQuery.isLoading || meetupQuery.isFetching,
    isLoadingParticipants,
    error: meetupQuery.error?.message ?? null,
    // Contexto del usuario actual dentro de la juntada
    currentUserId,
    currentUserParticipant,
    userRole,
    hasAbandoned,
    currentAttendance,
    // Flags derivados de rol y estado
    isOrganizer,
    isParticipant,
    isActive,
    isCancelled,
    isFinished,
    canFinish,
    // Acciones
    cancel,
    finish,
    leave,
    updateAttendance,
    updateParticipantAttendance,
    // Recargas
    reload,
    refreshAll,
  };
};

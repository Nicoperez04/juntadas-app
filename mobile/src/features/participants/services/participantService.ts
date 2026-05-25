/**
 * Servicio de participantes — capa de acceso a Supabase para operaciones
 * sobre meetup_participants (asistencia, abandono y listado).
 *
 * Todas las funciones retornan { data, error } para que la UI maneje
 * errores sin try/catch en componentes.
 */
import { supabase } from '@/lib/supabase/client';
import type {
  MeetupParticipant,
  AttendanceStatus,
  ParticipantRole,
} from '@/features/meetups/types';

/** Contrato de retorno uniforme de todas las operaciones del servicio */
interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

/** Fila cruda de meetup_participants con perfil anidado */
interface ParticipantWithProfileRow {
  id: string;
  meetup_id: string;
  user_id: string;
  role: string;
  attendance_status: string;
  joined_at: string;
  left_at: string | null;
  profiles: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
}

/**
 * Traduce errores de Supabase a mensajes en español para la UI.
 *
 * @param message - Mensaje original del error
 * @returns Mensaje legible para el usuario
 */
const translateError = (message: string): string => {
  if (message.includes('El organizador no puede abandonar')) return message;
  if (message.includes('Solo podés modificar tu propia asistencia')) return message;
  if (message.includes('Solo el organizador puede modificar')) return message;
  if (message.includes('Participante no encontrado')) return message;
  if (message.includes('No se puede modificar la asistencia del organizador')) {
    return message;
  }
  return 'Ocurrió un error inesperado — intentá de nuevo';
};

/**
 * Mapea una fila de la base de datos al tipo de dominio MeetupParticipant.
 *
 * @param row - Fila con perfil anidado desde Supabase
 * @returns Participante tipado para la capa de UI
 */
const mapParticipantRow = (row: ParticipantWithProfileRow): MeetupParticipant => ({
  id: row.id,
  meetupId: row.meetup_id,
  userId: row.user_id,
  role: row.role as ParticipantRole,
  attendanceStatus: row.attendance_status as AttendanceStatus,
  joinedAt: row.joined_at,
  leftAt: row.left_at,
  profile: {
    fullName: row.profiles.full_name,
    username: row.profiles.username,
    avatarUrl: row.profiles.avatar_url,
  },
});

export const participantService = {
  /**
   * Actualiza el estado de asistencia del usuario autenticado en una juntada.
   * Solo el propio usuario puede cambiar su estado (validado por RLS y por lógica local).
   *
   * @param meetupId - UUID de la juntada
   * @param userId - UUID del usuario que modifica su asistencia
   * @param status - Nuevo estado de asistencia
   * @returns Participante actualizado o mensaje de error
   */
  async updateAttendance(
    meetupId: string,
    userId: string,
    status: AttendanceStatus,
  ): Promise<ServiceResult<MeetupParticipant>> {
    try {
      // Verificar que el participante exista y no sea organizador
      const { data: existing, error: fetchError } = await supabase
        .from('meetup_participants')
        .select('id, role')
        .eq('meetup_id', meetupId)
        .eq('user_id', userId)
        .is('left_at', null)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!existing) {
        return { data: null, error: 'Participante no encontrado en esta juntada' };
      }
      if (existing.role === 'organizer') {
        return {
          data: null,
          error: 'El organizador siempre está confirmado y no puede modificar su asistencia',
        };
      }

      const { error: updateError } = await supabase
        .from('meetup_participants')
        .update({ attendance_status: status })
        .eq('meetup_id', meetupId)
        .eq('user_id', userId)
        .is('left_at', null);

      if (updateError) throw updateError;

      // Recargar el participante actualizado con su perfil
      const { data: updated, error: reloadError } = await supabase
        .from('meetup_participants')
        .select(
          `
          id,
          meetup_id,
          user_id,
          role,
          attendance_status,
          joined_at,
          left_at,
          profiles:user_id (
            full_name,
            username,
            avatar_url
          )
        `,
        )
        .eq('meetup_id', meetupId)
        .eq('user_id', userId)
        .is('left_at', null)
        .single();

      if (reloadError) throw reloadError;

      return {
        data: mapParticipantRow(updated as unknown as ParticipantWithProfileRow),
        error: null,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      return { data: null, error: translateError(message) };
    }
  },

  /**
   * Permite al organizador actualizar la asistencia de cualquier participante
   * excepto la suya propia (siempre confirmado).
   *
   * @param meetupId - UUID de la juntada
   * @param organizerUserId - UUID del organizador autenticado
   * @param targetUserId - UUID del participante a modificar
   * @param status - Nuevo estado de asistencia
   * @returns Participante actualizado o mensaje de error
   */
  async updateParticipantAttendanceByOrganizer(
    meetupId: string,
    organizerUserId: string,
    targetUserId: string,
    status: AttendanceStatus,
  ): Promise<ServiceResult<MeetupParticipant>> {
    try {
      const { data: organizerRow, error: organizerError } = await supabase
        .from('meetup_participants')
        .select('id, role')
        .eq('meetup_id', meetupId)
        .eq('user_id', organizerUserId)
        .is('left_at', null)
        .maybeSingle();

      if (organizerError) throw organizerError;
      if (!organizerRow || organizerRow.role !== 'organizer') {
        return {
          data: null,
          error: 'Solo el organizador puede modificar la asistencia de otros',
        };
      }

      const { data: target, error: targetError } = await supabase
        .from('meetup_participants')
        .select('id, role')
        .eq('meetup_id', meetupId)
        .eq('user_id', targetUserId)
        .is('left_at', null)
        .maybeSingle();

      if (targetError) throw targetError;
      if (!target) {
        return { data: null, error: 'Participante no encontrado en esta juntada' };
      }
      if (target.role === 'organizer') {
        return {
          data: null,
          error: 'No se puede modificar la asistencia del organizador',
        };
      }

      const { error: updateError } = await supabase
        .from('meetup_participants')
        .update({ attendance_status: status })
        .eq('meetup_id', meetupId)
        .eq('user_id', targetUserId)
        .is('left_at', null);

      if (updateError) throw updateError;

      const { data: updated, error: reloadError } = await supabase
        .from('meetup_participants')
        .select(
          `
          id,
          meetup_id,
          user_id,
          role,
          attendance_status,
          joined_at,
          left_at,
          profiles:user_id (
            full_name,
            username,
            avatar_url
          )
        `,
        )
        .eq('meetup_id', meetupId)
        .eq('user_id', targetUserId)
        .is('left_at', null)
        .single();

      if (reloadError) throw reloadError;

      return {
        data: mapParticipantRow(updated as unknown as ParticipantWithProfileRow),
        error: null,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      return { data: null, error: translateError(message) };
    }
  },

  /**
   * Abandona una juntada mediante soft delete (left_at = NOW()).
   * El organizador no puede abandonar su propia juntada.
   *
   * @param meetupId - UUID de la juntada
   * @param userId - UUID del participante que abandona
   * @returns true si el abandono fue exitoso o mensaje de error
   */
  async leaveMeetup(
    meetupId: string,
    userId: string,
  ): Promise<ServiceResult<boolean>> {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('meetup_participants')
        .select('id, role')
        .eq('meetup_id', meetupId)
        .eq('user_id', userId)
        .is('left_at', null)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!existing) {
        return { data: null, error: 'Participante no encontrado en esta juntada' };
      }
      if (existing.role === 'organizer') {
        return {
          data: null,
          error: 'El organizador no puede abandonar su propia juntada',
        };
      }

      const { error: updateError } = await supabase
        .from('meetup_participants')
        .update({ left_at: new Date().toISOString() })
        .eq('meetup_id', meetupId)
        .eq('user_id', userId)
        .is('left_at', null);

      if (updateError) throw updateError;

      return { data: true, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      return { data: null, error: translateError(message) };
    }
  },

  /**
   * Obtiene todos los participantes activos de una juntada con sus perfiles.
   * Ordena por rol (organizador primero) y luego por nombre completo.
   *
   * @param meetupId - UUID de la juntada
   * @returns Lista de participantes activos o mensaje de error
   */
  async getParticipants(
    meetupId: string,
  ): Promise<ServiceResult<MeetupParticipant[]>> {
    try {
      const { data, error } = await supabase
        .from('meetup_participants')
        .select(
          `
          id,
          meetup_id,
          user_id,
          role,
          attendance_status,
          joined_at,
          left_at,
          profiles:user_id (
            full_name,
            username,
            avatar_url
          )
        `,
        )
        .eq('meetup_id', meetupId)
        .is('left_at', null)
        .order('role', { ascending: true });

      if (error) throw error;

      const rows = (data ?? []) as unknown as ParticipantWithProfileRow[];

      // Ordenar secundariamente por nombre dentro de cada grupo de rol
      const sorted = [...rows].sort((a, b) => {
        if (a.role !== b.role) {
          // 'organizer' alfabéticamente precede a 'participant'
          return a.role === 'organizer' ? -1 : 1;
        }
        return a.profiles.full_name.localeCompare(b.profiles.full_name, 'es');
      });

      return {
        data: sorted.map(mapParticipantRow),
        error: null,
      };
    } catch {
      return { data: null, error: 'Error al obtener los participantes' };
    }
  },

  /**
   * Obtiene la participación del usuario en una juntada, incluyendo si abandonó.
   * Necesario en detalle/historial cuando el usuario ya no está en la lista activa.
   *
   * @param meetupId - UUID de la juntada
   * @param userId - UUID del usuario autenticado
   * @returns Rol, asistencia y left_at del usuario, o null si nunca participó
   */
  async getUserParticipation(
    meetupId: string,
    userId: string,
  ): Promise<
    ServiceResult<{
      role: ParticipantRole;
      attendanceStatus: AttendanceStatus;
      leftAt: string | null;
    } | null>
  > {
    try {
      const { data, error } = await supabase
        .from('meetup_participants')
        .select('role, attendance_status, left_at')
        .eq('meetup_id', meetupId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return { data: null, error: null };
      }

      return {
        data: {
          role: data.role as ParticipantRole,
          attendanceStatus: data.attendance_status as AttendanceStatus,
          leftAt: data.left_at,
        },
        error: null,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      return { data: null, error: translateError(message) };
    }
  },
};

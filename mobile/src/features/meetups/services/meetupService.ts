/**
 * Servicio de juntadas — única capa que interactúa con Supabase para este módulo.
 *
 * Todas las funciones siguen el patrón { data, error } para que los callers
 * nunca necesiten capturar excepciones directamente. Los errores de red o de
 * la SDK se capturan y se retornan como strings en español para presentarlos
 * en la UI sin transformación adicional.
 *
 * La atomicidad de createMeetup se implementa con un rollback manual:
 * si falla la inserción del participante, se elimina la juntada recién creada.
 * Supabase JS v2 no soporta transacciones desde el cliente.
 */
import { supabase } from '@/lib/supabase/client';
import type {
  Meetup,
  MeetupWithRole,
  MeetupParticipant,
  CreateMeetupFormData,
  MeetupStatus,
  ParticipantRole,
  AttendanceStatus,
} from '../types';

/** Contrato de retorno uniforme de todas las operaciones del servicio */
interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Estructura de una fila de la tabla meetups tal como la retorna Supabase.
 * Permite tipar los resultados de las queries sin usar 'any'.
 */
interface MeetupRow {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string;
  location: string;
  estimated_cost: number | null;
  status: string;
  join_code: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
}

/** Estructura de una fila de meetup_participants tal como la retorna Supabase */
interface ParticipantRow {
  id: string;
  meetup_id: string;
  user_id: string;
  role: string;
  attendance_status: string;
  joined_at: string;
  left_at: string | null;
}

/** Estructura del perfil anidado al hacer join con la tabla profiles */
interface ProfileRow {
  full_name: string;
  username: string;
  avatar_url: string | null;
}

/** Fila de participante con su perfil anidado, resultado del join */
interface ParticipantWithProfileRow extends ParticipantRow {
  profiles: ProfileRow;
}

/** Fila de participación del usuario (sin el detalle de la juntada) */
interface UserParticipationRow {
  meetup_id: string;
  role: string;
  attendance_status: string;
  left_at: string | null;
}

/** Fila de conteo de asistencia por juntada */
interface AttendanceCountRow {
  meetup_id: string;
  attendance_status: string;
}

/** Caracteres válidos para generar el código de juntada */
const JOIN_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** Longitud fija del código de juntada */
const JOIN_CODE_LENGTH = 6;

/** Máximo de intentos para generar un código único antes de lanzar error */
const MAX_CODE_ATTEMPTS = 5;

/**
 * Convierte una fecha del formato de usuario DD/MM/YYYY al formato YYYY-MM-DD
 * que espera la columna DATE de PostgreSQL. Necesario porque el formulario
 * recibe texto libre del usuario en formato local argentino.
 *
 * @param date - Fecha en formato DD/MM/YYYY
 * @returns Fecha en formato YYYY-MM-DD lista para persistir
 */
export const formatDateForDB = (date: string): string => {
  const [day, month, year] = date.split('/');
  return `${year}-${month}-${day}`;
};

/**
 * Convierte una fecha del formato de base de datos YYYY-MM-DD al formato
 * DD/MM/YYYY para mostrar en pantalla en el locale local.
 *
 * @param date - Fecha en formato YYYY-MM-DD proveniente de Supabase
 * @returns Fecha en formato DD/MM/YYYY lista para mostrar al usuario
 */
export const formatDateForDisplay = (date: string): string => {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
};

/**
 * Convierte una fila de la base de datos al tipo de dominio Meetup.
 * Centraliza el mapeo snake_case → camelCase para evitar inconsistencias.
 *
 * @param row - Fila cruda de la tabla meetups
 * @returns Objeto Meetup del dominio de la aplicación
 */
const mapMeetupRow = (row: MeetupRow): Meetup => ({
  id: row.id,
  title: row.title,
  description: row.description,
  date: row.date,
  time: row.time,
  location: row.location,
  estimatedCost: row.estimated_cost,
  status: row.status as MeetupStatus,
  joinCode: row.join_code,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  cancelledAt: row.cancelled_at,
});

/**
 * Genera un código alfanumérico de 6 caracteres en mayúsculas y verifica
 * que no exista ya en la tabla meetups antes de retornarlo.
 * Lanza un error si no logra generar un código único en MAX_CODE_ATTEMPTS intentos.
 *
 * @returns Código único de 6 caracteres listo para usarse
 */
const generateJoinCode = async (): Promise<string> => {
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const code = Array.from({ length: JOIN_CODE_LENGTH }, () =>
      JOIN_CODE_CHARS[Math.floor(Math.random() * JOIN_CODE_CHARS.length)],
    ).join('');

    const { data, error } = await supabase
      .from('meetups')
      .select('id')
      .eq('join_code', code)
      .maybeSingle();

    // Si no hay error y no existe ninguna fila, el código es único y se puede usar
    if (!error && !data) {
      return code;
    }
  }
  throw new Error('No se pudo generar un código único después de varios intentos');
};

/**
 * Traduce mensajes de error de Supabase al español.
 * Se hace matching por substring para mayor resiliencia ante variaciones de mensajes.
 *
 * @param message - Mensaje de error original
 * @returns Mensaje en español para mostrar al usuario
 */
const translateError = (message: string): string => {
  if (message.includes('No se pudo generar')) return message;
  if (message.includes('El usuario ya es participante')) return message;
  if (message.includes('Juntada no encontrada')) return message;
  if (message.includes('La juntada está cancelada')) return message;
  if (
    message.includes('unique') &&
    message.includes('meetup_participants')
  ) {
    return 'El usuario ya es participante de esta juntada';
  }
  return 'Ocurrió un error inesperado — intentá de nuevo';
};

export const meetupService = {
  /**
   * Crea una nueva juntada y registra al creador como organizador confirmado.
   *
   * La operación es pseudo-atómica: si falla la inserción del participante,
   * se elimina la juntada recién creada para no dejar juntadas sin organizador.
   * El join_code se genera automáticamente verificando unicidad.
   *
   * @param userId - UUID del usuario autenticado que crea la juntada
   * @param formData - Datos del formulario de creación
   * @returns La juntada creada o un mensaje de error en español
   */
  async createMeetup(
    userId: string,
    formData: CreateMeetupFormData,
  ): Promise<ServiceResult<Meetup>> {
    try {
      const joinCode = await generateJoinCode();

      const { data: newMeetup, error: meetupError } = await supabase
        .from('meetups')
        .insert({
          title: formData.title,
          description: formData.description || null,
          // El formulario entrega DD/MM/YYYY; PostgreSQL requiere YYYY-MM-DD
          date: formatDateForDB(formData.date),
          time: formData.time,
          location: formData.location,
          estimated_cost:
            formData.estimatedCost && formData.estimatedCost.trim() !== ''
              ? parseFloat(formData.estimatedCost)
              : null,
          status: 'active',
          join_code: joinCode,
          created_by: userId,
        })
        .select()
        .single();

      if (meetupError) throw meetupError;
      if (!newMeetup) throw new Error('No se obtuvo la juntada recién creada');

      // Registrar al creador como organizador con asistencia confirmada
      const { error: participantError } = await supabase
        .from('meetup_participants')
        .insert({
          meetup_id: newMeetup.id,
          user_id: userId,
          role: 'organizer',
          attendance_status: 'confirmed',
        });

      // Rollback manual si falla la inserción del participante
      if (participantError) {
        await supabase.from('meetups').delete().eq('id', newMeetup.id);
        throw participantError;
      }

      return { data: mapMeetupRow(newMeetup as MeetupRow), error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      return { data: null, error: translateError(message) };
    }
  },

  /**
   * Obtiene todas las juntadas activas en las que el usuario participa,
   * incluyendo su rol, estado de asistencia y conteos de participantes.
   * Ordena por fecha ascendente para mostrar las más próximas primero.
   *
   * @param userId - UUID del usuario autenticado
   * @returns Lista de juntadas con rol del usuario o mensaje de error
   */
  async getUserMeetups(userId: string): Promise<ServiceResult<MeetupWithRole[]>> {
    try {
      // Paso 1: obtener las participaciones activas del usuario para conocer su rol
      const { data: myParticipations, error: parError } = await supabase
        .from('meetup_participants')
        .select('meetup_id, role, attendance_status, left_at')
        .eq('user_id', userId)
        .is('left_at', null);

      if (parError) throw parError;
      if (!myParticipations || myParticipations.length === 0) {
        return { data: [], error: null };
      }

      const meetupIds = (myParticipations as UserParticipationRow[]).map(
        (p) => p.meetup_id,
      );

      // Paso 2: obtener las juntadas activas de esos IDs, ordenadas por fecha
      const { data: meetupsData, error: meetupsError } = await supabase
        .from('meetups')
        .select('*')
        .in('id', meetupIds)
        .eq('status', 'active')
        .order('date', { ascending: true });

      if (meetupsError) throw meetupsError;
      if (!meetupsData || meetupsData.length === 0) {
        return { data: [], error: null };
      }

      const activeMeetupIds = (meetupsData as MeetupRow[]).map((m) => m.id);

      // Paso 3: obtener todos los participantes de esas juntadas para los conteos
      const { data: allParticipants, error: countError } = await supabase
        .from('meetup_participants')
        .select('meetup_id, attendance_status')
        .in('meetup_id', activeMeetupIds);

      if (countError) throw countError;

      const safeParticipants = (allParticipants ?? []) as AttendanceCountRow[];
      const safeMyParticipations = myParticipations as UserParticipationRow[];

      // Paso 4: combinar los tres conjuntos de datos en el tipo MeetupWithRole
      const result: MeetupWithRole[] = (meetupsData as MeetupRow[]).map(
        (meetupRow) => {
          const myParticipation = safeMyParticipations.find(
            (p) => p.meetup_id === meetupRow.id,
          );
          const participantsForMeetup = safeParticipants.filter(
            (p) => p.meetup_id === meetupRow.id,
          );

          return {
            ...mapMeetupRow(meetupRow),
            userRole: (myParticipation?.role ?? 'participant') as ParticipantRole,
            attendanceStatus: (myParticipation?.attendance_status ??
              'pending') as AttendanceStatus,
            participantCount: participantsForMeetup.length,
            confirmedCount: participantsForMeetup.filter(
              (p) => p.attendance_status === 'confirmed',
            ).length,
            leftAt: myParticipation?.left_at ?? null,
          };
        },
      );

      return { data: result, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      return {
        data: null,
        error: translateError(message) || 'Error al obtener las juntadas',
      };
    }
  },

  /**
   * Busca una juntada por su código de ingreso.
   * Retorna null si el código no existe o si la juntada está cancelada.
   *
   * @param joinCode - Código de 6 caracteres en mayúsculas
   * @returns La juntada encontrada, null si no existe, o error
   */
  async getMeetupByCode(
    joinCode: string,
  ): Promise<ServiceResult<Meetup | null>> {
    try {
      const { data, error } = await supabase
        .from('meetups')
        .select('*')
        .eq('join_code', joinCode)
        .neq('status', 'cancelled')
        .maybeSingle();

      if (error) throw error;
      return { data: data ? mapMeetupRow(data as MeetupRow) : null, error: null };
    } catch {
      return { data: null, error: 'Juntada no encontrada o código inválido' };
    }
  },

  /**
   * Obtiene el detalle completo de una juntada por su ID.
   *
   * @param meetupId - UUID de la juntada
   * @returns La juntada con todos sus campos o mensaje de error
   */
  async getMeetupById(meetupId: string): Promise<ServiceResult<Meetup>> {
    try {
      const { data, error } = await supabase
        .from('meetups')
        .select('*')
        .eq('id', meetupId)
        .single();

      if (error) throw error;
      return { data: mapMeetupRow(data as MeetupRow), error: null };
    } catch {
      return { data: null, error: 'Juntada no encontrada' };
    }
  },

  /**
   * Une a un usuario a una juntada mediante su código de ingreso.
   *
   * Verifica que la juntada exista y esté activa, y que el usuario
   * no sea ya participante antes de insertar el registro. El rol
   * asignado es siempre 'participant' con asistencia 'pending'.
   *
   * @param userId - UUID del usuario que quiere unirse
   * @param joinCode - Código de la juntada
   * @returns La juntada a la que se unió o mensaje de error específico
   */
  async joinMeetup(
    userId: string,
    joinCode: string,
  ): Promise<ServiceResult<Meetup>> {
    try {
      // Verificar que la juntada exista y esté activa
      const { data: meetup, error: meetupError } = await supabase
        .from('meetups')
        .select('*')
        .eq('join_code', joinCode)
        .eq('status', 'active')
        .maybeSingle();

      if (meetupError) throw meetupError;
      if (!meetup) {
        return {
          data: null,
          error: 'Juntada no encontrada o código inválido',
        };
      }

      // Verificar participación existente: activa o abandonada (left_at)
      const { data: existing, error: existingError } = await supabase
        .from('meetup_participants')
        .select('id, left_at')
        .eq('meetup_id', meetup.id)
        .eq('user_id', userId)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing) {
        if (existing.left_at === null) {
          return {
            data: null,
            error: 'Ya sos participante de esta juntada',
          };
        }

        // Usuario que abandonó — reactivar participación
        const { error: rejoinError } = await supabase
          .from('meetup_participants')
          .update({
            left_at: null,
            attendance_status: 'pending',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (rejoinError) {
          return { data: null, error: 'No se pudo volver a unirte' };
        }

        return { data: mapMeetupRow(meetup as MeetupRow), error: null };
      }

      // No existe registro — INSERT normal
      const { error: insertError } = await supabase
        .from('meetup_participants')
        .insert({
          meetup_id: meetup.id,
          user_id: userId,
          role: 'participant',
          attendance_status: 'pending',
        });

      if (insertError) throw insertError;
      return { data: mapMeetupRow(meetup as MeetupRow), error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (
        message.includes('cancelled') ||
        message.includes('finished')
      ) {
        return {
          data: null,
          error: 'La juntada está cancelada o finalizada',
        };
      }
      return {
        data: null,
        error: translateError(message) || 'Error al unirse a la juntada',
      };
    }
  },

  /**
   * Obtiene todos los participantes de una juntada con sus perfiles públicos.
   * Ordena por rol (organizador primero, ya que 'organizer' < 'participant'
   * alfabéticamente) y luego ordena el resultado por nombre del cliente.
   *
   * @param meetupId - UUID de la juntada
   * @returns Lista de participantes con perfil o mensaje de error
   */
  async getMeetupParticipants(
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
        if (a.role !== b.role) return 0;
        return a.profiles.full_name.localeCompare(b.profiles.full_name, 'es');
      });

      const participants: MeetupParticipant[] = sorted.map((row) => ({
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
      }));

      return { data: participants, error: null };
    } catch {
      return { data: null, error: 'Error al obtener los participantes' };
    }
  },

  /**
   * Cancela una juntada activa. Solo el organizador puede ejecutar esta acción.
   * Setea status = 'cancelled' y cancelled_at = NOW().
   *
   * @param meetupId - UUID de la juntada
   * @param userId - UUID del usuario que intenta cancelar
   * @returns La juntada cancelada o mensaje de error
   */
  async cancelMeetup(
    meetupId: string,
    userId: string,
  ): Promise<ServiceResult<Meetup>> {
    try {
      const { data: meetup, error: fetchError } = await supabase
        .from('meetups')
        .select('*')
        .eq('id', meetupId)
        .single();

      if (fetchError) throw fetchError;
      if (!meetup) {
        return { data: null, error: 'Juntada no encontrada' };
      }
      if (meetup.created_by !== userId) {
        return {
          data: null,
          error: 'Solo el organizador puede cancelar la juntada',
        };
      }
      if (meetup.status === 'cancelled') {
        return { data: null, error: 'La juntada ya está cancelada' };
      }
      if (meetup.status === 'finished') {
        return { data: null, error: 'No se puede cancelar una juntada finalizada' };
      }

      const { data: updated, error: updateError } = await supabase
        .from('meetups')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', meetupId)
        .select()
        .single();

      if (updateError) throw updateError;

      return { data: mapMeetupRow(updated as MeetupRow), error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      return {
        data: null,
        error: translateError(message) || 'Error al cancelar la juntada',
      };
    }
  },

  /**
   * Finaliza una juntada activa. Solo el organizador puede ejecutar esta acción.
   * Setea status = 'finished' para moverla al historial sin marcarla como cancelada.
   *
   * @param meetupId - UUID de la juntada
   * @param userId - UUID del usuario que intenta finalizar
   * @returns La juntada finalizada o mensaje de error
   */
  async finishMeetup(
    meetupId: string,
    userId: string,
  ): Promise<ServiceResult<Meetup>> {
    try {
      const { data: meetup, error: fetchError } = await supabase
        .from('meetups')
        .select('*')
        .eq('id', meetupId)
        .single();

      if (fetchError) throw fetchError;
      if (!meetup) {
        return { data: null, error: 'Juntada no encontrada' };
      }
      if (meetup.created_by !== userId) {
        return {
          data: null,
          error: 'Solo el organizador puede finalizar la juntada',
        };
      }
      if (meetup.status === 'cancelled') {
        return { data: null, error: 'No se puede finalizar una juntada cancelada' };
      }
      if (meetup.status === 'finished') {
        return { data: null, error: 'La juntada ya está finalizada' };
      }

      const { data: updated, error: updateError } = await supabase
        .from('meetups')
        .update({ status: 'finished' })
        .eq('id', meetupId)
        .select()
        .single();

      if (updateError) throw updateError;

      return { data: mapMeetupRow(updated as MeetupRow), error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      return {
        data: null,
        error: translateError(message) || 'Error al finalizar la juntada',
      };
    }
  },

  /**
   * Edita los campos modificables de una juntada activa.
   * Solo el organizador puede editar y una juntada cancelada no es editable.
   *
   * @param meetupId - UUID de la juntada
   * @param userId - UUID del usuario que intenta editar
   * @param formData - Datos del formulario de edición
   * @returns La juntada actualizada o mensaje de error
   */
  async editMeetup(
    meetupId: string,
    userId: string,
    formData: CreateMeetupFormData,
  ): Promise<ServiceResult<Meetup>> {
    try {
      const { data: meetup, error: fetchError } = await supabase
        .from('meetups')
        .select('created_by, status')
        .eq('id', meetupId)
        .single();

      if (fetchError) throw fetchError;
      if (!meetup) {
        return { data: null, error: 'Juntada no encontrada' };
      }
      if (meetup.created_by !== userId) {
        return {
          data: null,
          error: 'Solo el organizador puede editar la juntada',
        };
      }
      if (meetup.status === 'cancelled') {
        return {
          data: null,
          error: 'Una juntada cancelada no puede editarse',
        };
      }
      if (meetup.status === 'finished') {
        return {
          data: null,
          error: 'Una juntada finalizada no puede editarse',
        };
      }

      const { data: updated, error: updateError } = await supabase
        .from('meetups')
        .update({
          title: formData.title,
          description: formData.description || null,
          date: formatDateForDB(formData.date),
          time: formData.time,
          location: formData.location,
          estimated_cost:
            formData.estimatedCost && formData.estimatedCost.trim() !== ''
              ? parseFloat(formData.estimatedCost)
              : null,
        })
        .eq('id', meetupId)
        .select()
        .single();

      if (updateError) throw updateError;

      return { data: mapMeetupRow(updated as MeetupRow), error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      return {
        data: null,
        error: translateError(message) || 'Error al editar la juntada',
      };
    }
  },

  /**
   * Obtiene juntadas finalizadas o canceladas en las que el usuario participó,
   * ya sea como organizador o como participante.
   * Ordena por fecha descendente (más recientes primero).
   *
   * @param userId - UUID del usuario autenticado
   * @returns Lista de juntadas históricas con rol del usuario
   */
  async getFinishedMeetups(
    userId: string,
  ): Promise<ServiceResult<MeetupWithRole[]>> {
    try {
      const { data: myParticipations, error: parError } = await supabase
        .from('meetup_participants')
        .select('meetup_id, role, attendance_status, left_at')
        .eq('user_id', userId);

      if (parError) throw parError;
      if (!myParticipations || myParticipations.length === 0) {
        return { data: [], error: null };
      }

      const meetupIds = (myParticipations as UserParticipationRow[]).map(
        (p) => p.meetup_id,
      );

      const { data: meetupsData, error: meetupsError } = await supabase
        .from('meetups')
        .select('*')
        .in('id', meetupIds)
        .in('status', ['finished', 'cancelled'])
        .order('date', { ascending: false });

      if (meetupsError) throw meetupsError;
      if (!meetupsData || meetupsData.length === 0) {
        return { data: [], error: null };
      }

      const historyMeetupIds = (meetupsData as MeetupRow[]).map((m) => m.id);

      const { data: allParticipants, error: countError } = await supabase
        .from('meetup_participants')
        .select('meetup_id, attendance_status')
        .in('meetup_id', historyMeetupIds)
        .is('left_at', null);

      if (countError) throw countError;

      const safeParticipants = (allParticipants ?? []) as AttendanceCountRow[];
      const safeMyParticipations = myParticipations as UserParticipationRow[];

      const result: MeetupWithRole[] = (meetupsData as MeetupRow[]).map(
        (meetupRow) => {
          const myParticipation = safeMyParticipations.find(
            (p) => p.meetup_id === meetupRow.id,
          );
          const participantsForMeetup = safeParticipants.filter(
            (p) => p.meetup_id === meetupRow.id,
          );

          return {
            ...mapMeetupRow(meetupRow),
            userRole: (myParticipation?.role ?? 'participant') as ParticipantRole,
            attendanceStatus: (myParticipation?.attendance_status ??
              'pending') as AttendanceStatus,
            participantCount: participantsForMeetup.length,
            confirmedCount: participantsForMeetup.filter(
              (p) => p.attendance_status === 'confirmed',
            ).length,
            leftAt: myParticipation?.left_at ?? null,
          };
        },
      );

      return { data: result, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      return {
        data: null,
        error: translateError(message) || 'Error al obtener el historial',
      };
    }
  },
};

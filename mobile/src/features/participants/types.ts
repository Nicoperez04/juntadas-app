/**
 * Tipos del módulo de participantes.
 *
 * Re-exporta los tipos compartidos con meetups y define los payloads
 * específicos de las operaciones de asistencia y abandono de juntada.
 */
import type { AttendanceStatus } from '@/features/meetups/types';

export type {
  AttendanceStatus,
  MeetupParticipant,
  ParticipantRole,
} from '@/features/meetups/types';

/** Payload para actualizar el estado de asistencia del usuario autenticado */
export interface UpdateAttendanceData {
  attendanceStatus: AttendanceStatus;
}

/** Payload para que el organizador actualice la asistencia de otro participante */
export interface UpdateParticipantAttendanceData {
  meetupId: string;
  targetUserId: string;
  attendanceStatus: AttendanceStatus;
}

/** Payload para abandonar una juntada como participante (soft delete) */
export interface LeaveParticipantData {
  meetupId: string;
  userId: string;
}

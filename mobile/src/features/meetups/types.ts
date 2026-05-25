import type { Memory } from '@/features/memories/types';

/**
 * Tipos del módulo de juntadas.
 *
 * Define las entidades, roles y estados que circulan entre pantallas,
 * el hook de juntadas y el servicio de Supabase. Se mantienen separados
 * de los tipos nativos de Supabase para desacoplar la UI del SDK.
 */

/** Estado posible de una juntada a lo largo de su ciclo de vida */
export type MeetupStatus = 'active' | 'cancelled' | 'finished';

/** Rol del usuario dentro de una juntada específica */
export type ParticipantRole = 'organizer' | 'participant';

/** Estado de confirmación de asistencia de un participante */
export type AttendanceStatus = 'pending' | 'confirmed' | 'declined';

/**
 * Entidad principal que representa una juntada.
 * Los campos de fecha y hora se almacenan como strings para facilitar
 * la serialización desde/hacia la base de datos.
 */
export interface Meetup {
  id: string;
  title: string;
  /** Descripción opcional de la juntada */
  description: string | null;
  /** Fecha almacenada como string (puede ser ISO YYYY-MM-DD o DD/MM/YYYY) */
  date: string;
  /** Hora en formato HH:MM */
  time: string;
  location: string;
  /** Costo estimado por persona en la moneda local; null si no fue especificado */
  estimatedCost: number | null;
  status: MeetupStatus;
  /** Código único de 6 caracteres alfanuméricos para unirse a la juntada */
  joinCode: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  /** Fecha de cancelación; null si la juntada está activa o terminó normalmente */
  cancelledAt: string | null;
}

/**
 * Juntada enriquecida con datos del participante autenticado actual.
 * Se usa en la lista principal y en el detalle cuando el contexto
 * del usuario autenticado es relevante para la UI.
 */
export interface MeetupWithRole extends Meetup {
  /** Rol del usuario autenticado dentro de esta juntada */
  userRole: ParticipantRole;
  /** Estado de confirmación de asistencia del usuario autenticado */
  attendanceStatus: AttendanceStatus;
  /** Cantidad total de participantes (incluyendo al organizador) */
  participantCount: number;
  /** Cantidad de participantes que confirmaron asistencia */
  confirmedCount: number;
  /** Fecha en que el usuario abandonó la juntada; null si sigue activo */
  leftAt: string | null;
}

/**
 * Datos del formulario de creación/edición de juntada.
 * Inferido desde createMeetupSchema para que Zod sea la única fuente de verdad
 * del tipado; description y estimatedCost son opcionales en el schema.
 */
export type { CreateMeetupSchema as CreateMeetupFormData } from './schemas/meetupSchemas';

/** Datos del formulario para unirse a una juntada por código */
export interface JoinMeetupFormData {
  joinCode: string;
}

/**
 * Participante de una juntada con su perfil público.
 * Se usa en la pantalla de detalle para mostrar la lista
 * de personas que integran la juntada.
 */
export interface MeetupParticipant {
  id: string;
  meetupId: string;
  userId: string;
  role: ParticipantRole;
  attendanceStatus: AttendanceStatus;
  joinedAt: string;
  /** Fecha en la que el participante dejó la juntada; null si sigue activo */
  leftAt: string | null;
  profile: {
    fullName: string;
    username: string;
    /** URL pública del avatar; null si el usuario no subió foto */
    avatarUrl: string | null;
  };
}

/**
 * Tipado de los parámetros de cada ruta del navegador principal.
 * Permite que useNavigation y useRoute estén completamente tipados
 * en las pantallas de este módulo.
 */
export type MainStackParamList = {
  MeetupHome: undefined;
  CreateMeetup: undefined;
  JoinMeetup: undefined;
  MeetupDetail: { meetupId: string };
  EditMeetup: { meetupId: string };
  ParticipantList: { meetupId: string };
  Games: undefined;
  ImpostorStart: { meetupId?: string };
  ImpostorRole: { meetupId?: string };
  MemoriesGallery: { meetupId: string; isActive: boolean };
  MemoryViewer: { memories: Memory[]; initialIndex: number; meetupId: string };
  MeetupHistory: undefined;
  CompleteProfile: undefined;
  Profile: undefined;
};

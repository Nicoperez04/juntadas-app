/**
 * Tipos del módulo de notificaciones.
 *
 * Centraliza la definición de los eventos notificables, el contrato
 * de la tabla notifications en Supabase y el input que consume la
 * Edge Function send-push-notification.
 */

/**
 * Enum de tipos de notificación.
 * Debe mantenerse sincronizado con el enum notification_type de la base de datos.
 */
export enum NotificationType {
  /** Alguien se unió a tu juntada — el organizador lo recibe */
  Joined = 'joined',
  /** Te transfirieron la organización de una juntada */
  Transferred = 'transferred',
  /** La juntada finalizó con reseñas habilitadas — todos los participantes */
  ReviewEnabled = 'review_enabled',
  /** La juntada fue cancelada — todos los participantes */
  Cancelled = 'cancelled',
  /** La juntada fue finalizada — todos los participantes */
  Finished = 'finished',
  /** Alguien abandonó tu juntada — el organizador lo recibe */
  Left = 'left',
  /** Recordatorio local 2 horas antes de la juntada */
  Reminder = 'reminder',
  /** Alguien se unió al grupo — el resto de los miembros activos lo reciben */
  GroupMemberJoined = 'group_member_joined',
  /** Fuiste expulsado de un grupo — solo el expulsado lo recibe */
  GroupMemberExpelled = 'group_member_expelled',
  /** Te transfirieron la administración de un grupo — solo el nuevo admin lo recibe */
  GroupAdminTransferred = 'group_admin_transferred',
  /** Alguien salió del grupo — el resto de los miembros activos lo reciben */
  GroupMemberLeft = 'group_member_left',
  /** Te agregaron como participante de una juntada creada desde un grupo */
  GroupMeetupInvite = 'group_meetup_invite',
}

/**
 * Notificación tal como se almacena en la tabla notifications de Supabase.
 *
 * @field id        - UUID único de la notificación
 * @field userId    - UUID del usuario destinatario
 * @field type      - Tipo del evento que generó la notificación
 * @field title     - Título del mensaje mostrado al usuario
 * @field body      - Cuerpo del mensaje mostrado al usuario
 * @field meetupId  - UUID de la juntada relacionada (opcional)
 * @field groupId   - UUID del grupo relacionado (opcional)
 * @field read      - true si el usuario ya la vio o la marcó como leída
 * @field createdAt - Timestamp de creación en la base de datos
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  meetupId?: string | null;
  groupId?: string | null;
  read: boolean;
  createdAt: string;
}

/**
 * Datos que el cliente envía a la Edge Function para crear una notificación.
 *
 * @field recipientUserId - UUID del usuario que recibirá la notificación
 * @field type            - Tipo del evento
 * @field title           - Título del mensaje
 * @field body            - Cuerpo del mensaje
 * @field meetupId        - UUID de la juntada relacionada (opcional)
 * @field groupId         - UUID del grupo relacionado (opcional)
 */
export interface NotificationInput {
  recipientUserId: string;
  type: NotificationType;
  title: string;
  body: string;
  meetupId?: string;
  groupId?: string;
}

/** Fila cruda de la tabla notifications tal como la devuelve Supabase (snake_case) */
export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  meetup_id: string | null;
  group_id: string | null;
  read: boolean;
  created_at: string;
}

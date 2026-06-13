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
  /** Recordatorio local 2 horas antes de la juntada */
  Reminder = 'reminder',
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
 */
export interface NotificationInput {
  recipientUserId: string;
  type: NotificationType;
  title: string;
  body: string;
  meetupId?: string;
}

/** Fila cruda de la tabla notifications tal como la devuelve Supabase (snake_case) */
export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  meetup_id: string | null;
  read: boolean;
  created_at: string;
}

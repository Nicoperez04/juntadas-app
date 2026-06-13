/**
 * Servicio de notificaciones — única capa que interactúa con Supabase y
 * expo-notifications para todo el módulo de notificaciones.
 *
 * Responsabilidades:
 *   - Registrar el push token del dispositivo en el perfil del usuario.
 *   - Invocar la Edge Function send-push-notification para crear notificaciones.
 *   - Leer, marcar como leídas y eliminar notificaciones de la tabla notifications.
 *   - Programar y cancelar notificaciones locales (recordatorios).
 *
 * Todas las funciones siguen el patrón { data, error } para que los callers
 * nunca necesiten capturar excepciones directamente.
 */
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase/client';
import type { Notification, NotificationInput, NotificationRow } from '../types';
import type { Meetup } from '@/features/meetups/types';

/** Contrato de retorno uniforme de todas las operaciones del servicio */
interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Convierte una fila cruda de la base de datos al tipo de dominio Notification.
 * Centraliza el mapeo snake_case → camelCase.
 *
 * @param row - Fila cruda de la tabla notifications
 * @returns Objeto Notification del dominio de la aplicación
 */
const mapNotificationRow = (row: NotificationRow): Notification => ({
  id: row.id,
  userId: row.user_id,
  type: row.type as Notification['type'],
  title: row.title,
  body: row.body,
  meetupId: row.meetup_id,
  read: row.read,
  createdAt: row.created_at,
});

export const notificationService = {
  /**
   * Registra el push token del dispositivo en el perfil del usuario.
   *
   * Verifica que se ejecute en un dispositivo físico (los emuladores no
   * soportan notificaciones push reales) y solicita permisos al usuario.
   * Si los permisos son concedidos, guarda el token en la tabla profiles
   * para que las Edge Functions puedan enviarlo.
   *
   * @param userId - UUID del usuario autenticado
   * @returns El token registrado o null si se rechazaron los permisos
   */
  async registerPushToken(userId: string): Promise<ServiceResult<string | null>> {
    try {
      // El guard va antes del import dinámico: expo-notifications crashea al cargarse en Expo Go
      const ConstantsModule = (await import('expo-constants')).default;
      const isExpoGo = ConstantsModule.appOwnership === 'expo';
      if (isExpoGo) {
        console.log('[Push] Expo Go detectado — push notifications deshabilitadas'); // TODO: remover
        return { data: null, error: null };
      }

      const Notifications = await import('expo-notifications');
      const Device = await import('expo-device');

      console.log('[Push] registerPushToken llamado con userId:', userId); // TODO: remover
      console.log('[Push] Iniciando registro...'); // TODO: remover

      // Los emuladores no tienen push token real; omitir silenciosamente
      console.log('[Push] isDevice:', Device.isDevice); // TODO: remover
      if (!Device.isDevice) {
        return { data: null, error: null };
      }

      // Solicitar permisos de notificación al sistema operativo
      const { status } = await Notifications.requestPermissionsAsync();
      console.log('[Push] Status permisos:', status); // TODO: remover

      if (status !== 'granted') {
        // El usuario rechazó los permisos; no es un error, simplemente no hay push
        return { data: null, error: null };
      }

      // Se intenta obtener el projectId desde múltiples fuentes para mayor resiliencia
      // en builds standalone donde expoConfig puede ser undefined.
      const projectId =
        ConstantsModule.expoConfig?.extra?.eas?.projectId ??
        ConstantsModule.easConfig?.projectId ??
        '4e795c92-2a3e-4984-939e-168bca1db737'; // fallback hardcodeado al projectId del proyecto

      console.log('[Push] projectId:', projectId); // TODO: remover

      if (!projectId) {
        console.error('[Push] projectId no disponible'); // TODO: remover
        return { data: null, error: 'No se pudo obtener el projectId para notificaciones' };
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      const token = tokenData.data;
      console.log('[Push] Token obtenido:', tokenData?.data); // TODO: remover

      // Persistir el token en el perfil del usuario para que la Edge Function lo lea
      console.log('[Push] Intentando guardar token para userId:', userId); // TODO: remover
      const updateResult = await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', userId);

      console.log('[Push] Resultado UPDATE:', JSON.stringify(updateResult)); // TODO: remover

      const { error: updateError } = updateResult;
      if (updateError) {
        console.error('[Push] Error en UPDATE:', updateError); // TODO: remover
        return { data: null, error: 'No se pudo guardar el token de notificaciones' };
      }

      return { data: token, error: null };
    } catch (err) {
      console.error('[Push] Error:', err); // TODO: remover
      const message = err instanceof Error ? err.message : '';
      return { data: null, error: message || 'Error al registrar el token de notificaciones' };
    }
  },

  /**
   * Elimina el push token del perfil cuando el usuario desactiva notificaciones.
   * Evita envíos push hasta que vuelva a registrarse con registerPushToken.
   *
   * @param userId - UUID del usuario autenticado
   * @returns null en data si fue exitoso; mensaje de error en caso contrario
   */
  async clearPushToken(userId: string): Promise<ServiceResult<null>> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ push_token: null })
        .eq('id', userId);

      if (error) throw error;
      return { data: null, error: null };
    } catch {
      return { data: null, error: 'No se pudo desactivar el token de notificaciones' };
    }
  },

  /**
   * Envía una notificación al destinatario invocando la Edge Function.
   *
   * La Edge Function se encarga de persistir la notificación in-app y de
   * enviar la push si el destinatario tiene token registrado.
   * El caller puede tratar esta llamada como fire-and-forget: si falla,
   * loguear el error pero no bloquear el flujo principal de la app.
   *
   * @param input - Datos de la notificación a enviar
   * @returns El resultado de la Edge Function o un mensaje de error
   */
  async sendNotification(input: NotificationInput): Promise<ServiceResult<unknown>> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'send-push-notification',
        { body: input },
      );

      if (error) {
        return { data: null, error: error.message || 'Error al enviar la notificación' };
      }

      return { data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      return { data: null, error: message || 'Error inesperado al enviar la notificación' };
    }
  },

  /**
   * Obtiene las últimas 50 notificaciones del usuario, ordenadas por fecha
   * descendente (las más recientes primero).
   *
   * @param userId - UUID del usuario autenticado
   * @returns Lista de notificaciones o mensaje de error
   */
  async getNotifications(userId: string): Promise<ServiceResult<Notification[]>> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const notifications = (data ?? []).map((row) =>
        mapNotificationRow(row as NotificationRow),
      );

      return { data: notifications, error: null };
    } catch {
      return { data: null, error: 'Error al obtener las notificaciones' };
    }
  },

  /**
   * Marca una notificación específica como leída.
   *
   * @param notificationId - UUID de la notificación
   * @returns null en data si fue exitoso; mensaje de error en caso contrario
   */
  async markAsRead(notificationId: string): Promise<ServiceResult<null>> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return { data: null, error: null };
    } catch {
      return { data: null, error: 'Error al marcar la notificación como leída' };
    }
  },

  /**
   * Marca todas las notificaciones no leídas del usuario como leídas.
   * Útil al abrir la pantalla de notificaciones.
   *
   * @param userId - UUID del usuario autenticado
   * @returns null en data si fue exitoso; mensaje de error en caso contrario
   */
  async markAllAsRead(userId: string): Promise<ServiceResult<null>> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return { data: null, error: null };
    } catch {
      return { data: null, error: 'Error al marcar todas las notificaciones como leídas' };
    }
  },

  /**
   * Elimina una notificación del historial del usuario.
   *
   * @param notificationId - UUID de la notificación a eliminar
   * @returns null en data si fue exitoso; mensaje de error en caso contrario
   */
  async deleteNotification(notificationId: string): Promise<ServiceResult<null>> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return { data: null, error: null };
    } catch {
      return { data: null, error: 'Error al eliminar la notificación' };
    }
  },

  /**
   * Programa una notificación local de recordatorio 2 horas antes de la juntada.
   *
   * Combina la fecha (formato YYYY-MM-DD) y la hora (formato HH:MM) de la
   * juntada, resta 2 horas y programa la notificación solo si el momento
   * resultante es futuro. Si ya pasó, retorna null silenciosamente.
   *
   * @param meetup - Juntada para la que programar el recordatorio
   * @returns El ID de la notificación programada o null si ya pasó la hora
   */
  async scheduleReminderNotification(meetup: Meetup): Promise<ServiceResult<string | null>> {
    try {
      // Guard antes del import dinámico para evitar cargar expo-notifications en Expo Go
      const isExpoGo = Constants.appOwnership === 'expo';
      if (isExpoGo) {
        return { data: null, error: null };
      }

      const Notifications = await import('expo-notifications');

      // Construir la fecha/hora de la juntada en zona local
      const [hours, minutes] = meetup.time.split(':').map(Number);
      const meetupDate = new Date(meetup.date);
      meetupDate.setHours(hours, minutes, 0, 0);

      // Restar 2 horas para el recordatorio
      const REMINDER_OFFSET_MS = 2 * 60 * 60 * 1000;
      const reminderDate = new Date(meetupDate.getTime() - REMINDER_OFFSET_MS);

      // Solo programar si la fecha del recordatorio aún no pasó
      if (reminderDate <= new Date()) {
        return { data: null, error: null };
      }

      const notifId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '¡Tu juntada empieza en 2 horas! ⏰',
          body: `No te olvides de "${meetup.title}"`,
          sound: 'default',
          data: {
            type: 'reminder',
            meetupId: meetup.id,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderDate,
        },
      });

      return { data: notifId, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      return { data: null, error: message || 'Error al programar el recordatorio' };
    }
  },

  /**
   * Cancela una notificación local previamente programada.
   * Se usa cuando el usuario abandona o cancela una juntada para la que
   * ya había un recordatorio agendado.
   *
   * @param notificationId - ID retornado por scheduleNotificationAsync
   * @returns null en data si fue exitoso; mensaje de error en caso contrario
   */
  async cancelReminderNotification(notificationId: string): Promise<ServiceResult<null>> {
    try {
      const isExpoGo = Constants.appOwnership === 'expo';
      if (isExpoGo) {
        return { data: null, error: null };
      }

      const Notifications = await import('expo-notifications');
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      return { data: null, error: null };
    } catch {
      return { data: null, error: 'Error al cancelar el recordatorio' };
    }
  },

  /**
   * Guarda el ID de un recordatorio programado en AsyncStorage para poder
   * cancelarlo posteriormente si el usuario abandona la juntada.
   *
   * @param meetupId  - UUID de la juntada asociada
   * @param notifId   - ID del recordatorio retornado por expo-notifications
   */
  async saveReminderIdForMeetup(meetupId: string, notifId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(`reminder_${meetupId}`, notifId);
    } catch {
      // Fallo silencioso: no poder guardar el ID no es un error bloqueante
    }
  },

  /**
   * Lee el ID de recordatorio guardado para una juntada y lo cancela.
   * Útil cuando el usuario confirma que ya no asistirá.
   *
   * @param meetupId - UUID de la juntada cuyo recordatorio se quiere cancelar
   */
  async cancelReminderForMeetup(meetupId: string): Promise<void> {
    try {
      const isExpoGo = Constants.appOwnership === 'expo';
      if (isExpoGo) {
        return;
      }

      const storedId = await AsyncStorage.getItem(`reminder_${meetupId}`);
      if (storedId) {
        const Notifications = await import('expo-notifications');
        await Notifications.cancelScheduledNotificationAsync(storedId);
        await AsyncStorage.removeItem(`reminder_${meetupId}`);
      }
    } catch {
      // Fallo silencioso
    }
  },
};

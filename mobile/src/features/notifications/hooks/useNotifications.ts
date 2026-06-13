/**
 * Hooks de TanStack Query para el módulo de notificaciones.
 *
 * Expone queries derivadas y mutaciones para leer, marcar como leídas
 * y eliminar notificaciones. Las mutaciones invalidan la caché de la
 * query ['notifications', userId] para que la UI se actualice
 * automáticamente tras cada operación.
 */
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { notificationService } from '../services/notificationService';
import { useNotificationStore } from '../store/notificationStore';
import type { Notification, NotificationRow } from '../types';

/**
 * Convierte una fila de Realtime (snake_case) al tipo de dominio Notification.
 * Duplicado aquí para no acoplar el hook al servicio privado de mapeo.
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

/**
 * Query principal de notificaciones del usuario.
 * Devuelve las últimas 50 notificaciones ordenadas por fecha descendente.
 *
 * @param userId - UUID del usuario; la query se deshabilita si es null
 * @returns Query de TanStack con la lista de notificaciones
 */
export const useNotifications = (userId: string | null) => {
  return useQuery({
    queryKey: ['notifications', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Notification[]> => {
      if (!userId) return [];
      const { data, error } = await notificationService.getNotifications(userId);
      if (error) throw new Error(error);
      return data ?? [];
    },
    // Refrescar cada 60 segundos para mantener el badge actualizado sin realtime
    refetchInterval: 60_000,
  });
};

/**
 * Conteo de notificaciones no leídas del usuario.
 * Derivado de useNotifications para no disparar una query adicional.
 *
 * @param userId - UUID del usuario; retorna 0 si no hay sesión
 * @returns Número de notificaciones con read = false
 */
export const useUnreadCount = (userId: string | null): number => {
  const { data } = useNotifications(userId);

  return useMemo(() => {
    if (!data) return 0;
    return data.filter((n) => !n.read).length;
  }, [data]);
};

/**
 * Mutación para marcar una notificación específica como leída.
 * Invalida la lista completa del usuario al tener éxito.
 *
 * @returns Mutación de TanStack Query
 */
export const useMarkAsRead = (userId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await notificationService.markAsRead(notificationId);
      if (error) throw new Error(error);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });
};

/**
 * Mutación para marcar todas las notificaciones del usuario como leídas.
 * Invalida la lista del usuario al tener éxito.
 *
 * @param userId - UUID del usuario
 * @returns Mutación de TanStack Query
 */
export const useMarkAllAsRead = (userId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const { error } = await notificationService.markAllAsRead(userId);
      if (error) throw new Error(error);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });
};

/**
 * Mutación para eliminar una notificación del historial.
 * Invalida la lista del usuario al tener éxito.
 *
 * @param userId - UUID del usuario, necesario para invalidar la cache correcta
 * @returns Mutación de TanStack Query
 */
export const useDeleteNotification = (userId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await notificationService.deleteNotification(notificationId);
      if (error) throw new Error(error);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });
};

/**
 * Suscripción Realtime a INSERTs en la tabla notifications del usuario.
 * Invalida la query de notificaciones y dispara el banner vía Zustand.
 *
 * @param userId - UUID del usuario autenticado; no suscribe si es null
 * @returns La suscripción activa de Supabase Realtime o null si no hay sesión
 */
export const useRealtimeNotifications = (userId: string | null): RealtimeChannel | null => {
  const queryClient = useQueryClient();
  const setPendingBanner = useNotificationStore((state) => state.setPendingBanner);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!userId) {
      setChannel(null);
      return;
    }

    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as NotificationRow;
          const notification = mapNotificationRow(row);

          void queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
          setPendingBanner(notification);
        },
      )
      .subscribe();

    setChannel(subscription);

    return () => {
      void supabase.removeChannel(subscription);
      setChannel(null);
    };
  }, [userId, queryClient, setPendingBanner]);

  return channel;
};

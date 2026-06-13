/**
 * Hooks de TanStack Query para el módulo de notificaciones.
 *
 * Expone queries derivadas y mutaciones para leer, marcar como leídas
 * y eliminar notificaciones. Las mutaciones invalidan la caché de la
 * query ['notifications', userId] para que la UI se actualice
 * automáticamente tras cada operación.
 */
import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/notificationService';
import type { Notification } from '../types';

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

/**
 * Store global de notificaciones para el banner flotante.
 *
 * Cuando Realtime detecta un INSERT, el hook useRealtimeNotifications
 * deposita la notificación aquí para que NotificationBanner la muestre
 * sin acoplar la suscripción al árbol de componentes.
 */
import { create } from 'zustand';
import type { Notification } from '../types';

interface NotificationStoreState {
  /** Notificación pendiente de mostrar en el banner flotante */
  pendingBanner: Notification | null;
  /** Registra la notificación recién llegada para el banner */
  setPendingBanner: (notification: Notification) => void;
  /** Limpia el banner tras descarte manual o auto-cierre por tiempo */
  clearPendingBanner: () => void;
}

export const useNotificationStore = create<NotificationStoreState>((set) => ({
  pendingBanner: null,
  setPendingBanner: (notification) => set({ pendingBanner: notification }),
  clearPendingBanner: () => set({ pendingBanner: null }),
}));

import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase/client';
import { notificationService, isExpoGoEnvironment } from '@/features/notifications/services/notificationService';
import { NotificationBanner } from '@/features/notifications/components/NotificationBanner';
import { useRealtimeNotifications } from '@/features/notifications/hooks/useNotifications';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { AppNavigator } from '@/navigation/AppNavigator';

/** Key de AsyncStorage para la preferencia local de notificaciones */
const NOTIFICATIONS_ENABLED_KEY = 'notifications_enabled';

/**
 * Cliente global de TanStack Query.
 *
 * Configuración base elegida para una app móvil con datos sociales:
 * - staleTime de 30 segundos: evita refetches innecesarios al navegar
 *   entre pantallas, pero mantiene los datos razonablemente frescos.
 * - retry 1: un único reintento ante fallos de red; los servicios ya
 *   traducen los errores a mensajes en español para la UI.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
    },
  },
});

/**
 * Inicializa la suscripción Realtime de notificaciones cuando hay sesión activa
 * y la preferencia del usuario lo permite. Vive dentro del QueryClientProvider
 * para poder invalidar queries.
 */
const AppNotificationsBootstrap = () => {
  const { userId } = useCurrentUser();
  /** null = AsyncStorage aún no leído; se pasa enabled=false para evitar suscripción prematura */
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadPreference = async () => {
      const value = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
      if (!mounted) return;
      // Ausencia de key = activado por defecto, coherente con ProfileScreen
      setNotificationsEnabled(value !== 'false');
    };

    void loadPreference();

    return () => {
      mounted = false;
    };
  }, []);

  // Mientras carga la preferencia, bloquear Realtime; luego respetar el valor leído
  const realtimeEnabled = notificationsEnabled ?? false;

  useRealtimeNotifications(userId, realtimeEnabled);
  return null;
};

// Punto de entrada de la app: provee gestos, bottom sheets y la caché de queries.
export default function App() {
  /**
   * Configura el handler de notificaciones solo en builds nativos.
   * Import dinámico para evitar que expo-notifications se cargue en Expo Go.
   */
  useEffect(() => {
    if (!isExpoGoEnvironment()) {
      import('expo-notifications').then((Notifications) => {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });
      });
    }
  }, []);

  /**
   * Escucha cambios de sesión para registrar el push token en cuanto el
   * usuario está autenticado. Se suscribe una sola vez al montar el componente.
   * El token se guarda en profiles.push_token para que las Edge Functions
   * puedan enviarlo como destinatario de push notifications.
   */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user?.id && !isExpoGoEnvironment()) {
          const registerIfEnabled = async () => {
            const value = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
            if (value === 'false') return;
            await notificationService.registerPushToken(session.user.id);
          };
          void registerIfEnabled();
        }
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.root}>
        <BottomSheetModalProvider>
          <QueryClientProvider client={queryClient}>
            <AppNotificationsBootstrap />
            <NotificationBanner />
            <AppNavigator />
          </QueryClientProvider>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

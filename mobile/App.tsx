import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase/client';
import { notificationService } from '@/features/notifications/services/notificationService';
import { AppNavigator } from '@/navigation/AppNavigator';

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

// Punto de entrada de la app: provee gestos, bottom sheets y la caché de queries.
export default function App() {
  /**
   * Configura el handler de notificaciones solo en builds nativos.
   * Import dinámico para evitar que expo-notifications se cargue en Expo Go.
   */
  useEffect(() => {
    const isExpoGo = Constants.appOwnership === 'expo';
    if (!isExpoGo) {
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
        if (session?.user?.id) {
          // Loguea el resultado para facilitar el diagnóstico en builds standalone // TODO: remover logs
          notificationService.registerPushToken(session.user.id)
            .then(result => {
              if (result.error) {
                console.error('[Push] Error al registrar token:', result.error);
              } else if (result.data) {
                console.log('[Push] Token registrado correctamente');
              }
            })
            .catch(err => console.error('[Push] Error inesperado:', err));
        }
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <BottomSheetModalProvider>
        <QueryClientProvider client={queryClient}>
          <AppNavigator />
        </QueryClientProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

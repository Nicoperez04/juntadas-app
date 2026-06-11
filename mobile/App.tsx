import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

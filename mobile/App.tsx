import React from 'react';
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

// Punto de entrada de la app: provee la caché de queries y monta la navegación.
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppNavigator />
    </QueryClientProvider>
  );
}

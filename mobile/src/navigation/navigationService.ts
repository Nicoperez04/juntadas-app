import { createNavigationContainerRef } from '@react-navigation/native';
import type { MainStackParamList } from './types';

/**
 * Ref global de navegación para componentes fuera del NavigationContainer.
 * Tipado con MainStackParamList para acceder a todas las rutas principales.
 * Se usa principalmente desde NotificationBanner.
 */
export const mainNavigationRef =
  createNavigationContainerRef<MainStackParamList>();

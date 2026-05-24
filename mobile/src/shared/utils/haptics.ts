/**
 * Utilidades de feedback háptico con fallback silencioso.
 *
 * Centraliza las llamadas a expo-haptics para no repetir try/catch
 * en cada pantalla y tolerar dispositivos sin motor háptico.
 */
import * as Haptics from 'expo-haptics';

/** Vibración leve al seleccionar una opción en listas o modales */
export const triggerSelectionHaptic = async (): Promise<void> => {
  try {
    await Haptics.selectionAsync();
  } catch {
    // Ignorado — simuladores o dispositivos sin soporte háptico
  }
};

/** Vibración de confirmación al completar una acción exitosa */
export const triggerSuccessHaptic = async (): Promise<void> => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Ignorado — simuladores o dispositivos sin soporte háptico
  }
};

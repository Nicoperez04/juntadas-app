/**
 * Toast centrado para feedback transitorio de acciones exitosas o errores.
 *
 * Aparece en el centro de la pantalla con animación fade in/out y se oculta
 * automáticamente tras 2 segundos de visibilidad completa.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/shared/constants/theme';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
  onHide: () => void;
}

/** Duración de cada animación de fade in/out en milisegundos */
const FADE_DURATION_MS = 200;

/** Tiempo visible entre la entrada y la salida */
const VISIBLE_DURATION_MS = 2000;

/** Tamaño del card cuadrado del toast */
const TOAST_SIZE = 140;

export const Toast = ({ message, type, visible, onHide }: ToastProps) => {
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(false);

  /**
   * Orquesta la secuencia completa: fade in → pausa visible → fade out → onHide.
   * Mantenemos el modal montado durante la salida para que la animación termine.
   */
  useEffect(() => {
    if (!visible) return;

    setShouldRender(true);
    cardOpacity.setValue(0);
    overlayOpacity.setValue(0);

    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const fadeIn = Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: FADE_DURATION_MS,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: FADE_DURATION_MS,
        useNativeDriver: true,
      }),
    ]);

    const fadeOut = Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: FADE_DURATION_MS,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: FADE_DURATION_MS,
        useNativeDriver: true,
      }),
    ]);

    fadeIn.start(({ finished }) => {
      if (!finished) return;

      hideTimer = setTimeout(() => {
        fadeOut.start(({ finished: fadeOutFinished }) => {
          if (!fadeOutFinished) return;
          setShouldRender(false);
          onHide();
        });
      }, VISIBLE_DURATION_MS);
    });

    return () => {
      cardOpacity.stopAnimation();
      overlayOpacity.stopAnimation();
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [visible, cardOpacity, overlayOpacity, onHide]);

  if (!shouldRender) return null;

  const isSuccess = type === 'success';
  const iconColor = isSuccess ? theme.colors.success : theme.colors.error;
  const iconBgColor = isSuccess
    ? theme.colors.successLight
    : theme.colors.errorLight;

  return (
    <Modal transparent visible={shouldRender} animationType="none" statusBarTranslucent>
      <View style={styles.container} pointerEvents="box-none">
        <Animated.View
          style={[styles.overlay, { opacity: overlayOpacity }]}
          pointerEvents="none"
        />
        <Animated.View
          style={[styles.toastCard, { opacity: cardOpacity }]}
          pointerEvents="none"
        >
          <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
            <Ionicons
              name={isSuccess ? 'checkmark-circle' : 'alert-circle'}
              size={48}
              color={iconColor}
            />
          </View>
          <Text style={styles.message} numberOfLines={3}>
            {message}
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  toastCard: {
    width: TOAST_SIZE,
    minHeight: TOAST_SIZE,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    ...theme.shadows.md,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  message: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

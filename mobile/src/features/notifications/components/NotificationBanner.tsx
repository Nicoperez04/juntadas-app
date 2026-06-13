/**
 * Banner flotante de notificaciones en tiempo real.
 *
 * Muestra la notificación pendiente del store global durante 4 segundos
 * con animación de entrada/salida. Si el usuario la descarta (toque o swipe),
 * se marca como leída; si expira sola, permanece no leída.
 */
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/shared/constants/theme';
import { useMarkAsRead } from '../hooks/useNotifications';
import { useNotificationStore } from '../store/notificationStore';

const BANNER_DURATION_MS = 4000;
const SWIPE_DISMISS_THRESHOLD = -40;

/** Opacidad del fondo primario del banner */
const BANNER_BG_OPACITY = 0.95;
const BANNER_BACKGROUND = `rgba(124, 58, 237, ${BANNER_BG_OPACITY})`;

export const NotificationBanner = () => {
  const insets = useSafeAreaInsets();
  const pendingBanner = useNotificationStore((state) => state.pendingBanner);
  const clearPendingBanner = useNotificationStore((state) => state.clearPendingBanner);
  const markAsReadMutation = useMarkAsRead(pendingBanner?.userId ?? null);

  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDismissingRef = useRef(false);

  const screenWidth = Dimensions.get('window').width;
  const bannerWidth = screenWidth * 0.9;

  /**
   * Anima la salida del banner. markAsRead=true solo cuando el usuario lo descarta.
   */
  const hideBanner = useCallback(
    (markAsRead: boolean) => {
      if (isDismissingRef.current) return;
      isDismissingRef.current = true;

      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (markAsRead && pendingBanner) {
          void markAsReadMutation.mutateAsync(pendingBanner.id).catch(() => undefined);
        }
        clearPendingBanner();
        isDismissingRef.current = false;
      });
    },
    [clearPendingBanner, markAsReadMutation, opacity, pendingBanner, translateY],
  );

  const showBanner = useCallback(() => {
    translateY.setValue(-120);
    opacity.setValue(0);
    isDismissingRef.current = false;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    dismissTimerRef.current = setTimeout(() => {
      hideBanner(false);
    }, BANNER_DURATION_MS);
  }, [hideBanner, opacity, translateY]);

  useEffect(() => {
    if (!pendingBanner) return;

    showBanner();

    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
    };
  }, [pendingBanner, showBanner]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          gesture.dy < -8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy < SWIPE_DISMISS_THRESHOLD) {
            hideBanner(true);
          }
        },
      }),
    [hideBanner],
  );

  if (!pendingBanner) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          top: insets.top + theme.spacing.sm,
          width: bannerWidth,
          opacity,
          transform: [{ translateY }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <Pressable
        style={styles.banner}
        onPress={() => hideBanner(true)}
        accessibilityRole="button"
        accessibilityLabel="Descartar notificación"
      >
        <MaterialCommunityIcons
          name="bell-ring-outline"
          size={22}
          color={theme.colors.surface}
          style={styles.icon}
        />
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {pendingBanner.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {pendingBanner.body}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 9999,
    ...theme.shadows.md,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BANNER_BACKGROUND,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  icon: {
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.surface,
    marginBottom: 2,
  },
  body: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.surface,
    opacity: 0.95,
    lineHeight: 16,
  },
});

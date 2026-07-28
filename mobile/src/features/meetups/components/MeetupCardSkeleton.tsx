/**
 * Placeholder animado que replica la estructura visual de MeetupCard.
 *
 * Se usa en el home mientras cargan las queries iniciales, reemplazando
 * el spinner genérico por un esqueleto que anticipa el layout real.
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/shared/constants/theme';

/** Colores fijos del efecto shimmer — no están definidos en theme.ts */
const SHIMMER_COLORS = ['#E8E8F0', '#F5F5FF', '#E8E8F0'] as const;

interface ShimmerPlaceholderProps {
  /** Estilos del bloque base sobre el que se desplaza el gradiente */
  style: StyleProp<ViewStyle>;
}

/**
 * Bloque con fondo neutro y gradiente animado que simula carga de contenido.
 * El overflow hidden recorta el gradiente para que solo se vea dentro del placeholder.
 *
 * @param style - Dimensiones y forma del bloque (línea, círculo, thumbnail, etc.)
 */
export const ShimmerPlaceholder = ({ style }: ShimmerPlaceholderProps) => {
  const { width: screenWidth } = useWindowDimensions();
  const shimmerProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerProgress, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerProgress]);

  const translateX = shimmerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-screenWidth, screenWidth],
  });

  return (
    <View style={[style, styles.shimmerBase]}>
      <Animated.View
        style={[
          styles.shimmerGradientWrapper,
          { transform: [{ translateX }] },
        ]}
      >
        <LinearGradient
          colors={[...SHIMMER_COLORS]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.shimmerGradient, { width: screenWidth * 2 }]}
        />
      </Animated.View>
    </View>
  );
};

/**
 * Esqueleto de una MeetupCard con shimmer horizontal.
 * No recibe props porque siempre representa el mismo layout de carga.
 */
export const MeetupCardSkeleton = () => (
  <View style={styles.card}>
    <View style={styles.cardTopRow}>
      <ShimmerPlaceholder style={styles.thumbnail} />

      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <ShimmerPlaceholder style={styles.titleLine} />
          <ShimmerPlaceholder style={styles.badgeLine} />
        </View>

        <ShimmerPlaceholder style={styles.dateLine} />
        <ShimmerPlaceholder style={styles.locationLine} />
      </View>
    </View>

    <View style={styles.cardFooter}>
      <View style={styles.avatarStack}>
        <ShimmerPlaceholder style={styles.avatar} />
        <ShimmerPlaceholder style={[styles.avatar, styles.avatarOverlap]} />
        <ShimmerPlaceholder style={[styles.avatar, styles.avatarOverlap]} />
      </View>

      <ShimmerPlaceholder style={styles.confirmedLine} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  cardTopRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: theme.radius.md,
  },
  cardBody: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  titleLine: {
    flex: 1,
    height: 14,
    borderRadius: theme.radius.sm,
    maxWidth: '60%',
  },
  badgeLine: {
    width: '25%',
    height: 20,
    borderRadius: theme.radius.full,
  },
  dateLine: {
    width: '70%',
    height: 12,
    borderRadius: theme.radius.sm,
    marginTop: theme.spacing.xs,
  },
  locationLine: {
    width: '50%',
    height: 12,
    borderRadius: theme.radius.sm,
    marginTop: theme.spacing.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: theme.radius.full,
  },
  avatarOverlap: {
    marginLeft: -8,
  },
  confirmedLine: {
    width: '35%',
    height: 12,
    borderRadius: theme.radius.sm,
  },
  shimmerBase: {
    overflow: 'hidden',
    backgroundColor: theme.colors.border,
  },
  shimmerGradientWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  shimmerGradient: {
    flex: 1,
  },
});

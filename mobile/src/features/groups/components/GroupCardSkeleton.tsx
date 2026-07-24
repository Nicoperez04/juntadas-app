/**
 * Placeholder animado que replica la estructura visual de la card de grupo
 * en GroupHomeScreen. Reutiliza el mismo patrón shimmer que
 * MeetupCardSkeleton, sin thumbnail porque las cards de grupo no lo tienen.
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

/** Colores fijos del efecto shimmer — mismos que MeetupCardSkeleton */
const SHIMMER_COLORS = ['#E8E8F0', '#F5F5FF', '#E8E8F0'] as const;

interface ShimmerPlaceholderProps {
  style: StyleProp<ViewStyle>;
}

const ShimmerPlaceholder = ({ style }: ShimmerPlaceholderProps) => {
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
        style={[styles.shimmerGradientWrapper, { transform: [{ translateX }] }]}
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

/** Esqueleto de una card de grupo con shimmer horizontal */
export const GroupCardSkeleton = () => (
  <View style={styles.card}>
    <View style={styles.headerRow}>
      <ShimmerPlaceholder style={styles.titleLine} />
      <ShimmerPlaceholder style={styles.badgeLine} />
    </View>

    <ShimmerPlaceholder style={styles.infoLine} />
    <ShimmerPlaceholder style={styles.infoLineShort} />

    <View style={styles.footer}>
      <View style={styles.avatarStack}>
        <ShimmerPlaceholder style={styles.avatar} />
        <ShimmerPlaceholder style={[styles.avatar, styles.avatarOverlap]} />
        <ShimmerPlaceholder style={[styles.avatar, styles.avatarOverlap]} />
      </View>
      <ShimmerPlaceholder style={styles.countLine} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  titleLine: {
    flex: 1,
    height: 16,
    borderRadius: theme.radius.sm,
    maxWidth: '55%',
  },
  badgeLine: {
    width: 70,
    height: 20,
    borderRadius: theme.radius.sm,
  },
  infoLine: {
    width: '45%',
    height: 12,
    borderRadius: theme.radius.sm,
    marginTop: theme.spacing.xs,
  },
  infoLineShort: {
    width: '55%',
    height: 12,
    borderRadius: theme.radius.sm,
    marginTop: theme.spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background,
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
  countLine: {
    width: 70,
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

/**
 * Card recordatoria para dejar reseña en una juntada finalizada.
 *
 * Aparece en el home cuando la juntada tiene reviews habilitadas y el usuario
 * aún no dejó su reseña ni descartó la card. Incluye animación FadeIn suave.
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/shared/constants/theme';
import { AppButton } from '@/shared/components/AppButton';
import type { MeetupWithRole } from '@/features/meetups/types';

/** Props de la card de reseña pendiente */
interface PendingReviewCardProps {
  meetup: MeetupWithRole;
  /** Navega al formulario de reseña */
  onLeaveReview: () => void;
  /** Descarta la card y la oculta del home */
  onDismiss: () => void;
}

export const PendingReviewCard = ({
  meetup,
  onLeaveReview,
  onDismiss,
}: PendingReviewCardProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <Ionicons name="star" size={18} color={theme.colors.warning} />
          <Text style={styles.meetupTitle} numberOfLines={1}>
            {meetup.title}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onDismiss}
          style={styles.dismissBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Descartar recordatorio de reseña"
        >
          <Ionicons
            name="close"
            size={18}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.promptText}>¿Cómo estuvo?</Text>

      <View style={styles.decorativeStars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name="star-outline"
            size={20}
            color={theme.colors.warning}
          />
        ))}
      </View>

      <AppButton label="Dejar reseña" onPress={onLeaveReview} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.warningLight,
    ...theme.shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginRight: theme.spacing.sm,
  },
  meetupTitle: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  dismissBtn: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  promptText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  decorativeStars: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
});

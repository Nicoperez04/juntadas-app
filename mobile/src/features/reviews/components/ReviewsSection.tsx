/**
 * Sección de reseñas en el detalle de una juntada finalizada.
 *
 * Muestra el promedio, la lista de reseñas y un botón para que el usuario
 * actual deje o edite su propia reseña. Solo se renderiza cuando la juntada
 * está finished y reviews_enabled = true.
 */
import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/shared/constants/theme';
import { AppButton } from '@/shared/components/AppButton';
import { useReviews, useUserReview } from '../hooks/useReviews';
import type { ReviewWithProfile } from '../types';

/** Props de la sección de reseñas */
interface ReviewsSectionProps {
  meetupId: string;
  currentUserId: string;
  reviewsEnabled: boolean;
  meetupStatus: string;
  /** Navega al formulario de crear/editar reseña */
  onAddReview: () => void;
}

/**
 * Extrae las iniciales de un nombre para el avatar placeholder.
 *
 * @param name - Nombre completo del autor
 * @returns Iniciales en mayúsculas
 */
const getInitials = (name: string): string => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

interface StaticStarsProps {
  rating: number;
  size?: number;
}

/** Estrellas estáticas para mostrar un rating numérico */
const StaticStars = ({ rating, size = 16 }: StaticStarsProps) => (
  <View style={styles.staticStarsRow}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Ionicons
        key={star}
        name={star <= rating ? 'star' : 'star-outline'}
        size={size}
        color={star <= rating ? theme.colors.warning : theme.colors.textDisabled}
      />
    ))}
  </View>
);

interface ReviewItemProps {
  review: ReviewWithProfile;
}

/** Card individual de una reseña con avatar, nombre, estrellas y comentario */
const ReviewItem = ({ review }: ReviewItemProps) => (
  <View style={styles.reviewItem}>
    <View style={styles.reviewHeader}>
      {review.profile.avatarUrl ? (
        <Image
          source={{ uri: review.profile.avatarUrl }}
          style={styles.reviewAvatar}
        />
      ) : (
        <View style={[styles.reviewAvatar, styles.reviewAvatarPlaceholder]}>
          <Text style={styles.reviewAvatarInitials}>
            {getInitials(review.profile.fullName)}
          </Text>
        </View>
      )}
      <View style={styles.reviewAuthorInfo}>
        <Text style={styles.reviewAuthorName} numberOfLines={1}>
          {review.profile.fullName}
        </Text>
        <StaticStars rating={review.rating} />
      </View>
    </View>
    {review.comment ? (
      <Text style={styles.reviewComment}>{review.comment}</Text>
    ) : null}
  </View>
);

export const ReviewsSection = ({
  meetupId,
  currentUserId,
  reviewsEnabled,
  meetupStatus,
  onAddReview,
}: ReviewsSectionProps) => {
  const reviewsQuery = useReviews(meetupId);
  const userReviewQuery = useUserReview(meetupId, currentUserId);

  if (!reviewsEnabled || meetupStatus !== 'finished') {
    return null;
  }

  const reviews = reviewsQuery.data ?? [];
  const userReview = userReviewQuery.data;
  const isLoading = reviewsQuery.isLoading || userReviewQuery.isLoading;

  const average =
    reviews.length > 0
      ? Math.round(
          (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) * 10,
        ) / 10
      : 0;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Reseñas</Text>

      <View style={styles.summaryCard}>
        {isLoading ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.averageNumber}>{average.toFixed(1)}</Text>
              <View>
                <StaticStars rating={Math.round(average)} size={18} />
                <Text style={styles.reviewCount}>
                  {reviews.length === 0
                    ? 'Sin reseñas aún'
                    : `${reviews.length} reseña${reviews.length !== 1 ? 's' : ''}`}
                </Text>
              </View>
            </View>

            {reviews.length === 0 ? (
              <Text style={styles.emptyText}>
                Todavía no hay reseñas. ¡Sé el primero!
              </Text>
            ) : (
              reviews.map((review) => (
                <ReviewItem key={review.id} review={review} />
              ))
            )}

            <AppButton
              label={userReview ? 'Editar mi reseña' : 'Dejar mi reseña'}
              onPress={onAddReview}
              variant={userReview ? 'ghost' : 'primary'}
            />
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  averageNumber: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  staticStarsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewCount: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  emptyText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  reviewItem: {
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
  },
  reviewAvatarPlaceholder: {
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarInitials: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  reviewAuthorInfo: {
    flex: 1,
  },
  reviewAuthorName: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  reviewComment: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});

/**
 * Hook para detectar juntadas finalizadas con reseñas pendientes del usuario.
 *
 * Filtra juntadas finished con reviews_enabled = true donde el usuario participó,
 * excluyendo las que ya tienen reseña o fueron descartadas en AsyncStorage.
 */
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { meetupService } from '@/features/meetups/services/meetupService';
import { reviewService } from '../services/reviewService';
import type { MeetupWithRole } from '@/features/meetups/types';

/** Clave de AsyncStorage para marcar una card de reseña como descartada */
export const getReviewDismissedKey = (meetupId: string): string =>
  `review_dismissed_${meetupId}`;

/**
 * Verifica si el usuario descartó la card de reseña pendiente para una juntada.
 *
 * @param meetupId - UUID de la juntada
 * @returns true si la card fue descartada previamente
 */
export const isReviewDismissed = async (meetupId: string): Promise<boolean> => {
  const value = await AsyncStorage.getItem(getReviewDismissedKey(meetupId));
  return value === 'true';
};

/**
 * Marca la card de reseña pendiente como descartada para una juntada.
 *
 * @param meetupId - UUID de la juntada
 */
export const dismissPendingReview = async (meetupId: string): Promise<void> => {
  await AsyncStorage.setItem(getReviewDismissedKey(meetupId), 'true');
};

/**
 * Obtiene las juntadas donde el usuario aún no dejó su reseña.
 *
 * @returns Query con lista de juntadas pendientes de reseña
 */
export const usePendingReviews = () => {
  const { userId } = useCurrentUser();

  return useQuery({
    queryKey: ['pendingReviews', userId],
    enabled: !!userId,
    queryFn: async (): Promise<MeetupWithRole[]> => {
      if (!userId) return [];

      const { data: finishedMeetups, error } =
        await meetupService.getFinishedMeetups(userId);

      if (error || !finishedMeetups) {
        throw new Error(error ?? 'Error al cargar reseñas pendientes');
      }

      const candidates = finishedMeetups.filter(
        (meetup) =>
          meetup.status === 'finished' &&
          meetup.reviews_enabled === true &&
          meetup.leftAt === null,
      );

      const pending: MeetupWithRole[] = [];

      for (const meetup of candidates) {
        const dismissed = await isReviewDismissed(meetup.id);
        if (dismissed) continue;

        const { data: userReview } = await reviewService.getUserReview(
          meetup.id,
          userId,
        );

        if (!userReview) {
          pending.push(meetup);
        }
      }

      return pending;
    },
  });
};

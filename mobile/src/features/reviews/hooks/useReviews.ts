/**
 * Hooks de reseñas con TanStack Query v5.
 *
 * Encapsula la carga, creación, edición y eliminación de reseñas
 * delegando toda la lógica de Supabase al reviewService.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { reviewService } from '../services/reviewService';
import type { CreateReviewInput, Review, UpdateReviewInput } from '../types';

/** Contrato de retorno uniforme de las mutaciones */
interface OperationResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Obtiene todas las reseñas de una juntada con perfil de cada autor.
 *
 * @param meetupId - UUID de la juntada
 * @returns Query con lista de reseñas
 */
export const useReviews = (meetupId: string) => {
  return useQuery({
    queryKey: ['reviews', meetupId],
    queryFn: async () => {
      const { data, error } = await reviewService.getReviews(meetupId);
      if (error) throw new Error(error);
      return data ?? [];
    },
  });
};

/**
 * Obtiene la reseña del usuario autenticado en una juntada, si existe.
 *
 * @param meetupId - UUID de la juntada
 * @param userId - UUID del usuario; la query se deshabilita si es null
 * @returns Query con la reseña del usuario o null
 */
export const useUserReview = (meetupId: string, userId: string | null) => {
  return useQuery({
    queryKey: ['userReview', meetupId, userId],
    enabled: !!userId,
    queryFn: async (): Promise<Review | null> => {
      if (!userId) return null;
      const { data, error } = await reviewService.getUserReview(meetupId, userId);
      if (error) throw new Error(error);
      return data;
    },
  });
};

/**
 * Mutación para crear una reseña nueva en la juntada indicada.
 * Invalida la lista de reseñas y la reseña del usuario al tener éxito.
 *
 * @param meetupId - UUID de la juntada
 * @returns Mutación de TanStack Query
 */
export const useCreateReview = (meetupId: string) => {
  const queryClient = useQueryClient();
  const { userId } = useCurrentUser();

  return useMutation({
    mutationFn: async (
      input: CreateReviewInput,
    ): Promise<OperationResult<Review>> => {
      if (!userId) {
        return { data: null, error: 'No hay usuario autenticado' };
      }
      return reviewService.createReview(meetupId, userId, input);
    },
    onSuccess: async (result) => {
      if (!result.error) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['reviews', meetupId] }),
          queryClient.invalidateQueries({
            queryKey: ['userReview', meetupId, userId],
          }),
          queryClient.invalidateQueries({ queryKey: ['pendingReviews'] }),
        ]);
      }
    },
  });
};

/**
 * Mutación para editar una reseña existente.
 * Invalida las mismas queries que useCreateReview al tener éxito.
 *
 * @param meetupId - UUID de la juntada
 * @returns Mutación de TanStack Query
 */
export const useUpdateReview = (meetupId: string) => {
  const queryClient = useQueryClient();
  const { userId } = useCurrentUser();

  return useMutation({
    mutationFn: async ({
      reviewId,
      input,
    }: {
      reviewId: string;
      input: UpdateReviewInput;
    }): Promise<OperationResult<Review>> => {
      return reviewService.updateReview(reviewId, input);
    },
    onSuccess: async (result) => {
      if (!result.error) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['reviews', meetupId] }),
          queryClient.invalidateQueries({
            queryKey: ['userReview', meetupId, userId],
          }),
        ]);
      }
    },
  });
};

/**
 * Mutación para eliminar una reseña propia.
 * Invalida las mismas queries que useCreateReview al tener éxito.
 *
 * @param meetupId - UUID de la juntada
 * @returns Mutación de TanStack Query
 */
export const useDeleteReview = (meetupId: string) => {
  const queryClient = useQueryClient();
  const { userId } = useCurrentUser();

  return useMutation({
    mutationFn: async (reviewId: string): Promise<OperationResult<null>> => {
      return reviewService.deleteReview(reviewId);
    },
    onSuccess: async (result) => {
      if (!result.error) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['reviews', meetupId] }),
          queryClient.invalidateQueries({
            queryKey: ['userReview', meetupId, userId],
          }),
        ]);
      }
    },
  });
};

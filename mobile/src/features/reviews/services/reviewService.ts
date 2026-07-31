/**
 * Servicio de reseñas — única capa que interactúa con Supabase para este módulo.
 *
 * Todas las funciones siguen el patrón { data, error } para que los callers
 * nunca necesiten capturar excepciones directamente.
 */
import { supabase } from '@/lib/supabase/client';
import type {
  Review,
  ReviewWithProfile,
  CreateReviewInput,
  UpdateReviewInput,
} from '../types';

/** Contrato de retorno uniforme de todas las operaciones del servicio */
interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

/** Fila cruda de meetup_reviews tal como la retorna Supabase */
interface ReviewRow {
  id: string;
  meetup_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

/** Perfil anidado al hacer join con profiles */
interface ProfileRow {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

/** Fila de reseña con perfil anidado */
interface ReviewWithProfileRow extends ReviewRow {
  profiles: ProfileRow;
}

/**
 * Convierte una fila de la base de datos al tipo de dominio Review.
 *
 * @param row - Fila cruda de meetup_reviews
 * @returns Objeto Review del dominio de la aplicación
 */
const mapReviewRow = (row: ReviewRow): Review => ({
  id: row.id,
  meetupId: row.meetup_id,
  userId: row.user_id,
  rating: row.rating,
  comment: row.comment,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * Convierte una fila con join a profiles al tipo ReviewWithProfile.
 *
 * @param row - Fila con perfil anidado
 * @returns Reseña con datos del autor
 */
const mapReviewWithProfileRow = (row: ReviewWithProfileRow): ReviewWithProfile => ({
  ...mapReviewRow(row),
  profile: {
    id: row.profiles.id,
    fullName: row.profiles.full_name,
    avatarUrl: row.profiles.avatar_url,
  },
});

export const reviewService = {
  /**
   * Obtiene todas las reseñas de una juntada con el perfil de cada autor.
   * Ordenadas por fecha de creación descendente (más recientes primero).
   *
   * @param meetupId - UUID de la juntada
   * @returns Lista de reseñas con perfil o mensaje de error
   */
  async getReviews(meetupId: string): Promise<ServiceResult<ReviewWithProfile[]>> {
    try {
      const { data, error } = await supabase
        .from('meetup_reviews')
        .select(
          `
          id,
          meetup_id,
          user_id,
          rating,
          comment,
          created_at,
          updated_at,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          )
        `,
        )
        .eq('meetup_id', meetupId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = (data ?? []) as unknown as ReviewWithProfileRow[];
      return {
        data: rows.map(mapReviewWithProfileRow),
        error: null,
      };
    } catch {
      return { data: null, error: 'Error al obtener las reseñas' };
    }
  },

  /**
   * Obtiene la reseña de un usuario específico en una juntada, si existe.
   *
   * @param meetupId - UUID de la juntada
   * @param userId - UUID del usuario
   * @returns La reseña del usuario o null si no dejó reseña
   */
  async getUserReview(
    meetupId: string,
    userId: string,
  ): Promise<ServiceResult<Review | null>> {
    try {
      const { data, error } = await supabase
        .from('meetup_reviews')
        .select('*')
        .eq('meetup_id', meetupId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return {
        data: data ? mapReviewRow(data as ReviewRow) : null,
        error: null,
      };
    } catch {
      return { data: null, error: 'Error al obtener tu reseña' };
    }
  },

  /**
   * Crea una reseña nueva para el usuario en la juntada indicada.
   * La RLS garantiza que solo participantes activos puedan insertar
   * cuando la juntada está finished y reviews_enabled = true.
   *
   * @param meetupId - UUID de la juntada
   * @param userId - UUID del autor
   * @param input - Rating y comentario opcional
   * @returns La reseña creada o mensaje de error
   */
  async createReview(
    meetupId: string,
    userId: string,
    input: CreateReviewInput,
  ): Promise<ServiceResult<Review>> {
    try {
      const { data, error } = await supabase
        .from('meetup_reviews')
        .insert({
          meetup_id: meetupId,
          user_id: userId,
          rating: input.rating,
          comment: input.comment?.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      return { data: mapReviewRow(data as ReviewRow), error: null };
    } catch {
      return { data: null, error: 'No se pudo guardar la reseña' };
    }
  },

  /**
   * Actualiza una reseña existente. Solo el autor puede modificarla (RLS).
   *
   * @param reviewId - UUID de la reseña
   * @param input - Campos a actualizar
   * @returns La reseña actualizada o mensaje de error
   */
  async updateReview(
    reviewId: string,
    input: UpdateReviewInput,
  ): Promise<ServiceResult<Review>> {
    try {
      const payload: Partial<ReviewRow> = {};
      if (input.rating !== undefined) payload.rating = input.rating;
      if (input.comment !== undefined) {
        payload.comment = input.comment.trim() || null;
      }

      const { data, error } = await supabase
        .from('meetup_reviews')
        .update(payload)
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw error;
      return { data: mapReviewRow(data as ReviewRow), error: null };
    } catch {
      return { data: null, error: 'No se pudo actualizar la reseña' };
    }
  },

  /**
   * Elimina una reseña. Solo el autor puede hacerlo (RLS).
   *
   * @param reviewId - UUID de la reseña
   * @returns null en data si fue exitoso
   */
  async deleteReview(reviewId: string): Promise<ServiceResult<null>> {
    try {
      const { error } = await supabase
        .from('meetup_reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;
      return { data: null, error: null };
    } catch {
      return { data: null, error: 'No se pudo eliminar la reseña' };
    }
  },

  /**
   * Calcula el promedio de rating y la cantidad de reseñas de una juntada.
   * El cálculo se hace en el cliente a partir de las reseñas obtenidas.
   *
   * @param meetupId - UUID de la juntada
   * @returns Promedio redondeado a 1 decimal y cantidad total
   */
  async getAverageRating(
    meetupId: string,
  ): Promise<ServiceResult<{ average: number; count: number }>> {
    const { data: reviews, error } = await reviewService.getReviews(meetupId);

    if (error || !reviews) {
      return { data: null, error: error ?? 'Error al calcular el promedio' };
    }

    if (reviews.length === 0) {
      return { data: { average: 0, count: 0 }, error: null };
    }

    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const average = Math.round((sum / reviews.length) * 10) / 10;

    return { data: { average, count: reviews.length }, error: null };
  },
};

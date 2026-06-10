/**
 * Tipos del módulo de reseñas post-juntada.
 *
 * Define las entidades que circulan entre pantallas, hooks y el servicio
 * de Supabase. Se mantienen separados de los tipos nativos de Supabase
 * para desacoplar la UI del SDK.
 */

/** Reseña individual de un participante sobre una juntada finalizada */
export interface Review {
  id: string;
  meetupId: string;
  userId: string;
  /** Valor entre 1 y 5 estrellas */
  rating: number;
  /** Comentario opcional del participante */
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Reseña enriquecida con datos públicos del perfil del autor */
export interface ReviewWithProfile extends Review {
  profile: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

/** Datos para crear una reseña nueva */
export interface CreateReviewInput {
  rating: number;
  comment?: string;
}

/** Datos parciales para editar una reseña existente */
export interface UpdateReviewInput {
  rating?: number;
  comment?: string;
}

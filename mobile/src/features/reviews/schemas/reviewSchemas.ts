/**
 * Schemas Zod para validación de formularios de reseñas.
 *
 * Son la única fuente de verdad para las reglas de rating y comentario
 * antes de enviar datos al servicio de Supabase.
 */
import { z } from 'zod';

/** Schema para crear una reseña: rating obligatorio y comentario opcional */
export const createReviewSchema = z.object({
  rating: z
    .number({ message: 'Seleccioná una calificación' })
    .int('La calificación debe ser un número entero')
    .min(1, 'La calificación mínima es 1 estrella')
    .max(5, 'La calificación máxima es 5 estrellas'),
  comment: z
    .string()
    .max(500, 'El comentario no puede superar los 500 caracteres')
    .optional(),
});

/** Schema para editar una reseña: ambos campos son opcionales */
export const updateReviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, 'La calificación mínima es 1 estrella')
    .max(5, 'La calificación máxima es 5 estrellas')
    .optional(),
  comment: z
    .string()
    .max(500, 'El comentario no puede superar los 500 caracteres')
    .optional(),
});

export type CreateReviewSchema = z.infer<typeof createReviewSchema>;
export type UpdateReviewSchema = z.infer<typeof updateReviewSchema>;

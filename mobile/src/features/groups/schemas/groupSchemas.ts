/**
 * Schemas de validación del módulo de grupos.
 *
 * Sigue el mismo criterio que meetupSchemas.ts: cada schema define las
 * reglas de negocio de un formulario específico, con mensajes en español
 * listos para mostrarse al usuario sin transformación adicional.
 */
import { z } from 'zod';

/** Regex para validar que el código solo contenga letras mayúsculas y dígitos */
const JOIN_CODE_REGEX = /^[A-Z0-9]{6}$/;

/**
 * Schema del formulario de creación de grupo.
 *
 * La portada se maneja fuera de este schema (como en createMeetupSchema):
 * la subida de imagen a Storage queda pendiente de un bucket dedicado
 * para grupos, todavía no creado (ver docs de este sub-bloque).
 */
export const createGroupSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().optional(),
});

export type CreateGroupSchema = z.infer<typeof createGroupSchema>;

/**
 * Schema del formulario para unirse a un grupo.
 *
 * El código debe tener exactamente 6 caracteres y contener solo
 * letras mayúsculas (A–Z) y dígitos (0–9), igual que joinMeetupSchema.
 */
export const joinGroupSchema = z.object({
  joinCode: z
    .string()
    .length(6, 'El código debe tener exactamente 6 caracteres')
    .regex(JOIN_CODE_REGEX, 'El código solo puede contener letras mayúsculas y números'),
});

export type JoinGroupSchema = z.infer<typeof joinGroupSchema>;

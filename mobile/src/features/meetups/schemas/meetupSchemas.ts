/**
 * Schemas de validación del módulo de juntadas.
 *
 * Cada schema define las reglas de negocio para un formulario específico.
 * Todos los mensajes de error están en español para presentarse directamente
 * al usuario sin transformación adicional desde la UI.
 *
 * La validación de fecha rechaza fechas pasadas para evitar crear
 * juntadas en el pasado por error.
 */
import { z } from 'zod';

/** Regex para validar el formato de fecha esperado: DD/MM/YYYY */
const DATE_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;

/** Regex para validar el formato de hora esperado: HH:MM */
const TIME_REGEX = /^\d{2}:\d{2}$/;

/** Regex para validar que el código solo contenga letras mayúsculas y dígitos */
const JOIN_CODE_REGEX = /^[A-Z0-9]{6}$/;

/**
 * Valida una fecha ingresada en formato DD/MM/YYYY.
 * Dos refinements separados permiten dar mensajes distintos:
 * uno para formato inválido y otro para fecha pasada.
 */
const dateField = z
  .string()
  .min(1, 'La fecha es requerida')
  .regex(DATE_REGEX, 'Ingresá la fecha en formato DD/MM/YYYY')
  .refine((val) => {
    const [day, month, year] = val.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  }, 'La fecha ingresada no existe en el calendario')
  .refine((val) => {
    const [day, month, year] = val.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return date >= hoy;
  }, 'La fecha no puede ser anterior a hoy');

/**
 * Valida una hora en formato HH:MM con rango 00:00–23:59.
 */
const timeField = z
  .string()
  .min(1, 'La hora es requerida')
  .regex(TIME_REGEX, 'Ingresá la hora en formato HH:MM')
  .refine((val) => {
    const [hours, minutes] = val.split(':').map(Number);
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  }, 'La hora debe estar entre 00:00 y 23:59');

/**
 * Schema del formulario de creación de juntada.
 *
 * El costo estimado es opcional; si se ingresa, debe ser
 * un número no negativo (acepta 0 para indicar sin costo).
 * La descripción es completamente opcional.
 */
export const createMeetupSchema = z.object({
  title: z
    .string()
    .min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  date: dateField,
  time: timeField,
  location: z
    .string()
    .min(3, 'La ubicación debe tener al menos 3 caracteres'),
  estimatedCost: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === '') return true;
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    }, 'El costo debe ser un número positivo'),
});

export type CreateMeetupSchema = z.infer<typeof createMeetupSchema>;

/**
 * Schema del formulario para unirse a una juntada.
 *
 * El código debe tener exactamente 6 caracteres y contener solo
 * letras mayúsculas (A–Z) y dígitos (0–9). La pantalla convierte
 * el input a mayúsculas automáticamente antes de validar.
 */
export const joinMeetupSchema = z.object({
  joinCode: z
    .string()
    .length(6, 'El código debe tener exactamente 6 caracteres')
    .regex(JOIN_CODE_REGEX, 'El código solo puede contener letras mayúsculas y números'),
});

export type JoinMeetupSchema = z.infer<typeof joinMeetupSchema>;

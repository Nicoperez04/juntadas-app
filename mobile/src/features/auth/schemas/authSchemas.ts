/**
 * Schemas de validación Zod para el módulo de autenticación.
 *
 * Cada schema refleja exactamente las reglas de negocio acordadas:
 * contraseñas de mínimo 6 caracteres (requisito de Supabase Auth),
 * username con restricciones de formato para URLs y menciones futuras.
 *
 * Todos los mensajes de error están en español rioplatense para
 * coherencia con el resto de la UI.
 */
import { z } from 'zod';

/** Valida las credenciales del formulario de inicio de sesión */
export const loginSchema = z.object({
  email: z.string().email('Ingresá un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

/** Valida los datos del formulario de registro de cuenta nueva */
export const registerSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Ingresá un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

/** Valida que se ingrese un email válido para el flujo de recuperación de contraseña */
export const forgotPasswordSchema = z.object({
  email: z.string().email('Ingresá un email válido'),
});

/**
 * Valida la nueva contraseña en el flujo de recuperación por deep link
 * y en el cambio de contraseña desde el perfil (sin contraseña actual).
 */
export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

/**
 * Valida el cambio de contraseña estando logueado.
 * Exige la contraseña actual para evitar cambios no autorizados en dispositivos compartidos.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

/**
 * Valida el username del paso de completar perfil.
 *
 * Las restricciones de formato (solo [a-z0-9_]) facilitan el uso del username
 * como slug en URLs y como identificador en menciones (@usuario) en el futuro.
 * El límite de 20 caracteres es una convención estándar en redes sociales.
 */
export const completeProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'El usuario debe tener al menos 3 caracteres')
    .max(20, 'El usuario no puede tener más de 20 caracteres')
    .regex(/^[a-z0-9_]+$/, 'Solo se permiten letras minúsculas, números y guión bajo'),
});

/**
 * Valida nombre y username en el modo edición de ProfileScreen.
 * Reutiliza las mismas reglas de username que el onboarding para consistencia.
 */
export const profileEditSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  username: z
    .string()
    .min(3, 'El usuario debe tener al menos 3 caracteres')
    .max(20, 'El usuario no puede tener más de 20 caracteres')
    .regex(/^[a-z0-9_]+$/, 'Solo se permiten letras minúsculas, números y guión bajo'),
});

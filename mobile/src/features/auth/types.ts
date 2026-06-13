/**
 * Tipos del módulo de autenticación.
 *
 * Estas interfaces modelan los datos que circulan entre formularios,
 * el hook de auth y el servicio de Supabase. Se mantienen separados
 * del tipo nativo de Supabase (User) para desacoplar la UI del SDK.
 */

/** Datos que el usuario ingresa en el formulario de inicio de sesión */
export interface LoginFormData {
  email: string;
  password: string;
}

/** Datos del formulario de registro — fullName se envía como metadata al crear la cuenta */
export interface RegisterFormData {
  /** Nombre y apellido tal como lo escribió el usuario; se normaliza en el trigger de Supabase */
  fullName: string;
  email: string;
  password: string;
}

/** Formulario mínimo para solicitar el reseteo de contraseña */
export interface ForgotPasswordFormData {
  email: string;
}

/** Datos del formulario de nueva contraseña tras abrir el deep link de recuperación */
export interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

/** Datos del formulario de cambio de contraseña desde el perfil autenticado */
export interface ChangePasswordFormData {
  currentPassword: string;
  password: string;
  confirmPassword: string;
}

/**
 * Datos del paso de completar perfil post-registro.
 * Se persiste en la tabla `profiles` y debe ser único en la base de datos.
 */
export interface CompleteProfileFormData {
  /** Identificador público del usuario — solo minúsculas, números y guión bajo */
  username: string;
}

/**
 * Campos editables desde ProfileScreen.
 * Todos son opcionales para permitir actualizaciones parciales desde el servicio.
 */
export interface UpdateProfileData {
  fullName?: string;
  username?: string;
  avatarUrl?: string;
}

/** Datos del formulario inline de edición de perfil en ProfileScreen */
export interface ProfileEditFormData {
  fullName: string;
  username: string;
}

/**
 * Estadísticas de participación del usuario en juntadas.
 * Se muestran como cards en la pantalla de perfil.
 */
export interface UserStats {
  /** Cantidad de juntadas creadas por el usuario */
  organizedCount: number;
  /** Cantidad de juntadas donde participa como invitado (no organizador) */
  participantCount: number;
}

/**
 * Representación del usuario autenticado dentro de la app.
 * Se construye a partir de la sesión de Supabase y la tabla `profiles`.
 */
export interface AuthUser {
  /** UUID generado por Supabase Auth */
  id: string;
  email: string;
  /** Nombre completo proveniente de raw_user_meta_data */
  fullName: string;
  /** Username único elegido en CompleteProfileScreen */
  username: string;
  /** URL pública de la foto de perfil almacenada en Supabase Storage; null si no fue cargada */
  avatarUrl: string | null;
}

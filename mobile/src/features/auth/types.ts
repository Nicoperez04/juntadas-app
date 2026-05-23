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

/**
 * Datos del paso de completar perfil post-registro.
 * Se persiste en la tabla `profiles` y debe ser único en la base de datos.
 */
export interface CompleteProfileFormData {
  /** Identificador público del usuario — solo minúsculas, números y guión bajo */
  username: string;
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

/**
 * Servicio de autenticación — única capa que interactúa con Supabase Auth.
 *
 * Todas las funciones siguen el patrón `{ data, error }` para que
 * los callers nunca necesiten capturar excepciones directamente.
 * Los errores de red o de la SDK se capturan en el catch y se devuelven
 * como strings en español para que la UI los muestre sin transformación adicional.
 */
import { supabase } from '@/lib/supabase/client';
import { LoginFormData, RegisterFormData, CompleteProfileFormData } from '../types';

/**
 * Contrato de retorno uniforme de todas las operaciones del servicio.
 * `error` es null cuando la operación fue exitosa; `data` es null cuando hubo error.
 */
interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Convierte los mensajes de error en inglés de la API de Supabase Auth
 * a mensajes amigables en español para el usuario final.
 *
 * Se hace matching por substring porque Supabase no garantiza códigos
 * de error estables entre versiones — los mensajes son más estables.
 */
const mapAuthError = (message: string): string => {
  if (message.includes('Invalid login credentials')) return 'Email o contraseña incorrectos';
  if (message.includes('Email not confirmed')) return 'Confirmá tu email antes de iniciar sesión';
  if (message.includes('User already registered')) return 'Ya existe una cuenta con ese email';
  if (message.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres';
  if (message.includes('security purposes')) return 'Por seguridad, esperá unos segundos antes de intentarlo nuevamente.';
  if (message.includes('duplicate key') && message.includes('username')) return 'Ese nombre de usuario ya está en uso';
  // Si no matchea ningún caso conocido, devuelve el mensaje original para no perder contexto
  return message;
};

export const authService = {
  /**
   * Registra un usuario nuevo en Supabase Auth.
   *
   * El `full_name` se pasa como `raw_user_meta_data` para que el trigger
   * de la base de datos lo lea al crear automáticamente el registro en `profiles`.
   * El `username` NO se pasa aquí; se completa en un paso posterior via `updateProfile`.
   *
   * @param data - Datos del formulario de registro
   * @returns Sesión creada o error descriptivo
   */
  async signUp(data: RegisterFormData): Promise<ServiceResult<object>> {
    try {
      const { data: result, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      });
      if (error) return { data: null, error: mapAuthError(error.message) };
      return { data: result, error: null };
    } catch {
      return { data: null, error: 'Error inesperado al registrarse' };
    }
  },

  /**
   * Inicia sesión con email y contraseña.
   * La sesión resultante es persistida automáticamente por el cliente de Supabase
   * configurado con AsyncStorage en `@/lib/supabase/client`.
   *
   * @param data - Credenciales del usuario
   * @returns Sesión activa o error descriptivo
   */
  async signIn(data: LoginFormData): Promise<ServiceResult<object>> {
    try {
      const { data: result, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) return { data: null, error: mapAuthError(error.message) };
      return { data: result, error: null };
    } catch {
      return { data: null, error: 'Error inesperado al iniciar sesión' };
    }
  },

  /**
   * Cierra la sesión activa y elimina la sesión del AsyncStorage.
   * El AppNavigator detecta el cambio via `onAuthStateChange` y redirige automáticamente.
   */
  async signOut(): Promise<ServiceResult<null>> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) return { data: null, error: mapAuthError(error.message) };
      return { data: null, error: null };
    } catch {
      return { data: null, error: 'Error inesperado al cerrar sesión' };
    }
  },

  /**
   * Envía un email con el link de recuperación de contraseña.
   *
   * Requiere que `Site URL` y `Redirect URLs` estén configurados en el dashboard
   * de Supabase (Authentication > URL Configuration). En desarrollo local esto
   * puede fallar si no hay dominio configurado.
   *
   * @param email - Email del usuario que olvidó su contraseña
   */
  async resetPassword(email: string): Promise<ServiceResult<null>> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { data: null, error: mapAuthError(error.message) };
      return { data: null, error: null };
    } catch {
      return { data: null, error: 'Error inesperado al enviar el email' };
    }
  },

  /**
   * Obtiene el usuario de la sesión activa desde el AsyncStorage local.
   * Usa `getSession` en lugar de `getUser` para evitar un round-trip a la API
   * cuando solo necesitamos el ID para operaciones locales inmediatas.
   *
   * @returns Objeto con id y email del usuario, o null si no hay sesión
   */
  async getCurrentUser(): Promise<ServiceResult<{ id: string; email: string }>> {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) return { data: null, error: mapAuthError(error.message) };
      if (!session?.user) return { data: null, error: null };
      return {
        data: { id: session.user.id, email: session.user.email ?? '' },
        error: null,
      };
    } catch {
      return { data: null, error: 'Error al obtener el usuario actual' };
    }
  },

  /**
   * Actualiza la fila del usuario en la tabla `profiles`.
   * Se usa únicamente en el flujo de `CompleteProfileScreen` para asignar el username.
   * Si el username ya existe, Supabase retorna un error de UNIQUE constraint
   * que se mapea a un mensaje amigable via `mapAuthError`.
   *
   * @param userId - UUID del usuario autenticado (proveniente de la sesión)
   * @param data - Campos a actualizar; actualmente solo `username`
   */
  async updateProfile(
    userId: string,
    data: Partial<CompleteProfileFormData>,
  ): Promise<ServiceResult<null>> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: data.username })
        .eq('id', userId);
      if (error) return { data: null, error: mapAuthError(error.message) };
      return { data: null, error: null };
    } catch {
      return { data: null, error: 'Error al actualizar el perfil' };
    }
  },
};

/**
 * Servicio de autenticación — única capa que interactúa con Supabase Auth.
 *
 * Todas las funciones siguen el patrón `{ data, error }` para que
 * los callers nunca necesiten capturar excepciones directamente.
 * Los errores de red o de la SDK se capturan en el catch y se devuelven
 * como strings en español para que la UI los muestre sin transformación adicional.
 */
import { supabase } from '@/lib/supabase/client';
import {
  AuthUser,
  LoginFormData,
  RegisterFormData,
  CompleteProfileFormData,
  UpdateProfileData,
  UserStats,
} from '../types';

/**
 * Contrato de retorno uniforme de todas las operaciones del servicio.
 * `error` es null cuando la operación fue exitosa; `data` es null cuando hubo error.
 */
interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

/** Nombre del bucket de Storage donde se guardan las fotos de perfil */
const AVATARS_BUCKET = 'avatars';

/**
 * SQL para crear el bucket y políticas RLS — ejecutar en Supabase SQL Editor
 * si no se aplicó la migración 003_avatars_storage.sql via CLI:
 *
 * INSERT INTO storage.buckets (id, name, public)
 * VALUES ('avatars', 'avatars', true)
 * ON CONFLICT (id) DO UPDATE SET public = true;
 *
 * CREATE POLICY "avatars: upload own" ON storage.objects FOR INSERT
 *   WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
 *
 * CREATE POLICY "avatars: update own" ON storage.objects FOR UPDATE
 *   USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
 *
 * CREATE POLICY "avatars: select public" ON storage.objects FOR SELECT
 *   USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
 */

/** Ruta fija del avatar dentro del bucket — siempre se reemplaza con upsert */
const getAvatarPath = (userId: string): string => `${userId}/avatar.jpg`;

/**
 * Fila de la tabla `profiles` tal como la devuelve Supabase (snake_case).
 */
interface ProfileRow {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
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
  if (message.includes('New password should be different from the old password')) {
    return 'La nueva contraseña debe ser diferente a la actual.';
  }
  if (message.includes('security purposes')) return 'Por seguridad, esperá unos segundos antes de intentarlo nuevamente.';
  if (message.includes('duplicate key') && message.includes('username')) return 'Ese nombre de usuario ya está en uso';
  // Si no matchea ningún caso conocido, devuelve el mensaje original para no perder contexto
  return message;
};

/**
 * Mapea una fila de `profiles` más el email de Auth al modelo de dominio AuthUser.
 */
const mapProfileRow = (row: ProfileRow, email: string): AuthUser => ({
  id: row.id,
  email,
  fullName: row.full_name,
  username: row.username,
  avatarUrl: row.avatar_url,
});

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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'rondaapp://reset-password',
      });
      if (error) return { data: null, error: mapAuthError(error.message) };
      return { data: null, error: null };
    } catch {
      return { data: null, error: 'Error inesperado al enviar el email' };
    }
  },

  /**
   * Actualiza la contraseña del usuario con sesión de recuperación activa.
   * Se invoca desde ResetPasswordScreen tras abrir el deep link del email.
   *
   * @param password - Nueva contraseña elegida por el usuario
   */
  async updatePassword(password: string): Promise<ServiceResult<null>> {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return { data: null, error: mapAuthError(error.message) };
      return { data: null, error: null };
    } catch {
      return { data: null, error: 'Error inesperado al actualizar la contraseña' };
    }
  },

  /**
   * Cambia la contraseña verificando primero la contraseña actual.
   * Reutiliza signInWithPassword solo como verificación — la sesión ya está activa.
   *
   * @param email - Email del usuario autenticado
   * @param currentPassword - Contraseña actual para validar identidad
   * @param newPassword - Nueva contraseña a persistir
   */
  async changePassword(
    email: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<ServiceResult<null>> {
    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (verifyError) {
        return { data: null, error: 'Contraseña actual incorrecta' };
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { data: null, error: mapAuthError(error.message) };
      return { data: null, error: null };
    } catch {
      return { data: null, error: 'Error inesperado al cambiar la contraseña' };
    }
  },

  /**
   * Solicita la eliminación de la cuenta del usuario autenticado.
   *
   * El cliente de Supabase no expone deleteUser — para E2 se limpia el push token
   * y se cierra sesión. El soft delete real requiere columna deleted_at (pendiente de migración).
   *
   * @param userId - UUID del usuario autenticado
   */
  async deleteAccount(userId: string): Promise<ServiceResult<null>> {
    try {
      // Limpia el token push para dejar de recibir notificaciones tras la baja
      await supabase.from('profiles').update({ push_token: null }).eq('id', userId);

      const { error } = await supabase.auth.signOut();
      if (error) return { data: null, error: mapAuthError(error.message) };
      return { data: null, error: null };
    } catch {
      return { data: null, error: 'Error inesperado al eliminar la cuenta' };
    }
  },

  /**
   * Procesa la URL del deep link de recuperación de contraseña.
   * Como detectSessionInUrl está desactivado en el cliente, hay que
   * extraer los tokens manualmente y establecer la sesión de recovery.
   *
   * @param url - URL completa recibida por Linking (ej: rondaapp://reset-password#...)
   */
  async setSessionFromRecoveryUrl(url: string): Promise<ServiceResult<null>> {
    try {
      if (!url.includes('reset-password')) {
        return { data: null, error: null };
      }

      const hashIndex = url.indexOf('#');
      const queryIndex = url.indexOf('?');
      const paramString =
        hashIndex !== -1
          ? url.substring(hashIndex + 1)
          : queryIndex !== -1
            ? url.substring(queryIndex + 1)
            : '';

      if (!paramString) {
        return { data: null, error: 'Enlace de recuperación inválido' };
      }

      const params = new URLSearchParams(paramString);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const recoveryType = params.get('type');

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) return { data: null, error: mapAuthError(error.message) };
        return { data: null, error: null };
      }

      // Fallback: algunos links de Supabase traen solo access_token con type=recovery
      if (accessToken && recoveryType === 'recovery') {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken ?? '',
        });

        if (error) {
          return { data: null, error: mapAuthError(error.message) };
        }

        return { data: null, error: null };
      }

      return { data: null, error: 'Enlace de recuperación inválido' };
    } catch {
      return { data: null, error: 'Error al procesar el enlace de recuperación' };
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
   * Obtiene el perfil completo del usuario desde la tabla `profiles`.
   * El email se toma de la sesión activa porque no vive en `profiles`.
   *
   * @param userId - UUID del usuario autenticado
   * @returns Perfil mapeado a AuthUser o error descriptivo
   */
  async getProfile(userId: string): Promise<ServiceResult<AuthUser>> {
    try {
      const { data: currentUser, error: userError } = await this.getCurrentUser();
      if (userError) return { data: null, error: userError };
      if (!currentUser) return { data: null, error: 'No hay usuario autenticado' };

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .eq('id', userId)
        .single();

      if (error) return { data: null, error: 'Error al cargar el perfil' };

      return {
        data: mapProfileRow(data as ProfileRow, currentUser.email),
        error: null,
      };
    } catch {
      return { data: null, error: 'Error al cargar el perfil' };
    }
  },

  /**
   * Verifica si un username ya está en uso por otro usuario distinto al actual.
   * Se consulta antes de actualizar para dar feedback inline sin depender del UNIQUE de la DB.
   *
   * @param username - Username a validar
   * @param excludeUserId - ID del usuario actual para excluirlo de la búsqueda
   */
  async isUsernameTaken(username: string, excludeUserId: string): Promise<ServiceResult<boolean>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', excludeUserId)
        .maybeSingle();

      if (error) return { data: null, error: 'Error al verificar el username' };
      return { data: data !== null, error: null };
    } catch {
      return { data: null, error: 'Error al verificar el username' };
    }
  },

  /**
   * Actualiza campos del perfil en la tabla `profiles`.
   * Usado tanto en CompleteProfileScreen (solo username) como en ProfileScreen (nombre, username, avatar).
   *
   * Antes de cambiar el username verifica que no esté en uso por otro usuario.
   * Si el username ya existe, Supabase también retorna error de UNIQUE constraint
   * que se mapea a un mensaje amigable via `mapAuthError`.
   *
   * @param userId - UUID del usuario autenticado (proveniente de la sesión)
   * @param data - Campos a actualizar: fullName, username y/o avatarUrl
   */
  async updateProfile(
    userId: string,
    data: Partial<CompleteProfileFormData> | UpdateProfileData,
  ): Promise<ServiceResult<AuthUser>> {
    try {
      const updates: Record<string, string> = {};

      if ('fullName' in data && data.fullName !== undefined) {
        updates.full_name = data.fullName;
      }

      if (data.username !== undefined) {
        const { data: isTaken, error: checkError } = await this.isUsernameTaken(
          data.username,
          userId,
        );
        if (checkError) return { data: null, error: checkError };
        if (isTaken) {
          return { data: null, error: 'Ese nombre de usuario ya está en uso' };
        }
        updates.username = data.username;
      }

      if ('avatarUrl' in data && data.avatarUrl !== undefined) {
        updates.avatar_url = data.avatarUrl;
      }

      if (Object.keys(updates).length === 0) {
        return this.getProfile(userId);
      }

      const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
      if (error) return { data: null, error: mapAuthError(error.message) };

      return this.getProfile(userId);
    } catch {
      return { data: null, error: 'Error al actualizar el perfil' };
    }
  },

  /**
   * Sube o reemplaza la foto de perfil en Supabase Storage.
   * Usa upsert para sobrescribir el archivo previo en la misma ruta fija.
   *
   * @param userId - UUID del usuario — define la carpeta en el bucket
   * @param imageUri - URI local de la imagen (cámara o galería via expo-image-picker)
   * @returns URL pública del avatar con cache-bust para refrescar la UI
   */
  async uploadAvatar(userId: string, imageUri: string): Promise<ServiceResult<string>> {
    try {
      const response = await fetch(imageUri);
      const arrayBuffer = await response.arrayBuffer();
      const path = getAvatarPath(userId);

      const { error: uploadError } = await supabase.storage
        .from(AVATARS_BUCKET)
        .upload(path, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        return { data: null, error: 'Error al subir la foto de perfil' };
      }

      const { data: publicUrlData } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path);

      // Cache-bust para que React Native recargue la imagen tras reemplazar el archivo
      const publicUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

      return { data: publicUrl, error: null };
    } catch {
      return { data: null, error: 'Error al subir la foto de perfil' };
    }
  },

  /**
   * Calcula estadísticas de participación del usuario en juntadas.
   * - organizedCount: juntadas creadas por el usuario
   * - participantCount: juntadas activas donde participa como invitado (no organizador)
   *
   * @param userId - UUID del usuario autenticado
   */
  async getUserStats(userId: string): Promise<ServiceResult<UserStats>> {
    try {
      const { count: organizedCount, error: organizedError } = await supabase
        .from('meetups')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', userId);

      if (organizedError) {
        return { data: null, error: 'Error al cargar las estadísticas' };
      }

      const { count: participantCount, error: participantError } = await supabase
        .from('meetup_participants')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('role', 'participant')
        .is('left_at', null);

      if (participantError) {
        return { data: null, error: 'Error al cargar las estadísticas' };
      }

      return {
        data: {
          organizedCount: organizedCount ?? 0,
          participantCount: participantCount ?? 0,
        },
        error: null,
      };
    } catch {
      return { data: null, error: 'Error al cargar las estadísticas' };
    }
  },
};

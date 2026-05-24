/**
 * Hook de autenticación — interfaz entre las pantallas y el authService.
 *
 * Centraliza el estado de carga y error para que las pantallas no necesiten
 * manejar lógica asíncrona directamente. Todas las acciones también retornan
 * `{ error }` de forma inmediata para flujos que necesitan saber el resultado
 * antes del siguiente ciclo de render (ej: ForgotPasswordScreen cambia el UI
 * sin esperar re-render del estado del hook).
 *
 * La redirección tras login/register la maneja AppNavigator via onAuthStateChange —
 * este hook no navega directamente para respetar la separación de responsabilidades.
 */
import { useState, useCallback } from 'react';
import { authService } from '../services/authService';
import {
  AuthUser,
  LoginFormData,
  RegisterFormData,
  CompleteProfileFormData,
  ProfileEditFormData,
  UserStats,
} from '../types';

/** Resultado inmediato de cada acción para evitar dependencias del ciclo de render */
interface ActionResult {
  error: string | null;
}

/** Estado inicial de estadísticas — evita null checks en la UI */
const EMPTY_STATS: UserStats = {
  organizedCount: 0,
  participantCount: 0,
};

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  /** Error del último intento; se limpia al inicio de cada nueva acción */
  const [error, setError] = useState<string | null>(null);

  /** Perfil del usuario autenticado — se carga bajo demanda desde ProfileScreen */
  const [profile, setProfile] = useState<AuthUser | null>(null);
  /** Estadísticas de juntadas del usuario actual */
  const [stats, setStats] = useState<UserStats>(EMPTY_STATS);
  /** Indica carga inicial o refresh del perfil y estadísticas */
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  /**
   * Inicia sesión con las credenciales del formulario.
   * La navegación post-login es automática vía AppNavigator.
   */
  const login = useCallback(async (data: LoginFormData): Promise<ActionResult> => {
    setIsLoading(true);
    setError(null);
    const { error: err } = await authService.signIn(data);
    if (err) setError(err);
    setIsLoading(false);
    return { error: err };
  }, []);

  /**
   * Registra una cuenta nueva. Si el email ya existe, Supabase retorna error
   * que se propaga al estado `error` para mostrarlo en la pantalla.
   */
  const register = useCallback(async (data: RegisterFormData): Promise<ActionResult> => {
    setIsLoading(true);
    setError(null);
    const { error: err } = await authService.signUp(data);
    if (err) setError(err);
    setIsLoading(false);
    return { error: err };
  }, []);

  /** Cierra la sesión activa; AppNavigator redirige al flujo de auth automáticamente */
  const logout = useCallback(async (): Promise<ActionResult> => {
    setIsLoading(true);
    setError(null);
    const { error: err } = await authService.signOut();
    if (err) setError(err);
    setProfile(null);
    setStats(EMPTY_STATS);
    setIsLoading(false);
    return { error: err };
  }, []);

  /**
   * Envía el email de recuperación de contraseña.
   * Retorna el resultado inmediatamente para que ForgotPasswordScreen
   * pueda cambiar su vista sin esperar el próximo render del estado.
   */
  const resetPassword = useCallback(async (email: string): Promise<ActionResult> => {
    setIsLoading(true);
    setError(null);
    const { error: err } = await authService.resetPassword(email);
    if (err) setError(err);
    setIsLoading(false);
    return { error: err };
  }, []);

  /**
   * Guarda el username elegido en la tabla `profiles`.
   * Primero obtiene el userId de la sesión activa para no requerir que la
   * pantalla lo maneje manualmente — hace al hook autocontenido.
   */
  const completeProfile = useCallback(async (data: CompleteProfileFormData): Promise<ActionResult> => {
    setIsLoading(true);
    setError(null);
    const { data: user, error: userError } = await authService.getCurrentUser();
    if (userError || !user) {
      const msg = userError ?? 'No hay usuario autenticado';
      setError(msg);
      setIsLoading(false);
      return { error: msg };
    }
    const { error: err } = await authService.updateProfile(user.id, data);
    if (err) setError(err);
    setIsLoading(false);
    return { error: err };
  }, []);

  /**
   * Carga el perfil y las estadísticas del usuario autenticado.
   * Se invoca al entrar a ProfileScreen o tras guardar cambios.
   */
  const loadProfile = useCallback(async (): Promise<ActionResult> => {
    setIsLoadingProfile(true);
    setError(null);

    const { data: user, error: userError } = await authService.getCurrentUser();
    if (userError || !user) {
      const msg = userError ?? 'No hay usuario autenticado';
      setError(msg);
      setIsLoadingProfile(false);
      return { error: msg };
    }

    const [profileResult, statsResult] = await Promise.all([
      authService.getProfile(user.id),
      authService.getUserStats(user.id),
    ]);

    if (profileResult.error) {
      setError(profileResult.error);
      setIsLoadingProfile(false);
      return { error: profileResult.error };
    }

    if (statsResult.error) {
      setError(statsResult.error);
      setIsLoadingProfile(false);
      return { error: statsResult.error };
    }

    setProfile(profileResult.data);
    setStats(statsResult.data ?? EMPTY_STATS);
    setIsLoadingProfile(false);
    return { error: null };
  }, []);

  /**
   * Actualiza nombre y/o username desde ProfileScreen.
   * Refresca el estado local con el perfil devuelto por el servicio.
   */
  const updateProfile = useCallback(async (data: ProfileEditFormData): Promise<ActionResult> => {
    setIsLoading(true);
    setError(null);

    const { data: user, error: userError } = await authService.getCurrentUser();
    if (userError || !user) {
      const msg = userError ?? 'No hay usuario autenticado';
      setError(msg);
      setIsLoading(false);
      return { error: msg };
    }

    const { data: updatedProfile, error: err } = await authService.updateProfile(user.id, {
      fullName: data.fullName,
      username: data.username,
    });

    if (err) {
      setError(err);
      setIsLoading(false);
      return { error: err };
    }

    setProfile(updatedProfile);
    setIsLoading(false);
    return { error: null };
  }, []);

  /**
   * Sube una nueva foto de perfil y persiste la URL en la tabla `profiles`.
   * Actualiza `profile.avatarUrl` en el estado local al finalizar.
   */
  const uploadAvatar = useCallback(async (imageUri: string): Promise<ActionResult> => {
    setIsLoading(true);
    setError(null);

    const { data: user, error: userError } = await authService.getCurrentUser();
    if (userError || !user) {
      const msg = userError ?? 'No hay usuario autenticado';
      setError(msg);
      setIsLoading(false);
      return { error: msg };
    }

    const { data: avatarUrl, error: uploadError } = await authService.uploadAvatar(
      user.id,
      imageUri,
    );

    if (uploadError || !avatarUrl) {
      setError(uploadError ?? 'Error al subir la foto');
      setIsLoading(false);
      return { error: uploadError ?? 'Error al subir la foto' };
    }

    const { data: updatedProfile, error: updateError } = await authService.updateProfile(user.id, {
      avatarUrl,
    });

    if (updateError) {
      setError(updateError);
      setIsLoading(false);
      return { error: updateError };
    }

    setProfile(updatedProfile);
    setIsLoading(false);
    return { error: null };
  }, []);

  return {
    login,
    register,
    logout,
    resetPassword,
    completeProfile,
    loadProfile,
    updateProfile,
    uploadAvatar,
    profile,
    stats,
    isLoading,
    isLoadingProfile,
    error,
  };
};

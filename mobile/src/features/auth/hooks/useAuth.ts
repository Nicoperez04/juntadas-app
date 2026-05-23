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
import { LoginFormData, RegisterFormData, CompleteProfileFormData } from '../types';

/** Resultado inmediato de cada acción para evitar dependencias del ciclo de render */
interface ActionResult {
  error: string | null;
}

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  /** Error del último intento; se limpia al inicio de cada nueva acción */
  const [error, setError] = useState<string | null>(null);

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

  return { login, register, logout, resetPassword, completeProfile, isLoading, error };
};

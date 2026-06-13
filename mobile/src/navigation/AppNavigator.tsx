/**
 * Navegador raíz de la app.
 *
 * Decide qué flujo mostrar según el estado de autenticación:
 * - Sin sesión: AuthNavigator (welcome, login, register).
 * - Con sesión y username autogenerado ('user_...'): MainNavigator
 *   arrancando en CompleteProfile para forzar el onboarding.
 * - Con sesión y perfil completo: MainNavigator arrancando en MeetupHome.
 * - Con sesión de recuperación (PASSWORD_RECOVERY): AuthNavigator en ResetPassword.
 *
 * La sesión se escucha via onAuthStateChange para reaccionar a login/logout
 * y al flujo de restablecimiento de contraseña por deep link.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { authService } from '@/features/auth/services/authService';
import { Routes } from './routes';
import type { AuthStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

/** Prefijo de los usernames autogenerados por el trigger de la base de datos */
const AUTO_USERNAME_PREFIX = 'user_';

/** Scheme y host del deep link de recuperación configurados en app.json y Supabase */
const RECOVERY_DEEP_LINK_PREFIX = 'rondaapp://reset-password';

/** Ref global para navegar imperativamente tras procesar el deep link de recovery */
const navigationRef = createNavigationContainerRef<AuthStackParamList>();

export const AppNavigator = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  /** Indica que el usuario llegó por el email de recuperación y debe elegir contraseña nueva */
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const isPasswordRecoveryRef = useRef(false);
  /** Ruta pendiente cuando el deep link llega antes de que el navigator esté listo */
  const pendingNavigationRef = useRef<keyof AuthStackParamList | null>(null);

  /**
   * Ejecuta la navegación pendiente si el navigator ya está listo.
   * Se invoca desde onReady y cuando isPasswordRecovery cambia tras el re-render.
   */
  const flushPendingNavigation = useCallback(() => {
    if (!pendingNavigationRef.current || !navigationRef.isReady()) return;

    navigationRef.navigate(pendingNavigationRef.current);
    pendingNavigationRef.current = null;
  }, []);

  /**
   * Activa el flujo de recovery y encola la navegación imperativa a ResetPassword.
   * La navegación se difiere a onReady / useEffect para que AuthNavigator ya esté montado
   * (evita el bug de cold start donde initialRouteName=Welcome ya no cambia).
   */
  const activatePasswordRecovery = useCallback(() => {
    isPasswordRecoveryRef.current = true;
    pendingNavigationRef.current = Routes.ResetPassword;
    setIsPasswordRecovery(true);
  }, []);

  /**
   * Procesa URLs de deep link que contienen tokens de sesión de Supabase.
   * detectSessionInUrl está desactivado en el cliente, por eso se hace manualmente.
   */
  const handleRecoveryDeepLink = async (url: string | null) => {
    // TODO: remover — log temporal para diagnosticar deep links en adb logcat
    console.log('[Recovery] URL recibida:', url);

    if (!url?.includes(RECOVERY_DEEP_LINK_PREFIX)) return;

    const result = await authService.setSessionFromRecoveryUrl(url);
    if (result.error) {
      // TODO: remover
      console.log('[Recovery] Error al setear sesión:', result.error);
      return;
    }

    activatePasswordRecovery();
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          activatePasswordRecovery();
        }

        if (event === 'USER_UPDATED' && isPasswordRecoveryRef.current) {
          isPasswordRecoveryRef.current = false;
          setIsPasswordRecovery(false);
        }

        setSession(session);
      },
    );

    return () => subscription.unsubscribe();
  }, [activatePasswordRecovery]);

  /** Listener de deep links — usa Linking nativo porque expo-linking no está instalado */
  useEffect(() => {
    void Linking.getInitialURL().then((url) => {
      void handleRecoveryDeepLink(url);
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleRecoveryDeepLink(url);
    });

    return () => subscription.remove();
  }, []);

  /**
   * Tras activar recovery, AuthNavigator se monta en el siguiente render.
   * Este efecto asegura la navegación imperativa aunque initialRouteName ya no aplique.
   */
  useEffect(() => {
    if (!isPasswordRecovery) return;
    flushPendingNavigation();
  }, [isPasswordRecovery, loading, flushPendingNavigation]);

  const userId = session?.user?.id ?? null;

  /**
   * Perfil del usuario autenticado — necesario para el guard de onboarding.
   * Solo se consulta cuando hay sesión activa y no estamos en flujo de recovery.
   */
  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    enabled: !!userId && !isPasswordRecovery,
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await authService.getProfile(userId);
      return data;
    },
  });

  // Esperar sesión y perfil antes de decidir el flujo, para evitar
  // un flash de MeetupHome en usuarios que deben completar su perfil.
  const waitingProfile = session && !isPasswordRecovery && profileQuery.isLoading;
  if (loading || waitingProfile) return null;

  /**
   * Guard de onboarding: los usuarios nuevos quedan con un username
   * autogenerado ('user_XXXX') hasta que eligen el propio. Si el perfil
   * no pudo cargarse se asume completo para no bloquear el acceso.
   */
  const needsOnboarding =
    profileQuery.data?.username?.startsWith(AUTO_USERNAME_PREFIX) ?? false;

  const showMainNavigator = session && !isPasswordRecovery;

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        flushPendingNavigation();
      }}
    >
      {showMainNavigator ? (
        <MainNavigator
          initialRouteName={
            needsOnboarding ? Routes.CompleteProfile : Routes.MeetupHome
          }
        />
      ) : (
        <AuthNavigator
          initialRouteName={
            isPasswordRecovery ? Routes.ResetPassword : Routes.Welcome
          }
        />
      )}
    </NavigationContainer>
  );
};

/**
 * Navegador raíz de la app.
 *
 * Decide qué flujo mostrar según el estado de autenticación:
 * - Sin sesión: AuthNavigator (welcome, login, register).
 * - Con sesión y username autogenerado ('user_...'): MainNavigator
 *   arrancando en CompleteProfile para forzar el onboarding.
 * - Con sesión y perfil completo: MainNavigator arrancando en MeetupHome.
 *
 * La sesión se escucha via onAuthStateChange para reaccionar a login/logout.
 */
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { authService } from '@/features/auth/services/authService';
import { Routes } from './routes';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

/** Prefijo de los usernames autogenerados por el trigger de la base de datos */
const AUTO_USERNAME_PREFIX = 'user_';

export const AppNavigator = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id ?? null;

  /**
   * Perfil del usuario autenticado — necesario para el guard de onboarding.
   * Solo se consulta cuando hay sesión activa.
   */
  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    enabled: !!userId,
    queryFn: async () => {
      // El guard de enabled garantiza userId, pero TypeScript no lo sabe
      if (!userId) return null;
      const { data } = await authService.getProfile(userId);
      return data;
    },
  });

  // Esperar sesión y perfil antes de decidir el flujo, para evitar
  // un flash de MeetupHome en usuarios que deben completar su perfil.
  if (loading || (session && profileQuery.isLoading)) return null;

  /**
   * Guard de onboarding: los usuarios nuevos quedan con un username
   * autogenerado ('user_XXXX') hasta que eligen el propio. Si el perfil
   * no pudo cargarse se asume completo para no bloquear el acceso.
   */
  const needsOnboarding =
    profileQuery.data?.username?.startsWith(AUTO_USERNAME_PREFIX) ?? false;

  return (
    <NavigationContainer>
      {session ? (
        <MainNavigator
          initialRouteName={
            needsOnboarding ? Routes.CompleteProfile : Routes.MeetupHome
          }
        />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};

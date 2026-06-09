/**
 * Hook compartido para obtener el usuario autenticado actual.
 *
 * Reemplaza el anti-patrón de llamar a supabase.auth.getSession() con
 * useState + useEffect en cada pantalla. La sesión se resuelve una sola
 * vez y se comparte entre todos los consumidores a través de la caché
 * de TanStack Query, evitando llamadas repetidas al storage local.
 *
 * Retorna:
 * - userId: UUID del usuario autenticado, o null si no hay sesión
 * - user: objeto User completo de Supabase, o null
 * - session: sesión activa de Supabase, o null
 * - isLoading: true mientras la sesión inicial se está resolviendo
 */
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

/** Query key de la sesión activa — compartida por todos los consumidores del hook */
export const SESSION_QUERY_KEY = ['auth', 'session'] as const;

/** Contrato público del hook */
interface UseCurrentUserResult {
  userId: string | null;
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

export const useCurrentUser = (): UseCurrentUserResult => {
  const queryClient = useQueryClient();

  const { data: session, isPending } = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async (): Promise<Session | null> => {
      const { data, error } = await supabase.auth.getSession();
      // Ante un error de lectura se trata como "sin sesión" para que la UI
      // no quede bloqueada en estado de carga; AppNavigator decide el flujo.
      if (error) return null;
      return data.session;
    },
    // La sesión solo cambia por eventos de auth, que actualizan la caché
    // manualmente via onAuthStateChange — no hace falta refetch por tiempo.
    staleTime: Infinity,
  });

  // Mantener la caché sincronizada ante login, logout o refresh de token,
  // para que todos los consumidores vean la sesión vigente sin refetch.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      queryClient.setQueryData(SESSION_QUERY_KEY, newSession);
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  return {
    userId: session?.user?.id ?? null,
    user: session?.user ?? null,
    session: session ?? null,
    isLoading: isPending,
  };
};

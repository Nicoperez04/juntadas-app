import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

// Este archivo es el encargado de manejar la navegación de la app, se encarga de mostrar el AuthNavigator o el MainNavigator dependiendo de si el usuario está autenticado o no.
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

  if (loading) return null;

  return (
    <NavigationContainer>
      {session ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
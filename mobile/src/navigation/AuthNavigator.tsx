/**
 * Navegador del flujo de autenticación.
 *
 * Gestiona el stack de pantallas que un usuario no autenticado puede visitar.
 * El header nativo está oculto en todas las pantallas porque cada una implementa
 * su propia cabecera con el botón de volver personalizado (excepto Welcome).
 *
 * AppNavigator es quien decide cuándo mostrar este navegador vs MainNavigator,
 * escuchando los cambios de sesión de Supabase. También se usa temporalmente
 * durante PASSWORD_RECOVERY aunque exista sesión activa.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Routes } from './routes';
import type { AuthStackParamList } from './types';
import { WelcomeScreen } from '@/features/auth/screens/WelcomeScreen';
import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { RegisterScreen } from '@/features/auth/screens/RegisterScreen';
import { ForgotPasswordScreen } from '@/features/auth/screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from '@/features/auth/screens/ResetPasswordScreen';

// El genérico habilita el chequeo de nombres de ruta y parámetros en compilación
const Stack = createNativeStackNavigator<AuthStackParamList>();

/** Props del navegador de autenticación */
interface AuthNavigatorProps {
  /**
   * Ruta inicial del stack. AppNavigator la setea en ResetPassword
   * cuando el usuario abre el deep link de recuperación de contraseña.
   */
  initialRouteName?: keyof AuthStackParamList;
}

export const AuthNavigator = ({
  initialRouteName = Routes.Welcome,
}: AuthNavigatorProps) => {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name={Routes.Welcome} component={WelcomeScreen} />
      <Stack.Screen name={Routes.Login} component={LoginScreen} />
      <Stack.Screen name={Routes.Register} component={RegisterScreen} />
      <Stack.Screen name={Routes.ForgotPassword} component={ForgotPasswordScreen} />
      <Stack.Screen name={Routes.ResetPassword} component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
};

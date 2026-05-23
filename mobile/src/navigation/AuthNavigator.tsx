/**
 * Navegador del flujo de autenticación.
 *
 * Gestiona el stack de pantallas que un usuario no autenticado puede visitar.
 * El header nativo está oculto en todas las pantallas porque cada una implementa
 * su propia cabecera con el botón de volver personalizado (excepto Welcome).
 *
 * AppNavigator es quien decide cuándo mostrar este navegador vs MainNavigator,
 * escuchando los cambios de sesión de Supabase.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Routes } from './routes';
import { WelcomeScreen } from '@/features/auth/screens/WelcomeScreen';
import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { RegisterScreen } from '@/features/auth/screens/RegisterScreen';
import { ForgotPasswordScreen } from '@/features/auth/screens/ForgotPasswordScreen';

const Stack = createNativeStackNavigator();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName={Routes.Welcome}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name={Routes.Welcome} component={WelcomeScreen} />
      <Stack.Screen name={Routes.Login} component={LoginScreen} />
      <Stack.Screen name={Routes.Register} component={RegisterScreen} />
      <Stack.Screen name={Routes.ForgotPassword} component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
};

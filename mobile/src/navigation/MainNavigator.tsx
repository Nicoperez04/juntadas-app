/**
 * Navegador principal de la app (usuario autenticado).
 *
 * Gestiona el stack de todas las pantallas disponibles post-login.
 * MeetupHomeScreen es la ruta inicial. Las pantallas de otros bloques
 * (impostor, memorias, historial, perfil) mantienen placeholders hasta
 * que se implementen en sus bloques correspondientes.
 *
 * El header nativo está oculto en todas las pantallas porque cada una
 * implementa su propio header con diseño consistente al sistema de diseño.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Routes } from './routes';

// Pantallas implementadas — bloque 1
import { CompleteProfileScreen } from '@/features/auth/screens/CompleteProfileScreen';

// Pantallas implementadas — bloque 2 (juntadas)
import { MeetupHomeScreen } from '@/features/meetups/screens/MeetupHomeScreen';
import { CreateMeetupScreen } from '@/features/meetups/screens/CreateMeetupScreen';
import { JoinMeetupScreen } from '@/features/meetups/screens/JoinMeetupScreen';
import { MeetupDetailScreen } from '@/features/meetups/screens/MeetupDetailScreen';

// Placeholders para bloques futuros — se reemplazarán cuando se implementen
const EditMeetupScreen = () => null;
const ParticipantListScreen = () => null;
const ImpostorStartScreen = () => null;
const ImpostorRoleScreen = () => null;
const MemoriesGalleryScreen = () => null;
const MeetupHistoryScreen = () => null;
const ProfileScreen = () => null;

const Stack = createNativeStackNavigator();

export const MainNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName={Routes.MeetupHome}
      screenOptions={{ headerShown: false }}
    >
      {/* Bloque 2 — juntadas (implementadas) */}
      <Stack.Screen name={Routes.MeetupHome} component={MeetupHomeScreen} />
      <Stack.Screen name={Routes.CreateMeetup} component={CreateMeetupScreen} />
      <Stack.Screen name={Routes.JoinMeetup} component={JoinMeetupScreen} />
      <Stack.Screen name={Routes.MeetupDetail} component={MeetupDetailScreen} />

      {/* Bloque futuro — edición y participantes */}
      <Stack.Screen name={Routes.EditMeetup} component={EditMeetupScreen} />
      <Stack.Screen name={Routes.ParticipantList} component={ParticipantListScreen} />

      {/* Bloque futuro — impostor */}
      <Stack.Screen name={Routes.ImpostorStart} component={ImpostorStartScreen} />
      <Stack.Screen name={Routes.ImpostorRole} component={ImpostorRoleScreen} />

      {/* Bloque futuro — memorias */}
      <Stack.Screen name={Routes.MemoriesGallery} component={MemoriesGalleryScreen} />

      {/* Bloque futuro — historial y perfil */}
      <Stack.Screen name={Routes.MeetupHistory} component={MeetupHistoryScreen} />
      <Stack.Screen name={Routes.Profile} component={ProfileScreen} />

      {/* Bloque 1 — completar perfil post-registro */}
      <Stack.Screen name={Routes.CompleteProfile} component={CompleteProfileScreen} />
    </Stack.Navigator>
  );
};

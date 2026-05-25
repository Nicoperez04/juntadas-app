/**
 * Navegador principal de la app (usuario autenticado).
 *
 * Gestiona el stack de todas las pantallas disponibles post-login.
 * MeetupHomeScreen es la ruta inicial. Las pantallas de impostor y perfil
 * mantienen placeholders hasta que se implementen en sus bloques.
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
import { EditMeetupScreen } from '@/features/meetups/screens/EditMeetupScreen';
import { MeetupHistoryScreen } from '@/features/meetups/screens/MeetupHistoryScreen';
import { ParticipantListScreen } from '@/features/participants/screens/ParticipantListScreen';

// Pantallas implementadas — bloque 4 (impostor)
import { GamesScreen } from '@/features/impostor/screens/GamesScreen';
import { ImpostorStartScreen } from '@/features/impostor/screens/ImpostorStartScreen';
import { ImpostorRoleScreen } from '@/features/impostor/screens/ImpostorRoleScreen';

// Pantallas implementadas — bloque 5 (recuerdos)
import { MemoriesGalleryScreen } from '@/features/memories/screens/MemoriesGalleryScreen';
import { MemoryViewerScreen } from '@/features/memories/screens/MemoryViewerScreen';

// Pantallas implementadas — bloque 6 (perfil)
import { ProfileScreen } from '@/features/auth/screens/ProfileScreen';

const Stack = createNativeStackNavigator();

export const MainNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName={Routes.MeetupHome}
      screenOptions={{
        headerShown: false,
        // Sin animación de transición: el footer embebido en cada pantalla
        // no debe moverse al cambiar de tab; solo cambia el ícono activo.
        animation: 'none',
      }}
    >
      {/* Bloque 2 — juntadas (implementadas) */}
      <Stack.Screen name={Routes.MeetupHome} component={MeetupHomeScreen} />
      <Stack.Screen name={Routes.CreateMeetup} component={CreateMeetupScreen} />
      <Stack.Screen name={Routes.JoinMeetup} component={JoinMeetupScreen} />
      <Stack.Screen name={Routes.MeetupDetail} component={MeetupDetailScreen} />

      {/* Bloque 3 — edición, participantes e historial */}
      <Stack.Screen name={Routes.EditMeetup} component={EditMeetupScreen} />
      <Stack.Screen name={Routes.ParticipantList} component={ParticipantListScreen} />
      <Stack.Screen name={Routes.MeetupHistory} component={MeetupHistoryScreen} />

      {/* Bloque 4 — impostor */}
      <Stack.Screen name={Routes.Games} component={GamesScreen} />
      <Stack.Screen name={Routes.ImpostorStart} component={ImpostorStartScreen} />
      <Stack.Screen name={Routes.ImpostorRole} component={ImpostorRoleScreen} />

      {/* Bloque 5 — recuerdos (galería de fotos) */}
      <Stack.Screen name={Routes.MemoriesGallery} component={MemoriesGalleryScreen} />
      <Stack.Screen
        name={Routes.MemoryViewer}
        component={MemoryViewerScreen}
        options={{ presentation: 'modal' }}
      />

      {/* Bloque 6 — perfil de usuario */}
      <Stack.Screen name={Routes.Profile} component={ProfileScreen} />

      {/* Bloque 1 — completar perfil post-registro */}
      <Stack.Screen name={Routes.CompleteProfile} component={CompleteProfileScreen} />
    </Stack.Navigator>
  );
};

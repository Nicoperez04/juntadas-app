import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Routes } from './routes';
import { CompleteProfileScreen } from '@/features/auth/screens/CompleteProfileScreen';

// Pantallas placeholder — se reemplazan cuando se implementa cada feature
const MeetupHomeScreen = () => null;
const CreateMeetupScreen = () => null;
const JoinMeetupScreen = () => null;
const MeetupDetailScreen = () => null;
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
      <Stack.Screen name={Routes.MeetupHome} component={MeetupHomeScreen} />
      <Stack.Screen name={Routes.CreateMeetup} component={CreateMeetupScreen} />
      <Stack.Screen name={Routes.JoinMeetup} component={JoinMeetupScreen} />
      <Stack.Screen name={Routes.MeetupDetail} component={MeetupDetailScreen} />
      <Stack.Screen name={Routes.EditMeetup} component={EditMeetupScreen} />
      <Stack.Screen name={Routes.ParticipantList} component={ParticipantListScreen} />
      <Stack.Screen name={Routes.ImpostorStart} component={ImpostorStartScreen} />
      <Stack.Screen name={Routes.ImpostorRole} component={ImpostorRoleScreen} />
      <Stack.Screen name={Routes.MemoriesGallery} component={MemoriesGalleryScreen} />
      <Stack.Screen name={Routes.MeetupHistory} component={MeetupHistoryScreen} />
      <Stack.Screen name={Routes.CompleteProfile} component={CompleteProfileScreen} />
      <Stack.Screen name={Routes.Profile} component={ProfileScreen} />
    </Stack.Navigator>
  );
};
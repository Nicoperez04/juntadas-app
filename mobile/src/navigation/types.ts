/**
 * Tipado centralizado de la navegación de la app.
 *
 * Antes MainStackParamList vivía en el feature meetups, lo que acoplaba
 * memories, impostor, auth y shared a ese módulo. Al vivir acá, cada
 * feature depende solo de la capa de navegación, que es transversal.
 *
 * Los nombres de las rutas deben mantenerse consistentes con las
 * constantes de `./routes` — son la fuente de verdad de los strings.
 */
import type { Memory } from '@/features/memories/types';

/**
 * Parámetros de cada ruta del flujo de autenticación.
 * Ninguna pantalla del flujo recibe parámetros actualmente.
 */
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

/**
 * Parámetros de cada ruta del navegador principal (usuario autenticado).
 * Permite que useNavigation y useRoute estén completamente tipados
 * en todas las pantallas de la app.
 */
export type MainStackParamList = {
  MeetupHome: undefined;
  CreateMeetup: undefined;
  JoinMeetup: undefined;
  MeetupDetail: { meetupId: string };
  EditMeetup: { meetupId: string };
  ParticipantList: { meetupId: string };
  Games: undefined;
  Timer: undefined;
  TeamRandomizer: undefined;
  ImpostorStart: { meetupId?: string };
  ImpostorRole: { meetupId?: string };
  MemoriesGallery: { meetupId: string; isActive: boolean };
  MemoryViewer: { memories: Memory[]; initialIndex: number; meetupId: string };
  MeetupHistory: undefined;
  ReviewForm: { meetupId: string; meetupTitle: string };
  CompleteProfile: undefined;
  Profile: undefined;
};

# Conversación Bloque 0 — Refactor base y setup E2

**Herramienta:** Cursor Agent  
**Rama:** feature/bloque-0-refactor-base

## Resumen

### Lo que se implementó
- QueryClientProvider en App.tsx con configuración base (staleTime 30s, retry 1)
- useMeetups.ts migrado a useQuery/useMutation con TanStack Query v5
- useParticipants.ts migrado a useQuery con TanStack Query v5
- Hook useCurrentUser.ts en shared/hooks/ con key ['auth', 'session'] y suscripción a onAuthStateChange
- Reemplazo de supabase.auth directo en 5 pantallas por useCurrentUser
- Tipado centralizado en src/navigation/types.ts (AuthStackParamList + MainStackParamList)
- MainStackParamList eliminado de meetups/types.ts, 13 consumidores actualizados
- useMeetupDetail.ts extraído como hook propio del detalle
- MeetupDetailScreen reducido de 1648 a 980 líneas mediante subcomponentes:
  MeetupDetailHeader, MeetupParticipantsSummary, MeetupOrganizerActions
- Guard de onboarding en AppNavigator para usuarios con username user_XXXX
- appConfig.ts limpiado (solo constantes de negocio, tokens de diseño eliminados)
- Comentario obsoleto de placeholders eliminado en MainNavigator
- Estructura ia/entrega-2/ creada con prompts, conversaciones, indice_ia.md y skills_instaladas.md

### Decisiones tomadas
- useCurrentUser adelantado a Tarea 1 porque useMeetups lo necesitaba
- isLoading incluye isFetching para mantener comportamiento visual idéntico al anterior
- getMeetupById y funciones imperativas quedaron como passthrough al servicio
- Guard fail-open: si el perfil no carga, se asume completo para no bloquear acceso
- leaveMeetup no invalida participantes (pantalla navega fuera inmediatamente)
- AuthStackParamList existe pero pantallas auth aún no tipadas (deuda menor)

### Problemas encontrados y resueltos
- MainStackParamList acoplado a feature meetups — resuelto con navigation/types.ts
- supabase.auth repetido en 5 pantallas — resuelto con useCurrentUser
- MeetupDetailScreen monolítica — resuelto con subcomponentes y hook propio
- CompleteProfileScreen sin flujo guiado — resuelto con guard en AppNavigator

### Deuda técnica documentada
- Pantallas auth sin tipar con AuthStackParamList
- MemoriesGalleryScreen y ParticipantListScreen con getMeetupById manual
- leaveMeetup sin invalidación de participantes
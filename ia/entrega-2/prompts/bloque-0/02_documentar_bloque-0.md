# Documentación — Cierre del Bloque 0: Refactor base y setup E2

## Tarea
Organizá la evidencia del Bloque 0 dentro de `ia/entrega-2/`.

## 1. Creá `ia/entrega-2/conversaciones/bloque-0/cursor-bloque-0-completo.md`

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

## Conversación completa
[Pegar acá la conversación exportada de Cursor]

## 2. Verificá estructura de prompts

ia/entrega-2/prompts/bloque-0/
├── 01_refactor_base.md ✓
└── 02_documentar_bloque-0.md   ← este prompt

## 3. Actualizá `ia/entrega-2/indice_ia.md`

Agregá las siguientes entradas:

01 - Integración TanStack Query v5 (QueryClientProvider, useMeetups, useParticipants)
02 - Hook useCurrentUser y eliminación de supabase.auth directo en pantallas
03 - Centralización de tipado de navegación en navigation/types.ts
04 - Refactor MeetupDetailScreen: subcomponentes y useMeetupDetail
05 - Guard de onboarding para usuarios con username autogenerado
06 - Setup estructura ia/entrega-2/

## Restricciones
- No tocar ningún archivo de código
- No hacer commits
- Solo crear o modificar archivos dentro de ia/entrega-2/

## Al finalizar reportá
1. Archivos creados o modificados
2. Cualquier inconsistencia encontrada

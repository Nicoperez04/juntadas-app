# Bloque 0 — Refactor base y setup E2

## Contexto general
Estamos iniciando la Entrega 2 (E2) del proyecto Juntadas.
Toda la implementación de E1 está completa en la rama `entrega-1`.
La rama actual de trabajo es `feature/bloque-0-refactor-base`, que sale de `entrega-2`.

Este bloque NO agrega funcionalidades nuevas.
Su objetivo es sanear la base del código antes de escalar con E2,
resolver deuda técnica crítica identificada en el análisis pre-E2,
y dejar la arquitectura lista para los bloques que siguen.

## Stack del proyecto
- React Native + Expo SDK 55 + TypeScript
- Supabase (Auth + PostgreSQL + Storage)
- React Navigation (stack navigator, sin Expo Router)
- TanStack Query v5 (instalado, sin integrar)
- Zustand v5 (usado solo en impostor)
- React Hook Form + Zod
- Navegación en src/navigation/ (NO en src/app/navigation/)
- Design tokens en src/shared/constants/theme.ts (fuente única de verdad)
- Todos los comentarios en español
- Sin TypeScript any

## Tu tarea
Realizá las siguientes tareas en orden. Completá cada una antes de pasar a la siguiente.
Reportá al finalizar cada tarea qué archivos modificaste.

---

### Tarea 1 — Integrar TanStack Query (piloto en 2 hooks)

Contexto:
- @tanstack/react-query v5 ya está instalado en package.json
- No hay QueryClientProvider en App.tsx
- Ningún hook usa useQuery ni useMutation actualmente
- Todos los hooks usan useState + useEffect manual

Alcance:
1. Agregar QueryClientProvider en App.tsx wrapeando toda la app
2. Crear QueryClient con configuración base razonable (staleTime, retry)
3. Migrar useMeetups.ts a useQuery / useMutation con TanStack Query v5
4. Migrar useParticipants.ts a useQuery con TanStack Query v5
5. Los demás hooks (useAuth, useMemories, useImpostor) NO se tocan en este bloque
6. Las query keys deben ser arrays descriptivos: ['meetups', userId], ['participants', meetupId], etc.
7. Mantener la misma interfaz pública de los hooks para que las pantallas no necesiten cambios

No hacer:
- No migrar useAuth ni useMemories ni useImpostor
- No cambiar ninguna pantalla salvo que sea estrictamente necesario por la migración
- No instalar dependencias adicionales

Archivos esperados:
- App.tsx (modificado)
- src/features/meetups/hooks/useMeetups.ts (migrado)
- src/features/participants/hooks/useParticipants.ts (migrado)

---

### Tarea 2 — Hook useCurrentUser

Contexto:
- supabase.auth.getSession() / getUser() aparece directamente en 5 pantallas:
  MeetupDetailScreen, ParticipantListScreen, MemoriesGalleryScreen,
  MemoryViewerScreen, ImpostorStartScreen
- Es un anti-patrón repetido que complica cada feature nueva de E2

Alcance:
1. Crear src/shared/hooks/useCurrentUser.ts
2. El hook expone: { userId, user, session, isLoading }
3. Internamente usa el cliente de Supabase para resolver la sesión
4. Si TanStack Query ya está integrado de la Tarea 1, puede usar useQuery internamente
5. Reemplazar las llamadas directas a supabase.auth en las 5 pantallas listadas
   usando el nuevo hook

No hacer:
- No tocar useAuth.ts (es el hook de autenticación del flujo login/register, distinto)
- No cambiar la lógica de negocio de ninguna pantalla, solo la obtención del userId

Archivos esperados:
- src/shared/hooks/useCurrentUser.ts (nuevo)
- MeetupDetailScreen.tsx (modificado)
- ParticipantListScreen.tsx (modificado)
- MemoriesGalleryScreen.tsx (modificado)
- MemoryViewerScreen.tsx (modificado)
- ImpostorStartScreen.tsx (modificado)

---

### Tarea 3 — Centralizar tipado de navegación

Contexto:
- MainStackParamList está definido en src/features/meetups/types.ts
- Esto acopla memories, impostor, auth y shared al feature meetups
- AuthNavigator no tiene tipado
- Los navigators no declaran genéricos

Alcance:
1. Crear src/navigation/types.ts con:
   - AuthStackParamList (pantallas del flujo auth)
   - MainStackParamList (todas las pantallas del flujo principal)
2. Eliminar MainStackParamList de meetups/types.ts
3. Actualizar todos los imports que usaban MainStackParamList desde meetups
4. Tipar AuthNavigator y MainNavigator con sus genéricos correspondientes
5. Asegurar que routes.ts sea consistente con los nuevos tipos

No hacer:
- No cambiar la estructura de navegadores, solo el tipado
- No agregar ni eliminar rutas

Archivos esperados:
- src/navigation/types.ts (nuevo)
- src/navigation/AuthNavigator.tsx (tipado)
- src/navigation/MainNavigator.tsx (tipado)
- src/features/meetups/types.ts (MainStackParamList eliminado)
- Cualquier pantalla que importaba MainStackParamList desde meetups

---

### Tarea 4 — Partir MeetupDetailScreen

Contexto:
- MeetupDetailScreen.tsx tiene ~1648 líneas
- Concentra UI, modales, lógica de rol, asistencia y acciones del organizador
- Cualquier feature de E2 sobre detalle de juntada (portada, resumen, cambio de organizador)
  va a chocar con este archivo si no se parte antes

Alcance:
1. Crear hook src/features/meetups/hooks/useMeetupDetail.ts que encapsule:
   - Obtención del meetup por ID
   - Obtención de participantes
   - Estado del usuario actual en la juntada (rol, asistencia)
   - Acciones del organizador (cancelar, finalizar, editar)
   - Acciones del participante (abandonar, modificar asistencia)
2. Extraer subcomponentes visuales dentro de src/features/meetups/components/:
   - MeetupDetailHeader.tsx (encabezado con título, fecha, ubicación, estado)
   - MeetupParticipantsSummary.tsx (resumen de participantes en el detalle)
   - MeetupOrganizerActions.tsx (botones de acción del organizador)
3. MeetupDetailScreen.tsx queda como orquestador: usa el hook y renderiza los subcomponentes
4. El comportamiento visible de la pantalla debe ser idéntico al actual

No hacer:
- No cambiar la lógica de negocio, solo reorganizarla
- No modificar otras pantallas
- No agregar funcionalidades nuevas
- No tocar la navegación

Archivos esperados:
- src/features/meetups/hooks/useMeetupDetail.ts (nuevo)
- src/features/meetups/components/MeetupDetailHeader.tsx (nuevo)
- src/features/meetups/components/MeetupParticipantsSummary.tsx (nuevo)
- src/features/meetups/components/MeetupOrganizerActions.tsx (nuevo)
- src/features/meetups/screens/MeetupDetailScreen.tsx (reducido significativamente)

---

### Tarea 5 — Flujo CompleteProfile y limpieza menor

Contexto:
- CompleteProfileScreen está registrada en MainNavigator pero nunca se navega automáticamente
- Usuarios nuevos pueden quedar con username autogenerado (user_XXXX) sin ser redirigidos
- appConfig.ts exporta tokens de diseño que duplican theme.ts
- MainNavigator tiene comentario obsoleto sobre "placeholders"

Alcance:
1. Agregar guard en AppNavigator o MainNavigator:
   si el usuario está autenticado Y su username empieza con 'user_',
   redirigir a CompleteProfileScreen antes de mostrar MeetupHome
2. Revisar appConfig.ts: eliminar exports de colores/spacing/radius que dupliquen theme.ts,
   dejar solo constantes de negocio (límites, reglas, etc.)
3. Eliminar el comentario obsoleto sobre placeholders en MainNavigator

No hacer:
- No cambiar la UI de CompleteProfileScreen
- No tocar la lógica de auth

Archivos esperados:
- src/navigation/AppNavigator.tsx (guard de onboarding)
- src/config/appConfig.ts (limpiado)
- src/navigation/MainNavigator.tsx (comentario eliminado)

---

### Tarea 6 — Setup de documentación IA para E2

Contexto:
- En E1 se mantuvo la carpeta ia/entrega-1/ con prompts, conversaciones e índice
- E2 requiere la misma estructura bajo ia/entrega-2/

Alcance:
Crear la siguiente estructura de carpetas y archivos base:

ia/entrega-2/
├── prompts/
│   └── bloque-0/
│       └── 01_refactor_base.md  ← copiar este prompt completo aquí
├── conversaciones/
│   └── bloque-0/
│       └── (vacío, se llenará con el export de esta conversación)
├── indice_ia.md  ← índice base con entrada para bloque-0
└── skills_instaladas.md  ← skills de E1 copiadas como base

No hacer:
- No modificar ia/entrega-1/
- No crear archivos de conversación (los exporta el equipo manualmente)

---

## Reglas generales
- Solo lectura en E1. No tocar entrega-1 ni main.
- No instalar dependencias adicionales.
- No tocar android/ ni ios/.
- No hacer commits (los hace el equipo).
- Comentarios en español.
- Sin TypeScript any.
- Seguir los tokens de src/shared/constants/theme.ts para cualquier elemento visual.
- Al finalizar cada tarea: listar archivos modificados y decisiones tomadas.
- Si algo no queda claro o hay ambigüedad, preguntar antes de asumir.

## Al finalizar todo el bloque
Generar un resumen con:
1. Archivos creados
2. Archivos modificados
3. Archivos eliminados o vaciados
4. Decisiones que tomaste y por qué
5. Cosas que encontraste y que deberían revisarse manualmente

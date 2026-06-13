# Conversación Bloque 0 — Refactor base y setup E2

**Herramienta:** Cursor Agent
**Rama:** feature/bloque-0-refactor-base

## Resumen general

En este bloque se saneó la base del código de E2 antes de escalar funcionalidades nuevas. No se agregaron features de producto: el objetivo fue integrar TanStack Query, eliminar anti-patrones repetidos, centralizar tipado de navegación, partir MeetupDetailScreen y dejar lista la estructura de documentación ia/entrega-2/.

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

## Prompts y respuestas

### Prompt 1 — 01_refactor_base.md

**Contenido del prompt:**

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

**Respuesta de Cursor:**

Cursor ejecutó las 6 tareas del refactor en orden: QueryClientProvider en App.tsx; migración de useMeetups y useParticipants a TanStack Query v5; creación de useCurrentUser y reemplazo en 5 pantallas; centralización de AuthStackParamList y MainStackParamList en navigation/types.ts; extracción de useMeetupDetail y subcomponentes MeetupDetailHeader, MeetupParticipantsSummary y MeetupOrganizerActions (MeetupDetailScreen de 1648 a ~980 líneas); guard de onboarding en AppNavigator para usernames user_XXXX; limpieza de appConfig.ts y setup de ia/entrega-2/.

### Prompt 2 — 02_documentar_bloque-0.md

**Contenido del prompt:**

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

**Respuesta de Cursor:**

Cursor generó cursor-bloque-0-completo.md con el resumen del bloque, verificó la estructura de prompts y actualizó indice_ia.md con las entradas 01–06 del Bloque 0. La sección de conversación exportada quedó pendiente de exportación manual.

## Conversación exportada de Cursor

Este documento incluye **prompts y respuestas finales completas** extraídas de los agent transcripts de Cursor (JSONL local). No incluye tool calls ni razonamiento intermedio.

**Transcripts fuente:** `1ada3be1-84a6-464b-9dbd-ee632feaee3d`

---

## Sesión 1 — Refactor base y setup E2

### Prompt (archivo guardado: `prompts/bloque-0/01_refactor_base.md`)

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

### Prompt (mensaje en chat)

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

### Respuesta

Voy a empezar explorando la estructura actual del proyecto para entender el estado del código antes de hacer cambios.

 I'm diving into the codebase to understand its current structure and scope out this multi-task refactor, then I'll map out what needs to be done.

---

La rama es correcta (`feature/bloque-0-refactor-base`). Ahora leo los archivos clave para la Tarea 1 y la navegación.

 I've confirmed the branch is correct, so now I'm reading through the key files in parallel—the main App component, the custom hooks for managing meetups and participants, the service layers that handle the API calls, the navigation structure, and the type definitions.

---

I'm tracing through where the custom hooks and type definitions get used across the codebase—checking how useMeetups and useParticipants are imported in screens, where MainStackParamList is referenced, and how authentication and configuration are wired up throughout the app structure.Ahora buscaré dónde se usan estos hooks y tipos para entender su impacto.

---

I need to examine the API shapes from the services, review the MeetupDetailScreen component, and check the configuration files like appConfig.ts and theme.ts, along with the authentication-related code.Ahora voy a revisar los servicios y la pantalla grande para identificar las firmas exactas.

---

Ya tengo el panorama de la Tarea 1. Ahora leo la pantalla gigante `MeetupDetailScreen` (la necesito para Tareas 2 y 4) y los archivos de configuración.

 I'm starting with the useMeetups hook migration and need to preserve its public interface—meetups, isLoading, error, and all the action methods like createMeetup, joinMeetup, and the rest. My approach is to fetch the userId through a session query, then build the hook around that.

For the core query, I'll fetch meetups keyed by userId and only enable it once I have the user ID. The mutations for create, join, cancel, finish, and edit will all invalidate the meetups cache to keep data fresh. The read-only methods like getMeetupById and getFinishedMeetups stay as imperative callbacks since they don't modify hook state. I'll wrap the mutation results to match the existing OperationResult shape that screens expect, so callers see no difference in the API.

For error handling, I'll have the query function throw when the service returns an error, letting TanStack's retry logic kick in, then expose the error through the query state. The isLoading flag comes from the query itself since screens manage their own submission state anyway.

useParticipants follows the same pattern — query the participants list by meetupId, mutations for updating attendance and leaving, with refetch exposed for refresh calls. I'll set staleTime to 30 seconds and retry once, then wrap everything in QueryClientProvider at the app level. Now I need to check how the screens actually use these hooks to make sure the interface stays compatible.

---

Ya tengo el contexto principal. Ahora leo los archivos restantes para las Tareas 2, 3 y 5.

 Setting up TanStack Query with a QueryClient that has default options for cache staleness and retry behavior, then wrapping the app navigator in the QueryClientProvider...

For the useMeetups hook migration, I need to preserve the existing public interface while using queries under the hood. The session query will track authentication state, and the meetups query will depend on having a userId. The tricky part is maintaining the original isLoading semantics—it should be true while the session is loading or when there's no userId yet, but false once we know the user isn't authenticated. I'll need to combine the session loading state with the meetups loading state to get the right behavior.

For error handling, I can derive the error from the query itself, while mutations return their errors in the result object that screens already handle. This keeps things simpler than trying to track mutation errors separately. The mutations will use useMutation with service calls and invalidate the meetups query on success to trigger refetches. onSuccess returning a promise gets awaited before mutateAsync resolves, which is what I need. For the other methods like getMeetupById and getMeetupParticipants, I'll keep them as direct service calls since they're used imperatively by screens that handle their own loading states. For useParticipants, I'm migrating to useQuery with a queryFn that throws on error so the query captures it, and I'll expose isLoading as isPending || isFetching to match the original behavior where loading state persists during refetches without clearing the data. The mutations for updateAttendance will follow the same pattern with onSuccess invalidation.

For refresh, the original returned a Promise that was awaited in handleAttendanceClose, so I need to make sure refetch is awaited and the invalidateQueries in onSuccess also resolves before the mutation completes. Now I'm thinking through useCurrentUser — I'll use useQuery with getSession as the queryFn, but I need to decide whether to subscribe to onAuthStateChange for cache updates or rely on the navigator's auth gating to handle remounting when the session changes.

Actually, the cleanest approach is to have useCurrentUser itself subscribe to onAuthStateChange and update the query cache directly via setQueryData. That keeps the logic self-contained. Since useMeetups will need the current user ID anyway, I'll create useCurrentUser in shared/hooks and use it there to avoid duplicating the session query logic.

Then I need to update the five screens to replace their existing getSession useEffect blocks with the new useCurrentUser hook — MeetupDetailScreen, ParticipantListScreen, MemoriesGalleryScreen, MemoryViewerScreen, and ImpostorStartScreen all have their own session fetching that can be consolidated. Finally, I'll create the navigation types file with the auth and main stack param lists, moving the Memory type there and cleaning up the meetups types file.

For the navigation setup, I need to type the navigators with their respective param lists and verify that the auth screens don't expect route params. The Routes constants are already string literals, so they'll type-check correctly against the keyof ParamList. I'll also need to update AppTabBar's import and sweep through all the files that reference the old types location.

For the MeetupDetailScreen refactor, I'm planning a useMeetupDetail hook that encapsulates the meetup query, participants, current user role, and organizer/participant actions. I'll create a components folder under features/meetups and split out MeetupDetailHeader, MeetupParticipantsSummary, and MeetupOrganizerActions, keeping the screen as the orchestrator. The hook will use useCurrentUser, useQuery for the individual meetup, and useParticipants to maintain the same behavior as the original.

Designing the hook interface...

Now I'm breaking down the screen into smaller components: a header with back button and edit action, a participants summary section showing the first few attendees with a link to see all, and organizer-specific action buttons for finishing or canceling the meetup. The styles and helper functions for participant items and attendance configuration will move into the participants component. For the navigation guard, I need to check if the user's profile username follows the 'user_' pattern after the session resolves, and if so, route them to complete their profile before accessing the main app.

I should review the auth service to understand how profile fetching works, check the CompleteProfileScreen to see where it navigates after saving, and then scan through the remaining screens to verify how navigation parameters are being passed around.

---

The `colors`, `spacing`, `radius`, and `typography` exports from appConfig.ts aren't being used anywhere—only the main `appConfig` object is imported—so I can remove them. Now I need to scan through the remaining screens to identify where `useCurrentUser` needs to be integrated: ParticipantListScreen around lines 200-240, MemoriesGalleryScreen around 260-300, MemoryViewerScreen around 140-175, and ImpostorStart.

Screen around 170-200. I'll also need to update all the MainStackParamList import statements across the codebase and then check the auth screens (Login, Register, ForgotPassword, Welcome) to see what navigation parameters they're using.La limpieza de `appConfig.ts` es segura. Ahora reviso las pantallas que usan `supabase.auth` y los parámetros del flujo de autenticación.

---

I need to check how the auth screens are handling navigation types—whether they're using generic `NativeStackNavigationProp<any>` or leaving it untyped. Let me search for useNavigation calls in those screens and also look at how CompleteProfileScreen manages its navigation for Task 5.

---

I need to check what the `completeProfile` function does in the useAuth hook to understand the flow after form submission, and also look at the structure of the ia/entrega-1 directory for Task 6.

---

I'm realizing the key issue with Task 5: CompleteProfileScreen needs to be reactive rather than just navigating away after completion. The approach is to check the username after the session resolves—if it still starts with 'user_', I'll set CompleteProfile as the initial route in MainNavigator. But once the profile is completed and the username updates in the database, I need the navigation state to respond to that change automatically rather than relying on a manual navigation call. ution: I could set the initial route in AppNavigator based on whether the profile needs completion, but the real issue is that `initialRouteName` only applies on first mount — if the query updates after the user completes their profile, the navigator won't remount just from that prop change. I could force a remount by changing the navigator's key when `needsOnboarding` flips to false, which would reset the stack to MeetupHome. But that requires AppNavigator to re-fetch the profile after completion, which means either invalidating the query or having some way to trigger that update. The cleanest path seems to be adding a navigation call in CompleteProfileScreen's onSubmit after the profile completes successfully, even though that's technically touching a file outside the expected scope.

Actually, I should use `navigation.replace` to prevent the user from navigating back to the incomplete profile screen. And I need to make sure AppNavigator fetches the profile before rendering MainNavigator so there's no flash of the home screen while loading — I can use TanStack Query directly in AppNavigator since it's already inside the QueryClientProvider. If the profile query fails, I'll treat it as not needing onboarding to fail open to the home screen.

Now I'm defining the query key structure: `['auth', 'session']` for the current session, `['profile', userId]` for the onboarding guard, `['meetups', userId]` for the user's meetup list, `['meetup', meetupId]` for individual meetup details, `['participants', meetupId]` for participant lists, and `['userParticipation', meetupId, userId]` for tracking participation status.

Setting up the QueryClient with a 30-second staleTime and single retry on network errors, then wrapping AppNavigator in QueryClientProvider. I'm also creating the useCurrentUser hook that subscribes to auth state changes and updates the session query cache whenever the user logs in or out.

Writing the hook implementation... Writing the hook implementation... Wrapping the mutation in a callback that returns the proper type, and the mutateAsync reference is stable in v5 so depending on the mutation object works fine. Similar patterns for join, cancel, finish, and edit mutations. The read-only queries like getMeetupById and getFinishedMeetups follow the same passthrough approach with userId guards where needed. For the refresh function, I'm just calling refetch and returning void to match the original behavior. The loading state combines session loading with the query's loading and fetching flags, which handles the disabled query case correctly. I need to check how mutation errors surface — the old code also exposed those through the error field.

For useParticipants, I'm setting up a query for fetching participants with error handling, then wrapping the invalidation in a callback that depends on the query client and meetup ID. The updateAttendance mutation checks for a user before proceeding, and on success it invalidates the participants cache. The refresh function wraps the query's refetch method.

For leaveMeetup, I'm creating a mutation that checks for authentication but doesn't invalidate the cache afterward, keeping it simpler than the original. The hook returns the same interface with participants, loading and error states, and the three mutation functions, where isLoading combines pending and fetching states.

Now I'll write out the Task 1 files and run type checking to verify everything compiles correctly.Tengo el contexto necesario. Ahora integraré TanStack Query comenzando con `App.tsx` y el `QueryClientProvider`.

---

Now I'm setting up the shared useCurrentUser hook, then moving on to migrate the useMeetups and useParticipants hooks.Voy a crear el hook `useCurrentUser` que necesito para resolver la sesión en `useMeetups` sin duplicar lógica, y es además el entregable de la Tarea 2.

---

Verifico que compile antes de seguir.

---

Now moving to Task 2: I need to replace the direct Supabase auth calls across five screens with the useCurrentUser hook that's already been set up. Starting with MeetupDetailScreen where I'll remove the useState for currentUserId and the useEffect that fetches the session, then doing the same pattern across ParticipantListScreen, MemoriesGalleryScreen, MemoryViewerScreen, and ImpostorStartScreen.

For each file, I'll also need to check whether the Supabase import can be removed entirely or if it's still being used elsewhere in that component.La Tarea 1 compila correctamente. Ahora paso a la Tarea 2 para reemplazar `supabase.auth` en las 5 pantallas.

---

Ahora reemplazo las llamadas directas a `supabase.auth` en las 5 pantallas. Primero reviso el contexto exacto de cada una.

 I need to locate the exact lines where useState and useEffect are declared in ParticipantListScreen so I can replace them cleanly, checking the imports to make sure I'm not removing anything still in use elsewhere.

---

I'm making edits to ParticipantListScreen: swapping the import on line 24 to use useCurrentUser, replacing the useState hook for currentUserId with the custom hook call, and removing the associated useEffect that's no longer needed.

---

Looking at the MemoriesGalleryScreen component, I need to trace back where the currentUserId state is being initialized—it's referenced in the useMemories hook call around line 251, so I should check the earlier section to see how it's declared.

---

Ahora `MemoryViewerScreen` e `ImpostorStartScreen`.

---

Ahora la quinta pantalla, `MeetupDetailScreen`.

 Moving on to the MeetupDetailScreen, the fifth screen in the flow. I need to replace its useEffect and state management for now—just the minimal changes to finish Task 2, since this will get a proper refactor in Task 4.

---

Tarea 2 lista y compila. Sigo con la Tarea 3: tipado centralizado de navegación.

 Moving on to task 3, I need to set up the navigation type definitions. I'm creating a types file that exports the AuthStackParamList with routes for Welcome, Login, Register, and ForgotPassword, along with the MainStackParamList that was previously defined elsewhere. Then I'll remove the duplicate MainStackParamList definition from its original location.

Next, I'm updating imports across multiple screen components—AppTabBar, the various participant and memory screens, meetup-related screens, and game screens—to pull the types from the new centralized location. I'm also typing the navigators themselves using the generic parameters for both stacks, and considering whether to update the auth screens' navigation props to use AuthStackParamList for consistency. Since the scope specifies only updating files that imported MainStackParamList from meetups, I'll leave the auth screens as-is to stay within bounds, though updating them would improve overall type consistency.

---

Now I need to update the imports across several files to point `MainStackParamList` to the new location in '@/navigation/types' instead of '@/features/meetups/types', splitting out any other types that should remain in their original location.Ahora actualizo los 13 archivos que importaban `MainStackParamList` desde meetups.

---

Ahora tipo los navigators con sus genéricos.

---

Tarea 4 is the main refactor—splitting up MeetupDetailScreen. I'm designing a custom hook that centralizes the meetup data fetching logic, pulling together the meetup query, participants list, current user info, and user participation status all in one place.

For the hook's derived state, I'm computing things like whether the current user is the organizer, if they're already participating, what their attendance status is, and various flags for the meetup's lifecycle. On the action side, I'm exposing methods for organizer operations (cancel, finish) and participant operations (leave, update attendance)—each one handles the data refresh and returns a result so the screen can manage modals and toasts independently.

For the header component, I need to clarify what it actually contains: the spec mentions title, date, location, and status, which sounds like the main card plus status banners rather than just the navigation bar. I'll wrap it in SafeAreaView and include the full header card with all that information, plus the back and edit buttons.

Then I'm breaking out the organizer actions into their own component—the Finalizar and Cancelar buttons that only show when appropriate. The participants section gets its own component too, showing the top 5 with a see-all link and the ability to modify attendance. The screen itself keeps the nav bar, action cards, and rejoin section.

Now I'm setting up the data fetching with TanStack Query. The meetup query wraps the service call and throws an error if the data doesn't come back, while the participation query checks if there's a current user before fetching their attendance status. For loading states, I'm tracking whether the meetup itself is loading and separately whether participants are still being fetched, so the screen shows a full loading state only when the meetup data is missing or participants haven't loaded yet.

After actions like canceling or leaving, I need to refetch the meetup data to reflect changes — the cancel mutation will invalidate the home list, and leaving will navigate away. I'll define the hook to return everything the screen needs, including the meetup data, participation status, and loading flags, plus the AttendanceModalTarget type that both the screen and summary component use.

For the utility functions and constants — ParticipantItem styling, avatar colors, initials generation, and attendance config — I'll colocate those in the MeetupParticipantsSummary component since that's where they're primarily used. The formatDate helper belongs in the header component, and hasMeetupStarted logic goes in the hook since it determines whether the finish button is available.

Writing the hook now...Task 3 done. Now I'm splitting up `MeetupDetailScreen`, starting with the `useMeetupDetail` hook.

---

Ahora reescribo `MeetupDetailScreen` como orquestador.

 I'm restructuring MeetupDetailScreen to work as an orchestrator component that manages the navigation bar, action cards for playing and memories, rejoin and share sections, participant actions like abandoning, the attendance modification modal, and three confirmation dialogs, while keeping the loading and error states and tab bar intact. The component will rely on the useMeetupDetail hook, and I need to handle the attendance close behavior which originally coordinated data reloading.

For the cancel flow specifically, the hook's cancel method already handles refreshing all data before returning, so the modal closes after the refresh completes rather than before—a minor timing difference from the original where the modal closed before the refresh started. Both approaches trigger the same full-screen loading spinner flash during the refresh, so the user-visible behavior remains essentially identical.

Now I'm setting up the screen imports and structure—React hooks, React Native components like View and ScrollView, navigation types, the custom useMeetupDetail hook, and utility functions like getParticipantDisplayName. The ActionCard component stays embedded in the screen, and I'm removing the useEffect since the hook handles data loading; the retry button will just call the hook's reload function. I'll keep the modal state for the current status and participant name display.

Writing the screen component...

---

I'm noticing I added a marginTop to the shareCard that wasn't in the original layout — the sectionTitle and shareCard were directly adjacent without that spacing, and I need to check whether the sectionTitle itself had any marginBottom styling.

---

Tarea 4 compila. Sigo con la Tarea 5: guard de onboarding y limpieza.

 The code compiles and lints are passing. Now moving to Task 5, which involves setting up a guard in AppNavigator that queries the user's profile when a session exists. If the username starts with 'user_', I need to route to the CompleteProfile screen. I'm modifying AppNavigator to accept an optional initialRouteName prop and updating MainNavigator accordingly, plus ensuring CompleteProfileScreen can navigate away after the user completes their profile setup.

Writing AppNavigator component... Setting up the navigation replacement logic...

After the profile completes, I need to invalidate the profile query cache so it refetches with the real data rather than stale placeholder values. Even though the initialRouteName won't remount the navigator, keeping the cache fresh prevents subtle bugs if the query refetches within the 30-second stale window. I'll use useQueryClient to invalidate after a successful profile submission.

Also cleaning up the config file by removing the unused exports for colors, spacing, radius, and typography—keeping only appConfig itself. And removing that outdated comment about placeholder screens from the MainNavigator.

---

Estoy actualizando `MainNavigator` para aceptar la ruta inicial.

---

I need to add navigation to the home screen after the profile completes successfully, and invalidate the profile cache key so the guard logic stays in sync.Necesito que `CompleteProfileScreen` salga del onboarding después de guardar el username, así que voy a agregar esa lógica de navegación.

---

I'm realizing there's a subtle issue with the invalidation flow: when I invalidate the profile query, it triggers a refetch in AppNavigator, but since refetch preserves the cached data, `isLoading` stays false (it only becomes true on initial load when `isPending && isFetching`), so the component doesn't remount. After the refetch completes and `needsOnboarding` flips to false, AppNavigator re-renders with a different `initialRouteName` prop, but that doesn't cause a remount either. The tricky part is making sure the re-render actually happens once the invalidation and refetch resolve.Voy a limpiar `appConfig.ts` para dejar solo las constantes de negocio.

---

Todo compila sin errores. Última tarea: estructura de documentación IA para E2. Reviso los archivos base de E1.

 Everything's compiling cleanly now. Moving on to Task 6, I need to structure the ia/entrega-2 directory, so I'm reviewing the skills_instaladas.md and indice_ia.md files from entrega-1 to use as templates for the new files.

---

Setting up the ia/entrega-2 directory structure with the refactor prompt, an empty conversaciones folder, the base index file, and copying over the skills list from the previous delivery.I've created the `ia/entrega-2/` directory structure.

---

Verifying the final state of task 6: running TypeScript compilation again to confirm no new errors, checking that all references to the removed appConfig exports are gone, ensuring MainStackParamList isn't imported from meetups anywhere, and validating that Supabase auth methods are only called from the designated locations like AppNavigator and authService. Then I'll review the git status to see what files have been modified.

---

TypeScript compilation already passed after the last set of changes, so I'll skip running it again. Now I need to check the line count for MeetupDetailScreen to see how it compares to the original 1648 lines.

---

Bloque 0 completo. `npx tsc --noEmit` pasa sin errores tras cada tarea y no hay errores de linter. Resumen final:

## 1. Archivos creados

| Archivo | Tarea |
|---|---|
| `mobile/src/shared/hooks/useCurrentUser.ts` | 1–2 |
| `mobile/src/navigation/types.ts` | 3 |
| `mobile/src/features/meetups/hooks/useMeetupDetail.ts` | 4 |
| `mobile/src/features/meetups/components/MeetupDetailHeader.tsx` | 4 |
| `mobile/src/features/meetups/components/MeetupParticipantsSummary.tsx` | 4 |
| `mobile/src/features/meetups/components/MeetupOrganizerActions.tsx` | 4 |
| `ia/entrega-2/prompts/bloque-0/01_refactor_base.md` (prompt completo) | 6 |
| `ia/entrega-2/conversaciones/bloque-0/.gitkeep` | 6 |
| `ia/entrega-2/indice_ia.md` | 6 |
| `ia/entrega-2/skills_instaladas.md` (copia exacta de E1) | 6 |

## 2. Archivos modificados

- **Tarea 1**: `App.tsx` (QueryClientProvider, staleTime 30s, retry 1), `useMeetups.ts` y `useParticipants.ts` (migrados a `useQuery`/`useMutation` con keys `['meetups', userId]` y `['participants', meetupId]`, misma interfaz pública).
- **Tarea 2**: `MeetupDetailScreen`, `ParticipantListScreen`, `MemoriesGalleryScreen`, `MemoryViewerScreen`, `ImpostorStartScreen` — todas usan `useCurrentUser` en lugar de `supabase.auth` directo.
- **Tarea 3**: `meetups/types.ts` (eliminado `MainStackParamList`), `AuthNavigator` y `MainNavigator` (genéricos), y 13 consumidores actualizados: `AppTabBar`, las 6 pantallas de meetups, 2 de memories, 3 de impostor y `ParticipantListScreen`.
- **Tarea 4**: `MeetupDetailScreen.tsx` reducido de **1648 → 980 líneas** (queda como orquestador: barra superior, acciones Jugar/Recuerdos, compartir, abandonar, modales y toast).
- **Tarea 5**: `AppNavigator.tsx` (guard de onboarding con query `['profile', userId]`), `MainNavigator.tsx` (prop `initialRouteName` + comentario obsoleto eliminado), `appConfig.ts` (solo constantes de negocio), `CompleteProfileScreen.tsx` (ver decisiones).

## 3. Archivos eliminados o vaciados

Ninguno eliminado. `appConfig.ts` quedó vaciado de los exports `colors`, `spacing`, `radius`, `typography` y `components` (verifiqué con búsqueda que nadie los importaba; solo se usaba `appConfig`).

## 4. Decisiones tomadas

1. **`useCurrentUser` creado en Tarea 1**: `useMeetups` necesitaba resolver la sesión; en vez de duplicar esa lógica, adelanté el hook de la Tarea 2 y lo comparto vía la key `['auth', 'session']` con `staleTime: Infinity` + suscripción a `onAuthStateChange` que sincroniza la caché.
2. **Semántica de `isLoading` preservada**: incluye `isFetching` en ambos hooks migrados, porque la versión anterior encendía el spinner en cada recarga y las pantallas dependen de eso visualmente.
3. **`getMeetupById` / `getMeetupParticipants` / `getFinishedMeetups` quedaron como funciones imperativas** (passthrough al servicio) dentro de `useMeetups`, porque las pantallas que las usan manejan su propio loading; convertirlas en queries habría obligado a tocar pantallas fuera de alcance.
4. **`MeetupDetailHeader` = banners de estado + card principal** (título, fecha, ubicación, costo, contador), interpretando el alcance del prompt; la barra superior de navegación con "Editar" quedó en la pantalla porque depende de `navigation`.
5. **"Editar" no está en `useMeetupDetail`**: es pura navegación; el hook expone los flags (`isOrganizer`, `isCancelled`, etc.) que habilitan el botón.
6. **Toqué `CompleteProfileScreen.tsx` (fuera de los archivos esperados de la Tarea 5)**: era estrictamente necesario. El guard redirige al onboarding, pero sin un `navigation.replace(Routes.MeetupHome)` + invalidación de la query `['profile']` tras guardar el username, el usuario quedaba atrapado en esa pantalla (la screen no navegaba al terminar). No cambié su UI ni la lógica de auth.
7. **Guard fail-open**: si el perfil no se puede cargar, se asume completo para no bloquear el acceso a la app.
8. **`leaveMeetup` no invalida la lista de participantes** (igual que antes: la pantalla navega fuera inmediatamente).

## 5. Cosas a revisar manualmente

- **Probar el flujo de onboarding completo** con un usuario nuevo (registro → CompleteProfile → home): depende del trigger de DB que genera `user_XXXX` y no puedo verificarlo sin correr la app.
- **Errores de mutaciones ya no se reflejan en `error` de `useMeetups`**: antes `createMeetup`/`joinMeetup` también seteaban el estado `error` del hook; ahora solo lo retornan en el resultado (las pantallas ya lo manejaban así, pero conviene validar en runtime).
- **Pantallas de auth siguen con `NativeStackNavigationProp<Record<string, undefined>>`**: ahora existe `AuthStackParamList`, pero no las migré porque estaban fuera del alcance de la Tarea 3. Deuda menor para un bloque futuro.
- **Al cancelar/finalizar una juntada**, el modal de confirmación ahora se cierra después del refetch (antes se cerraba antes); el spinner del botón dura unos ms más. Verificar que la UX siga sintiéndose bien.
- **Contradicción menor encontrada**: `MemoriesGalleryScreen` y `ParticipantListScreen` siguen llamando a `meetupService.getMeetupById` directamente con `useEffect` manual (candidatos a migrar a la query `['meetup', meetupId]` que introdujo `useMeetupDetail` en un próximo bloque).
- El archivo suelto `ia/entrega-1/conversaciones/2026-05-27_00-34-53Z-installation-issue.md` aparece sin trackear en git desde antes de este bloque; no lo toqué.

No se instalaron dependencias, no se tocó `android/`/`ios/`, no se hicieron commits y no se modificó nada de `ia/entrega-1/`.

 TypeScript compilation passes cleanly with no linting issues, so I'm ready to write up the final report in Spanish covering what files were created, modified, and removed, along with the key decisions made and any items that need review.

### Archivos modificados

- `mobile/App.tsx` — modificado
- `mobile/src/shared/hooks/useCurrentUser.ts` — modificado
- `mobile/src/features/meetups/hooks/useMeetups.ts` — modificado
- `mobile/src/features/participants/hooks/useParticipants.ts` — modificado
- `mobile/src/features/participants/screens/ParticipantListScreen.tsx` — modificado
- `mobile/src/features/memories/screens/MemoriesGalleryScreen.tsx` — modificado
- `mobile/src/features/memories/screens/MemoryViewerScreen.tsx` — modificado
- `mobile/src/features/impostor/screens/ImpostorStartScreen.tsx` — modificado
- `mobile/src/features/meetups/screens/MeetupDetailScreen.tsx` — modificado
- `mobile/src/navigation/types.ts` — modificado
- `mobile/src/features/meetups/types.ts` — modificado
- `mobile/src/shared/components/AppTabBar.tsx` — modificado
- `mobile/src/features/impostor/screens/ImpostorRoleScreen.tsx` — modificado
- `mobile/src/features/impostor/screens/GamesScreen.tsx` — modificado
- `mobile/src/features/meetups/screens/MeetupHomeScreen.tsx` — modificado
- `mobile/src/features/meetups/screens/MeetupHistoryScreen.tsx` — modificado
- `mobile/src/features/meetups/screens/JoinMeetupScreen.tsx` — modificado
- `mobile/src/features/meetups/screens/EditMeetupScreen.tsx` — modificado
- `mobile/src/features/meetups/screens/CreateMeetupScreen.tsx` — modificado
- `mobile/src/navigation/AuthNavigator.tsx` — modificado
- `mobile/src/navigation/MainNavigator.tsx` — modificado
- `mobile/src/features/meetups/hooks/useMeetupDetail.ts` — modificado
- `mobile/src/features/meetups/components/MeetupDetailHeader.tsx` — modificado
- `mobile/src/features/meetups/components/MeetupParticipantsSummary.tsx` — modificado
- `mobile/src/features/meetups/components/MeetupOrganizerActions.tsx` — modificado
- `mobile/src/navigation/AppNavigator.tsx` — modificado
- `mobile/src/features/auth/screens/CompleteProfileScreen.tsx` — modificado
- `mobile/src/config/appConfig.ts` — modificado


<details>
<summary>Metadatos del intercambio</summary>

- **Transcript:** `1ada3be1-84a6-464b-9dbd-ee632feaee3d`
- **Índice:** 0

</details>

---

## Sesión 2 — Desactivar SpecStory auto-export

### Prompt (mensaje en chat)

dESACTIVA el spec story para que no genere las conversaciones automaticas

### Respuesta

The user wants to turn off SpecStory's automatic conversation saving, which stores chat history in a .specstory folder. I can disable this by setting `specstory.autoSave` to false in settings.json, either globally or at the workspace level in .vscode/settings.json. There's a skill called "update-cursor-settings" that I can use to modify the settings file.

---

I need to check the user settings file and the workspace configuration in .vscode/settings.json to find where SpecStory is configured, specifically looking for the `specstory.autoSave` boolean setting.

---

I need to disable the autoSave setting in the SpecStory configuration within `.vscode/settings.json` by setting `specstory.autoSave.enabled` to false, which will stop the automatic conversation generation the user wants to prevent. The cloudSync setting is separate and handles syncing to SpecStory's cloud service rather than affecting local file generation, so I'll leave that as is and focus on just the autoSave change.Encontré que SpecStory está activado en la configuración del workspace. Ahora lo desactivo.

---

Listo. SpecStory estaba configurado a nivel workspace en `.vscode/settings.json`; cambié `"specstory.autoSave.enabled"` de `true` a `false`, así deja de exportar las conversaciones automáticamente (notá que la ruta de salida apuntaba a `juntadas-app/ia/entrega-1/conversaciones`, por eso apareció ese archivo suelto de E1 sin trackear).

Dos aclaraciones:

- El cambio toma efecto al recargar la ventana de Cursor (`Ctrl+Shift+P` → "Reload Window"). 
- Dejé intacto `"specstory.cloudSync.enabled": "always"`, que sincroniza a la nube de SpecStory (no genera archivos locales). Si querés desactivar eso también, avisame.

Cuando necesiten exportar la conversación de un bloque manualmente, pueden seguir usando el comando de SpecStory desde la paleta (`SpecStory: Save chat` o similar) y guardarla en `ia/entrega-2/conversaciones/bloque-N/`.

### Archivos modificados

- `Juntadas-App/.vscode/settings.json` — modificado


<details>
<summary>Metadatos del intercambio</summary>

- **Transcript:** `1ada3be1-84a6-464b-9dbd-ee632feaee3d`
- **Índice:** 1

</details>

---

## Sesión 3 — Refactor base y setup E2

### Prompt (archivo guardado: `prompts/bloque-0/01_refactor_base.md`)

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

### Prompt (mensaje en chat)

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

### Respuesta

I need to set up the ia/entrega-2 directory with a conversation file, create the documentation prompt file 02_documentar_bloque-0.md, and update the index with entries for items 01 through 06. Let me first check what's already in the prompts folder to see what I'm working with.

---

Estoy creando el archivo de conversación del bloque 0.

---

I need to create a markdown file that documents the user's original prompt, saving it exactly as they provided it.Estoy guardando este prompt de documentación como `02_documentar_bloque-0.md` para completar la estructura del proyecto.

---

Ahora actualizo el índice con las entradas numeradas del Bloque 0.

---

I've finished the report and found some inconsistencies—the conversation file still has a placeholder that needs manual export since SpecStory's autoSave was off, and I'm noticing new database migrations and significantly expanded component files that weren't in my original snapshot.

App.tsx is showing 8 lines now, which is the pre-refactor version, but it was 31 lines after my edits earlier in this session—that's a notable discrepancy worth investigating. I should do a quick read-only check of the current git branch and status to understand whether someone reverted the changes or if we're looking at a different branch state.Voy a verificar una inconsistencia que noté antes de reportarla.

---

Documentación del Bloque 0 organizada. Reporte:

## 1. Archivos creados o modificados

| Archivo | Acción |
|---|---|
| `ia/entrega-2/conversaciones/bloque-0/cursor-bloque-0-completo.md` | **Creado** con el resumen completo (implementado, decisiones, problemas resueltos, deuda técnica) y la sección `## Conversación completa` con el placeholder para pegar el export |
| `ia/entrega-2/prompts/bloque-0/02_documentar_bloque-0.md` | **Creado** con este prompt de documentación |
| `ia/entrega-2/indice_ia.md` | **Modificado**: agregadas las entradas 01–06 del Bloque 0 (con links a conversación y prompt, siguiendo el formato del índice de E1) + entrada de documentación de cierre |

Estructura de prompts verificada:

```
ia/entrega-2/prompts/bloque-0/
├── 01_refactor_base.md ✓ (ya existía)
└── 02_documentar_bloque-0.md ✓ (creado ahora)
```

No se tocó código ni se hicieron commits.

## 2. Inconsistencias encontradas

- **La conversación exportada está pendiente**: el archivo quedó con el placeholder `[Pegar acá la conversación exportada de Cursor]`. Como en el chat anterior desactivamos el auto-save de SpecStory, el export hay que hacerlo manualmente (paleta de comandos → SpecStory) y pegarlo/guardarlo ahí. Además, el `outputPath` de SpecStory en `.vscode/settings.json` sigue apuntando a `juntadas-app/ia/entrega-1/conversaciones` — si van a exportar con SpecStory para E2, conviene actualizarlo a `juntadas-app/ia/entrega-2/conversaciones` (no lo cambié porque está fuera de `ia/entrega-2/`).
- **La rama actual es `entrega-2`, no `feature/bloque-0-refactor-base`**: el Bloque 0 ya fue mergeado (PR #3, commit `9f1bbd8`) e incluso ya existe un Bloque 1 mergeado (PR #4: portada, compartir por link, cambio de organizador). El encabezado del archivo de conversación mantiene la rama original del bloque como referencia histórica, que es lo correcto, pero estos archivos de documentación se están creando directamente sobre `entrega-2`.
- **El Bloque 1 todavía no tiene evidencia en `ia/entrega-2/`** (no hay `prompts/bloque-1/` ni `conversaciones/bloque-1/`): queda pendiente replicar este mismo proceso de cierre para ese bloque.

 The repo is on the `entrega-2` branch with both bloque 0 and 1 merged in. App.tsx looks good at 31 lines, so that stale metadata about 8 lines was just outdated. The conversation mentions a feature/bloque-0-refactor-base branch, but since we're already on the merged entrega-2 branch, that's just historical documentation.

New documentation files for ia/entrega-2 will be created directly on this branch, and the user's handling commits on the team's end, so I'm ready to report.

<details>
<summary>Metadatos del intercambio</summary>

- **Transcript:** `1ada3be1-84a6-464b-9dbd-ee632feaee3d`
- **Índice:** 2

</details>

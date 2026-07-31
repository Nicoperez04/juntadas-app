# Conversación Bloque 2 — Reseñas post-juntada

**Herramienta:** Cursor Agent
**Rama:** feature/bloque-2-resumen-post-juntada

## Resumen general

En este bloque se implementó el sistema completo de reseñas post-juntada: el organizador habilita reseñas al finalizar, los participantes pueden crear/editar/eliminar su reseña, y la UI muestra reseñas pendientes en home e indicador en historial.

### Lo que se implementó

- Migración 007_meetup_reviews.sql: columna reviews_enabled en meetups, tabla meetup_reviews, trigger updated_at, función is_meetup_participant, políticas RLS
- Tipo Meetup con reviews_enabled?: boolean y mapeo en mapMeetupRow
- meetupService.finishMeetup: ahora recibe reviewsEnabled: boolean y retorna { data: null, error }
- Módulo src/features/reviews/: types, reviewService, useReviews (TanStack Query v5), reviewSchemas (Zod v4)
- Modal de finalizar juntada movido a MeetupOrganizerActions con Switch de reseñas, toast ✓ y haptic
- ReviewFormScreen: estrellas interactivas, comentario multilínea, crear/editar/eliminar reseña
- ReviewsSection integrado en MeetupDetailScreen (solo finished + reviews_enabled)
- Ruta Routes.ReviewForm registrada en MainNavigator
- usePendingReviews + PendingReviewCard en home con AsyncStorage (review_dismissed_{meetupId})
- Badge de estrella en historial cuando reviews_enabled = true
- Documentación ia/entrega-2/ actualizada

### Decisiones tomadas

- Modal de finalizar centralizado en MeetupOrganizerActions (mismo patrón que transferencia)
- Función SQL is_meetup_participant para RLS SELECT: incluye ex-participantes
- Badge en historial basado solo en reviews_enabled (sin cargar reseñas)
- finishMeetup retorna data: null; hooks invalidan queries para refrescar UI
- Toast en ReviewFormScreen con delay de 900ms antes de goBack()
- Schema Zod v4 usa { message: '...' } en lugar de required_error

### Problemas encontrados y resueltos

- Modal de finalizar estaba en MeetupDetailScreen — resuelto moviendo lógica a MeetupOrganizerActions
- Error TS en reviewSchemas con Zod v4 (required_error no existe) — corregido a message
- Error TS en ReviewFormScreen (parsed.error.errors vs issues) — corregido a issues

### Deuda técnica documentada

- usePendingReviews hace N+1 queries (getUserReview por juntada candidata)
- Badge de historial no distingue juntadas con 0 reseñas vs con reseñas
- Reactivar juntada (status active → finished) no está implementado en la app

## Prompts y respuestas

### Prompt 1 — 01_resumen_post_juntada.md

**Contenido del prompt:**

# Bloque 2 — Reseñas post-juntada

> Prompt completo de implementación del Bloque 2 (Entrega 2).
> Ver conversación exportada en `conversaciones/bloque-2/cursor-bloque-2-completo.md`.

## Contexto general

Continuamos con la Entrega 2 (E2) del proyecto Juntadas.
Los Bloques 0 y 1 están completos y mergeados a entrega-2.
La rama actual de trabajo es `feature/bloque-2-resumen-post-juntada`.

## Modelo de negocio

- Al finalizar una juntada, el organizador elige si habilita reseñas o no
- Si habilita: todos los participantes pueden dejar una reseña individual
- Cada reseña tiene: rating (1-5 estrellas), comment (texto libre, opcional)
- Un participante puede editar o eliminar su propia reseña
- Nadie puede tocar la reseña de otro
- Una vez habilitadas las reseñas, no se pueden deshabilitar
- El organizador puede reseñar como cualquier participante
- Si la juntada se reactiva, las reseñas se conservan pero no se pueden agregar nuevas hasta que se vuelva a finalizar con reviews habilitadas

## Tareas

1. Migración `007_meetup_reviews.sql` (reviews_enabled + meetup_reviews + RLS)
2. Actualizar tipos y `finishMeetup` en meetupService
3. Módulo `src/features/reviews/` (types, service, hooks, schemas)
4. Modal de finalizar con toggle de reseñas en MeetupOrganizerActions
5. Pantalla ReviewFormScreen (crear/editar reseña)
6. ReviewsSection en detalle de juntada
7. Navegación: Routes.ReviewForm + MainNavigator
8. PendingReviewCard + usePendingReviews en home
9. Indicador de reseñas en historial
10. Documentación ia/entrega-2/

## Reglas generales

- No instalar dependencias adicionales
- No tocar android/ ni ios/
- No hacer commits
- Comentarios en español
- Sin TypeScript any
- Seguir tokens de `src/shared/constants/theme.ts`

**Respuesta de Cursor:**

Cursor implementó el bloque completo en una sesión: migración 007_meetup_reviews.sql; actualización de finishMeetup; módulo reviews con service, hooks y schemas; modal de finalizar con toggle en MeetupOrganizerActions; ReviewFormScreen y ReviewsSection; PendingReviewCard con usePendingReviews en home; badge de estrella en historial; registro de Routes.ReviewForm en MainNavigator.

## Conversación exportada de Cursor

Este documento incluye **prompts y respuestas finales completas** extraídas de los agent transcripts de Cursor (JSONL local). No incluye tool calls ni razonamiento intermedio.

**Transcripts fuente:** `c7ea03c3-b939-4524-866d-72a6afc41a41`

---

## Sesión 1 — Reseñas post-juntada

### Prompt (archivo guardado: `prompts/bloque-2/01_resumen_post_juntada.md`)

# Bloque 2 — Reseñas post-juntada

> Prompt completo de implementación del Bloque 2 (Entrega 2).
> Ver conversación exportada en `conversaciones/bloque-2/cursor-bloque-2-completo.md`.

## Contexto general

Continuamos con la Entrega 2 (E2) del proyecto Juntadas.
Los Bloques 0 y 1 están completos y mergeados a entrega-2.
La rama actual de trabajo es `feature/bloque-2-resumen-post-juntada`.

## Modelo de negocio

- Al finalizar una juntada, el organizador elige si habilita reseñas o no
- Si habilita: todos los participantes pueden dejar una reseña individual
- Cada reseña tiene: rating (1-5 estrellas), comment (texto libre, opcional)
- Un participante puede editar o eliminar su propia reseña
- Nadie puede tocar la reseña de otro
- Una vez habilitadas las reseñas, no se pueden deshabilitar
- El organizador puede reseñar como cualquier participante
- Si la juntada se reactiva, las reseñas se conservan pero no se pueden agregar nuevas hasta que se vuelva a finalizar con reviews habilitadas

## Tareas

1. Migración `007_meetup_reviews.sql` (reviews_enabled + meetup_reviews + RLS)
2. Actualizar tipos y `finishMeetup` en meetupService
3. Módulo `src/features/reviews/` (types, service, hooks, schemas)
4. Modal de finalizar con toggle de reseñas en MeetupOrganizerActions
5. Pantalla ReviewFormScreen (crear/editar reseña)
6. ReviewsSection en detalle de juntada
7. Navegación: Routes.ReviewForm + MainNavigator
8. PendingReviewCard + usePendingReviews en home
9. Indicador de reseñas en historial
10. Documentación ia/entrega-2/

## Reglas generales

- No instalar dependencias adicionales
- No tocar android/ ni ios/
- No hacer commits
- Comentarios en español
- Sin TypeScript any
- Seguir tokens de `src/shared/constants/theme.ts`

### Prompt (mensaje en chat)

# Bloque 2 — Reseñas post-juntada

## Contexto general
Continuamos con la Entrega 2 (E2) del proyecto Juntadas.
Los Bloques 0 y 1 están completos y mergeados a entrega-2.
La rama actual de trabajo es `feature/bloque-2-resumen-post-juntada`.

Cambios relevantes de bloques anteriores:
- TanStack Query v5 integrado con QueryClientProvider en App.tsx
- useMeetups migrado a useQuery/useMutation
- useCurrentUser disponible en src/shared/hooks/
- MeetupDetailScreen partida en subcomponentes y useMeetupDetail
- Tipado de navegación centralizado en src/navigation/types.ts
- meetupService tiene métodos para cover, transferOrganizer
- El enum meetup_status tiene: active, finished, cancelled (no 'upcoming')
- El enum participant_role tiene: organizer, participant (no 'member')

## Stack del proyecto
- React Native + Expo SDK 55 + TypeScript
- Supabase (Auth + PostgreSQL + Storage)
- React Navigation (stack navigator)
- TanStack Query v5
- Zustand v5 (solo en impostor)
- React Hook Form + Zod
- AsyncStorage (ya instalado)
- Design tokens en src/shared/constants/theme.ts (fuente única de verdad)
- Todos los comentarios en español
- Sin TypeScript any

## Modelo de negocio definido
- Al finalizar una juntada, el organizador elige si habilita reseñas o no
- Si habilita: todos los participantes pueden dejar una reseña individual
- Cada reseña tiene: rating (1-5 estrellas), comment (texto libre, opcional)
- Un participante puede editar o eliminar su propia reseña
- Nadie puede tocar la reseña de otro
- Una vez habilitadas las reseñas, no se pueden deshabilitar
- El organizador puede reseñar como cualquier participante
- Si la juntada se reactiva, las reseñas se conservan pero no se pueden
  agregar nuevas hasta que se vuelva a finalizar con reviews habilitadas

## Tu tarea
Realizá las siguientes tareas en orden.
Completá y reportá cada una antes de pasar a la siguiente.

---

### Tarea 1 — Migración de base de datos

Crear supabase/migrations/007_meetup_reviews.sql con:

1. Columna reviews_enabled BOOLEAN NOT NULL DEFAULT false en tabla meetups

2. Tabla meetup_reviews:
   - id UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - meetup_id UUID NOT NULL REFERENCES meetups(id) ON DELETE CASCADE
   - user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
   - rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5)
   - comment TEXT NULL
   - created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   - updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   - UNIQUE(meetup_id, user_id) — un usuario, una reseña por juntada

3. Trigger updated_at en meetup_reviews (igual al patrón usado en otras tablas)

4. RLS en meetup_reviews:
   - SELECT: cualquier miembro activo o que haya participado en la juntada
   - INSERT: participante de la juntada, solo si reviews_enabled = true
     y la juntada está finished, y no tiene reseña previa
   - UPDATE: solo el autor de la reseña (user_id = auth.uid())
   - DELETE: solo el autor de la reseña

5. Comentarios en español en todo el SQL

IMPORTANTE: solo generás el archivo SQL, no lo ejecutés.
La migración la ejecuta el equipo manualmente en el SQL Editor de Supabase.

Archivos esperados:
- supabase/migrations/007_meetup_reviews.sql

---

### Tarea 2 — Actualizar tipos y servicio de meetups

Contexto:
- El tipo Meetup está en src/features/meetups/types.ts
- meetupService.ts maneja todo lo relacionado a meetups
- El método de finalizar juntada existe pero hay que modificarlo

Alcance:
1. Agregar reviews_enabled?: boolean al tipo Meetup en meetups/types.ts
2. Agregar mapeo de reviews_enabled en mapMeetupRow si existe

3. Modificar el método finalizeMeetup (o como se llame) en meetupService.ts:
   - Ahora recibe un parámetro adicional reviewsEnabled: boolean
   - Actualiza status = 'finished' Y reviews_enabled = reviewsEnabled
   - Si reviewsEnabled = false, solo cambia el status
   - Retorna { data: null, error }

No hacer:
- No modificar otros métodos
- No tocar otros servicios

Archivos esperados:
- src/features/meetups/types.ts (reviews_enabled agregado)
- src/features/meetups/services/meetupService.ts (finalizeMeetup modificado)

---

### Tarea 3 — Nuevo feature: reviews

Crear el módulo completo src/features/reviews/ con la siguiente estructura:

src/features/reviews/
├── types.ts
├── services/reviewService.ts
├── hooks/useReviews.ts
└── schemas/reviewSchemas.ts

**types.ts:**
- Tipo Review: id, meetupId, userId, rating, comment, createdAt, updatedAt
- Tipo ReviewWithProfile: Review + profile (id, fullName, avatarUrl)
- Tipo CreateReviewInput: rating, comment?
- Tipo UpdateReviewInput: rating?, comment?

**reviewService.ts:**
- getReviews(meetupId): retorna ReviewWithProfile[] con join a profiles
- getUserReview(meetupId, userId): retorna Review | null de ese usuario
- createReview(meetupId, userId, input: CreateReviewInput): retorna { data, error }
- updateReview(reviewId, input: UpdateReviewInput): retorna { data, error }
- deleteReview(reviewId): retorna { data, error }
- getAverageRating(meetupId): retorna { average: number, count: number }
  calculado en el cliente desde las reseñas obtenidas

**useReviews.ts con TanStack Query v5:**
- useReviews(meetupId): useQuery con key ['reviews', meetupId]
- useUserReview(meetupId, userId): useQuery con key ['userReview', meetupId, userId]
- useCreateReview(meetupId): useMutation, en onSuccess invalida
  ['reviews', meetupId] y ['userReview', meetupId, userId]
- useUpdateReview(meetupId): useMutation, invalida las mismas queries
- useDeleteReview(meetupId): useMutation, invalida las mismas queries

**reviewSchemas.ts:**
- Schema Zod para CreateReviewInput y UpdateReviewInput
- rating: número entre 1 y 5
- comment: string opcional, máximo 500 caracteres

No hacer:
- No crear pantallas todavía
- No tocar navegación

Archivos esperados:
- src/features/reviews/types.ts
- src/features/reviews/services/reviewService.ts
- src/features/reviews/hooks/useReviews.ts
- src/features/reviews/schemas/reviewSchemas.ts

---

### Tarea 4 — Modificar el modal de finalizar juntada

Contexto:
- MeetupOrganizerActions.tsx tiene la acción de finalizar juntada
- Actualmente el modal de confirmación es simple (confirmar/cancelar)
- Hay que agregar la elección de habilitar reseñas antes de confirmar

Alcance:
Modificar el modal de confirmación de "Finalizar juntada" en
MeetupOrganizerActions.tsx:

1. Agregar un toggle o switch en el modal con texto:
   "¿Querés que los participantes puedan dejar una reseña de esta juntada?"
   - Por defecto: desactivado (false)
   - Usar Switch de React Native

2. Al confirmar, llamar a finalizeMeetup con el valor del toggle

3. El diseño del modal debe ser consistente con los modales existentes
   en la app. El toggle va entre el texto de confirmación y los botones.

4. Feedback de éxito con toast ✓ y haptic igual que otras acciones

No hacer:
- No cambiar otros modales ni acciones
- No tocar otros archivos

Archivos esperados:
- src/features/meetups/components/MeetupOrganizerActions.tsx (modificado)

---

### Tarea 5 — Pantalla de crear/editar reseña

Crear src/features/reviews/screens/ReviewFormScreen.tsx

Comportamiento:
- Sirve tanto para crear como para editar (si ya existe userReview, precarga los datos)
- Parámetros de navegación: meetupId, meetupTitle
- Campos: rating (1-5 estrellas interactivo, obligatorio) + comment (opcional, max 500 chars)
- Estrellas: 5 íconos de estrella tocables, se iluminan según el rating seleccionado
- Botón "Guardar reseña" que llama a createReview o updateReview según corresponda
- Si es edición: botón "Eliminar reseña" con confirmación antes de ejecutar
- En éxito: navegar atrás con toast ✓ y haptic
- En error: mostrar mensaje de error sin navegar

UI:
- Seguir exactamente los tokens de theme.ts
- Título de la pantalla: "Tu reseña" en el header
- Subtítulo con el nombre de la juntada
- Componente de estrellas con tamaño generoso (mínimo 36dp por estrella)
- Input de comentario multilínea (4 líneas visibles)
- Contador de caracteres visible bajo el input

No hacer:
- No registrar la ruta todavía (se hace en Tarea 7)
- No instalar librerías de íconos nuevas,
  usar @expo/vector-icons que ya está instalado

Archivos esperados:
- src/features/reviews/screens/ReviewFormScreen.tsx

---

### Tarea 6 — Sección de reseñas en el detalle de juntada

Contexto:
- MeetupDetailScreen.tsx es el orquestador del detalle
- Solo se muestra si la juntada está finished Y reviews_enabled = true
- Los participantes ven las reseñas de todos
- Cada participante ve un botón para dejar/editar su propia reseña

Alcance:
Crear src/features/reviews/components/ReviewsSection.tsx

Props:
- meetupId: string
- currentUserId: string
- reviewsEnabled: boolean
- meetupStatus: string
- onAddReview: () => void — callback para navegar a ReviewFormScreen

Comportamiento:
- Si reviewsEnabled = false o status != 'finished': no renderizar nada (return null)
- Si reviewsEnabled = true y finished:
  * Mostrar promedio de estrellas y cantidad de reseñas
  * Si count = 0: texto "Todavía no hay reseñas. ¡Sé el primero!"
  * Lista de reseñas: avatar + nombre + estrellas + comentario
  * Si el usuario actual tiene reseña: botón "Editar mi reseña" (navega a ReviewFormScreen)
  * Si no tiene reseña: botón "Dejar mi reseña" (navega a ReviewFormScreen)

Usar useReviews y useUserReview del hook creado en Tarea 3.

Luego integrar ReviewsSection en MeetupDetailScreen.tsx
debajo de la información principal de la juntada,
solo cuando meetup.status === 'finished'.

No hacer:
- No modificar la lógica existente del detalle
- No tocar otros componentes

Archivos esperados:
- src/features/reviews/components/ReviewsSection.tsx (nuevo)
- src/features/meetups/screens/MeetupDetailScreen.tsx (integración)

---

### Tarea 7 — Navegación y rutas

Contexto:
- Las rutas están en src/navigation/routes.ts
- Los tipos están en src/navigation/types.ts
- MainNavigator registra todas las pantallas

Alcance:
1. Agregar Routes.ReviewForm en routes.ts
2. Agregar ReviewForm: { meetupId: string, meetupTitle: string }
   en MainStackParamList en navigation/types.ts
3. Registrar ReviewFormScreen en MainNavigator
4. Conectar el callback onAddReview de ReviewsSection
   para navegar a Routes.ReviewForm con los params correctos

No hacer:
- No cambiar rutas existentes
- No modificar otros navigators

Archivos esperados:
- src/navigation/routes.ts (modificado)
- src/navigation/types.ts (modificado)
- src/navigation/MainNavigator.tsx (modificado)
- src/features/meetups/screens/MeetupDetailScreen.tsx (navegación conectada)

---

### Tarea 8 — Card de reseña pendiente en el home

Contexto:
- MeetupHomeScreen muestra las juntadas activas del usuario
- Cuando una juntada se finaliza con reviews_enabled = true
  y el usuario no dejó su reseña ni descartó la card,
  debe aparecer una card/banner en el home recordándoselo
- El estado "descartado" se guarda en AsyncStorage
  con key 'review_dismissed_{meetupId}'
- AsyncStorage ya está instalado

Alcance:
1. Crear src/features/reviews/hooks/usePendingReviews.ts:
   - Obtiene todas las juntadas finished con reviews_enabled = true
     donde el usuario participó
   - Para cada una verifica si el usuario ya tiene reseña (useReviews)
     y si ya descartó la card (AsyncStorage)
   - Retorna lista de meetups pendientes de reseña

2. Crear src/features/reviews/components/PendingReviewCard.tsx:
   - Card con: nombre de la juntada, texto "¿Cómo estuvo?",
     estrellas decorativas, botón "Dejar reseña" y botón X para descartar
   - Al presionar X: guarda en AsyncStorage y desaparece
   - Al presionar "Dejar reseña": navega a ReviewFormScreen
   - Diseño no invasivo pero visible, consistente con theme.ts
   - Animación suave de entrada (FadeIn) usando Animated de React Native

3. Integrar en MeetupHomeScreen.tsx:
   - Mostrar PendingReviewCards encima de la lista de juntadas activas
   - Si no hay pendientes, no renderizar nada extra
   - Si hay varias, mostrarlas apiladas (una por juntada)

No hacer:
- No modificar la lógica de carga de juntadas activas
- No instalar librerías de animación

Archivos esperados:
- src/features/reviews/hooks/usePendingReviews.ts (nuevo)
- src/features/reviews/components/PendingReviewCard.tsx (nuevo)
- src/features/meetups/screens/MeetupHomeScreen.tsx (integración)

---

### Tarea 9 — Indicador en historial

Contexto:
- MeetupHistoryScreen muestra las juntadas finalizadas y canceladas
- Las juntadas con reviews_enabled = true y al menos una reseña
  deberían tener un indicador visual

Alcance:
En MeetupHistoryScreen.tsx (o en el componente de card del historial
si existe como componente separado):
- Si la juntada tiene reviews_enabled = true: mostrar un badge o ícono
  de estrella pequeño junto al título
- El badge es puramente decorativo/informativo, no es un botón
- El detalle completo de reseñas se ve al entrar al detalle de la juntada

No hacer:
- No cargar las reseñas en el historial (solo el flag reviews_enabled)
- No modificar la lógica de carga del historial

Archivos esperados:
- src/features/meetups/screens/MeetupHistoryScreen.tsx (modificado)

---

### Tarea 10 — Prompt de documentación del bloque

Crear ia/entrega-2/prompts/bloque-2/01_resumen_post_juntada.md
con el contenido completo de este prompt.

Crear ia/entrega-2/conversaciones/bloque-2/cursor-bloque-2-completo.md
con la siguiente estructura base:

# Conversación Bloque 2 — Reseñas post-juntada

**Herramienta:** Cursor Agent
**Rama:** feature/bloque-2-resumen-post-juntada

## Resumen

### Lo que se implementó
[Completar al finalizar]

### Decisiones tomadas
[Completar al finalizar]

### Problemas encontrados y resueltos
[Completar al finalizar]

### Deuda técnica documentada
[Completar al finalizar]

## Conversación completa
[Pegar acá la conversación exportada de Cursor]

Actualizar ia/entrega-2/indice_ia.md agregando:
13 - Migración meetup_reviews y campo reviews_enabled
14 - Módulo reviews: service, hook, schemas
15 - Modal de finalizar juntada con toggle de reseñas
16 - Pantalla ReviewFormScreen (crear/editar reseña)
17 - Componente ReviewsSection en detalle de juntada
18 - Card de reseña pendiente en home (PendingReviewCard)
19 - Indicador de reseñas en historial

No hacer:
- No tocar archivos de código
- No hacer commits

Archivos esperados:
- ia/entrega-2/prompts/bloque-2/01_resumen_post_juntada.md
- ia/entrega-2/conversaciones/bloque-2/cursor-bloque-2-completo.md
- ia/entrega-2/indice_ia.md (actualizado)

---

## Reglas generales
- No instalar dependencias adicionales
- No tocar android/ ni ios/
- No hacer commits
- Comentarios en español
- Sin TypeScript any
- Seguir tokens de src/shared/constants/theme.ts para todo elemento visual
- Reportar archivos modificados y decisiones al finalizar cada tarea
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar todo el bloque
Generar resumen con:
1. Archivos creados
2. Archivos modificados
3. Decisiones tomadas
4. Cosas a revisar manualmente o probar en dispositivo

### Respuesta

Implementando el Bloque 2 completo. Explorando el código existente para seguir los patrones del proyecto.

---

Implementando las 10 tareas en orden. Creando la migración y los archivos base.

---

Implementando Tarea 4: modal de finalización en `MeetupOrganizerActions` y actualizando hooks relacionados.

---

Bloque 2 completado. Resumen por tarea y cierre del bloque:

---

## Tarea 1 — Migración DB ✓

**Archivo creado:** `supabase/migrations/007_meetup_reviews.sql`

- Columna `reviews_enabled BOOLEAN NOT NULL DEFAULT false` en `meetups`
- Tabla `meetup_reviews` con constraints y `UNIQUE(meetup_id, user_id)`
- Trigger `updated_at` reutilizando `update_updated_at()`
- Función `is_meetup_participant()` para RLS SELECT (activos + ex-participantes)
- Políticas RLS: SELECT, INSERT (finished + reviews_enabled + sin reseña previa), UPDATE/DELETE solo autor
- Comentarios en español

**Pendiente:** ejecutar manualmente en Supabase SQL Editor.

---

## Tarea 2 — Tipos y servicio ✓

**Archivos modificados:**
- `src/features/meetups/types.ts` — `reviews_enabled?: boolean`
- `src/features/meetups/services/meetupService.ts` — `finishMeetup(meetupId, userId, reviewsEnabled)` actualiza `status` + `reviews_enabled`, retorna `{ data: null, error }`

---

## Tarea 3 — Módulo reviews ✓

**Archivos creados:**
- `src/features/reviews/types.ts`
- `src/features/reviews/services/reviewService.ts`
- `src/features/reviews/hooks/useReviews.ts`
- `src/features/reviews/schemas/reviewSchemas.ts`

---

## Tarea 4 — Modal finalizar ✓

**Archivo modificado:** `MeetupOrganizerActions.tsx`

- Switch “¿Querés que los participantes puedan dejar una reseña…?” (default: off)
- Llama a `finish(reviewsEnabled)` al confirmar
- Toast ✓ + haptic en éxito

**Decisión:** el modal de finalizar se movió desde `MeetupDetailScreen` a `MeetupOrganizerActions` (mismo patrón que transferencia). Se tocó `MeetupDetailScreen` mínimamente para quitar el modal duplicado.

**Archivos adicionales tocados:** `useMeetups.ts`, `useMeetupDetail.ts`, `MeetupDetailScreen.tsx`

---

## Tareas 5–9 ✓

| Tarea | Archivo(s) |
|-------|-----------|
| 5 — ReviewFormScreen | `src/features/reviews/screens/ReviewFormScreen.tsx` |
| 6 — ReviewsSection | `ReviewsSection.tsx` + integración en `MeetupDetailScreen.tsx` |
| 7 — Navegación | `routes.ts`, `types.ts`, `MainNavigator.tsx` |
| 8 — Home pendientes | `usePendingReviews.ts`, `PendingReviewCard.tsx`, `MeetupHomeScreen.tsx` |
| 9 — Historial | `MeetupHistoryScreen.tsx` (estrella si `reviews_enabled`) |

---

## Tarea 10 — Documentación ✓

- `ia/entrega-2/prompts/bloque-2/01_resumen_post_juntada.md`
- `ia/entrega-2/conversaciones/bloque-2/cursor-bloque-2-completo.md`
- `ia/entrega-2/indice_ia.md` (ítems 13–19)

---

## Resumen final del bloque

### Archivos creados (12)
1. `supabase/migrations/007_meetup_reviews.sql`
2. `src/features/reviews/types.ts`
3. `src/features/reviews/services/reviewService.ts`
4. `src/features/reviews/hooks/useReviews.ts`
5. `src/features/reviews/schemas/reviewSchemas.ts`
6. `src/features/reviews/screens/ReviewFormScreen.tsx`
7. `src/features/reviews/components/ReviewsSection.tsx`
8. `src/features/reviews/hooks/usePendingReviews.ts`
9. `src/features/reviews/components/PendingReviewCard.tsx`
10. `ia/entrega-2/prompts/bloque-2/01_resumen_post_juntada.md`
11. `ia/entrega-2/conversaciones/bloque-2/cursor-bloque-2-completo.md`

### Archivos modificados (11)
1. `src/features/meetups/types.ts`
2. `src/features/meetups/services/meetupService.ts`
3. `src/features/meetups/hooks/useMeetups.ts`
4. `src/features/meetups/hooks/useMeetupDetail.ts`
5. `src/features/meetups/components/MeetupOrganizerActions.tsx`
6. `src/features/meetups/screens/MeetupDetailScreen.tsx`
7. `src/features/meetups/screens/MeetupHomeScreen.tsx`
8. `src/features/meetups/screens/MeetupHistoryScreen.tsx`
9. `src/navigation/routes.ts`
10. `src/navigation/types.ts`
11. `src/navigation/MainNavigator.tsx`
12. `ia/entrega-2/indice_ia.md`

### Decisiones tomadas
- Modal de finalizar centralizado en `MeetupOrganizerActions`
- Badge en historial solo con `reviews_enabled` (sin cargar reseñas)
- `is_meetup_participant()` para RLS que incluye ex-participantes
- Zod v4: `{ message: '...' }` en lugar de `required_error`

### Validar manualmente en dispositivo
1. **Ejecutar migración 007** en Supabase SQL Editor
2. Finalizar juntada con toggle ON/OFF y verificar `reviews_enabled` en DB
3. Crear/editar/eliminar reseña como participante
4. Ver `ReviewsSection` en detalle de juntada finalizada
5. Card pendiente en home + descartar con X (AsyncStorage)
6. Badge de estrella en historial
7. Verificar que RLS impide reseñar en juntadas activas o sin `reviews_enabled`

TypeScript compila sin errores (`npx tsc --noEmit` ✓).

### Archivos modificados

- `supabase/migrations/007_meetup_reviews.sql` — modificado
- `mobile/src/features/meetups/types.ts` — modificado
- `mobile/src/features/meetups/services/meetupService.ts` — modificado
- `mobile/src/features/reviews/types.ts` — modificado
- `mobile/src/features/reviews/schemas/reviewSchemas.ts` — modificado
- `mobile/src/features/reviews/services/reviewService.ts` — modificado
- `mobile/src/features/reviews/hooks/useReviews.ts` — modificado
- `mobile/src/features/meetups/hooks/useMeetups.ts` — modificado
- `mobile/src/features/meetups/hooks/useMeetupDetail.ts` — modificado
- `mobile/src/features/meetups/components/MeetupOrganizerActions.tsx` — modificado
- `mobile/src/features/meetups/screens/MeetupDetailScreen.tsx` — modificado
- `mobile/src/features/reviews/screens/ReviewFormScreen.tsx` — modificado
- `mobile/src/features/reviews/components/ReviewsSection.tsx` — modificado
- `mobile/src/navigation/routes.ts` — modificado
- `mobile/src/navigation/types.ts` — modificado
- `mobile/src/navigation/MainNavigator.tsx` — modificado
- `mobile/src/features/reviews/hooks/usePendingReviews.ts` — modificado
- `mobile/src/features/reviews/components/PendingReviewCard.tsx` — modificado
- `mobile/src/features/meetups/screens/MeetupHomeScreen.tsx` — modificado
- `mobile/src/features/meetups/screens/MeetupHistoryScreen.tsx` — modificado


<details>
<summary>Metadatos del intercambio</summary>

- **Transcript:** `c7ea03c3-b939-4524-866d-72a6afc41a41`
- **Índice:** 0

</details>

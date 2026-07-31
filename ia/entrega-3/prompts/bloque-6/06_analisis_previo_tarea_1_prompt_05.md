# Analisis previo - Tarea 1 del Prompt 05

## Contexto

Se ejecuto la Tarea 1 del Prompt 05 del Bloque 6 sin tocar codigo fuente de la aplicacion.

Objetivo: revisar tablas, policies, servicios, hooks, navegacion y pantallas de juegos antes de implementar estadisticas por juntada y registro de resultados.

Por indicacion del equipo, se omite en este documento la decision especifica de numeracion de migraciones.

## Tablas y policies revisadas

### meetups

Tabla base existente en `supabase/migrations/001_initial_schema.sql`.

Campos relevantes:

- `id`
- `status`
- `join_code`
- `created_by`
- `created_at`
- `updated_at`
- `cancelled_at`
- `group_id`, agregado por Bloque 4 en migracion posterior

Policies relevantes:

- SELECT original por organizador o participante.
- SELECT actual reemplazado por `is_active_meetup_member(id)` en `002_fix_rls_circular.sql`.
- INSERT propio con `created_by = auth.uid()`.
- UPDATE propio con `created_by = auth.uid()`.

### meetup_participants

Tabla base existente en `supabase/migrations/001_initial_schema.sql`.

Campos relevantes:

- `meetup_id`
- `user_id`
- `role`
- `attendance_status`
- `left_at`

Policies relevantes:

- SELECT de fila propia.
- SELECT de co-participantes si el usuario es miembro activo mediante `is_active_meetup_member(meetup_id)`.
- INSERT propio.
- UPDATE propio.
- UPDATE como organizador.

### impostor_games

Tabla base existente en `supabase/migrations/001_initial_schema.sql`.

Campos relevantes:

- `meetup_id`
- `created_by`
- `topic`
- `normal_prompt`
- `impostor_prompt`
- `impostor_user_id`
- `status`
- `created_at`
- `started_at`
- `finished_at`

Limitacion: registra inicio/estado del juego, pero no define ganador ni cierre estadistico util para Bloque 6.

### meetup_reviews

Tabla existente en `supabase/migrations/007_meetup_reviews.sql`.

Campos relevantes:

- `meetup_id`
- `user_id`
- `rating`
- `comment`
- `created_at`
- `updated_at`

Patron util para Bloque 6:

- `is_meetup_participant(meetup_id)` permite lectura a participantes activos o historicos.
- INSERT exige participante activo y condiciones de negocio propias de reviews.

Decision de diseno para resultados:

- `game_results` deberia permitir SELECT a participantes historicos de la juntada, siguiendo el criterio de reviews.
- `game_results` deberia permitir INSERT solo a participantes activos de la juntada.
- No se agregan UPDATE ni DELETE en esta etapa.

## Patron de servicios y hooks

Servicios:

- Viven dentro de cada feature.
- Encapsulan Supabase.
- Devuelven siempre `{ data, error }`.
- No obligan a las pantallas a capturar excepciones.
- Mapean filas snake_case a tipos de dominio camelCase.
- Devuelven mensajes de error en espanol.

Hooks:

- Usan TanStack Query.
- Las queries relanzan errores para que Query gestione estado de error.
- Las mutaciones invalidan queries relacionadas al completar sin error.

Patron propuesto:

- Feature nueva `mobile/src/features/gameResults/`.
- Query key de resultados: `['gameResults', meetupId]`.
- Query key de estadisticas: puede derivarse de resultados o exponerse como `['gameStats', meetupId]`.

## Navegacion necesaria

Agregar pantalla `MeetupStats`.

Archivos a tocar:

- `mobile/src/navigation/routes.ts`
- `mobile/src/navigation/types.ts`
- `mobile/src/navigation/MainNavigator.tsx`

Parametros esperados:

- `meetupId: string`
- `meetupTitle?: string`
- `isActive?: boolean`

## Puntos de guardado detectados

### Truco

Archivo: `mobile/src/features/games/screens/TrucoGameScreen.tsx`.

Punto exacto:

- `handleFinish`
- boton final visible cuando `state.isFinished`

Datos disponibles:

- `teamAName`
- `teamBName`
- `targetPoints`
- `meetupId`
- `state.scoreA`
- `state.scoreB`
- `state.winnerName`

### Generala

Archivo: `mobile/src/features/games/screens/GeneralaGameScreen.tsx`.

Punto exacto:

- `handleFinish`
- boton final visible cuando `state.isFinished`

Datos disponibles:

- `players`
- `meetupId`
- `state.players`
- `state.winnerName`
- totales calculables con `calculateTotalScore`
- categorias anotadas e indicador `isServido`

### Liga

Archivo: `mobile/src/features/games/screens/LeagueGameScreen.tsx`.

Punto exacto:

- `handleFinish`
- boton final visible cuando `isFinished`

Datos disponibles:

- `teams`
- `meetupId`
- `matches`
- `tableStats`
- campeon: `tableStats[0]?.teamName`

### Torneo

Archivo: `mobile/src/features/games/screens/TournamentGameScreen.tsx`.

Punto exacto:

- `handleFinish`
- boton final visible cuando `state.winnerName`

Datos disponibles:

- `players`
- `meetupId`
- `state.rounds`
- `state.winnerName`

## Ambiguedades y riesgos

### Anotador generico

`ScorerSetupScreen` recibe `meetupId`, pero no lo pasa a `ScorerGameScreen`.

`ScorerGameScreen` no tiene un cierre real de partida ni boton de guardar resultado. Solo muestra avisos no bloqueantes cuando alguien alcanza el objetivo.

Decision propuesta: dejarlo fuera de la primera implementacion y documentar la limitacion.

### Impostor

No existe ganador ni cierre estadistico. La tabla `impostor_games` no alcanza para calcular resultado.

Decision propuesta: no implementar persistencia estadistica de Impostor en esta etapa.

### Validacion TypeScript

`mobile/src/features/games/types/truco.ts` esta corrupto con numeros de linea incrustados. Debe corregirse en un cambio chico separado antes de validar TypeScript con senal limpia.

## Implementacion por grupos chicos

1. Fix tecnico minimo: limpiar `truco.ts`.
2. Migracion `game_results` con RLS.
3. Tipos, servicio y hooks `gameResults`.
4. Navegacion y `MeetupStatsScreen`.
5. Entrada desde `MeetupDetailScreen`.
6. Guardado desde Truco y Generala.
7. Guardado desde Liga y Torneo.
8. Documentacion de cierre del Prompt 05.

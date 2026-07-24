# Prompt 05 - Bloque 6: Estadisticas por Juntada y Registro de Resultados

## Contexto

Rama actual: `feature/bloque-6-estadisticas`

En el marco de la Entrega 3, implementar el Bloque 6 correspondiente a **RF-43 - Registro y estadisticas de juegos**.

El alcance confirmado es:

- registrar resultados solo de juegos iniciados dentro del contexto de una juntada (`meetupId`);
- mostrar estadisticas por juntada desde el detalle del evento;
- acumular primero por evento y dejar preparado el contrato conceptual para futuras estadisticas por grupo;
- no guardar resultados de juegos iniciados desde el tab principal de Juegos sin `meetupId`;
- no implementar CRUD de resultados ni ranking global;
- no implementar UI final de grupos porque Bloque 4 todavia no esta implementado.

Stack relevante:

- React Native + Expo SDK 55 + TypeScript.
- Supabase con migraciones SQL en `supabase/migrations/`.
- React Navigation con rutas centralizadas en `src/navigation/routes.ts`, `src/navigation/types.ts` y `src/navigation/MainNavigator.tsx`.
- TanStack Query ya utilizado en hooks existentes.
- Design tokens desde `src/shared/constants/theme.ts`.
- Componentes existentes: `AppButton`, `SuccessAnimation`, `ErrorAnimation`.

Referencias internas ya documentadas:

- `ia/entrega-3/prompts/bloque-6/01_analisis_dependencias_estadisticas_grupos.md`
- `ia/entrega-3/prompts/bloque-6/02_alcance_flujo_figma_apk.md`
- `ia/entrega-3/prompts/bloque-6/03_referencias_visuales_diseno_estadisticas.md`
- `ia/entrega-3/prompts/bloque-6/04_decisiones_preimplementacion_estadisticas.md`

## Tarea 1 - Analisis previo obligatorio

Antes de tocar archivos, reportar:

1. Que tablas y politicas existen hoy para `meetups`, `meetup_participants`, `impostor_games` y `meetup_reviews`.
2. Que patron de servicio/hook usa el proyecto para leer y escribir datos en Supabase.
3. Que rutas y tipos deben agregarse para una pantalla nueva `MeetupStats`.
4. En que puntos exactos de `TrucoGameScreen`, `GeneralaGameScreen`, `LeagueGameScreen` y `TournamentGameScreen` se puede disparar el guardado.
5. Si hay alguna ambiguedad o riesgo que deba consultarse antes de implementar.

No modificar ningun archivo durante esta tarea.

## Tarea 2 - Migracion de resultados de juegos

Crear una migracion nueva en `supabase/migrations/` con nombre consecutivo.

Crear tabla `game_results` con, como minimo:

- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `meetup_id UUID NOT NULL REFERENCES meetups(id) ON DELETE CASCADE`
- `created_by UUID REFERENCES profiles(id) ON DELETE SET NULL`
- `game_type TEXT NOT NULL`
- `winner_name TEXT NOT NULL`
- `winner_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL`
- `participants JSONB NOT NULL DEFAULT '[]'::jsonb`
- `score_summary JSONB NOT NULL DEFAULT '{}'::jsonb`
- `metadata JSONB NOT NULL DEFAULT '{}'::jsonb`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

Agregar indices para:

- `meetup_id`
- `game_type`
- `winner_name`
- `created_at`

Habilitar RLS.

Politicas esperadas:

1. `SELECT`: usuarios que participan actualmente o participaron de la juntada asociada pueden ver resultados.
2. `INSERT`: usuarios que participan de la juntada activa pueden insertar resultados.

No agregar `UPDATE` ni `DELETE` en esta etapa.

## Tarea 3 - Tipos, servicio y hooks

Crear feature o submodulo para resultados/estadisticas de juegos siguiendo el patron existente del repo.

Archivos sugeridos:

- `src/features/gameResults/types.ts`
- `src/features/gameResults/services/gameResultService.ts`
- `src/features/gameResults/hooks/useGameResults.ts`

Definir tipos sin usar `any`.

Tipos esperados:

- `GameType`: `truco | generala | league | tournament | scorer | impostor`
- `GameResult`
- `CreateGameResultInput`
- `MeetupGameStats`
- tipos auxiliares para participantes, resumen de puntaje y metadata usando `Record<string, unknown>` o estructuras mas especificas.

Servicio esperado:

- `createResult(input)`
- `getResultsByMeetup(meetupId)`
- `getStatsByMeetup(meetupId)`

Reglas:

- si no hay `meetupId`, no llamar al servicio;
- devolver errores legibles en espanol;
- calcular estadisticas por juntada del lado cliente a partir de resultados obtenidos;
- invalidar queries al crear un resultado.

## Tarea 4 - Navegacion y pantalla Estadisticas

Agregar ruta:

- constante `MeetupStats` en `routes.ts`;
- tipo `MeetupStats: { meetupId: string; meetupTitle?: string; isActive?: boolean }` en `types.ts`;
- registro en `MainNavigator.tsx`.

Crear pantalla:

- `src/features/gameResults/screens/MeetupStatsScreen.tsx`

Contenido visual:

1. Header con titulo **Estadisticas** y boton volver.
2. Resumen superior:
   - total de partidas;
   - cantidad de juegos distintos;
   - ganador mas frecuente si existe.
3. Ranking de ganadores:
   - nombre;
   - cantidad de victorias;
   - chips o subtitulo con juegos ganados si queda claro.
4. Distribucion por juego:
   - conteo por tipo.
5. Seccion **Resultados registrados**:
   - card por resultado;
   - juego;
   - ganador;
   - resumen de puntaje;
   - fecha/hora.
6. Empty state:
   - si `isActive` es verdadero, mostrar accion para ir a `Games` con `meetupId`;
   - si no, solo mensaje informativo.

Usar el lenguaje visual del historial: cards blancas, chips suaves, violeta como accion principal, estructura compacta.

## Tarea 5 - Entrada desde Detalle de Juntada

Modificar `MeetupDetailScreen.tsx`.

Agregar una tercera `ActionCard` junto a `Jugar` y `Recuerdos`:

- label: `Estadisticas`
- icono sugerido: `stats-chart` o equivalente disponible en Ionicons
- visible si:
  - la juntada no esta cancelada;
  - el usuario no abandono;
  - la juntada esta activa o finalizada.

Comportamiento:

- navegar a `Routes.MeetupStats` con `meetupId`, `meetupTitle` e `isActive`.

No modificar las reglas existentes de `Jugar`, `Recuerdos`, participantes, reviews ni acciones de organizador.

## Tarea 6 - Guardado desde Truco

Modificar `TrucoGameScreen.tsx`.

Cuando `state.isFinished` y existe `meetupId`:

- cambiar label del boton a `Guardar resultado y salir`;
- al presionar, guardar resultado con:
  - `game_type: 'truco'`;
  - `winner_name: state.winnerName`;
  - participantes/equipos: nombres de ambos equipos;
  - `score_summary`: marcador final, puntos objetivo;
  - `metadata`: datos relevantes del modo de juego.

Despues de guardar:

- mostrar feedback de exito;
- navegar al detalle de la juntada.

Si no hay `meetupId`, mantener comportamiento actual `Finalizar y Salir` sin persistir.

Evitar doble guardado si el usuario toca dos veces.

## Tarea 7 - Guardado desde Generala

Modificar `GeneralaGameScreen.tsx`.

Cuando `state.isFinished` y existe `meetupId`:

- cambiar label del boton a `Guardar resultado y salir`;
- guardar resultado con:
  - `game_type: 'generala'`;
  - `winner_name: state.winnerName`;
  - participantes: jugadores;
  - `score_summary`: totales por jugador;
  - `metadata`: planilla resumida por jugador, categorias y si fue servido.

Despues de guardar:

- mostrar feedback de exito;
- navegar al detalle de la juntada.

Si no hay `meetupId`, mantener comportamiento actual sin persistir.

Evitar doble guardado.

## Tarea 8 - Guardado desde Liga y Torneo

Modificar `LeagueGameScreen.tsx` y `TournamentGameScreen.tsx`.

Liga:

- cuando `isFinished` y existe `meetupId`, guardar:
  - `game_type: 'league'`;
  - campeon como `winner_name`;
  - equipos;
  - tabla final resumida;
  - partidos con resultados cargados.

Torneo:

- cuando `state.winnerName` y existe `meetupId`, guardar:
  - `game_type: 'tournament'`;
  - campeon como `winner_name`;
  - jugadores;
  - rondas y ganadores por llave de forma resumida.

En ambos:

- cambiar label a `Guardar resultado y salir` cuando corresponda;
- si no hay `meetupId`, mantener comportamiento actual;
- evitar doble guardado;
- volver al Detalle de Juntada tras guardar.

## Tarea 9 - Anotador generico e Impostor

No implementar persistencia completa si requiere cambios grandes.

Para Anotador generico:

- revisar si `ScorerGame` recibe `meetupId`;
- si el ajuste es chico, transportar `meetupId` desde `ScorerSetup` a `ScorerGame`;
- guardar solo si hay ganador claro por objetivo;
- si no hay criterio claro, dejar documentada la limitacion.

Para Impostor:

- no inventar ganador ni aciertos;
- no bloquear el Bloque 6;
- dejar documentado que hoy solo existe registro de inicio en `impostor_games` y que el cierre estadistico requiere una decision futura de gameplay.

## Tarea 10 - Documentacion del prompt

Crear o actualizar este archivo:

`ia/entrega-3/prompts/bloque-6/05_prompt_implementacion_estadisticas_juntada.md`

Actualizar:

`ia/entrega-3/indice_ia.md`

Agregar una entrada del Bloque 6 para este prompt.

## Reglas generales

- Escribir codigo, comentarios y mensajes visibles en espanol.
- No usar TypeScript `any`.
- No hacer commits.
- No instalar dependencias nuevas.
- No tocar funcionalidades ajenas al Bloque 6 salvo integraciones necesarias.
- No modificar Grupos porque todavia no esta implementado.
- No guardar resultados sin `meetupId`.
- Si una decision no esta clara, preguntar antes de asumir.
- Mantener cambios en grupos pequenos y reportar cada grupo al finalizar.

## Al finalizar reportar

1. Archivos creados y modificados.
2. Migracion creada y resumen de politicas RLS.
3. Decisiones tomadas durante la implementacion.
4. Limitaciones que quedaron fuera: Grupos, Impostor y Anotador generico si aplica.
5. Como probar:
   - abrir una juntada activa;
   - entrar a `Jugar`;
   - finalizar Truco/Generala/Liga/Torneo;
   - guardar resultado;
   - volver al detalle;
   - entrar a `Estadisticas`;
   - verificar resumen, ranking y resultados registrados;
   - abrir un juego desde el tab principal y confirmar que no guarda estadisticas.

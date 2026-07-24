# Bloque 6 - Fase 1 cerrada: Estadisticas de juntadas independientes

## Alcance cerrado

La primera fase del Bloque 6 queda cerrada con foco en estadisticas por juntada
independiente, sin depender todavia del modulo de grupos.

Se implemento RF-43 en una primera version operativa:

- registro de resultados de juegos asociados a una juntada;
- pantalla `Estadisticas` accesible desde Detalle de Juntada;
- resumen de partidas, cantidad de juegos, ganador mas frecuente, ranking,
  distribucion por juego y ultimos resultados;
- pantalla de historial completo de resultados;
- guardado automatico al finalizar juegos con resultado claro;
- fallback local solo en desarrollo cuando la migracion de Supabase todavia no
  esta aplicada.

## Fuentes y decisiones usadas

Se trabajo con:

- guia de Entrega 3 y flujo IA adaptado de Claude/Cursor a ChatGPT/Codex;
- `alcance_final.docx`;
- mapa de funcionalidades;
- Figma provisto por el equipo;
- capturas reales del APK con Hub de Juegos, Truco, Generala, Historial y
  Grupos;
- estado real de `entrega-3` despues del merge del Bloque 4.

Decision central: separar el Bloque 6 en dos fases.

1. Fase 1: estadisticas por juntada independiente y registro de resultados de
   juegos.
2. Fase 2: estadisticas por grupo, una vez disponible el modelo real de grupos
   y juntadas asociadas.

## Implementacion realizada

### Base de datos

- Nueva migracion `supabase/migrations/027_game_results.sql`.
- Nueva tabla `game_results`.
- Policies para que usuarios relacionados a la juntada puedan consultar y
  registrar resultados segun el alcance definido.

Nota: para testing local sin permisos de Supabase se agrego un fallback de
desarrollo en AsyncStorage. Ese fallback solo se activa en `__DEV__` cuando la
tabla `game_results` no existe o falta en el schema cache. No simula errores de
RLS ni reemplaza la migracion real.

### Feature mobile

Se agrego `mobile/src/features/gameResults/` con:

- tipos de resultado y estadisticas;
- servicio `gameResultService`;
- hook `useGameResults`;
- pantalla `MeetupStatsScreen`;
- pantalla `MeetupResultsHistoryScreen`;
- componente reutilizable `GameResultCard`.

### Navegacion

Se agregaron rutas:

- `MeetupStats`;
- `MeetupResultsHistory`.

La entrada a estadisticas vive en Detalle de Juntada como accion central entre
`Jugar` y `Recuerdos`.

### Juegos integrados

Guardan resultado cuando fueron iniciados desde una juntada:

- Truco;
- Generala;
- Liga;
- Torneo.

Si los juegos se inician fuera de una juntada, conservan el flujo anterior y no
persisten estadisticas.

## Correcciones aplicadas durante testing

- Mensajes de error especificos para migracion faltante y RLS.
- Fallback local de desarrollo para probar sin migracion aplicada.
- Ranking de ganadores case-insensitive:
  - agrupa diferencias de mayusculas/minusculas;
  - colapsa espacios repetidos;
  - conserva un nombre visible representativo.
- Pantalla `Estadisticas` muestra solo los ultimos 3 resultados.
- Pantalla `Historial de resultados` muestra el listado completo.
- Cards de resultados delimitadas con superficie, borde y sombra.
- Boton `Estadisticas` en Detalle:
  - misma card visual que `Jugar` y `Recuerdos`;
  - icono/texto naranja;
  - ubicado en el medio.
- Reset del stack al guardar una partida finalizada para evitar volver a la
  pantalla de juego y registrar resultados duplicados.

## Limites conscientes

- No se implemento estadistica por grupo en esta fase.
- No se resolvio equivalencia semantica de equipos con orden invertido
  (`Agus y Nico` vs `Nico y Agus`).
- No se agrego edicion/eliminacion de resultados.
- No se agrego cierre estadistico para Impostor porque no existe un flujo claro
  de ganador/cierre de partida.
- `ScorerGameScreen` no se integro porque no tiene cierre real de partida.
- El fallback local no debe considerarse backend definitivo.

## Verificacion realizada

- Testing manual en Expo/Android con resultados de Generala y otros flujos.
- Verificacion de que las estadisticas se actualizan.
- Verificacion de ranking case-insensitive.
- Verificacion de historial completo.
- Verificacion de que al guardar una partida y volver desde Detalle no se vuelve
  a la partida finalizada.
- `npx.cmd tsc --noEmit` paso sin errores despues de las correcciones.

## Evidencia granular

Los prompts y decisiones granulares quedan como respaldo:

- `prompts/bloque-6/01_analisis_dependencias_estadisticas_grupos.md`
- `prompts/bloque-6/02_alcance_flujo_figma_apk.md`
- `prompts/bloque-6/03_referencias_visuales_diseno_estadisticas.md`
- `prompts/bloque-6/04_decisiones_preimplementacion_estadisticas.md`
- `prompts/bloque-6/05_prompt_implementacion_estadisticas_juntada.md`
- `prompts/bloque-6/06_analisis_previo_tarea_1_prompt_05.md`
- `prompts/bloque-6/07_implementacion_estadisticas_juntada.md`
- `prompts/bloque-6/08_correccion_diagnostico_guardado_resultado.md`
- `prompts/bloque-6/09_fallback_local_testing_sin_migracion.md`
- `prompts/bloque-6/10_correccion_ranking_historial_resultados.md`
- `prompts/bloque-6/11_correccion_visual_cards_boton_estadisticas.md`
- `prompts/bloque-6/12_correccion_boton_estadisticas_sin_borde_fondo.md`
- `prompts/bloque-6/13_correccion_stack_partida_finalizada.md`

## Proxima fase: estadisticas por grupo

Se puede avanzar con la fase de grupos, pero no como extension ciega de la
pantalla actual. Primero conviene hacer analisis previo sobre el modelo real ya
mergeado:

1. Confirmar relaciones disponibles entre `groups`, `group_members`, `meetups`
   y `game_results`.
2. Confirmar si una juntada de grupo siempre tiene `meetups.group_id`.
3. Confirmar permisos esperados:
   - miembros activos pueden ver estadisticas del grupo;
   - ex-miembros no deberian seguir viendo estadisticas;
   - admins no necesitan una vista distinta salvo acciones futuras.
4. Definir pantalla:
   - entrada desde Detalle de Grupo;
   - resumen por grupo;
   - ranking de ganadores acumulado;
   - distribucion por juego;
   - ultimas juntadas con resultados;
   - acceso a historial completo por grupo si el volumen lo justifica.
5. Decidir si se necesita nueva RPC o si alcanza con queries existentes y RLS.

La recomendacion tecnica inicial es reutilizar `game_results` como fuente de
verdad y calcular estadisticas por grupo filtrando por juntadas asociadas al
grupo. Solo crear migracion/RPC nueva si RLS o performance lo requieren.

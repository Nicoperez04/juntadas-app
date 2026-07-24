# Implementacion - Estadisticas por juntada

## Contexto

Se implemento el Prompt 05 del Bloque 6 en grupos chicos, luego del analisis previo documentado en `06_analisis_previo_tarea_1_prompt_05.md`.

No se realizaron commits.

## Grupos implementados

### 1. Fix tecnico de Truco

Se corrigio `mobile/src/features/games/types/truco.ts`, que tenia numeros de linea incrustados en el contenido y bloqueaba la validacion TypeScript.

No se cambio el contrato funcional:

- `TrucoConfig`
- `TrucoState`

### 2. Persistencia en Supabase

Se agrego la tabla `game_results`.

Campos principales:

- juntada asociada
- usuario creador
- tipo de juego
- ganador
- participantes
- resumen de puntaje
- metadata flexible
- fecha de creacion

RLS:

- SELECT para participantes activos o historicos de la juntada.
- INSERT solo para participantes activos de una juntada activa.
- Sin UPDATE ni DELETE en esta etapa.

### 3. Feature gameResults

Se agrego `mobile/src/features/gameResults/` con:

- tipos
- servicio Supabase
- hook con TanStack Query

Patron usado:

- servicios con `{ data, error }`
- mensajes visibles en espanol
- mapeo snake_case a camelCase
- hooks con invalidacion de queries al crear resultados

### 4. Pantalla Estadisticas

Se agrego `MeetupStatsScreen`.

Contenido:

- resumen de partidas
- cantidad de juegos distintos
- ganador mas frecuente
- ranking de ganadores
- distribucion por juego
- resultados registrados
- empty state con accion a Juegos si la juntada esta activa

### 5. Entrada desde Detalle de Juntada

Se agrego la accion `Estadisticas` junto a `Jugar` y `Recuerdos`.

Visibilidad:

- no se muestra si la juntada esta cancelada
- no se muestra si el usuario abandono
- se muestra en juntadas activas y finalizadas

### 6. Guardado desde Truco y Generala

Se agrego persistencia real al boton final cuando existe `meetupId`.

Si no hay `meetupId`, se mantiene el comportamiento anterior: finalizar y salir sin guardar.

Se evita doble guardado usando estado de carga del hook.

### 7. Guardado desde Liga y Torneo

Liga guarda:

- campeon
- tabla final
- partidos con marcadores

Torneo guarda:

- campeon
- participantes
- rondas y llaves con ganadores

## Limitaciones documentadas

### Anotador generico

Queda fuera de esta primera implementacion.

Motivo:

- `ScorerSetupScreen` recibe `meetupId`, pero no lo propaga a `ScorerGameScreen`.
- `ScorerGameScreen` no tiene cierre de partida ni boton final de guardado.
- Solo muestra avisos no bloqueantes cuando alguien alcanza un objetivo.

### Impostor

Queda fuera de esta primera implementacion.

Motivo:

- no hay ganador definido
- no hay cierre estadistico del juego
- `impostor_games` registra inicio/estado, pero no resultado final

### Estadisticas por grupo

No se implemento UI de estadisticas por grupo.

La estructura queda preparada porque `game_results` se asocia a `meetups`, y Bloque 4 ya agrego `group_id` opcional en `meetups`.

## Como probar

1. Abrir una juntada activa.
2. Entrar a `Jugar`.
3. Finalizar Truco, Generala, Liga o Torneo.
4. Presionar `Guardar resultado y salir`.
5. Verificar que vuelve al detalle de la juntada.
6. Entrar a `Estadisticas`.
7. Confirmar resumen, ranking, distribucion y listado de resultados.
8. Abrir un juego desde el tab principal `Juegos` sin juntada.
9. Confirmar que el boton mantiene `Finalizar y Salir` y no guarda estadisticas.

## Validacion ejecutada

Se ejecuto:

`npx tsc --noEmit`

Resultado: pasa correctamente.

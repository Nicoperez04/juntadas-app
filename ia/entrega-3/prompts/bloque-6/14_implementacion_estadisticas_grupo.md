# Implementacion - Estadisticas por grupo

## Contexto

Se continuo el Bloque 6 despues de cerrar la fase 1 de estadisticas por
juntada. Antes de implementar se reviso el contrato real de grupos ya mergeado
en `entrega-3`:

- `groups` y `group_members`;
- `meetups.group_id`;
- policies RLS de grupos y juntadas;
- helper `get_user_group_role`;
- tabla `game_results` creada en la fase 1.

Decision de producto confirmada: las estadisticas de grupo deben mostrar el
historico de resultados de todas las juntadas asociadas al grupo y ser visibles
para cualquier miembro activo del grupo, aunque no haya participado en todas
esas juntadas. Ex-miembros o expulsados no deben conservar acceso.

Se mantuvo el resumen visual definido para la pantalla de estadisticas:

- Partidas;
- Juegos;
- Mas ganador.

## Problema tecnico detectado

No conviene implementar estadisticas de grupo con queries directas desde el
cliente.

Motivo: `game_results` tiene SELECT por relacion con la juntada
(`is_meetup_participant(meetup_id)`), pero el permiso de grupo es distinto:
miembro activo del grupo, no necesariamente participante historico de cada
juntada.

Usar queries directas obligaria a abrir RLS de `game_results` de forma mas
amplia y seria mas riesgoso. Se eligio una RPC con gate explicito de membresia
activa.

## Implementacion realizada

### Base de datos

Se agrego `supabase/migrations/028_group_game_results.sql`.

Nueva RPC:

`get_group_game_results(p_group_id UUID)`

Retorna resultados de juegos unidos con su juntada:

- `id`
- `meetup_id`
- `meetup_title`
- `created_by`
- `game_type`
- `winner_name`
- `winner_user_id`
- `participants`
- `score_summary`
- `metadata`
- `created_at`

Reglas:

- `SECURITY DEFINER`;
- `SET search_path = public`;
- valida que `auth.uid()` sea miembro activo del grupo;
- retorna resultados de `game_results` donde `meetups.group_id = p_group_id`;
- ordena por `created_at DESC`;
- `GRANT EXECUTE` solo a `authenticated`;
- `REVOKE EXECUTE FROM PUBLIC`.

### Mobile

Se extendio `mobile/src/features/gameResults/`:

- `GroupGameResult`
- `GroupGameStats`
- `gameResultService.getResultsByGroup`
- `gameResultService.getStatsByGroup`
- `useGroupGameResults`
- `GroupStatsScreen`
- `GroupResultsHistoryScreen`

Se reutilizo el calculo de estadisticas ya existente:

- ranking case-insensitive;
- distribucion por juego;
- ultimos 3 resultados en pantalla principal;
- historial completo en pantalla separada.

`GameResultCard` ahora acepta `contextLabel` opcional. Para estadisticas de
grupo se usa para mostrar el titulo de la juntada donde se registro cada
resultado.

### Fallback local de desarrollo

Para permitir testing local sin la migracion 028 aplicada, se agrego un fallback
equivalente al de la fase 1:

- en `__DEV__`, cada resultado guardado desde una juntada de grupo se espeja en
  AsyncStorage bajo una key por `groupId`;
- si la RPC `get_group_game_results` no existe o falta en el schema cache, la
  pantalla de estadisticas de grupo lee esos resultados locales;
- si la migracion existe y responde correctamente, se usa Supabase como fuente
  real.

Este fallback no reemplaza la migracion. Solo permite validar el flujo visual y
funcional en Expo mientras Supabase todavia no tiene aplicada la RPC.

### Navegacion

Se agregaron rutas:

- `GroupStats`
- `GroupResultsHistory`

Se registraron en:

- `mobile/src/navigation/routes.ts`
- `mobile/src/navigation/types.ts`
- `mobile/src/navigation/MainNavigator.tsx`

### Entrada desde Detalle de Grupo

Se agrego la card `Estadisticas` en `GroupDetailScreen`, al lado de `Juntadas`.

Mantiene el criterio visual del modulo de grupos:

- card de accion;
- icono `stats-chart`;
- color warning/naranja para diferenciar estadisticas.

## Limitaciones actuales

- La migracion 028 debe aplicarse en Supabase para probar datos reales.
- El fallback local de desarrollo solo contiene resultados guardados en ese
  dispositivo durante pruebas; no reconstruye historico real de Supabase.
- No se agrego edicion ni eliminacion de resultados.
- No se resolvio equivalencia semantica de equipos con orden invertido
  (`Agus y Nico` vs `Nico y Agus`).

## Como probar cuando la migracion este aplicada

1. Crear o abrir un grupo con una juntada asociada.
2. Desde una juntada del grupo, jugar Truco, Generala, Liga o Torneo.
3. Guardar resultado.
4. Volver al detalle del grupo.
5. Entrar a `Estadisticas`.
6. Verificar:
   - total de partidas;
   - cantidad de juegos;
   - mas ganador;
   - ranking de ganadores;
   - distribucion por juego;
   - ultimos 3 resultados con nombre de juntada.
7. Si hay mas de 3 resultados, tocar `Ver historial completo`.
8. Validar que un usuario que ya no es miembro activo del grupo no pueda cargar
   las estadisticas.

## Validacion local realizada

Se ejecuto:

`npx.cmd tsc --noEmit`

Resultado: pasa correctamente.

Como la migracion 028 no esta aplicada todavia en Supabase, la validacion local
funcional usa el fallback en AsyncStorage:

1. Abrir una juntada asociada a un grupo.
2. Guardar un resultado desde un juego.
3. Volver al detalle del grupo.
4. Entrar a `Estadisticas`.
5. Verificar que el resultado aparece en estadisticas de grupo aunque la RPC 028
   todavia no exista en Supabase.

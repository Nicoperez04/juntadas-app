# Bloque 6 - Fase 2 cerrada: Estadisticas por grupo

## Alcance cerrado

La segunda fase del Bloque 6 queda cerrada con foco en estadisticas acumuladas
por grupo.

Se implemento una primera version operativa que permite consultar, desde el
detalle de un grupo, las estadisticas historicas de resultados registrados en
juntadas asociadas a ese grupo.

La pantalla mantiene el mismo criterio visual y funcional definido para
estadisticas por juntada:

- total de partidas;
- cantidad de juegos distintos;
- mas ganador;
- ranking de ganadores;
- distribucion por juego;
- ultimos 3 resultados;
- historial completo en pantalla separada.

## Decision de producto

Se definio que las estadisticas de grupo deben contemplar todas las juntadas
asociadas al grupo, no solo aquellas donde el usuario actual participo.

Permisos esperados:

- miembros activos del grupo pueden ver el historico de resultados del grupo;
- ex-miembros o usuarios expulsados no deben conservar acceso;
- admin y miembro comparten la misma vista de estadisticas en esta fase.

## Implementacion realizada

### Base de datos

Se agrego `supabase/migrations/028_group_game_results.sql`.

Nueva RPC:

`get_group_game_results(p_group_id UUID)`

La funcion:

- corre como `SECURITY DEFINER`;
- usa `SET search_path = public`;
- valida al inicio que `auth.uid()` sea miembro activo del grupo;
- retorna resultados de `game_results` unidos con `meetups`;
- filtra por `meetups.group_id = p_group_id`;
- incluye `meetup_title` para mostrar contexto en la UI;
- ordena por fecha descendente;
- otorga ejecucion a `authenticated`;
- revoca ejecucion a `PUBLIC`.

Se eligio RPC en vez de query directa porque `game_results` esta protegido por
RLS de participacion en juntada, mientras que la estadistica de grupo requiere
un permiso distinto: membresia activa del grupo.

### Mobile

Se extendio `mobile/src/features/gameResults/` con:

- `GroupGameResult`;
- `GroupGameStats`;
- `gameResultService.getResultsByGroup`;
- `gameResultService.getStatsByGroup`;
- `useGroupGameResults`;
- `GroupStatsScreen`;
- `GroupResultsHistoryScreen`.

Tambien se extendio `GameResultCard` con `contextLabel` opcional para mostrar
el titulo de la juntada en resultados de grupo.

### Navegacion

Se agregaron rutas:

- `GroupStats`;
- `GroupResultsHistory`.

Se registraron en:

- `mobile/src/navigation/routes.ts`;
- `mobile/src/navigation/types.ts`;
- `mobile/src/navigation/MainNavigator.tsx`.

### Entrada desde detalle de grupo

`GroupDetailScreen` ahora muestra una card `Estadisticas` junto a `Juntadas`.

La card usa icono `stats-chart` y color warning/naranja, manteniendo el patron
visual de acciones del modulo de grupos.

## Fallback local de desarrollo

Como durante esta sesion no habia permisos para aplicar migraciones en Supabase,
se agrego un fallback local solo en `__DEV__`, equivalente al criterio usado en
fase 1.

Funcionamiento:

1. Si un resultado se guarda desde una juntada asociada a un grupo, el servicio
   intenta resolver `meetups.title` y `meetups.group_id`.
2. Si existe `group_id`, espeja el resultado en AsyncStorage bajo una key por
   grupo.
3. Si la RPC `get_group_game_results` no existe o falta en el schema cache, la
   pantalla de estadisticas de grupo lee los resultados locales.
4. Si la RPC existe y responde correctamente, Supabase vuelve a ser la fuente
   real.

Este fallback no reemplaza la migracion. Solo permite probar navegacion, UI y
calculo de estadisticas en Expo mientras la base remota todavia no tiene la RPC.

## Validacion realizada

Validacion tecnica:

- `npx.cmd tsc --noEmit` paso correctamente.
- `git diff --check` paso correctamente.

Validacion funcional local reportada:

- se pudo guardar un resultado desde una juntada de grupo;
- se pudo entrar a estadisticas desde detalle de grupo;
- el resultado aparecio correctamente usando el fallback local de desarrollo.

Intento adicional:

- se intento `expo export` para validar Metro, pero fallo por
  `hermesc.exe: permission denied`. El bundling llego hasta Metro y el error
  corresponde al ejecutable local de Hermes, no a imports o tipado de la fase.

## Pendiente para revision posterior

Antes de mergear o de continuar con otro bloque, un companero con permisos de
Supabase debe:

1. Aplicar `supabase/migrations/028_group_game_results.sql`.
2. Probar el flujo real contra Supabase, sin depender del fallback local:
   - grupo con al menos una juntada asociada;
   - resultado guardado desde Truco/Generala/Liga/Torneo;
   - entrada a `Estadisticas` desde `GroupDetailScreen`;
   - historial completo con mas de 3 resultados;
   - acceso correcto de otro miembro activo;
   - rechazo de acceso para ex-miembro o expulsado.
3. Revisar si conviene mantener el fallback `__DEV__` para desarrollo o
   retirarlo despues de aplicar la migracion.

## Limites conscientes

- No se implemento edicion ni eliminacion de resultados.
- No se resolvio equivalencia semantica de equipos con orden invertido
  (`Agus y Nico` vs `Nico y Agus`).
- El fallback local solo refleja resultados guardados en el dispositivo actual;
  no reconstruye historico real.
- La prueba real de permisos queda pendiente hasta aplicar la migracion 028.

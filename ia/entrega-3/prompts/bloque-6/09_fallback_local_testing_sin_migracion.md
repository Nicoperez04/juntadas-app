# Correccion - Fallback local para testing sin migracion aplicada

## Contexto

Durante la prueba manual en Expo se confirmo que la base remota no tiene aplicada la migracion `game_results`.

El equipo no tenia disponibilidad inmediata de una persona con permisos para aplicar migraciones en Supabase.

## Problema

Sin la tabla `game_results`, no se puede validar el INSERT real ni las policies RLS.

Sin embargo, si no se ofrece una alternativa, tampoco se puede probar el flujo visual completo:

- guardar resultado desde un juego;
- volver al detalle;
- abrir `Estadisticas`;
- ver resumen, ranking y resultados registrados.

## Correccion aplicada

Se agrego un fallback local en `gameResultService`.

Condiciones:

- solo corre en `__DEV__`;
- solo se activa si Supabase responde que falta la tabla o el schema cache de `game_results`;
- guarda y lee resultados desde AsyncStorage por `meetupId`;
- no se activa ante errores de RLS o permisos.

Esto permite probar la experiencia de usuario sin simular permisos reales.

## Alcance

Sirve para testear:

- flujo de boton `Guardar resultado y salir`;
- navegacion de regreso al detalle;
- pantalla `Estadisticas`;
- calculo cliente de resumen, ranking y distribucion.

No sirve para testear:

- INSERT real en Supabase;
- RLS real;
- persistencia compartida entre dispositivos;
- historial luego de borrar datos locales o reinstalar la app.

## Accion pendiente

Antes de considerar cerrado el backend del Bloque 6, se debe aplicar `supabase/migrations/027_game_results.sql` en Supabase y volver a probar sin depender del fallback local.

## Validacion

Se ejecuto:

`npx tsc --noEmit`

Resultado: pasa correctamente.

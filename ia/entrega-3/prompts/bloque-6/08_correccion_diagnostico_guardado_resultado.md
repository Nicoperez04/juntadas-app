# Correccion - Diagnostico de guardado de resultado

## Contexto

Durante la prueba manual en Expo, el boton `Guardar resultado y salir` aparecio correctamente en Generala, pero al intentar guardar mostro el error generico:

`No se pudo guardar el resultado`

## Diagnostico

La insercion en `game_results` puede fallar por dos causas principales:

- la migracion de `game_results` todavia no fue aplicada en la base Supabase usada por la app;
- una policy RLS rechazo el INSERT.

El servicio estaba ocultando el error real de Supabase y devolvia siempre el mismo mensaje generico, por lo que no permitia distinguir la causa.

## Correccion aplicada

Se ajusto `gameResultService.createResult` para traducir errores relevantes:

- tabla faltante o schema cache: `Falta aplicar la migracion de estadisticas en Supabase`;
- RLS/permisos: `No tenes permisos para guardar resultados en esta juntada`;
- otros errores: se devuelve el mensaje de Supabase si existe.

## Validacion

Se ejecuto:

`npx tsc --noEmit`

Resultado: pasa correctamente.

## Proximo paso manual

Reintentar el guardado en Expo despues de recargar la app.

Si aparece `Falta aplicar la migracion de estadisticas en Supabase`, aplicar `supabase/migrations/027_game_results.sql` en la base compartida antes de seguir probando.

# 10 - Correccion ranking e historial de resultados

## Contexto

Durante el testing manual de Estadisticas por juntada se detecto que el ranking
trataba como ganadores distintos a nombres con diferencias solo de mayusculas o
minusculas. Ejemplo observado: `agus y nico` y `Agus y NIco`.

Tambien se reviso la UX de la seccion `Resultados registrados`: cuando una
juntada acumula varias partidas, listar todo en la pantalla principal de
estadisticas vuelve menos escaneable el resumen.

## Decision

- Para el calculo de ranking se agrupan ganadores por una clave normalizada:
  `trim`, espacios consecutivos colapsados y comparacion case-insensitive con
  locale `es-AR`.
- El nombre visible no se fuerza a minusculas: se conserva una version
  representativa ingresada por el usuario para mostrar en ranking y "Mas
  ganador".
- No se intenta resolver equivalencia semantica de equipos con orden invertido
  (`Agus y Nico` vs `Nico y Agus`). Eso queda fuera de alcance porque requeriria
  estructura de equipos o seleccion explicita de participantes.
- La pantalla `Estadisticas` muestra solo los ultimos 3 resultados registrados.
- Si existen mas de 3 resultados, se muestra el boton `Ver historial completo`.
- El historial completo vive en una pantalla separada para mantener el resumen
  principal corto y consistente con el patron de `Ver participantes` /
  `Historial`.

## Implementacion esperada

1. Ajustar `buildStats` para usar una clave normalizada al acumular victorias.
2. Mantener el nombre visible del ganador en el ranking.
3. Extraer la tarjeta visual de resultado a un componente reutilizable.
4. Limitar la lista de resultados recientes en `MeetupStatsScreen` a 3 items.
5. Crear la ruta y pantalla `MeetupResultsHistory` con todos los resultados de
   la juntada.
6. No modificar la migracion ni el contrato de persistencia.

## Prueba manual

1. Guardar dos resultados para la misma juntada con el mismo ganador escrito con
   distinta capitalizacion.
2. Abrir `Estadisticas`.
3. Verificar que el ranking muestre una sola fila para ese ganador y que el
   contador acumule ambas victorias.
4. Guardar mas de 3 resultados.
5. Verificar que `Estadisticas` muestre 3 resultados recientes y el boton para
   ver el historial completo.

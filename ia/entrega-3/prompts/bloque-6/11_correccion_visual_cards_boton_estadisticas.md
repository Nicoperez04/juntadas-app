# 11 - Correccion visual de cards y boton Estadisticas

> Nota posterior: la decision de borde/fondo propio del boton `Estadisticas`
> queda superada por `12_correccion_boton_estadisticas_sin_borde_fondo.md`.
> La correccion de cards delimitadas para resultados sigue vigente.

## Contexto

Durante la prueba visual se detectaron dos diferencias de diseno:

- En el historial completo de resultados, cada resultado no quedaba claramente
  delimitado como card porque usaba el mismo color que el fondo.
- En Detalle de Juntada, el boton `Estadisticas` necesitaba diferenciarse con
  una paleta propia y quedar ubicado en el medio de los tres accesos.

## Decision

- La card reutilizable de resultado pasa a usar superficie, borde y sombra para
  que sea legible tanto dentro del resumen de `Estadisticas` como en
  `Historial de resultados`.
- El boton `Estadisticas` en Detalle de Juntada usa:
  - borde `#FFB900`
  - texto e icono `#E17100`
  - fondo `#FFFBEB`
- El orden de acciones queda `Jugar`, `Estadisticas`, `Recuerdos` cuando las
  tres acciones estan disponibles.

## Prueba manual

1. Abrir una juntada con resultados registrados.
2. Entrar a `Estadisticas` y luego a `Ver historial completo`.
3. Verificar que cada resultado se vea como una card separada.
4. Volver a Detalle de Juntada.
5. Verificar que `Estadisticas` aparezca en el medio y con los colores definidos.

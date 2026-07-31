# 12 - Correccion boton Estadisticas sin borde ni fondo propio

## Contexto

Al comparar nuevamente contra el diseno de referencia, se detecto que el boton
`Estadisticas` no debia tener borde ni fondo propio. La interpretacion previa
de Figma habia mezclado el estilo del icon box con el contenedor completo.

## Decision

- `Estadisticas` mantiene la misma card blanca que `Jugar` y `Recuerdos`.
- Se quitan borde `#FFB900` y fondo `#FFFBEB` del contenedor del boton.
- Se conserva el color naranja `#E17100` solo para icono y texto.
- El orden sigue siendo `Jugar`, `Estadisticas`, `Recuerdos`.
- La correccion visual 11 queda superada solo en lo referido a borde/fondo del
  boton; la delimitacion de cards de resultados se mantiene vigente.

## Prueba manual

1. Abrir Detalle de Juntada.
2. Verificar que los tres botones compartan el mismo contenedor visual.
3. Verificar que `Estadisticas` quede en el centro y solo difiera por icono y
   texto naranja.

# 13 - Correccion stack al guardar partida finalizada

## Contexto

Durante el testing manual se detecto que, al guardar el resultado de una partida
asociada a una juntada, la app registraba correctamente el resultado y navegaba a
Detalle de Juntada, pero la partida quedaba debajo en el stack. Al tocar atras
desde Detalle se volvia a la partida finalizada y era posible guardar otra vez,
duplicando la estadistica.

## Causa

Las pantallas de juego usaban `navigation.navigate(Routes.MeetupDetail, ...)`
despues de guardar. Ese metodo apila Detalle arriba de la partida actual en vez
de cerrar el flujo de juego.

## Decision

- Al guardar un resultado con `meetupId`, la salida del juego debe resetear el
  stack a `MeetupHome -> MeetupDetail`.
- Al tocar atras desde Detalle de Juntada, el usuario vuelve a Inicio y no a una
  partida ya finalizada.
- Se aplica el mismo criterio a Truco, Generala, Liga y Torneo.
- Si el juego no tiene `meetupId`, se conserva el comportamiento previo:
  `navigation.goBack()`.

## Prueba manual

1. Abrir una juntada activa.
2. Entrar a un juego con registro de resultado.
3. Finalizar y guardar el resultado.
4. Confirmar que se abre Detalle de Juntada.
5. Tocar atras desde Detalle.
6. Verificar que no se vuelve a la partida finalizada.
7. Volver a Estadisticas y confirmar que no se genero un resultado duplicado.

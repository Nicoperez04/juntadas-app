# Referencias visuales y diseno funcional - Bloque 6 Estadisticas

## Consulta

Se prueban los ultimos cambios mergeados de `entrega-3` en emulador Android con Expo Go SDK 55 y se aportan capturas actuales de:

- Hub de juegos real de la APK.
- Pantalla final de Truco con ganador.
- Pantalla final de Generala con ganador.
- Mockups de Historial con filtros.
- Mockups de Grupos de Amigos.
- Mockups de Detalle de Grupo y miembros.

El usuario confirma que Grupos aun no esta implementado, pero seguira el mismo estilo y dinamica del CRUD de juntadas.

## Clasificacion documental

**DOCUMENTAR OBLIGATORIO**

Estas referencias definen el diseno base del Bloque 6 y confirman que parte de las estadisticas por grupo dependen de una funcionalidad futura. Deben quedar documentadas antes de generar prompts de implementacion.

## Lectura visual del estado actual

### Hub de juegos

El hub real de la APK muestra las dinamicas disponibles en una grilla de dos columnas:

- Impostor.
- Que soy?
- Preguntas para el grupo.
- Anotador generico.
- Anotador de Truco.
- Anotador de Generala.
- Generador de Ligas.
- Generador de Torneos.
- Temporizador.
- Equipos aleatorios.
- Sorteador.

Decision: para el hub de juegos, la fuente funcional es el codigo/APK actual y no el Figma desactualizado.

### Truco

La pantalla final de Truco ya expone:

- marcador final;
- ganador visible;
- boton principal `Finalizar y Salir`.

Decision: si Truco fue iniciado con `meetupId`, ese cierre debe convertirse en el punto de guardado del resultado. Si fue iniciado desde el menu principal, debe seguir cerrando sin guardar estadisticas.

### Generala

La pantalla final de Generala ya expone:

- puntajes por jugador;
- total;
- ganador visible;
- boton principal `Finalizar y Salir`.

Decision: si Generala fue iniciada con `meetupId`, ese cierre debe guardar resultado y planilla resumida. Si fue iniciada sin `meetupId`, no debe persistir estadisticas.

### Historial

Los mockups de historial muestran un patron visual reutilizable:

- cards blancas con borde/sombra suave;
- chips de estado y rol;
- filtro por bottom sheet;
- busqueda superior;
- jerarquia compacta, orientada a escaneo.

Decision: la pantalla de estadisticas por juntada debe reutilizar este lenguaje visual: cards simples, chips, badges y secciones compactas.

### Grupos

Los mockups de grupos proponen una estructura equivalente a juntadas:

- listado de grupos;
- creacion de grupo;
- union por codigo;
- detalle de grupo;
- miembros;
- compartir codigo;
- transferir administracion;
- salir o eliminar grupo.

Decision: el Bloque 6 no implementa Grupos. Solo deja preparado el contrato conceptual para que las estadisticas por grupo acumulen resultados de juntadas asociadas cuando el Bloque 4 defina modelo y pantallas.

## Diseno funcional propuesto

### 1. Entrada desde Detalle de Juntada

Agregar una entrada a `Estadisticas` o `Resultados` en el detalle de una juntada.

Ubicacion propuesta:

- cerca de las acciones actuales `Jugar` y `Recuerdos`;
- visualmente como card accionable;
- icono sugerido: grafico/bar chart;
- disponible para juntadas activas y finalizadas;
- en canceladas, solo lectura si corresponde.

Comportamiento:

- si no hay resultados, abrir pantalla con empty state;
- si hay resultados, abrir resumen estadistico del evento.

### 2. Pantalla Estadisticas de Juntada

Pantalla nueva orientada a un solo evento.

Secciones:

1. Resumen superior:
   - total de partidas registradas;
   - cantidad de juegos distintos;
   - ganador mas frecuente si existe.

2. Distribucion por juego:
   - Truco;
   - Generala;
   - Impostor;
   - Anotador generico;
   - Liga/Torneo si se decide persistir campeon.

3. Ranking del evento:
   - nombre;
   - cantidad de victorias;
   - ultima victoria o juego destacado.

4. Historial de resultados:
   - card por resultado;
   - tipo de juego;
   - ganador;
   - puntaje o resumen;
   - fecha/hora de registro.

5. Empty state:
   - texto corto indicando que aun no hay resultados;
   - accion opcional para ir a `Jugar` si la juntada esta activa.

### 3. Cierre de juegos con resultado

Cambiar el comportamiento del boton final solo cuando exista `meetupId`.

Estados:

- Sin `meetupId`: `Finalizar y Salir`, no guarda nada.
- Con `meetupId` y resultado no guardado: `Guardar resultado y salir`.
- Guardando: estado de carga.
- Guardado exitoso: feedback visual y regreso al detalle o hub.
- Error: mensaje claro, sin perder el resultado local inmediatamente.

Juegos prioritarios:

1. Truco.
2. Generala.
3. Anotador generico.
4. Liga/Torneo, si el resultado final es claro.
5. Impostor, solo si se define un cierre con ganador/aciertos.

### 4. Estadisticas por grupo

No se implementa pantalla final en esta fase.

Contrato futuro:

- cada resultado se guarda asociado a una juntada;
- cuando exista relacion `grupo -> juntadas`, las estadisticas del grupo se calculan acumulando los resultados de esas juntadas;
- el detalle de grupo podria incorporar una entrada `Estadisticas`, siguiendo la misma logica que `Juntadas` y `Multimedia`.

## Reglas de alcance

- No guardar resultados de partidas iniciadas desde el tab principal sin contexto de juntada.
- No crear ranking global.
- No duplicar logica estadistica en pantallas de juegos.
- No implementar pantallas de grupos antes de que exista el Bloque 4.
- No asumir que todo juego genera estadistica si no tiene resultado claro.

## Preguntas a cerrar antes del prompt de implementacion

1. Nombre visible de la entrada: `Estadisticas`, `Resultados` o `Resumen`.
2. Al guardar resultado: volver al hub de juegos o al detalle de juntada.
3. Si el resultado ya fue guardado: permitir edicion/eliminacion o dejarlo inmutable.
4. Si Liga/Torneo deben guardar solo campeon o tambien fixture completo.
5. Si Impostor debe registrar ganador/aciertos o solo partida jugada.

## Resultado

El diseno funcional queda listo para una etapa de decision final. El siguiente paso no es implementar todavia, sino responder las preguntas abiertas y luego generar el prompt de implementacion con OK explicito.

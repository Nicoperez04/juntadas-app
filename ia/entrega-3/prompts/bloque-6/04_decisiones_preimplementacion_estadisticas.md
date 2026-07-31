# Decisiones preimplementacion - Bloque 6 Estadisticas

## Consulta

Luego de documentar el alcance y las referencias visuales, se continua con el cierre de decisiones previas a la implementacion del Bloque 6.

Se revisan las pantallas actuales de Detalle de Juntada, Truco, Generala, Liga, Torneo e Impostor para definir que resultados se pueden guardar de forma confiable y donde ubicar la entrada a estadisticas.

## Clasificacion documental

**DOCUMENTAR OBLIGATORIO**

Estas decisiones son base directa para el prompt de implementacion. Definen nombres visibles, navegacion, reglas de persistencia, alcance por juego y postergaciones.

## Decisiones cerradas

### 1. Nombre visible de la funcionalidad

Usar **Estadisticas** como nombre principal de la seccion.

Motivo:

- coincide con el Bloque 6 y con el alcance de RF-43;
- es suficientemente amplio para mostrar resultados, rankings y resumen;
- evita reducir la pantalla solo a historial de partidas.

Dentro de la pantalla, usar **Resultados registrados** para la lista de partidas guardadas.

### 2. Entrada desde Detalle de Juntada

Agregar una tercera accion junto a `Jugar` y `Recuerdos`, con el label **Estadisticas**.

Reglas:

- visible para juntadas activas y finalizadas;
- no visible si el usuario abandono la juntada;
- en juntadas canceladas se mantiene oculta en esta primera implementacion;
- si no hay resultados, abre empty state.

Motivo:

- el Detalle de Juntada ya es el centro de acciones del evento;
- `Jugar` ya abre el hub con `meetupId`;
- `Recuerdos` ya funciona como modulo asociado al evento;
- `Estadisticas` sigue esa misma logica.

### 3. Navegacion despues de guardar resultado

Despues de guardar un resultado iniciado desde una juntada, volver al **Detalle de Juntada**.

Motivo:

- el resultado pertenece al evento, no al hub global;
- permite ver rapidamente la nueva entrada de estadisticas;
- evita que el usuario crea que el juego suelto queda persistido.

Si no existe `meetupId`, mantener el comportamiento actual de volver atras o salir sin guardar.

### 4. Edicion o eliminacion de resultados

No implementar edicion ni eliminacion en la primera version del Bloque 6.

Motivo:

- RF-43 pide capturar y acumular estadisticas, no CRUD de resultados;
- editar/eliminar agregaria reglas de permisos y RLS no pedidas;
- reduce riesgo de inconsistencias en rankings y acumulados.

Los resultados quedan inmutables en esta etapa.

### 5. Juegos incluidos en la primera implementacion

Prioridad alta:

- Truco: guardar ganador, equipos, marcador final y puntos objetivo.
- Generala: guardar ganador, jugadores, puntajes totales y planilla resumida.
- Liga: guardar campeon, equipos, tabla final y partidos jugados de forma resumida.
- Torneo: guardar campeon, jugadores y cuadro/resumen de rondas.

Prioridad media:

- Anotador generico: requiere primero ajustar el tipado para transportar `meetupId` desde setup a game. Guardar ganador solo si hay criterio claro de objetivo o seleccion manual.

Postergado o limitado:

- Impostor: actualmente registra inicio en `impostor_games`, pero no tiene pantalla de cierre con ganador/aciertos. En la primera implementacion se puede:
  - contar partida jugada a partir del registro existente, o
  - dejar preparado el contrato para agregar resultado de `impostor_found` en una segunda pasada.

Decision: no bloquear el Bloque 6 por Impostor. Implementar primero los juegos que ya poseen resultado inequívoco.

### 6. Persistencia

Crear una tabla general de resultados de juegos, por ejemplo `game_results`.

Campos conceptuales minimos:

- `id`;
- `meetup_id`;
- `created_by`;
- `game_type`;
- `winner_name`;
- `winner_user_id` opcional;
- `participants`;
- `score_summary`;
- `metadata`;
- `created_at`.

Reglas:

- `meetup_id` obligatorio;
- solo se insertan resultados de juegos iniciados desde juntada;
- participantes de la juntada pueden ver resultados;
- participantes de la juntada pueden insertar resultados mientras la juntada este activa;
- no se guardan resultados desde el tab principal de Juegos.

### 7. Pantalla Estadisticas de Juntada

Crear una pantalla nueva asociada a `meetupId`.

Contenido:

1. Resumen del evento:
   - total de partidas;
   - juegos distintos;
   - ganador mas frecuente si existe.

2. Ranking de ganadores:
   - nombre;
   - cantidad de victorias;
   - chips por tipo de juego si aporta claridad.

3. Distribucion por juego:
   - conteo por `game_type`.

4. Resultados registrados:
   - cards compactas con juego, ganador, resumen y fecha.

5. Empty state:
   - si la juntada esta activa, accion para ir a `Jugar`;
   - si esta finalizada, solo mensaje informativo.

### 8. Estadisticas por grupo

No implementar UI ni consultas finales de grupos en esta fase.

Dejar solo la decision arquitectonica:

- las estadisticas por grupo se calculan acumulando `game_results` de las juntadas asociadas a un grupo;
- la integracion real depende del Bloque 4;
- cuando exista el modelo de grupos, se agregara relacion `group_id` o equivalente sin rehacer los resultados ya guardados.

## Criterio para el prompt de implementacion

El prompt de implementacion debe pedir cambios en grupos pequenos:

1. Migracion y tipos/servicio de resultados.
2. Pantalla Estadisticas de Juntada y navegacion.
3. Guardado desde Truco y Generala.
4. Guardado desde Liga y Torneo.
5. Ajuste de Anotador generico si el alcance de tiempo lo permite.
6. Documentacion de limitaciones: Impostor y grupos.

## Resultado

El Bloque 6 queda listo para generar un prompt de implementacion, pero solo despues de OK explicito del usuario segun el flujo adaptado ChatGPT/Codex.

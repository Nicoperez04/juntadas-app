# Alcance, flujo IA y referencias de diseno - Bloque 6 Estadisticas

## Consulta

Se incorpora documentacion adicional de alcance final de Entrega 3 y el mapa de funcionalidades para limitar el desarrollo del Bloque 6. Tambien se provee el enlace de Figma:

https://www.figma.com/design/Iu9DQtttfYfcuWrFqmJuwb/Dise%C3%B1o-de-Wireframes---MockUps---Ronda-App?node-id=73-23&t=LC089FZ1Z0vd9HiQ-1

El usuario informa que las pantallas del hub de juegos en Figma pueden estar desactualizadas porque la responsable del Bloque 5 no actualizo esos mockups, aunque su trabajo ya fue mergeado a `entrega-3`. Se consulta ademas si, para ver esos cambios en la APK instalada, el usuario debe hacer algo o si depende de otra accion de la responsable del Bloque 5.

## Clasificacion documental

**DOCUMENTAR OBLIGATORIO**

Esta consulta fija reglas de trabajo, fuentes de verdad, alcance funcional y orden del flujo antes de disenar o implementar. Debe quedar registrada porque condiciona todas las decisiones posteriores del Bloque 6.

## Adaptacion del flujo Claude/Cursor a ChatGPT/Codex

La guia de Entrega 3 define un flujo donde Claude actua como arquitecto y generador de prompts, y Cursor Agent implementa. Como en este proyecto se trabaja con ChatGPT/Codex, se adopta una simulacion equivalente:

1. El usuario explica el problema o bloque a implementar.
2. ChatGPT/Codex actua primero como analista/arquitecto y hace preguntas antes de generar prompts cuando falta informacion relevante.
3. ChatGPT/Codex explica que se va a hacer y por que antes de proponer implementacion.
4. El usuario debe dar OK explicito antes de generar el prompt final de implementacion.
5. Con el OK, ChatGPT/Codex pasa al rol implementador, aplica cambios y reporta lo realizado.
6. El usuario prueba en APK/emulador/dispositivo y reporta resultados.
7. Si aparecen bugs, ChatGPT/Codex genera diagnostico no documentable si solo inspecciona, o prompt/correccion documentable si deriva en cambios.

Regla operativa: no se implementa codigo del Bloque 6 hasta cerrar alcance, definir pantallas y recibir OK explicito.

## Fuentes de verdad para Bloque 6

Orden de prioridad para decisiones:

1. `alcance_final.docx` y reglas de negocio de Entrega 3.
2. Mapa de funcionalidades final.
3. Codigo mergeado en la rama `entrega-3`.
4. Figma como referencia visual, validando si cada pantalla esta actualizada.
5. Este chat y los markdowns de IA como trazabilidad de decisiones.

Cuando Figma y codigo difieran, no se asume automaticamente que Figma esta actualizado. Para el hub de juegos, se toma como fuente funcional el codigo mergeado en `entrega-3`, porque el usuario informa que Figma puede no reflejar los cambios del Bloque 5.

## Alcance funcional confirmado

El Bloque 6 corresponde a `RF-43 - Registro y estadisticas de juegos`.

El sistema debe capturar y almacenar resultados de dinamicas ejecutadas dentro del contexto de una juntada, por ejemplo ganadores y puntajes de Truco, Generala e Impostor. Las estadisticas se totalizan por evento y luego se acumulan a nivel de Grupo de Amigos.

## Limites de alcance

- No se guardan estadisticas de juegos iniciados desde el menu principal sin `meetupId`.
- No se implementa un ranking global de usuarios.
- No se implementa un sistema de minijuegos independiente.
- No se resuelve la pantalla final de estadisticas por grupo hasta contar con contrato estable del Bloque 4.
- No se toma el Figma del hub de juegos como actualizado si contradice el codigo mergeado.

## Decision sobre APK y visibilidad de cambios del Bloque 5

Si el Bloque 5 ya fue mergeado a `entrega-3`, la responsable del bloque no necesita hacer nada adicional a nivel de codigo para que esos cambios existan en la rama.

Para ver esos cambios en una APK instalada, el usuario debe usar una APK construida desde una rama que incluya ese merge. Una APK ya instalada no se actualiza sola por un merge en Git. Hay que actualizar el codigo local, reconstruir la APK o instalar una nueva build generada desde `entrega-3` actualizado.

Si el usuario no ve "Anotador de Truco" en su APK, las causas probables son:

- la APK fue construida antes del merge del Bloque 5;
- la APK fue construida desde otra rama;
- el dispositivo conserva una version anterior instalada;
- no se reinstalo ni actualizo la build despues del merge.

En el codigo local actual de `feature/bloque-6-estadisticas`, que fue actualizado desde `entrega-3`, existen rutas y pantallas de Truco y Generala, por lo que el problema no parece ser ausencia de codigo en esta rama sino una build instalada desactualizada.

## Resultado

Antes de implementar, se debe definir el diseno de:

- entrada a estadisticas desde Detalle de Juntada;
- pantalla de estadisticas por juntada;
- guardado de resultado desde pantallas finales de juegos;
- estado vacio cuando no hay resultados;
- contrato futuro para estadisticas por grupo.

Luego, con OK explicito del usuario, se genera el prompt de implementacion o se pasa a implementacion con Codex.

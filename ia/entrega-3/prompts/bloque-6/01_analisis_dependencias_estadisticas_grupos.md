# Analisis de dependencias - Bloque 6 Estadisticas

## Consulta

Tengo que hacer el bloque 6 correspondiente a las estadisticas. Para las estadisticas de juntadas puedo trabajar tranquilamente, pero para las estadisticas de grupos en si podria requerir del trabajo previo del que se haya encargado del bloque 4 de grupos, tanto de decisiones como de diseno de pantallas, no?

## Clasificacion documental

**RECOMENDABLE DOCUMENTAR**

Esta consulta no es un prompt de implementacion ni una correccion de bug, pero si define alcance, dependencias y orden de trabajo del Bloque 6. Debe quedar registrada porque afecta como se separa el desarrollo de estadisticas independientes y estadisticas dependientes del modelo de grupos.

## Analisis

La lectura es correcta: las estadisticas generales de juntadas y juegos pueden avanzar si dependen de entidades ya existentes o de migraciones propias del Bloque 6, por ejemplo `meetups`, `meetup_participants`, `impostor_games`, reviews o futuras tablas de resultados de juegos.

En cambio, las estadisticas agregadas por grupo no deberian disenarse en vacio. Dependen del contrato que defina el Bloque 4, especialmente:

- modelo de datos de grupos;
- tabla de integrantes o membresias;
- relacion entre grupos y juntadas;
- roles y permisos dentro del grupo;
- comportamiento al salir de un grupo;
- pantallas donde se mostrara el historial y las estadisticas consolidadas.

## Decision de alcance

El Bloque 6 se debe dividir en dos fases:

1. Estadisticas independientes de grupos: estadisticas por usuario, por juntada y por juegos iniciados desde una juntada.
2. Estadisticas dependientes de grupos: estadisticas acumuladas por grupo, solo cuando el Bloque 4 este mergeado o tenga un contrato de datos estable.

## Adaptacion del flujo IA

La guia E3 describe el flujo Claude como arquitecto y Cursor Agent como ejecutor. En este caso, se adopta el mismo criterio metodologico con ChatGPT/Codex:

- ChatGPT/Codex actua primero como analista/arquitecto para detectar dependencias y definir alcance.
- La implementacion queda diferida hasta tener aprobacion explicita y una base tecnica estable.
- No se atribuye esta consulta a Claude ni Cursor porque no fueron las herramientas utilizadas.

## Resultado

Antes de implementar estadisticas de grupos, coordinar o esperar el resultado del Bloque 4. Mientras tanto, avanzar con estadisticas de juntadas y juegos que no dependan de entidades grupales.

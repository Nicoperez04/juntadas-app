# Prompt 01 — Bloque 1: ParticipantListScreen reemplazar Alert.alert por ErrorAnimation

## Contexto
Rama actual: feature/bloque-1-deuda-tecnica
En E2 se implementó ErrorAnimation como componente global de error
usado consistentemente en toda la app. Sin embargo, ParticipantListScreen
quedó usando Alert.alert nativo para mostrar errores, inconsistente
con el resto de la aplicación.
Stack relevante:
- React Native + Expo SDK 55 + TypeScript
- Componente global ErrorAnimation ya implementado en E2
- Sin TypeScript any, comentarios en español

## Tarea 1 — Análisis previo
Sin tocar ningún archivo, reportá:
1. ¿En qué archivo vive ParticipantListScreen? ¿Cuál es su ruta exacta?
2. ¿Cuántos Alert.alert existen en ese archivo y en qué situaciones
   se disparan (qué errores muestran)?
3. ¿Cuál es la ruta exacta del componente ErrorAnimation y cuál es
   su interfaz (qué props recibe)?
4. ¿Cómo usan ErrorAnimation otras pantallas de la app?
   Mostrar un ejemplo concreto de uso.
No tocar ningún archivo, solo reportar.

## Tarea 2 — Reemplazar Alert.alert por ErrorAnimation
En ParticipantListScreen:
1. Importar ErrorAnimation con la ruta correcta encontrada en Tarea 1
2. Reemplazar cada Alert.alert de error por ErrorAnimation,
   respetando exactamente la misma interfaz que usan las otras
   pantallas (encontrada en Tarea 1)
3. Mantener toda la lógica existente intacta — solo cambia la
   forma de mostrar el error, no cuándo ni por qué se muestra
No modificar ningún otro archivo.
No hacer commits.
Archivos esperados:
- El archivo de ParticipantListScreen (ruta encontrada en Tarea 1)

## Tarea 3 — Documentar este prompt
Crear el archivo:
ia/entrega-3/prompts/bloque-1/01_participant_list_error_animation.md
con el contenido completo de este prompt.
Crear ia/entrega-3/indice_ia.md si no existe, o agregar la entrada:
01 - ParticipantListScreen: reemplazar Alert.alert por ErrorAnimation
No hacer commits.

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- No hacer commits
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar reportar
1. Archivos modificados
2. Decisiones tomadas
3. Cómo probarlo en Pixel 9

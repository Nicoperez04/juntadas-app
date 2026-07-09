# Prompt 03c — Fix confirmDelete organizador en MemoryViewerScreen

## Contexto
Rama actual: feature/bloque-1-deuda-tecnica
El Prompt 03b agregó el botón de eliminar al organizador en
MemoryViewerScreen, pero confirmDelete no pasa meetupId ni
isOrganizer a deleteMemory. El servicio valida permisos antes
de llamar a Supabase, por lo que el organizador ve el botón
pero recibe "No tenés permiso para eliminar esta foto" al
confirmar.

La galería sí funciona porque useMemories.deletePhoto pasa
esos parámetros correctamente. Hay que replicar el mismo
comportamiento en el viewer.

## Tarea 1 — Análisis previo
Sin tocar ningún archivo, reportá:

1. En memoriesService.ts, función deleteMemory:
   a. ¿Qué parámetros recibe exactamente?
   b. ¿Cómo valida si el usuario tiene permiso para eliminar?
      ¿Chequea isOrganizer o meetupId en algún punto?
   c. ¿Qué retorna si el usuario no tiene permiso?

2. En useMemories o el hook equivalente, función deletePhoto:
   a. ¿Qué parámetros recibe y cómo los pasa a deleteMemory?
   b. ¿Cómo obtiene meetupId e isOrganizer para pasarlos?

3. En MemoryViewerScreen, función confirmDelete:
   a. ¿Cómo está implementada hoy exactamente?
   b. ¿Tiene acceso a meetupId e isOrganizer desde
      route.params?

No tocar ningún archivo, solo reportar.

## Tarea 2 — Fix confirmDelete en MemoryViewerScreen
En MemoryViewerScreen, función confirmDelete:

1. Pasar meetupId e isOrganizer a deleteMemory (o al hook
   equivalente) replicando exactamente el mismo patrón
   que usa la galería en useMemories.deletePhoto
2. Ambos valores ya están disponibles en route.params
   (meetupId existía antes, isOrganizer se agregó en 03b)
3. No cambiar la firma de deleteMemory ni la lógica del
   servicio, solo pasar los parámetros que ya acepta

No modificar ningún otro archivo ni ninguna otra lógica.
No hacer commits.
Archivos esperados:
- mobile/src/features/memories/screens/MemoryViewerScreen.tsx

## Tarea 3 — Documentar este prompt
Crear el archivo:
ia/entrega-3/prompts/bloque-1/03c_fix_confirm_delete_viewer.md
con el contenido completo de este prompt.
Actualizar ia/entrega-3/indice_ia.md agregando:
03c - Fix confirmDelete en MemoryViewerScreen: pasar
      meetupId e isOrganizer a deleteMemory

No hacer commits.

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- No hacer commits
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar reportar
1. Archivos modificados
2. Cómo quedó confirmDelete exactamente
3. Cómo probarlo en Pixel 9:
   - Aplicar migración 010 desde Supabase SQL Editor
     si aún no fue aplicada
   - Como organizador desde viewer: abrir foto ajena →
     botón eliminar visible → confirmar → foto desaparece
     sin error de permisos
   - Como participante no organizador: abrir foto ajena →
     sin botón eliminar
   - Como dueño de la foto (no organizador): abrir foto
     propia → botón visible → confirmar → foto desaparece

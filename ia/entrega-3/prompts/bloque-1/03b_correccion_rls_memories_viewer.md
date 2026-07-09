# Prompt 03b — Corrección RLS tabla memories y viewer organizador

## Contexto
Rama actual: feature/bloque-1-deuda-tecnica
El análisis del Prompt 03 encontró dos problemas pendientes:

Problema 1 (crítico): La migración 010 agrega la política DELETE
de organizador en Storage pero no en la tabla memories. Resultado:
el organizador puede borrar el archivo físico de Storage pero el
registro queda huérfano en la tabla porque la RLS de DELETE en
memories solo permite al uploaded_by.

Problema 2 (UI): MemoryViewerScreen no pasa isOrganizer ni muestra
el botón de eliminar al organizador sobre fotos ajenas. El flujo
de organizador hoy solo existe desde la galería con long-press.

## Tarea 1 — Análisis previo
Sin tocar ningún archivo, reportá:

1. En supabase/migrations/010_rls_memories_organizer.sql:
   a. ¿La migración toca solo Storage o también la tabla
      memories?
   b. ¿Hay alguna política DELETE de organizador definida
      para la tabla memories (no el bucket)?

2. En supabase/migrations/ anteriores, ¿qué políticas RLS
   existen hoy sobre la tabla memories (no el bucket)?
   Buscar en todos los archivos .sql menciones a
   'memories' con CREATE POLICY.

3. En MemoryViewerScreen:
   a. ¿Qué props recibe el componente o pantalla?
   b. ¿Cómo se navega hasta MemoryViewerScreen desde la
      galería? ¿Qué parámetros se pasan por navegación?
   c. ¿Cómo determina hoy si mostrar el botón de eliminar
      (isOwn)?
   d. ¿Qué función se llama al confirmar la eliminación?
      ¿Recibe el filePath y el id del registro?

4. En la galería de recuerdos (MemoriesScreen o similar):
   a. ¿Cómo obtiene isOrganizer? ¿Viene de props, de un
      hook, de TanStack Query?
   b. ¿Qué parámetros pasa a MemoryViewerScreen al navegar?

No tocar ningún archivo, solo reportar.

## Tarea 2 — Agregar política DELETE de organizador en tabla
En supabase/migrations/010_rls_memories_organizer.sql,
agregar al final del archivo:

1. Política DELETE de organizador sobre la tabla memories
   (no el bucket, la tabla PostgreSQL):
   Permitir DELETE cuando el usuario autenticado es el
   organizador de la juntada asociada al recuerdo:

   CREATE POLICY "memories_delete_organizer_record"
   ON memories FOR DELETE
   USING (
     EXISTS (
       SELECT 1 FROM meetups
       WHERE meetups.id = memories.meetup_id
       AND meetups.created_by = auth.uid()
     )
   );

2. Incluir comentario en español explicando que esta política
   complementa la de Storage: ambas deben existir para que
   el organizador pueda eliminar fotos ajenas de forma
   completa (archivo + registro).

No ejecutar la migración todavía.
No hacer commits.
Archivos esperados:
- supabase/migrations/010_rls_memories_organizer.sql

## Tarea 3 — Mostrar botón eliminar al organizador en viewer
En MemoryViewerScreen, basándose en lo encontrado en Tarea 1:

1. Recibir isOrganizer como parámetro de navegación o prop,
   según el mecanismo que ya usa la pantalla para recibir
   parámetros
2. Cambiar la condición del botón de eliminar de:
   isOwn
   a:
   isOwn || isOrganizer
3. No cambiar la función de eliminación ni su lógica,
   solo la condición de visibilidad del botón

En la galería de recuerdos (pantalla que navega al viewer):
1. Pasar isOrganizer a MemoryViewerScreen al navegar,
   usando el mismo mecanismo que ya existe para otros
   parámetros
No cambiar ninguna otra lógica en ninguna de las dos pantallas.
No hacer commits.
Archivos esperados:
- El archivo de MemoryViewerScreen (ruta encontrada en Tarea 1)
- La pantalla de galería que navega al viewer
  (ruta encontrada en Tarea 1)

## Tarea 4 — Documentar este prompt
Crear el archivo:
ia/entrega-3/prompts/bloque-1/03b_correccion_rls_memories_viewer.md
con el contenido completo de este prompt.
Actualizar ia/entrega-3/indice_ia.md agregando:
03b - Corrección RLS tabla memories y botón eliminar
      organizador en MemoryViewerScreen

No hacer commits.

## Reglas generales
- Comentarios en español en SQL y en código
- Sin TypeScript any
- No hacer commits
- No ejecutar migraciones, solo modificar el archivo SQL
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar reportar
1. Archivos modificados
2. Política SQL agregada (texto completo)
3. Cambios en MemoryViewerScreen y galería
4. Cómo probarlo:
   - Aplicar migración 010 desde Supabase SQL Editor
   - Como organizador desde galería: long-press foto ajena
     → eliminar → foto desaparece y no queda registro
     huérfano en tabla memories
   - Como organizador desde viewer: abrir foto ajena →
     botón eliminar visible → eliminar → foto desaparece
   - Como participante no organizador: abrir foto ajena →
     no se muestra botón eliminar

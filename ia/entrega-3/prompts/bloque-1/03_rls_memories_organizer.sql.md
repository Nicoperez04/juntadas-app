# Prompt 03 — Bloque 1: RLS fotos de recuerdos en Storage

## Contexto
Rama actual: feature/bloque-1-deuda-tecnica
El organizador de una juntada puede tocar "eliminar foto" en la
UI sobre fotos subidas por otros participantes, pero Supabase
Storage rechaza la operación porque la política RLS actual solo
permite eliminar al usuario que subió la foto (uploaded_by).

El path de las fotos en el bucket memories es:
{meetupId}/{userId}/{timestamp}.jpg

Desde ese path se puede extraer el meetupId para verificar en
la tabla meetups si el usuario que intenta eliminar es el
organizador (created_by = auth.uid()).

Modelo de permisos completo acordado:
- SELECT: cualquier participante confirmado de la juntada
- INSERT: cualquier participante confirmado de la juntada
- DELETE propio: el usuario que subió la foto
  (uploaded_by = auth.uid())
- DELETE organizador: el organizador de la juntada puede
  eliminar cualquier foto de su juntada
- UPDATE: nadie

Stack relevante:
- Supabase Storage bucket: memories
- Supabase PostgreSQL con RLS
- Tabla meetups con columna created_by (organizador)
- Tabla meetup_participants con columnas user_id y status
- Path de archivo: {meetupId}/{userId}/{timestamp}.jpg
- Sin TypeScript any, comentarios en español

## Tarea 1 — Análisis previo
Sin tocar ningún archivo ni ejecutar ninguna migración, reportá:

1. En Supabase Storage, bucket memories, ¿qué políticas RLS
   existen hoy? Listar nombre, operación (SELECT/INSERT/DELETE)
   y definición de cada una. Buscar en:
   - Dashboard de Supabase → Storage → Policies
   - O en los archivos de migración SQL existentes
     (supabase/migrations/) que mencionen el bucket memories

2. En supabase/migrations/, ¿cuál es el número de la última
   migración existente? El archivo nuevo debe seguir la
   numeración correlativa desde 009.

3. En memoriesService.ts:
   a. ¿Cómo se construye el path al eliminar una foto?
      ¿Se usa el mismo buildFilePath o se construye diferente?
   b. ¿Qué método de Supabase Storage se llama al eliminar
      (storage.from('memories').remove([path]))?
   c. ¿Se maneja el error de Storage cuando falla la
      eliminación, o se ignora silenciosamente?

4. En la pantalla o componente que permite eliminar fotos
   de recuerdos:
   a. ¿Cómo se determina si mostrar el botón de eliminar
      al usuario actual? ¿Se chequea si es el dueño de la
      foto o si es el organizador?
   b. ¿Qué mensaje de error se muestra si falla la
      eliminación?

No tocar ningún archivo, solo reportar.

## Tarea 2 — Crear migración SQL 010
Crear el archivo:
supabase/migrations/010_rls_memories_organizer.sql

El archivo debe:
1. Auditar comentando qué políticas existentes se mantienen
   sin cambios (las encontradas en Tarea 1)

2. Agregar política DELETE para el dueño de la foto si no
   existe:
   Permitir DELETE cuando:
   auth.uid()::text = (storage.fspath(name) split por '/'
   en posición [1], es decir el userId del path)

   En Supabase Storage el path completo accesible en las
   políticas es el campo name del objeto. Para el path
   {meetupId}/{userId}/{timestamp}.jpg:
   - split_part(name, '/', 1) = meetupId
   - split_part(name, '/', 2) = userId
   - split_part(name, '/', 3) = timestamp.jpg

3. Agregar política DELETE para el organizador:
   Permitir DELETE cuando el usuario autenticado es el
   organizador de la juntada correspondiente al meetupId
   del path:

   EXISTS (
     SELECT 1 FROM meetups
     WHERE id::text = split_part(name, '/', 1)
     AND created_by = auth.uid()
   )

4. Si las políticas de SELECT e INSERT encontradas en
   Tarea 1 ya cubren correctamente a participantes
   confirmados, no modificarlas. Solo agregar las que
   falten o estén incorrectas.

5. Cada política debe tener un nombre descriptivo:
   - memories_select_participants
   - memories_insert_participants
   - memories_delete_owner
   - memories_delete_organizer

Incluir comentarios en español explicando cada política.
No ejecutar la migración, solo crear el archivo.
No hacer commits.
Archivos esperados:
- supabase/migrations/010_rls_memories_organizer.sql

## Tarea 3 — Verificar manejo de error en memoriesService
Basándose en lo encontrado en Tarea 1 punto 3c:
Si la eliminación de Storage falla silenciosamente (no se
propaga el error a la UI), agregar el manejo correcto para
que el error llegue al componente que llama al servicio.
No cambiar la firma del método ni la lógica de negocio,
solo asegurarse de que el error se retorna correctamente.
Si ya maneja el error correctamente, reportar que no fue
necesario modificar nada.
No hacer commits.
Archivos esperados (solo si necesita cambios):
- mobile/src/features/memories/services/memoriesService.ts

## Tarea 4 — Documentar este prompt
Crear el archivo:
ia/entrega-3/prompts/bloque-1/03_rls_memories_organizer.sql.md
con el contenido completo de este prompt.
Actualizar ia/entrega-3/indice_ia.md agregando:
03 - RLS Storage memories: política DELETE para organizador
     y auditoría de políticas existentes

No hacer commits.

## Reglas generales
- Comentarios en español en el SQL y en el código
- Sin TypeScript any
- No hacer commits
- No ejecutar migraciones, solo crear el archivo SQL
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar reportar
1. Archivos creados o modificados
2. Políticas existentes que se mantuvieron sin cambios
3. Políticas nuevas agregadas y por qué
4. Si memoriesService necesitó cambios y cuáles
5. Cómo probarlo:
   - Aplicar la migración desde Supabase Dashboard →
     SQL Editor → ejecutar el contenido del archivo
   - Como participante no organizador: verificar que
     puede eliminar sus propias fotos pero no las de otros
   - Como organizador: verificar que puede eliminar
     cualquier foto de su juntada

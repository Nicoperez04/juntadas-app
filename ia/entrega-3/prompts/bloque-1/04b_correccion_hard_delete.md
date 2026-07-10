# Prompt 04b — Corrección hard delete: avatar, portadas e impostor_games

## Contexto
Rama actual: feature/bloque-1-deuda-tecnica
El Prompt 04 implementó la Edge Function delete-account pero
quedaron tres pendientes a resolver antes de deployar:

Pendiente 1a — Avatar no se limpia:
El archivo {userId}/avatar.jpg del bucket avatars queda
huérfano tras eliminar la cuenta.

Pendiente 1b — Portadas no se limpian:
Las portadas en bucket meetup-covers con path
{meetupId}/{userId}/{timestamp}.jpg quedan huérfanas cuando
la juntada se transfiere a otro organizador. Si la juntada
se elimina, la portada también se va por cascade en Storage,
pero si se transfiere la portada queda huérfana.

Pendiente 2 — impostor_games con created_by NOT NULL:
Cursor eliminó partidas donde created_by = userId en vez
de anonimizarlas porque created_by tiene constraint NOT NULL.
La decisión correcta (D26) es anonimizar, no eliminar.
Solución: migración 011 que hace created_by nullable en
impostor_games, luego la Edge Function puede SET NULL.

## Tarea 1 — Análisis previo
Sin tocar ningún archivo, reportá:

1. En supabase/functions/delete-account/index.ts:
   a. ¿En qué paso y cómo se manejan hoy las fotos de
      Storage? ¿Solo memories o también avatars y
      meetup-covers?
   b. ¿Cómo está implementado el PASO 3 de impostor_games
      exactamente? ¿Elimina o anonimiza?
   c. ¿Hay alguna referencia al bucket avatars o
      meetup-covers en la función?

2. En supabase/migrations/:
   a. ¿Cuál es el número de la última migración existente
      después de 010?
   b. En la migración donde se crea impostor_games, ¿cómo
      está definida la columna created_by? ¿Tiene NOT NULL
      explícito o viene de una FK?

3. En meetupService o authService del cliente móvil:
   a. ¿Cómo se construye el path al subir una portada de
      juntada en meetup-covers?
      ({meetupId}/{userId}/{timestamp}.jpg confirmado,
      pero verificar el método exacto)
   b. ¿Cómo se construye el path del avatar en avatars?
      ({userId}/avatar.jpg confirmado, verificar)

No tocar ningún archivo, solo reportar.

## Tarea 2 — Migración 011: hacer created_by nullable
Crear el archivo:
supabase/migrations/011_impostor_games_created_by_nullable.sql

Contenido:
-- Permite anonimizar partidas de impostor al eliminar cuenta
-- sin borrar el historial de la partida para otros participantes
ALTER TABLE impostor_games
  ALTER COLUMN created_by DROP NOT NULL;

No ejecutar la migración, solo crear el archivo.
No hacer commits.
Archivos esperados:
- supabase/migrations/011_impostor_games_created_by_nullable.sql

## Tarea 3 — Actualizar Edge Function delete-account
En supabase/functions/delete-account/index.ts:

1. PASO 2 — Ampliar limpieza de Storage:
   Además de memories, agregar:

   a. Eliminar avatar del bucket avatars:
      - Path: {userId}/avatar.jpg
      - storage.from('avatars').remove([`${userId}/avatar.jpg`])
      - Si no existe el archivo, ignorar el error silenciosamente
        (el usuario puede no tener avatar)

   b. Eliminar portadas huérfanas del bucket meetup-covers:
      - Consultar meetup-covers solo para juntadas que fueron
        TRANSFERIDAS (no eliminadas) en el PASO 1, porque las
        juntadas eliminadas ya no tienen portada accesible
      - Obtener los paths de portadas subidas por el usuario:
        consultar storage objects de meetup-covers con path
        que contenga /{userId}/ en la segunda posición
      - Alternativa más simple y confiable: listar todos los
        paths en meetup-covers donde el segmento del path
        corresponda al userId del usuario eliminado.
        Como el path es {meetupId}/{userId}/{timestamp}.jpg,
        usar el mismo patrón que memories: consultar la tabla
        meetups o directamente los objetos de Storage filtrando
        por el segmento userId del path.
      - Si no hay portadas, ignorar silenciosamente.

2. PASO 3 — Corregir anonimización de impostor_games:
   Reemplazar el DELETE por SET NULL:
   - UPDATE impostor_games SET created_by = null
     WHERE created_by = userId
   - UPDATE impostor_games SET impostor_user_id = null
     WHERE impostor_user_id = userId
   (después de aplicar migración 011, created_by ya es nullable)

3. Mantener todos los demás pasos sin cambios.
4. Mantener el helper stepError sin cambios.

No hacer commits.
Archivos esperados:
- supabase/functions/delete-account/index.ts

## Tarea 4 — Documentar este prompt
Crear el archivo:
ia/entrega-3/prompts/bloque-1/04b_correccion_hard_delete.md
con el contenido completo de este prompt.
Actualizar ia/entrega-3/indice_ia.md agregando:
04b - Corrección hard delete: limpieza avatar y portadas
      en Storage, anonimización impostor_games con
      migración 011

No hacer commits.

## Reglas generales
- Comentarios en español en Edge Function y SQL
- Sin TypeScript any
- No hacer commits
- No ejecutar migraciones, solo crear el archivo SQL
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar reportar
1. Archivos creados o modificados
2. Cómo quedó el PASO 2 de Storage exactamente
   (avatar + portadas + memories)
3. Cómo quedó el PASO 3 de impostor_games
4. Cómo probarlo:
   - Aplicar migración 011 desde Supabase SQL Editor
   - Deploy: supabase functions deploy delete-account
   - Cuenta de prueba con avatar, juntada con portada
     donde sea organizador con participantes confirmados
     (para probar transferencia + limpieza de portada),
     partidas de impostor creadas por el usuario
   - Verificar en Supabase tras eliminar cuenta:
     * bucket avatars: sin archivo del usuario
     * bucket meetup-covers: sin portadas del usuario
     * bucket memories: sin fotos del usuario
     * impostor_games: created_by = null e
       impostor_user_id = null donde correspondía
     * partidas de impostor NO eliminadas, solo anonimizadas
     * Auth: usuario eliminado

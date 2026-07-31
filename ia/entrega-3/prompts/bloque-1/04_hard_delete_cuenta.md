# Prompt 04 — Bloque 1: Hard delete de cuenta

## Contexto
Rama actual: feature/bloque-1-deuda-tecnica
Hoy authService.deleteAccount solo limpia push_token y cierra
sesión (stub). No elimina datos ni el usuario de Supabase Auth.

La UI de eliminación ya existe y está completa en ProfileScreen:
doble confirmación con modal + ingreso de email. No se toca.

La cadena actual es:
ProfileScreen → useAuth.deleteAccount() → authService.deleteAccount(userId)

Lo que hay que implementar:
1. Edge Function delete-account en Supabase con service_role
   que ejecute la eliminación real en el orden correcto
2. Reemplazar el stub en authService.deleteAccount para que
   llame a la Edge Function en vez de hacer signOut directo

Decisión D26 — orden de eliminación acordado:
1. Juntadas donde es organizador:
   - Si tiene participantes confirmados → transferir al más
     antiguo por joined_at (status = 'confirmed')
   - Si no tiene participantes confirmados → eliminar la
     juntada completa (el cascade se encarga de sus registros)
2. Fotos en Storage bucket memories subidas por el usuario
   (listar y eliminar archivos físicos)
3. Anonimizar impostor_games: created_by = null,
   impostor_user_id = null donde corresponda
4. Eliminar registros en este orden respetando foreign keys:
   - meetup_reviews (user_id)
   - meetup_participants (user_id)
   - meetup_hidden (user_id)
   - notifications (user_id)
   - memories (uploaded_by) — registros de tabla, no Storage
5. Limpiar push_token en profiles (push_token = null)
6. Eliminar perfil de tabla profiles
7. Eliminar usuario de Supabase Auth con service_role
   (último paso siempre)

El orden importa: Auth se elimina último para que si falla
algún paso anterior el usuario pueda volver a iniciar sesión
y reintentar.

Referencia de estructura: seguir el mismo patrón de
send-push-notification/index.ts para validación JWT,
uso de service_role, headers CORS y manejo de errores.

Stack relevante:
- Supabase Edge Functions (Deno)
- service_role para operaciones administrativas
- Supabase Storage bucket: memories
- Path fotos: {meetupId}/{userId}/{timestamp}.jpg
- Sin TypeScript any, comentarios en español

## Tarea 1 — Análisis previo
Sin tocar ningún archivo, reportá:

1. En supabase/functions/send-push-notification/index.ts:
   a. ¿Cómo se valida el JWT del usuario autenticado?
   b. ¿Cómo se inicializa el cliente con service_role?
      ¿Qué variables de entorno usa
      (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)?
   c. ¿Cómo están definidos los headers CORS?
   d. ¿Cómo se maneja el error general (try/catch externo)?
   e. ¿Qué formato tienen las respuestas de éxito y error?

2. En authService.ts, función deleteAccount:
   a. ¿Cómo obtiene el JWT del usuario actual para pasarlo
      a la Edge Function? ¿Usa supabase.auth.getSession()?
   b. ¿Hay alguna llamada a Edge Functions existente en
      authService o en otro servicio que pueda usar como
      referencia de patrón (supabase.functions.invoke)?

3. En la tabla meetup_participants:
   a. ¿Qué valores puede tener la columna status?
   b. ¿Existe índice o constraint sobre joined_at?

4. ¿Existe algún archivo de tipos compartidos entre Edge
   Functions (types.ts o similar en supabase/functions/)?

No tocar ningún archivo, solo reportar.

## Tarea 2 — Crear Edge Function delete-account
Crear el archivo:
supabase/functions/delete-account/index.ts

La función debe:

1. Validar el JWT del usuario autenticado siguiendo el mismo
   patrón de send-push-notification. Extraer userId del JWT.

2. Inicializar cliente Supabase con service_role usando las
   mismas variables de entorno que send-push-notification.

3. Ejecutar la eliminación en este orden exacto dentro de
   un bloque try/catch:

   PASO 1 — Transferir o eliminar juntadas del organizador:
   - Buscar todas las juntadas donde created_by = userId
   - Para cada juntada:
     * Buscar participante confirmado más antiguo por joined_at
       donde user_id != userId y status = 'confirmed'
     * Si existe → UPDATE meetups SET created_by = participante.user_id
     * Si no existe → DELETE FROM meetups WHERE id = juntada.id
       (el cascade de la DB se encarga del resto de registros
       de esa juntada si está configurado, sino eliminar
       meetup_participants de esa juntada primero)

   PASO 2 — Eliminar fotos de Storage:
   - Listar todos los archivos en bucket memories con prefijo
     que contenga userId en el path ({meetupId}/{userId}/)
   - IMPORTANTE: el path es {meetupId}/{userId}/{timestamp}.jpg
     No hay un prefijo único por userId — hay que listar
     por meetupId primero o usar una query a la tabla memories
     para obtener los filePaths del usuario y luego eliminar
     esos paths específicos del bucket
   - Eliminar los archivos encontrados del bucket

   PASO 3 — Anonimizar impostor_games:
   - UPDATE impostor_games SET created_by = null
     WHERE created_by = userId
   - UPDATE impostor_games SET impostor_user_id = null
     WHERE impostor_user_id = userId

   PASO 4 — Eliminar registros en orden:
   - DELETE FROM meetup_reviews WHERE user_id = userId
   - DELETE FROM meetup_participants WHERE user_id = userId
   - DELETE FROM meetup_hidden WHERE user_id = userId
   - DELETE FROM notifications WHERE user_id = userId
   - DELETE FROM memories WHERE uploaded_by = userId

   PASO 5 — Limpiar push_token:
   - UPDATE profiles SET push_token = null WHERE id = userId

   PASO 6 — Eliminar perfil:
   - DELETE FROM profiles WHERE id = userId

   PASO 7 — Eliminar usuario de Auth (último siempre):
   - adminClient.auth.admin.deleteUser(userId)

4. Si cualquier paso falla, retornar error con el paso
   que falló para facilitar debugging. No hacer rollback
   manual — si falla en paso 5 o 6, los datos ya fueron
   limpiados en pasos anteriores, lo cual es aceptable.

5. Respuesta de éxito: { success: true }
   Respuesta de error: { error: 'descripción', step: N }

6. Seguir exactamente el mismo formato de headers CORS
   y manejo de OPTIONS que send-push-notification.

No hacer commits.
Archivos esperados:
- supabase/functions/delete-account/index.ts

## Tarea 3 — Reemplazar stub en authService
En authService.ts, función deleteAccount:

1. Obtener el JWT del usuario actual con
   supabase.auth.getSession()
2. Llamar a la Edge Function delete-account usando
   supabase.functions.invoke('delete-account') pasando
   el JWT en el header Authorization
3. Si la Edge Function retorna error → retornar
   { data: null, error: mensaje } sin hacer signOut
4. Si la Edge Function retorna éxito → hacer signOut
   (el usuario ya fue eliminado de Auth, el signOut
   limpia el estado local de la sesión)
5. Mantener la firma del método sin cambios:
   async deleteAccount(userId: string): Promise<ServiceResult<null>>

No modificar ningún otro método de authService.
No hacer commits.
Archivos esperados:
- mobile/src/features/auth/services/authService.ts

## Tarea 4 — Documentar este prompt
Crear el archivo:
ia/entrega-3/prompts/bloque-1/04_hard_delete_cuenta.md
con el contenido completo de este prompt.
Actualizar ia/entrega-3/indice_ia.md agregando:
04 - Hard delete de cuenta: Edge Function delete-account
     con service_role y reemplazo de stub en authService

No hacer commits.

## Reglas generales
- Comentarios en español en Edge Function y en authService
- Sin TypeScript any
- No hacer commits
- Si algo es ambiguo, preguntar antes de asumir
- Seguir exactamente el patrón de send-push-notification
  para la estructura de la Edge Function

## Al finalizar reportar
1. Archivos creados o modificados
2. Decisiones tomadas, especialmente:
   - Cómo se resolvió el listado de fotos en Storage
     por userId (el path no tiene prefijo único por usuario)
   - Cómo quedó el manejo de errores por paso
3. Cómo probarlo:
   - Deployar la Edge Function con:
     supabase functions deploy delete-account
   - Crear una cuenta de prueba con juntadas, fotos y
     participaciones
   - Ejecutar eliminar cuenta desde ProfileScreen
   - Verificar en Supabase que:
     * El usuario no existe en Auth
     * No hay registros en profiles, memories,
       meetup_participants, meetup_reviews, notifications
     * Las juntadas con participantes tienen nuevo organizador
     * Las juntadas sin participantes fueron eliminadas
     * impostor_games tienen null en los campos del usuario
     * Las fotos fueron eliminadas del bucket memories

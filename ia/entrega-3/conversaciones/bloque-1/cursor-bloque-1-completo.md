# Conversación Bloque 1 — Deuda técnica E2

**Herramienta:** Cursor Agent
**Rama:** feature/bloque-1-deuda-tecnica

## Resumen

### Lo que se implementó
- Prompt 01: Reemplazo de Alert.alert por ErrorAnimation
  en ParticipantListScreen
- Prompt 02: Fix completo toggle notificaciones —
  guard AsyncStorage en App.tsx y control de suscripción
  Realtime desde ProfileScreen via listeners internos
- Prompt 03: RLS Storage memories — política DELETE para
  organizador en bucket y tabla, botón eliminar en
  MemoryViewerScreen
- Prompt 04: Hard delete de cuenta — Edge Function
  delete-account con service_role, transferencia de
  organizador, limpieza de Storage (memories, avatars,
  meetup-covers), anonimización de impostor_games,
  migración 011 para created_by nullable
- Prompt 05: Auto-refresh Realtime por tipo de
  notificación, pull-to-refresh en Home y Detalle,
  skeleton con shimmer usando expo-linear-gradient
- Prompt 06: Casos borde — error participantes
  silencioso, subida parcial de fotos con
  UploadPhotosResult, indicador fecha pasada,
  limpieza de maxParticipants

### Decisiones tomadas
- D26: Hard delete con transferencia al participante
  confirmado más antiguo por joined_at; juntadas sin
  participantes se eliminan; impostor_games se
  anonimizan (created_by nullable via migración 011)
- Toggle notificaciones controla tanto push (FCM)
  como in-app (Realtime) — AppNotificationsBootstrap
  es la única fuente de verdad para el parámetro
  enabled del hook
- Skeleton solo en área de cards, no reemplaza
  header ni botones de acción
- isPastMeetup como helper compartido en
  meetupDateTime.ts para evitar duplicación
- UploadPhotosResult con tres estados mutuamente
  excluyentes (success/partial/failure)
- maxParticipants eliminado de appConfig por ser
  valor arbitrario sin uso en runtime

### Problemas encontrados y resueltos
- Toggle (Prompt 02): race condition entre doble
  lectura de AsyncStorage en AppNotificationsBootstrap
  y en el hook — resuelto eliminando la lectura
  interna del hook y centralizando en Bootstrap
- Hard delete (Prompt 04): meetup_participants.role
  no se actualizaba al transferir organizador —
  resuelto agregando UPDATE role = 'organizer'
  al sucesor en el mismo PASO 1
- Hard delete (Prompt 04): portadas en meetup-covers
  no se limpiaban por Invalid schema: storage —
  resuelto consultando meetups.cover_url en schema
  public en vez de storage.objects
- Skeleton (Prompt 05): reemplazaba toda la pantalla
  incluyendo el header — resuelto moviendo los
  skeletons al área de cards únicamente

### Deuda técnica pendiente
- Skeleton en MeetupDetailScreen (Bloque 8)
- Animaciones de entrada de cards y press feedback
  (Bloque 8)
- Testing sistemático pantalla por pantalla (Bloque 7)
- Casos borde hipotéticos sin confirmar (Bloque 7)
- Portadas históricas en meetup-covers no se limpian
  en hard delete (limitación aceptada: no hay tabla
  de historial de portadas)

## Conversación completa

Este documento incluye **prompts y respuestas finales** extraídas de los agent transcripts de Cursor (JSONL local) y de los archivos en `prompts/bloque-1/`. No incluye tool calls ni razonamiento intermedio.

**Transcripts fuente:**
- `a9710862-1941-4807-aa43-4f00a58d3bfe` — Prompts 01, 02, 02b, 02c
- `1bfb2063-c9d6-4b0b-8ec3-5ac9f9cfe129` — Prompts 03, 03b, 03c, 04, 04b, 04c, 04d
- `44a62921-3ad2-4c27-88f0-5eb142f1d040` — Prompts 05, 05b
- `9d0557bd-fc12-4b7e-b1bd-1519f2ad52eb` — Prompt 06
- `5f537eb5-9db6-4e82-abd5-47d9b7da8309` — Prompt 07

---

## Prompts y respuestas
### 01_participant_list_error_animation.md

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


---

### 02_fix_toggle_notificaciones.md

# Prompt 02 — Bloque 1: Fix completo toggle de notificaciones

## Contexto
Rama actual: feature/bloque-1-deuda-tecnica
El toggle de notificaciones en ProfileScreen tiene dos problemas:
1. Bug A: al reiniciar la app, App.tsx llama registerPushToken en
   onAuthStateChange sin consultar la preferencia guardada en
   AsyncStorage, re-registrando el token aunque el usuario lo haya
   desactivado.
2. Bug B: el toggle solo controla el push token (FCM), pero no la
   suscripción Realtime. Las notificaciones in-app (banner flotante
   y panel) siguen llegando aunque el toggle esté en OFF porque
   useRealtimeNotifications se inicializa siempre en
   AppNotificationsBootstrap sin consultar la preferencia.

La decisión de producto es: el toggle debe controlar tanto las
notificaciones push como las in-app. Toggle OFF = sin push + sin
banner + sin actualizaciones del panel.

Arquitectura relevante:
- App.tsx: onAuthStateChange llama registerPushToken; también
  monta AppNotificationsBootstrap que inicializa
  useRealtimeNotifications
- useRealtimeNotifications: hook en
  src/features/notifications/hooks/useNotifications.ts (líneas
  140-180). Crea el canal Supabase Realtime, invalida TanStack
  Query y llama setPendingBanner en el store Zustand
- ProfileScreen: handleToggleNotifications gestiona el toggle,
  guarda 'true'/'false' en AsyncStorage bajo la key
  'notifications_enabled', y llama registerPushToken o
  clearPushToken según corresponda
- notificationStore (Zustand): recibe pendingBanner y lo expone
  a NotificationBanner

Stack relevante:
- React Native + Expo SDK 55 + TypeScript
- expo-notifications con guard isExpoGo
- AsyncStorage key: 'notifications_enabled' ('true' / 'false')
- Supabase Realtime para notificaciones in-app
- TanStack Query v5
- Zustand para notificationStore
- Sin TypeScript any, comentarios en español

## Tarea 1 — Análisis previo
Sin tocar ningún archivo, reportá:

1. En App.tsx:
   a. ¿En qué línea exacta se llama registerPushToken dentro de
      onAuthStateChange? ¿Hay algún guard previo además de
      isExpoGo?
   b. ¿Cómo está montado AppNotificationsBootstrap? ¿Depende
      de alguna condición de sesión o se monta siempre?

2. En useNotifications.ts, hook useRealtimeNotifications:
   a. ¿Qué parámetros recibe?
   b. ¿Qué pasa si userId es null o undefined? ¿Hay algún guard
      que evite crear el canal?
   c. ¿El hook limpia la suscripción en el cleanup del useEffect
      (subscription.unsubscribe)?

3. En ProfileScreen.tsx, función handleToggleNotifications:
   a. ¿En qué orden exacto se ejecutan las operaciones al
      desactivar (clearPushToken, AsyncStorage, setState)?
   b. ¿Hay algún mecanismo hoy para afectar la suscripción
      Realtime desde esta función?

4. En notificationStore (Zustand):
   a. ¿Existe alguna acción para limpiar pendingBanner o
      resetear el estado del store?

No tocar ningún archivo, solo reportar.

## Tarea 2 — Fix Bug A: guard en App.tsx para registerPushToken
En App.tsx, dentro de onAuthStateChange, antes de llamar
registerPushToken:
1. Leer AsyncStorage con la key 'notifications_enabled'
2. Si el valor es 'false': no llamar registerPushToken,
   salir silenciosamente
3. Si el valor es 'true' o null (default activado): llamar
   registerPushToken normalmente
No modificar ninguna otra lógica de App.tsx en esta tarea.
No hacer commits.
Archivos esperados:
- mobile/App.tsx

## Tarea 3 — Fix Realtime: guard en useRealtimeNotifications
En useNotifications.ts, hook useRealtimeNotifications:
1. Agregar un parámetro enabled: boolean al hook. Si enabled
   es false, no crear el canal Supabase ni suscribirse, y
   retornar cleanup vacío
2. El parámetro enabled debe leerse desde AsyncStorage
   ('notifications_enabled') dentro del hook, antes de crear
   la suscripción. Si no existe la key, asumir true (default
   activado)
3. Asegurarse de que el cleanup (unsubscribe) funcione
   correctamente cuando enabled cambia de true a false en
   caliente (el canal existente debe destruirse)
No modificar ninguna otra lógica del hook.
No hacer commits.
Archivos esperados:
- mobile/src/features/notifications/hooks/useNotifications.ts

## Tarea 4 — Conectar el toggle en vivo desde ProfileScreen
En ProfileScreen.tsx, función handleToggleNotifications:
1. Al desactivar (enabled = false):
   - Llamar clearPushToken (ya existe)
   - Guardar 'false' en AsyncStorage (ya existe)
   - Además: desactivar la suscripción Realtime en caliente.
     Usar el mecanismo que corresponda según lo encontrado en
     Tarea 1 (puede ser llamar una función expuesta por el hook,
     cambiar un estado que el hook observa, o cualquier
     mecanismo limpio sin prop drilling innecesario)
2. Al activar (enabled = true):
   - Llamar registerPushToken (ya existe)
   - Guardar 'true' en AsyncStorage (ya existe)
   - Además: reactivar la suscripción Realtime en caliente
3. Limpiar pendingBanner del store Zustand al desactivar,
   para que el banner no quede visible si estaba mostrándose
   en ese momento
Si el mecanismo para controlar el Realtime desde ProfileScreen
no está claro después de la Tarea 1, preguntar antes de asumir
una solución.
No modificar ninguna otra lógica de ProfileScreen.
No hacer commits.
Archivos esperados:
- mobile/src/features/profile/screens/ProfileScreen.tsx

## Tarea 5 — Documentar este prompt
Crear el archivo:
ia/entrega-3/prompts/bloque-1/02_fix_toggle_notificaciones.md
con el contenido completo de este prompt.
Actualizar ia/entrega-3/indice_ia.md agregando:
02 - Fix toggle notificaciones: guard AsyncStorage en App.tsx
     y control de suscripción Realtime desde ProfileScreen

No hacer commits.

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- No hacer commits
- Si algo es ambiguo, preguntar antes de asumir
- No modificar archivos fuera de los listados en cada tarea

## Al finalizar reportar
1. Archivos modificados
2. Decisiones tomadas (especialmente cómo se resolvió el
   control del Realtime desde ProfileScreen)
3. Cómo probarlo en Pixel 9:
   - Caso 1: toggle OFF → cerrar app → reabrir → verificar
     que push_token sigue null en Supabase
   - Caso 2: toggle OFF → sin cerrar app → generar una acción
     que dispare notificación → verificar que no aparece
     banner ni se actualiza el panel
   - Caso 3: toggle ON → verificar que push_token vuelve a
     Supabase y las notificaciones in-app funcionan


---

### 02b_correccion_toggle_notificaciones.md

# Prompt 02b — Corrección fix toggle notificaciones

## Contexto
Rama actual: feature/bloque-1-deuda-tecnica
El fix del Prompt 02 no funciona en ninguno de los dos casos.
Después del diagnóstico se identificaron dos causas raíces:

Causa 1 — AppNotificationsBootstrap (Bug A y B):
AppNotificationsBootstrap llama useRealtimeNotifications(userId)
sin pasar el parámetro enabled (líneas 40-43 de App.tsx).
El hook siempre usa enabled = true por default, ignorando
la preferencia del usuario. Esto hace que:
- El canal Realtime se cree siempre al arrancar (Bug B)
- setNotificationsRealtimeEnabled(false) no destruya el canal
  porque enabled sigue siendo true en el hook (Bug B)

Causa 2 — Race condition en onAuthStateChange (Bug A):
El guard usa void AsyncStorage.getItem(...).then() dentro
del callback de onAuthStateChange. Al arrancar la app,
AsyncStorage puede no haber terminado de leer antes de que
el evento de sesión se dispare, causando que registerPushToken
se ejecute antes de conocer la preferencia real.

## Tarea 1 — Análisis previo
Sin tocar ningún archivo, reportá:

1. En App.tsx, AppNotificationsBootstrap (líneas 40-43):
   ¿Cómo está definido exactamente? ¿Recibe algún prop
   además de userId?

2. En useNotifications.ts, useRealtimeNotifications:
   ¿El parámetro enabled está tipado como boolean con
   default true? ¿isSubscriptionActive incluye enabled
   en su condición?

3. En App.tsx, onAuthStateChange (líneas 68-88):
   ¿El AsyncStorage.getItem está dentro de un void .then()
   o usa await correctamente?

No tocar ningún archivo, solo reportar.

## Tarea 2 — Fix AppNotificationsBootstrap
En App.tsx, modificar AppNotificationsBootstrap para que:
1. Lea la preferencia de AsyncStorage ('notifications_enabled')
   al montar, usando useState + useEffect con await correcto
2. Mientras AsyncStorage no terminó de leer (estado inicial),
   pase enabled={false} al hook para evitar suscribirse
   prematuramente
3. Una vez leída la preferencia, pase enabled={true} o
   enabled={false} según el valor encontrado
   (ausencia de key = true por defecto)
4. Cuando el usuario cambia el toggle en ProfileScreen,
   setNotificationsRealtimeEnabled ya notifica a los
   listeners del hook directamente — no hace falta que
   AppNotificationsBootstrap reaccione a ese cambio,
   el hook lo maneja internamente

Solo modificar AppNotificationsBootstrap dentro de App.tsx.
No tocar ninguna otra lógica de App.tsx.
No hacer commits.
Archivos esperados:
- mobile/App.tsx

## Tarea 3 — Fix race condition en onAuthStateChange
En App.tsx, dentro de onAuthStateChange, reemplazar el
void AsyncStorage.getItem(...).then() por una función
async interna con await correcto:

  if (session?.user?.id && !isExpoGoEnvironment()) {
    const registerIfEnabled = async () => {
      const value = await AsyncStorage.getItem(
        NOTIFICATIONS_ENABLED_KEY
      );
      if (value === 'false') return;
      await notificationService.registerPushToken(
        session.user.id
      );
    };
    void registerIfEnabled();
  }

Esto garantiza que AsyncStorage se lee completamente antes
de decidir si registrar el token.
No tocar ninguna otra lógica de onAuthStateChange.
No hacer commits.
Archivos esperados:
- mobile/App.tsx

## Tarea 4 — Documentar este prompt
Crear el archivo:
ia/entrega-3/prompts/bloque-1/02b_correccion_toggle_notificaciones.md
con el contenido completo de este prompt.
Actualizar ia/entrega-3/indice_ia.md agregando:
02b - Corrección fix toggle: AppNotificationsBootstrap
      con enabled dinámico y fix race condition en
      onAuthStateChange

No hacer commits.

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- No hacer commits
- Si algo es ambiguo, preguntar antes de asumir
- No modificar archivos fuera de los listados en cada tarea

## Al finalizar reportar
1. Archivos modificados
2. Decisiones tomadas
3. Cómo probarlo en Pixel 9:
   - Caso 1: toggle OFF → cerrar app completamente →
     reabrir → verificar que push_token sigue null en
     Supabase y el toggle sigue en OFF
   - Caso 2: toggle OFF sin cerrar app → generar acción
     que dispare notificación desde otra cuenta →
     verificar que no aparece banner ni se actualiza
     el panel
   - Caso 3: toggle ON → verificar que push_token vuelve
     a Supabase y las notificaciones in-app funcionan


---

### 02c_correccion_banner_toggle.md

# Prompt 02c — Corrección banner flotante con toggle ON

## Contexto
Rama actual: feature/bloque-1-deuda-tecnica
Después del fix 02b el toggle ON/OFF funciona correctamente
para push_token, pero el banner flotante dejó de aparecer
cuando el toggle está en ON.

Causa raíz identificada: hay una condición de carrera entre
dos lecturas de AsyncStorage independientes que se contradicen:

1. AppNotificationsBootstrap lee AsyncStorage y pasa el
   resultado como parámetro enabled al hook. Mientras AsyncStorage
   no termina de leer, pasa enabled={false} (porque
   notificationsEnabled es null → realtimeEnabled = false).

2. useRealtimeNotifications también lee AsyncStorage internamente
   en su propio useEffect (líneas 170-182) y setea
   preferenceEnabled por su cuenta.

3. isSubscriptionActive requiere AMBOS en true simultáneamente:
   !!userId && enabled && preferenceEnabled === true

   Esto crea una race condition: cuando AppNotificationsBootstrap
   termina de leer y pasa enabled={true}, el useEffect interno
   del hook ya no se re-ejecuta (tiene [] como dependencias) y
   preferenceEnabled puede estar en un estado inconsistente.
   El canal nunca llega a crearse.

La solución: el hook NO debe leer AsyncStorage internamente.
Esa responsabilidad vive exclusivamente en
AppNotificationsBootstrap. El hook solo recibe enabled como
parámetro externo y escucha cambios en caliente via listeners.

## Tarea 1 — Análisis previo
Sin tocar ningún archivo, reportá:

1. En useNotifications.ts, useRealtimeNotifications:
   a. ¿Cuáles son exactamente los tres useEffect presentes
      (líneas 170-182, 184-195, 199-231)?
   b. ¿preferenceEnabled se usa en algún otro lugar además
      de isSubscriptionActive?
   c. ¿El listener de cambios en caliente
      (notificationsPreferenceListeners) setea preferenceEnabled
      o enabled?

2. En AppNotificationsBootstrap (App.tsx líneas 36-68):
   a. ¿Cómo se calcula realtimeEnabled exactamente?
   b. Cuando notificationsEnabled es null (AsyncStorage aún
      no leído), ¿qué valor pasa al hook?

No tocar ningún archivo, solo reportar.

## Tarea 2 — Eliminar lectura interna de AsyncStorage del hook
En useNotifications.ts, hook useRealtimeNotifications:

1. Eliminar completamente el primer useEffect que lee
   AsyncStorage internamente (líneas 170-182). El hook
   no debe leer AsyncStorage por su cuenta.

2. Eliminar el estado preferenceEnabled y su useState.
   Ya no es necesario porque la preferencia viene
   exclusivamente del parámetro enabled.

3. Simplificar isSubscriptionActive a:
   const isSubscriptionActive = !!userId && enabled;
   Sin preferenceEnabled, sin doble condición.

4. Mantener intacto el useEffect del listener de cambios
   en caliente (líneas 184-195). Este listener debe llamar
   a setNotificationsRealtimeEnabled que a su vez actualiza
   enabled en AppNotificationsBootstrap, no un estado
   interno del hook.

   IMPORTANTE: verificar que setNotificationsRealtimeEnabled
   propaga el cambio hacia AppNotificationsBootstrap y no
   hacia un estado interno del hook que ya no existe.
   Si el listener actualmente hace setPreferenceEnabled(),
   hay que redirigir esa actualización para que
   AppNotificationsBootstrap reaccione en cambio.

5. Mantener intacto el useEffect que crea/destruye el canal
   Supabase (líneas 199-231). Solo cambia que ahora depende
   de isSubscriptionActive simplificado.

No modificar ningún otro archivo en esta tarea.
No hacer commits.
Archivos esperados:
- mobile/src/features/notifications/hooks/useNotifications.ts

## Tarea 3 — Ajustar AppNotificationsBootstrap para
           propagar cambios en caliente
En App.tsx, AppNotificationsBootstrap:

El problema con el listener actual es que
setNotificationsRealtimeEnabled notifica a listeners internos
del hook (que ya no existen después de la Tarea 2).
Ahora el cambio en caliente debe actualizar el estado
notificationsEnabled de AppNotificationsBootstrap para que
se lo pase al hook via el parámetro enabled.

1. Agregar un useEffect en AppNotificationsBootstrap que
   registre un listener en notificationsPreferenceListeners
   (importado desde useNotifications.ts) para recibir
   cambios en caliente desde ProfileScreen:
   - Cuando llega enabled=true → setNotificationsEnabled(true)
   - Cuando llega enabled=false → setNotificationsEnabled(false)

2. El flujo completo queda así:
   ProfileScreen cambia toggle
     → setNotificationsRealtimeEnabled(true/false)
       → notifica a listener en AppNotificationsBootstrap
         → setNotificationsEnabled(true/false)
           → realtimeEnabled cambia
             → hook recibe nuevo enabled
               → isSubscriptionActive cambia
                 → canal se crea o destruye

3. Mantener el useEffect que lee AsyncStorage al montar
   (líneas 46-60) sin cambios. Solo agregar el useEffect
   del listener.

No modificar ningún otro archivo en esta tarea.
No hacer commits.
Archivos esperados:
- mobile/App.tsx

## Tarea 4 — Documentar este prompt
Crear el archivo:
ia/entrega-3/prompts/bloque-1/02c_correccion_banner_toggle.md
con el contenido completo de este prompt.
Actualizar ia/entrega-3/indice_ia.md agregando:
02c - Corrección banner flotante: eliminar doble lectura
      AsyncStorage en hook, propagar cambios via
      AppNotificationsBootstrap

No hacer commits.

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- No hacer commits
- Si algo es ambiguo, preguntar antes de asumir
- No modificar archivos fuera de los listados en cada tarea

## Al finalizar reportar
1. Archivos modificados
2. Decisiones tomadas
3. Cómo probarlo en Pixel 9:
   - Caso 1: toggle ON → generar notificación desde otra
     cuenta → verificar que aparece el banner flotante
   - Caso 2: toggle OFF → generar notificación → verificar
     que NO aparece banner ni se actualiza el panel
   - Caso 3: toggle OFF → cerrar app → reabrir → toggle
     sigue OFF y push_token sigue null


---

### 03_rls_memories_organizer.sql.md

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


---

### 03b_correccion_rls_memories_viewer.md

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


---

### 03c_fix_confirm_delete_viewer.md

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


---

### 04_hard_delete_cuenta.md

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


---

### 04b_correccion_hard_delete.md

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


---

### 04c_fix_transferencia_role.md

# Prompt 04c COMPLETO— Fix transferencia organizador en delete-account
# (no documentar como los otros, es corrección interna)

## Contexto
Rama actual: feature/bloque-1-deuda-tecnica
La Edge Function delete-account transfiere meetups.created_by
correctamente al sucesor, pero no actualiza el campo role en
meetup_participants. El sucesor queda con role = 'participant'
en vez de role = 'organizer', por lo que la app no lo reconoce
como nuevo organizador.

## Tarea 1 — Análisis previo
Sin tocar ningún archivo, reportá:

1. En delete-account/index.ts, dentro de
   transferOrDeleteOrganizedMeetups, en el bloque donde
   se hace el UPDATE de created_by al sucesor:
   ¿Hay algún UPDATE posterior a meetup_participants
   para cambiar el role del sucesor?

2. ¿Qué valores puede tener la columna role en
   meetup_participants? Buscarlo en las migraciones SQL
   o en los tipos TypeScript del proyecto móvil.

No tocar ningún archivo, solo reportar.

## Tarea 2 — Fix: actualizar role del sucesor
En supabase/functions/delete-account/index.ts, dentro de
transferOrDeleteOrganizedMeetups, después del UPDATE exitoso
de meetups.created_by al sucesor, agregar:

UPDATE meetup_participants
SET role = 'organizer'
WHERE meetup_id = meetup.id
AND user_id = successor.user_id

Si este UPDATE falla, retornar stepError(1, mensaje).

No modificar ninguna otra lógica de la función.
No hacer commits.
Archivos esperados:
- supabase/functions/delete-account/index.ts

## Tarea 3 — Documentar
Crear el archivo:
ia/entrega-3/prompts/bloque-1/04c_fix_transferencia_role.md
con el contenido completo de este prompt.
Actualizar ia/entrega-3/indice_ia.md agregando:
04c - Fix transferencia organizador: actualizar role en
      meetup_participants al transferir created_by

No hacer commits.

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- No hacer commits
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar reportar
1. Archivos modificados
2. Cómo quedó el bloque de transferencia completo
3. Cómo probarlo:
   - supabase functions deploy delete-account
   - Cuenta de prueba con juntada donde sea organizador
     y tenga participante confirmado
   - Eliminar cuenta
   - Verificar que el participante confirmado aparece
     como organizador en la app (no solo en created_by
     de Supabase sino en su rol dentro de la juntada)


---

### 04d_fix_warning_portadas.md

# Prompt 04d — Fix WARNING portadas meetup-covers en delete-account

## Contexto
Rama actual: feature/bloque-1-deuda-tecnica
La Edge Function delete-account lanza WARNING:
"No se pudieron listar portadas en Storage: Invalid schema: storage"

El helper listUserCoverPaths usa admin.schema('storage').from('objects')
que no está disponible via PostgREST en Edge Functions con service_role.
Resultado: las portadas del usuario en meetup-covers no se eliminan.

La solución es reemplazar la query al schema storage por una consulta
a meetups.cover_url en el schema public, que sí es accesible.
La URL pública contiene el path: extraerlo con el mismo patrón que
usa getCoverFilePath en EditMeetupScreen.

Patrón de URL: .../meetup-covers/{meetupId}/{userId}/{timestamp}.jpg
Marker para extraer path: '/meetup-covers/'

## Tarea 1 — Análisis previo
Sin tocar ningún archivo, reportá:

1. En delete-account/index.ts, función listUserCoverPaths
   (líneas 157-180):
   ¿Cómo filtra exactamente que el userId sea el segundo
   segmento del path? ¿Solo filtra por LIKE o también
   valida en JS?

2. En meetups, ¿cover_url puede ser null? ¿Qué valor tiene
   si la juntada no tiene portada?

3. ¿El usuario eliminado puede tener portadas en juntadas
   que NO era organizador (por ejemplo juntadas transferidas
   donde había subido la portada antes de transferir)?
   Esto determina si alcanza con filtrar por created_by
   o hay que buscar por el userId en la URL.

No tocar ningún archivo, solo reportar.

## Tarea 2 — Reemplazar listUserCoverPaths
En supabase/functions/delete-account/index.ts:

Reemplazar la función listUserCoverPaths completa por esta
implementación que consulta meetups.cover_url en public:

/**
 * Obtiene paths de portadas subidas por el usuario en meetup-covers
 * consultando cover_url en la tabla meetups (schema public).
 * Solo considera portadas activas (cover_url NOT NULL).
 * Portadas reemplazadas (paths viejos) no se recuperan — limitación
 * aceptada porque no hay registro de portadas históricas.
 */
const listUserCoverPaths = async (
  admin: SupabaseClient,
  userId: string,
): Promise<string[]> => {
  const marker = '/meetup-covers/';
  // Buscar juntadas con cover_url que contenga el userId en el path
  const { data, error } = await admin
    .from('meetups')
    .select('cover_url')
    .not('cover_url', 'is', null)
    .like('cover_url', `%/${userId}/%`);
  if (error) {
    console.warn('No se pudieron listar portadas:', error.message);
    return [];
  }
  return (data ?? [])
    .map((row) => {
      const url = (row as { cover_url: string }).cover_url;
      const index = url.indexOf(marker);
      if (index === -1) return null;
      return url.substring(index + marker.length);
    })
    .filter((path): path is string => path !== null)
    .filter((path) => path.split('/')[1] === userId);
};

No modificar ninguna otra función.
No hacer commits.
Archivos esperados:
- supabase/functions/delete-account/index.ts

## Tarea 3 — Documentar este prompt
Crear el archivo:
ia/entrega-3/prompts/bloque-1/04d_fix_warning_portadas.md
con el contenido completo de este prompt.
Actualizar ia/entrega-3/indice_ia.md agregando:
04d - Fix WARNING portadas meetup-covers: reemplazar
      query schema storage por consulta a meetups.cover_url

No hacer commits.

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- No hacer commits
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar reportar
1. Archivos modificados
2. Cómo quedó listUserCoverPaths exactamente
3. Limitación documentada sobre portadas históricas
4. Cómo probarlo:
   - supabase functions deploy delete-account
   - Cuenta de prueba con juntada que tenga portada subida
   - Eliminar cuenta
   - Verificar en Supabase Storage → meetup-covers que
     no quedan archivos del usuario
   - Verificar que no aparece WARNING en los logs de
     la Edge Function


---

### 05_autorefresh_pulltorefresh_skeleton.md

> **Archivo no encontrado en prompts/bloque-1/.** El prompt fue ejecutado en Cursor; ver transcript `44a62921-3ad2-4c27-88f0-5eb142f1d040` para el contenido completo.

---

### 05b_correccion_skeleton_pulltorefresh.md

# Prompt 05b — Corrección skeleton y pull-to-refresh

## Contexto
Rama actual: feature/bloque-1-deuda-tecnica
El Prompt 05 implementó skeleton, pull-to-refresh y auto-refresh.
Auto-refresh funciona correctamente. Hay dos bugs a corregir:

Bug 1 — Skeleton ocupa toda la pantalla:
isPageLoading reemplaza todo el contenido incluyendo el header
("Mis juntadas", botones Crear/Unirse). El skeleton debería
aparecer solo en el área de lista de cards ("Próximas juntadas"),
mostrando el mismo número de skeletons que juntadas hay
o 3 como máximo si aún no se sabe cuántas hay.
El header y los botones deben ser visibles siempre.

Bug 2 — Pull-to-refresh tarda más de lo esperado:
El spinner permanece visible más tiempo del necesario.
Probablemente handleRefresh no resuelve el await
correctamente o setIsRefreshing(false) se llama tarde.

## Tarea 1 — Análisis previo
Sin tocar ningún archivo, reportá:

1. En MeetupHomeScreen.tsx:
   a. ¿Cómo está estructurado el condicional isPageLoading
      hoy exactamente? ¿Qué elementos envuelve?
      Incluir número de líneas.
   b. ¿El header ("Mis juntadas", botones Crear/Unirse)
      está dentro o fuera del condicional isPageLoading?
   c. ¿Dónde exactamente en el JSX se renderiza la lista
      de cards de "Próximas juntadas"? ¿Está dentro de
      un bloque separado o mezclado con el resto?
   d. ¿Cómo está implementado handleRefresh exactamente?
      ¿Usa Promise.all, await secuencial, o algo distinto?
      Incluir el código completo con número de líneas.

2. ¿isPageLoading incluye el estado de carga de
   ['meetups', userId] específicamente, o solo depende
   de otras queries?

No tocar ningún archivo, solo reportar.

## Tarea 2 — Fix Bug 1: skeleton solo en área de cards
En MeetupHomeScreen.tsx:

1. Sacar los skeletons del condicional isPageLoading
   global que envuelve toda la pantalla

2. El header (saludo, título "Mis juntadas", botones
   Crear/Unirse) debe renderizarse siempre,
   independientemente de isPageLoading

3. En el área de "Próximas juntadas", reemplazar
   el condicional así:
   - Si isLoading (solo la query de meetups carga
     por primera vez, sin datos previos):
     mostrar 3 MeetupCardSkeleton
   - Si !isLoading y hay juntadas: mostrar las cards
   - Si !isLoading y no hay juntadas: mostrar el
     estado vacío actual

4. Las otras queries (pendingReviews, notifications,
   profile) no deben bloquear la visualización
   del skeleton ni de las cards

No modificar la lógica de negocio ni otros estados.
No hacer commits.
Archivos esperados:
- mobile/src/features/meetups/screens/MeetupHomeScreen.tsx

## Tarea 3 — Fix Bug 2: pull-to-refresh resuelve rápido
En MeetupHomeScreen.tsx, función handleRefresh:

1. Usar Promise.all para invalidar las queries
   en paralelo en vez de secuencial:
   await Promise.all([
     queryClient.invalidateQueries({
       queryKey: ['meetups', userId]
     }),
     queryClient.invalidateQueries({
       queryKey: ['pendingReviews', userId]
     }),
   ])
2. Llamar setIsRefreshing(false) en el bloque finally
   para garantizar que siempre se llama aunque falle
3. No esperar a que los datos terminen de fetchearse
   para resolver — invalidateQueries dispara el refetch
   y resuelve inmediatamente, lo cual es el
   comportamiento correcto

No modificar ninguna otra lógica.
No hacer commits.
Archivos esperados:
- mobile/src/features/meetups/screens/MeetupHomeScreen.tsx

## Tarea 4 — Documentar este prompt
Crear el archivo:
ia/entrega-3/prompts/bloque-1/05b_correccion_skeleton_pulltorefresh.md
con el contenido completo de este prompt.
Actualizar ia/entrega-3/indice_ia.md agregando:
05b - Corrección skeleton: solo en área de cards,
      pull-to-refresh resuelve con Promise.all

No hacer commits.

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- No hacer commits
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar reportar
1. Archivos modificados
2. Cómo quedó la estructura del JSX en el área
   de "Próximas juntadas" exactamente
3. Cómo quedó handleRefresh exactamente
4. Cómo probarlo en Expo Go:
   - Carga inicial: header visible siempre,
     skeletons solo en el área de cards
   - Pull-to-refresh: spinner aparece y desaparece
     rápido (menos de 1 segundo)
   - Datos reales aparecen después del skeleton


---

### 06_casos_borde.md

# Prompt 06 — Bloque 1: Casos borde confirmados

## Contexto
Rama actual: feature/bloque-1-deuda-tecnica
Relevamiento previo identificó estos bugs concretos
en flujos existentes que hay que resolver:

1. Error de participantes silencioso en MeetupDetailScreen:
   Si falla la carga de participantes, la lista aparece
   vacía sin ningún aviso al usuario.

2. Feedback inconsistente en subida parcial de fotos:
   Si se suben X de Y fotos, el hook puede disparar
   toast de éxito y error simultáneamente →
   feedback contradictorio.

3. Juntada con fecha pasada pero estado activo:
   No hay indicador visual cuando el organizador
   no finalizó una juntada cuya fecha ya pasó.

4. maxParticipants en appConfig: el valor 12 es
   arbitrario y nunca fue una decisión de negocio
   real. Hay que eliminarlo para que no confunda.

Stack relevante:
- React Native + Expo SDK 55 + TypeScript
- TanStack Query v5
- Sin TypeScript any, comentarios en español

## Tarea 1 — Análisis previo
Sin tocar ningún archivo, reportá:

1. En MeetupDetailScreen y useMeetupDetail:
   a. ¿useMeetupDetail expone algún campo de error
      de participantes (isErrorParticipants o similar)?
   b. ¿La sección de participantes tiene algún
      estado de error o vacío hoy?
   c. ¿Qué función dispara el refetch solo de
      participantes?

2. En useMemories o MemoriesGalleryScreen:
   a. ¿Cuándo se considera éxito y cuándo error
      en una subida múltiple? ¿Qué valor tiene
      count en subida parcial?
   b. ¿Dónde exactamente se dispara el toast de
      éxito y dónde el de error?
   c. ¿El error de upload reemplaza el grid entero
      o solo muestra un toast?

3. En MeetupCard y MeetupDetailScreen:
   a. ¿Existe hasMeetupStarted u función similar
      para determinar si la fecha ya pasó?
   b. ¿Qué campos tiene el objeto meetup para
      calcular si la fecha ya ocurrió?
      (date, time, timezone?)

4. En appConfig.ts:
   a. ¿Dónde está definido maxParticipants?
   b. ¿En qué otros archivos se referencia
      appConfig.meetups.maxParticipants?
      Buscar en todo el proyecto.

No tocar ningún archivo, solo reportar.

## Tarea 2 — Surfacear error de participantes
En MeetupDetailScreen y useMeetupDetail:

1. Si useMeetupDetail no expone el error de
   participantes, agregarlo:
   - Exponer isErrorParticipants y
     refetchParticipants desde useMeetupDetail

2. En MeetupDetailScreen, en la sección de
   participantes, si isErrorParticipants:
   - Mostrar mensaje de error con ícono y texto:
     "No se pudieron cargar los participantes"
   - Agregar botón "Reintentar" que llame a
     refetchParticipants()
   - No mostrar lista vacía silenciosa

3. Mantener el comportamiento actual cuando
   los participantes cargan correctamente

No hacer commits.
Archivos esperados:
- mobile/src/features/meetups/hooks/useMeetupDetail.ts
- mobile/src/features/meetups/screens/MeetupDetailScreen.tsx

## Tarea 3 — Fix feedback subida parcial de fotos
En useMemories y/o MemoriesGalleryScreen:

Definir criterio claro y único:
- 0 fotos subidas de Y → solo error, sin éxito
- X fotos subidas de Y (parcial, X > 0) →
  toast de error "Se subieron X de Y fotos",
  sin disparar toast de éxito
- Y fotos subidas de Y → solo éxito, sin error

Asegurarse de que en ningún caso se disparen
ambos toasts simultáneamente.

Si el error de upload hoy reemplaza el grid entero,
cambiar para que muestre ErrorAnimation toast
manteniendo el grid visible con las fotos que
sí se subieron exitosamente.

No modificar la lógica de subida en sí.
No hacer commits.
Archivos esperados:
- El archivo de useMemories
- MemoriesGalleryScreen si maneja los toasts

## Tarea 4 — Indicador visual de fecha pasada
En MeetupCard (MeetupHomeScreen) y
MeetupDetailScreen:

1. Crear función helper isPastMeetup(date, time):
   - Retorna true si la combinación date + time
     ya ocurrió respecto a now()
   - Usar el mismo patrón que hasMeetupStarted
     si existe (encontrado en Tarea 1)
   - Si no existe, construir combinando date +
     time como string ISO y comparar con new Date()

2. En MeetupCard en Home:
   Si isPastMeetup && meetup.status === 'active':
   Mostrar texto pequeño debajo de la fecha:
   "Esta juntada ya ocurrió"
   Color: theme.colors.textSecondary
   Tamaño: 12sp

3. En MeetupDetailScreen:
   Si isPastMeetup && isActive:
   Mostrar el mismo aviso cerca de la fecha
   con color theme.colors.textSecondary

4. Solo indicador visual informativo.
   No cambiar ninguna lógica de negocio.

No hacer commits.
Archivos esperados:
- mobile/src/features/meetups/screens/MeetupHomeScreen.tsx
- mobile/src/features/meetups/screens/MeetupDetailScreen.tsx

## Tarea 5 — Limpiar maxParticipants de appConfig
En appConfig.ts:

1. Eliminar la propiedad maxParticipants del
   objeto meetups (o del lugar donde esté definida)
2. Si hay referencias a appConfig.meetups.maxParticipants
   en otros archivos (encontradas en Tarea 1),
   eliminarlas también
3. Si no hay referencias en ningún otro archivo,
   solo eliminar de appConfig.ts

No hacer commits.
Archivos esperados:
- mobile/src/shared/constants/appConfig.ts
  (verificar ruta exacta en Tarea 1)
- Cualquier archivo que referencie maxParticipants

## Tarea 6 — Documentar este prompt
Crear el archivo:
ia/entrega-3/prompts/bloque-1/06_casos_borde.md
con el contenido completo de este prompt.
Actualizar ia/entrega-3/indice_ia.md agregando:
06 - Casos borde: error participantes silencioso,
     subida parcial fotos, indicador fecha pasada,
     limpieza maxParticipants

No hacer commits.

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- No hacer commits
- Si algo es ambiguo, preguntar antes de asumir
- No modificar lógica de negocio existente,
  solo agregar validaciones y feedback faltantes

## Al finalizar reportar
1. Archivos modificados
2. Decisiones tomadas, especialmente:
   - Cómo quedó el criterio éxito/error en
     subida de fotos
   - Cómo se implementó isPastMeetup
   - Si maxParticipants tenía referencias en
     otros archivos
3. Cómo probarlo en Expo Go:
   - Error participantes: con red lenta o
     forzando error, verificar que aparece
     mensaje con "Reintentar" en vez de
     lista vacía
   - Subida parcial: subir fotos y simular
     fallo parcial → solo toast de error,
     grid visible con fotos subidas
   - Fecha pasada: juntada activa con fecha
     anterior → aviso visible en Home y Detalle


---

### 07_documentacion_cierre_bloque1.md

# Prompt 07 — Documentación y cierre del Bloque 1

## Tarea
Organizá la evidencia del Bloque 1 dentro de ia/entrega-3/.

## 1. Crear ia/entrega-3/conversaciones/bloque-1/cursor-bloque-1-completo.md

El archivo debe tener esta estructura exacta:

# Conversación Bloque 1 — Deuda técnica E2

**Herramienta:** Cursor Agent
**Rama:** feature/bloque-1-deuda-tecnica

## Resumen

### Lo que se implementó
- Prompt 01: Reemplazo de Alert.alert por ErrorAnimation
  en ParticipantListScreen
- Prompt 02: Fix completo toggle notificaciones —
  guard AsyncStorage en App.tsx y control de suscripción
  Realtime desde ProfileScreen via listeners internos
- Prompt 03: RLS Storage memories — política DELETE para
  organizador en bucket y tabla, botón eliminar en
  MemoryViewerScreen
- Prompt 04: Hard delete de cuenta — Edge Function
  delete-account con service_role, transferencia de
  organizador, limpieza de Storage (memories, avatars,
  meetup-covers), anonimización de impostor_games,
  migración 011 para created_by nullable
- Prompt 05: Auto-refresh Realtime por tipo de
  notificación, pull-to-refresh en Home y Detalle,
  skeleton con shimmer usando expo-linear-gradient
- Prompt 06: Casos borde — error participantes
  silencioso, subida parcial de fotos con
  UploadPhotosResult, indicador fecha pasada,
  limpieza de maxParticipants

### Decisiones tomadas
- D26: Hard delete con transferencia al participante
  confirmado más antiguo por joined_at; juntadas sin
  participantes se eliminan; impostor_games se
  anonimizan (created_by nullable via migración 011)
- Toggle notificaciones controla tanto push (FCM)
  como in-app (Realtime) — AppNotificationsBootstrap
  es la única fuente de verdad para el parámetro
  enabled del hook
- Skeleton solo en área de cards, no reemplaza
  header ni botones de acción
- isPastMeetup como helper compartido en
  meetupDateTime.ts para evitar duplicación
- UploadPhotosResult con tres estados mutuamente
  excluyentes (success/partial/failure)
- maxParticipants eliminado de appConfig por ser
  valor arbitrario sin uso en runtime

### Problemas encontrados y resueltos
- Toggle (Prompt 02): race condition entre doble
  lectura de AsyncStorage en AppNotificationsBootstrap
  y en el hook — resuelto eliminando la lectura
  interna del hook y centralizando en Bootstrap
- Hard delete (Prompt 04): meetup_participants.role
  no se actualizaba al transferir organizador —
  resuelto agregando UPDATE role = 'organizer'
  al sucesor en el mismo PASO 1
- Hard delete (Prompt 04): portadas en meetup-covers
  no se limpiaban por Invalid schema: storage —
  resuelto consultando meetups.cover_url en schema
  public en vez de storage.objects
- Skeleton (Prompt 05): reemplazaba toda la pantalla
  incluyendo el header — resuelto moviendo los
  skeletons al área de cards únicamente

### Deuda técnica pendiente
- Skeleton en MeetupDetailScreen (Bloque 8)
- Animaciones de entrada de cards y press feedback
  (Bloque 8)
- Testing sistemático pantalla por pantalla (Bloque 7)
- Casos borde hipotéticos sin confirmar (Bloque 7)
- Portadas históricas en meetup-covers no se limpian
  en hard delete (limitación aceptada: no hay tabla
  de historial de portadas)

## Conversación completa
[Pegar acá la conversación exportada de Cursor]

## 2. Verificá estructura de prompts del Bloque 1

ia/entrega-3/prompts/bloque-1/
├── 01_participant_list_error_animation.md ✓
├── 02_fix_toggle_notificaciones.md ✓
├── 02b_correccion_toggle_notificaciones.md ✓
├── 02c_correccion_banner_toggle.md ✓
├── 03_rls_memories_organizer.sql.md ✓
├── 03b_correccion_rls_memories_viewer.md ✓
├── 03c_fix_confirm_delete_viewer.md ✓
├── 04_hard_delete_cuenta.md ✓
├── 04b_correccion_hard_delete.md ✓
├── 04c_fix_transferencia_role.md ✓
├── 04d_fix_warning_portadas.md ✓
├── 05_autorefresh_pulltorefresh_skeleton.md ✓
├── 05b_correccion_skeleton_pulltorefresh.md ✓
├── 06_casos_borde.md ✓
└── 07_documentacion_cierre_bloque1.md ← este prompt

Verificar que todos existen. Si falta alguno, reportarlo.

## 3. Actualizá ia/entrega-3/indice_ia.md

Verificar que todos los ítems del bloque 1 existen
y agregar al final:
07 - Documentación y cierre del Bloque 1

## Restricciones
- No tocar ningún archivo de código
- No hacer commits
- Solo crear o modificar archivos dentro de
  ia/entrega-3/

## Al finalizar reportar
1. Archivos creados o modificados
2. Prompts faltantes si los hay
3. Cualquier inconsistencia encontrada en el índice


---


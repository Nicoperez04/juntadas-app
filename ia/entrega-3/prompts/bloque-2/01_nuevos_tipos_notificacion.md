# Prompt 01 — Bloque 2: Nuevos tipos de notificación

## Contexto
Rama actual: feature/bloque-2-notificaciones
Hoy existen 4 tipos de notificación (joined, transferred,
review_enabled, reminder). Hay tres acciones críticas que
ocurren en la app sin generar notificación:

- cancelMeetup: la juntada se cancela pero los participantes
  no reciben aviso
- finishMeetup: la juntada se finaliza pero los participantes
  no reciben aviso (solo reciben review_enabled si está
  habilitado, que es distinto)
- leaveMeetup: alguien abandona la juntada pero el organizador
  no recibe aviso

Nuevos tipos a agregar:
- cancelled → a todos los participantes activos excepto el
  organizador cuando se cancela la juntada
- finished → a todos los participantes activos excepto el
  organizador cuando se finaliza la juntada
- left → al organizador cuando alguien abandona su juntada

Patrón de envío existente (referencia de finishMeetup):
- Query a meetup_participants con left_at IS NULL y
  neq(user_id, organizador)
- Promise.allSettled con sendNotification por cada participante
- Fire-and-forget envuelto en void (async () => {})()
- Si falla el envío de notificaciones, no afecta el resultado
  de la operación principal

Stack relevante:
- React Native + Expo SDK 55 + TypeScript
- Supabase Edge Function send-push-notification
- notificationService.sendNotification como único punto
  de envío
- Sin TypeScript any, comentarios en español

## Tarea 1 — Análisis previo
Sin tocar ningún archivo, reportá:

1. En supabase/functions/send-push-notification/index.ts:
   a. ¿En qué línea exacta está la lista de tipos
      permitidos que hay que extender?
   b. ¿Cómo está definida esa lista? ¿Es un array,
      un Set, un objeto?

2. En mobile/src/features/notifications/types.ts:
   a. ¿El enum NotificationType se exporta e importa
      en meetupService.ts y participantService.ts?
   b. ¿Hay algún otro archivo que importe
      NotificationType que pueda verse afectado
      por agregar valores nuevos?

3. En meetupService.ts, función cancelMeetup
   (líneas 620-668):
   a. ¿En qué punto exacto del flujo conviene
      agregar el bloque de notificaciones?
      ¿Antes o después del return de éxito?
   b. ¿El objeto meetup (MeetupRow) tiene title
      disponible antes del UPDATE?

4. En participantService.ts, función leaveMeetup
   (líneas 345-383):
   a. ¿En qué punto exacto conviene agregar la
      query a meetups para obtener created_by
      y title?
   b. ¿participantService.ts importa ya
      notificationService o hay que agregarlo?
   c. ¿participantService.ts importa NotificationType?

No tocar ningún archivo, solo reportar.

## Tarea 2 — Extender Edge Function
En supabase/functions/send-push-notification/index.ts:

1. Agregar los tres nuevos tipos a la lista de
   tipos permitidos:
   - 'cancelled'
   - 'finished'
   - 'left'

2. No modificar ninguna otra lógica de la función.
   Los nuevos tipos no necesitan tratamiento especial —
   se insertan en notifications y se envía push
   exactamente igual que los tipos existentes.

No hacer commits.
Archivos esperados:
- supabase/functions/send-push-notification/index.ts

## Tarea 3 — Extender NotificationType en cliente móvil
En mobile/src/features/notifications/types.ts:

Agregar al enum NotificationType:
/** La juntada fue cancelada — todos los participantes */
Cancelled = 'cancelled',
/** La juntada fue finalizada — todos los participantes */
Finished = 'finished',
/** Alguien abandonó tu juntada — el organizador lo recibe */
Left = 'left',

Mantener los valores existentes sin cambios.
No hacer commits.
Archivos esperados:
- mobile/src/features/notifications/types.ts

## Tarea 4 — Notificación en cancelMeetup
En meetupService.ts, función cancelMeetup:

Después del UPDATE exitoso (después de verificar
que updateError es null y antes del return de éxito),
agregar bloque fire-and-forget siguiendo el mismo
patrón que finishMeetup:

1. Query a meetup_participants:
   - meetup_id = meetupId
   - left_at IS NULL
   - user_id != userId (excluir al organizador)
   - SELECT solo user_id

2. Usar mapMeetupRow(meetup as MeetupRow) para
   obtener el título de la juntada

3. Promise.allSettled con sendNotification por
   cada participante:
   - recipientUserId: p.user_id
   - type: NotificationType.Cancelled
   - title: 'Juntada cancelada 😔'
   - body: `${mappedMeetup.title} fue cancelada`
   - meetupId: mappedMeetup.id

4. Envolver en void (async () => {})() igual que
   finishMeetup — si falla no afecta el return

No modificar ninguna otra lógica de cancelMeetup.
No hacer commits.
Archivos esperados:
- mobile/src/features/meetups/services/meetupService.ts

## Tarea 5 — Notificación en finishMeetup
En meetupService.ts, función finishMeetup:

El bloque de notificaciones de review_enabled ya
existe y funciona. Hay que agregar la notificación
finished de forma independiente:

1. Agregar un segundo bloque fire-and-forget
   SEPARADO del de review_enabled, que se ejecute
   SIEMPRE (no condicionado a reviewsEnabled):

   - Misma query de participantes activos
     (left_at IS NULL, neq userId)
   - Promise.allSettled con sendNotification:
     * recipientUserId: p.user_id
     * type: NotificationType.Finished
     * title: '¡Juntada finalizada! 🎊'
     * body: `${mappedMeetup.title} ha finalizado`
     * meetupId: mappedMeetup.id

2. Si reviewsEnabled también es true, ambos bloques
   se ejecutan: uno para finished y otro para
   review_enabled. Son notificaciones distintas
   con propósitos distintos.

3. Mantener el bloque de review_enabled sin cambios.

No modificar ninguna otra lógica de finishMeetup.
No hacer commits.
Archivos esperados:
- mobile/src/features/meetups/services/meetupService.ts

## Tarea 6 — Notificación en leaveMeetup
En participantService.ts, función leaveMeetup:

Después del UPDATE exitoso (left_at seteado,
updateError null), agregar bloque fire-and-forget:

1. Query a meetups para obtener created_by y title:
   SELECT id, title, created_by
   FROM meetups
   WHERE id = meetupId

2. Con created_by y title disponibles, llamar a
   sendNotification:
   - recipientUserId: meetup.created_by
   - type: NotificationType.Left
   - title: 'Alguien abandonó tu juntada'
   - body: 'Un participante se fue de ${meetup.title}'
     (sin username — participantService no tiene
     acceso al perfil del usuario que abandona)
   - meetupId: meetupId

3. Importar notificationService si no está importado
4. Importar NotificationType si no está importado

No modificar ninguna otra lógica de leaveMeetup.
No hacer commits.
Archivos esperados:
- mobile/src/features/participants/services/participantService.ts

## Tarea 7 — Deployar Edge Function
Después de modificar send-push-notification/index.ts,
deployar la función actualizada:
supabase functions deploy send-push-notification
--project-ref tgxedyffizwbgidexpfj

Reportar si el deploy fue exitoso.

## Tarea 8 — Documentar este prompt
Crear el archivo:
ia/entrega-3/prompts/bloque-2/01_nuevos_tipos_notificacion.md
con el contenido completo de este prompt.
Crear ia/entrega-3/indice_ia.md si no existe la
sección de bloque-2, o agregar la entrada:
01 - Bloque 2: Nuevos tipos de notificación
     (cancelled, finished, left)

No hacer commits.

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- No hacer commits
- Si algo es ambiguo, preguntar antes de asumir
- Seguir exactamente el patrón fire-and-forget
  de finishMeetup para los nuevos bloques

## Al finalizar reportar
1. Archivos modificados
2. Decisiones tomadas, especialmente:
   - Cómo quedó la lista de tipos en la Edge Function
   - Si participantService necesitó imports nuevos
   - Si el deploy fue exitoso
3. Cómo probarlo en Expo Go:
   - cancelled: organizador cancela juntada →
     participantes reciben push y notificación in-app
     "Juntada cancelada"
   - finished: organizador finaliza juntada →
     participantes reciben "¡Juntada finalizada!"
     además de review_enabled si aplica
   - left: participante abandona juntada →
     organizador recibe "Alguien abandonó tu juntada"

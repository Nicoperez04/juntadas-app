# Bloque 5b — Backend de notificaciones

## Contexto
Rama actual: feature/bloque-5-notificaciones
El objetivo es implementar toda la infraestructura de notificaciones:
- Tabla notifications en Supabase
- push_token en profiles
- Edge Function para enviar push + insertar notificación
- Instalación y configuración de expo-notifications en el cliente
- Servicio de notificaciones en el cliente

Stack relevante:
- React Native + Expo SDK 55 + TypeScript
- Supabase (Auth + PostgreSQL)
- expo-notifications (a instalar)
- expo-device (verificar si está instalado)
- Sin TypeScript any, comentarios en español

## Arquitectura definida

Flujo completo:
1. Ocurre un evento en el cliente (alguien se une, transferencia, etc.)
2. El cliente llama a notificationService.sendNotification(...)
3. notificationService llama a la Edge Function send-push-notification
4. La Edge Function:
   a. Inserta una fila en la tabla notifications para el destinatario
   b. Lee el push_token del destinatario desde profiles
   c. Si tiene token: llama a la Expo Push API para enviar la push
5. El cliente también puede programar notificaciones locales
   (recordatorio 2hs antes de la juntada)

Notificaciones implementadas en E2:
- JOINED: alguien se une a tu juntada → al organizador
- TRANSFERRED: te transfieren la organización → al nuevo organizador
- REVIEW_ENABLED: juntada finalizada con reviews → a todos los participantes
- REMINDER: recordatorio 2hs antes → local, programada en el dispositivo

## Tu tarea
Realizá las siguientes tareas en orden.

---

### Tarea 1 — Migración de base de datos

Crear supabase/migrations/009_notifications.sql con:

1. Columna push_token en profiles:
   ALTER TABLE profiles ADD COLUMN push_token TEXT;
   (nullable, sin default, sin unique — un usuario puede
   tener múltiples dispositivos en el futuro)

2. Enum notification_type:
   CREATE TYPE notification_type AS ENUM (
     'joined',
     'transferred',
     'review_enabled',
     'reminder'
   );

3. Tabla notifications:
   - id UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
   - type notification_type NOT NULL
   - title TEXT NOT NULL
   - body TEXT NOT NULL
   - meetup_id UUID REFERENCES meetups(id) ON DELETE SET NULL
   - read BOOLEAN NOT NULL DEFAULT false
   - created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

4. Índice en notifications(user_id, read) para queries eficientes

5. RLS en notifications:
   - SELECT: solo el propio usuario (user_id = auth.uid())
   - UPDATE: solo el propio usuario (para marcar como leída)
   - INSERT: solo via service role (la Edge Function usa service role)
   - DELETE: solo el propio usuario (para descartar)

6. Comentarios en español

IMPORTANTE: solo generás el archivo SQL, no lo ejecutés.

Archivos esperados:
- supabase/migrations/009_notifications.sql

---

### Tarea 2 — Edge Function

Crear supabase/functions/send-push-notification/index.ts

La Edge Function es código Deno/TypeScript que corre en Supabase.
NO es React Native — es servidor. Usar sintaxis Deno.

Comportamiento:
1. Recibe un POST con body JSON:
   {
     recipientUserId: string,
     type: 'joined' | 'transferred' | 'review_enabled' | 'reminder',
     title: string,
     body: string,
     meetupId?: string
   }

2. Valida que los campos requeridos existen

3. Crea cliente Supabase con service role key
   (disponible en Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))
   URL en Deno.env.get('SUPABASE_URL')

4. Inserta en la tabla notifications:
   {
     user_id: recipientUserId,
     type,
     title,
     body,
     meetup_id: meetupId ?? null,
     read: false
   }

5. Lee el push_token del destinatario:
   SELECT push_token FROM profiles WHERE id = recipientUserId

6. Si tiene push_token:
   - Llama a https://exp.host/--/api/v2/push/send con:
     {
       to: push_token,
       title,
       body,
       sound: 'default',
       data: { type, meetupId }
     }
   - Si la llamada falla: loguear el error pero NO fallar
     la función (la notificación in-app ya fue insertada)

7. Retorna { success: true } con status 200
   En caso de error: { error: mensaje } con status apropiado

Manejo de CORS:
- Agregar headers CORS para permitir llamadas desde la app móvil
- Manejar preflight OPTIONS request

Seguridad:
- Verificar que el request tiene el header Authorization
  con el JWT del usuario autenticado
- Usar el JWT para verificar que el usuario está autenticado
  antes de procesar

Comentarios en español en todo el código.

IMPORTANTE: este archivo va en supabase/functions/send-push-notification/index.ts
Es TypeScript para Deno, NO para Node.js.
NO usar require(), usar import con URLs de Deno/esm.sh

Archivos esperados:
- supabase/functions/send-push-notification/index.ts

---

### Tarea 3 — Instalar expo-notifications

Ejecutar desde mobile/:
npx expo install expo-notifications expo-device

Luego actualizar app.json:
1. Agregar expo-notifications al array de plugins:
   [
     "expo-notifications",
     {
       "icon": "./assets/notification-icon.png",
       "color": "#7C3AED",
       "sounds": []
     }
   ]
   IMPORTANTE: si no existe ./assets/notification-icon.png,
   usar "./assets/icon.png" como fallback — no crear el archivo

2. Agregar configuración de Android notifications:
   "android": {
     ...existing fields...,
     "permissions": ["NOTIFICATIONS", "VIBRATE", "RECEIVE_BOOT_COMPLETED"]
   }

Verificar que package.json tiene expo-notifications y expo-device
después de instalar.

Archivos esperados:
- mobile/package.json (actualizado)
- mobile/app.json (plugin y permisos agregados)

---

### Tarea 4 — Tipos y servicio de notificaciones

Crear src/features/notifications/ con la siguiente estructura:

src/features/notifications/
├── types.ts
├── services/notificationService.ts
└── hooks/useNotifications.ts

**types.ts:**
- Tipo Notification: id, userId, type (enum), title, body,
  meetupId?, read, createdAt
- Tipo NotificationInput: recipientUserId, type, title, body, meetupId?
- Enum NotificationType: joined, transferred, reviewEnabled, reminder

**notificationService.ts:**

Métodos del cliente:

1. registerPushToken():
   - Verifica que el dispositivo es físico (expo-device)
   - Pide permisos con Notifications.requestPermissionsAsync()
   - Si se conceden: obtiene el token con
     Notifications.getExpoPushTokenAsync({
       projectId: Constants.expoConfig?.extra?.eas?.projectId
     })
   - Guarda el token en profiles via supabase:
     UPDATE profiles SET push_token = token WHERE id = userId
   - Si se rechazan: no hace nada, retorna null
   - Retorna el token o null

2. sendNotification(input: NotificationInput):
   - Llama a la Edge Function send-push-notification via
     supabase.functions.invoke('send-push-notification', { body: input })
   - Retorna { data, error }

3. getNotifications(userId):
   - SELECT * FROM notifications WHERE user_id = userId
     ORDER BY created_at DESC LIMIT 50
   - Retorna { data: Notification[], error }

4. markAsRead(notificationId):
   - UPDATE notifications SET read = true WHERE id = notificationId
   - Retorna { data, error }

5. markAllAsRead(userId):
   - UPDATE notifications SET read = true
     WHERE user_id = userId AND read = false
   - Retorna { data, error }

6. deleteNotification(notificationId):
   - DELETE FROM notifications WHERE id = notificationId
   - Retorna { data, error }

7. scheduleReminderNotification(meetup):
   - Calcula la fecha/hora de la juntada menos 2 horas
   - Si esa fecha es futura: programa una notificación local con
     Notifications.scheduleNotificationAsync()
   - Si ya pasó: no programa nada
   - Retorna el id de la notificación programada o null

8. cancelReminderNotification(notificationId):
   - Cancela una notificación local programada
   - Notifications.cancelScheduledNotificationAsync(notificationId)

**useNotifications.ts con TanStack Query v5:**
- useNotifications(userId): useQuery con key ['notifications', userId]
- useUnreadCount(userId): derivado de useNotifications,
  cuenta las notificaciones con read = false
- useMarkAsRead(): useMutation, invalida ['notifications', userId]
- useMarkAllAsRead(): useMutation, invalida ['notifications', userId]
- useDeleteNotification(): useMutation, invalida ['notifications', userId]

No hacer:
- No crear pantallas todavía
- No integrar en ninguna pantalla existente
- No hacer commits

Archivos esperados:
- src/features/notifications/types.ts
- src/features/notifications/services/notificationService.ts
- src/features/notifications/hooks/useNotifications.ts

---

### Tarea 5 — Registrar el token al iniciar la app

En App.tsx, después de que el usuario esté autenticado,
llamar a notificationService.registerPushToken().

Alcance:
1. En App.tsx agregar un useEffect que:
   - Escucha el estado de autenticación (ya existe onAuthStateChange)
   - Cuando el usuario está autenticado (session != null):
     llamar a registerPushToken() con el userId
   - Configurar el handler de notificaciones en primer plano:
     Notifications.setNotificationHandler({
       handleNotification: async () => ({
         shouldShowAlert: true,
         shouldPlaySound: true,
         shouldSetBadge: true,
       }),
     })

2. No cambiar ninguna otra lógica existente en App.tsx

Archivos esperados:
- mobile/App.tsx (modificado)

---

### Tarea 6 — Integrar sendNotification en eventos existentes

Agregar llamadas a notificationService.sendNotification()
en los lugares donde ocurren los eventos relevantes:

1. Al unirse a una juntada (en el servicio o hook de meetups):
   - Evento: usuario se une exitosamente
   - Destinatario: organizador de la juntada
   - Tipo: 'joined'
   - Título: "Nueva confirmación 🎉"
   - Cuerpo: "[username] se unió a [nombre de juntada]"

2. Al transferir la organización (en MeetupOrganizerActions o servicio):
   - Evento: transferencia exitosa
   - Destinatario: nuevo organizador
   - Tipo: 'transferred'
   - Título: "Ahora sos el organizador 👑"
   - Cuerpo: "Sos el nuevo organizador de [nombre de juntada]"

3. Al finalizar juntada con reviews habilitadas (en servicio o hook):
   - Evento: juntada finalizada con reviewsEnabled = true
   - Destinatario: todos los participantes excepto el que finaliza
   - Tipo: 'review_enabled'
   - Título: "¿Cómo estuvo? ⭐"
   - Cuerpo: "Dejá tu reseña de [nombre de juntada]"
   - NOTA: para enviar a múltiples destinatarios, llamar a
     sendNotification una vez por cada participante

4. Al confirmar asistencia a una juntada futura (en el servicio):
   - Evento: usuario confirma asistencia
   - Acción: llamar a scheduleReminderNotification(meetup)
   - Guardar el id retornado en AsyncStorage con key
     'reminder_[meetupId]' para poder cancelarlo si es necesario

En todos los casos:
- Las llamadas a sendNotification son fire-and-forget
  (no bloquear el flujo principal si fallan)
- Usar try/catch para que un error en la notificación
  no afecte la acción principal

Archivos a modificar (verificar cuáles corresponden
revisando el código actual):
- src/features/meetups/services/meetupService.ts
- src/features/meetups/hooks/useMeetups.ts
- src/features/meetups/components/MeetupOrganizerActions.tsx

---

### Tarea 7 — Documentar este prompt

Crear ia/entrega-2/prompts/bloque-5/02_backend_notificaciones.md
con el contenido completo de este prompt.

Actualizar ia/entrega-2/indice_ia.md agregando:
[número siguiente] - Migración notifications + push_token en profiles
[número siguiente] - Edge Function send-push-notification (Deno)
[número siguiente] - expo-notifications: instalación y configuración
[número siguiente] - notificationService y useNotifications hook
[número siguiente] - Registro de token en App.tsx y eventos integrados

No hacer:
- No tocar archivos de código fuera de los indicados
- No hacer commits

Archivos esperados:
- ia/entrega-2/prompts/bloque-5/02_backend_notificaciones.md
- ia/entrega-2/indice_ia.md (actualizado)

---

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- No hacer commits
- Reportar archivos modificados y decisiones al finalizar cada tarea
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar
Resumen con:
1. Archivos creados y modificados
2. Decisiones tomadas
3. Pendientes manuales (migración SQL + deploy Edge Function)
4. Cómo probarlo

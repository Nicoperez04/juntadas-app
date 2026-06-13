# Conversación Bloque 5 — Notificaciones

**Herramienta:** Cursor Agent
**Rama:** feature/bloque-5-notificaciones

## Resumen general

En este bloque se configuró EAS Build para generar el APK de E2, se implementó la infraestructura completa de notificaciones (backend Supabase + Edge Function + frontend con banner, panel y badge) y se resolvieron problemas de compatibilidad con Expo Go y FCM V1.

### Lo que se implementó

- EAS Build configurado: eas.json, android.package, versionCode 2, google-services.json con FCM V1, Service Account Key subida a EAS
- APK de preview generado y funcional como entrega de E2
- Migración 009_notifications.sql: push_token en profiles, enum notification_type, tabla notifications con RLS
- Edge Function send-push-notification deployada: inserta notificación in-app y envía push via Expo Push API
- expo-notifications instalado con imports dinámicos para compatibilidad con Expo Go (guard isExpoGo)
- notificationService con métodos registerPushToken, sendNotification, getNotifications, markAsRead, markAllAsRead, deleteNotification, scheduleReminderNotification, cancelReminderNotification, clearPushToken
- useNotifications con TanStack Query v5 y useRealtimeNotifications con Supabase Realtime
- notificationStore con Zustand para estado del banner
- NotificationBanner: banner flotante animado 4 segundos, PanResponder para swipe
- NotificationPanel: lista paginada de 10 en 10, swipe para eliminar, marcar todas como leídas
- Badge en campana del home con count de no leídas y 9+
- Toggle de notificaciones en ProfileScreen con AsyncStorage
- Realtime habilitado en tabla notifications

### Decisiones tomadas

- imports dinámicos de expo-notifications para evitar crash en Expo Go (SDK 53+)
- FCM V1 con Service Account JSON en lugar de Legacy Server Key
- Edge Function sin validación de JWT de usuario — solo apikey — para fire-and-forget
- Notificaciones in-app siempre se insertan aunque la push falle
- Auto-descarte del banner no marca como leída; descarte manual sí
- SafeAreaProvider agregado en App.tsx
- clearPushToken() en el servicio al desactivar notificaciones desde perfil

### Problemas encontrados y resueltos

- expo-notifications crasheaba en Expo Go — resuelto con imports dinámicos y guard isExpoGo
- supabaseUrl undefined en Edge Function — resuelto moviendo Deno.env.get() dentro del handler
- FCM Legacy API inhabilitada — resuelto migrando a FCM V1 con Service Account JSON
- push_token no se guardaba — resuelto agregando google-services.json al build
- Edge Function retornaba 401 con validación JWT — resuelto reemplazando auth por validación de apikey

### Deuda técnica documentada

- push token se re-registra al reiniciar app aunque notificaciones estén desactivadas en perfil
- Animaciones del panel y swipe pendientes de pulido
- error TS2688 @types/node preexistente sin resolver
- Sesiones de diagnóstico (push_token, Edge Function) y fix de imports dinámicos no tienen prompt guardado aparte de 03

## Prompts y respuestas

### Prompt 1 — 01_eas_build_setup.md

**Contenido del prompt:**

# Bloque 5a — EAS Build setup + APK de E2

## Contexto
Rama actual: feature/bloque-5-notificaciones
El objetivo es configurar EAS Build y generar el APK de E2
para cumplir con el requisito de entrega.

El usuario ya está logueado en EAS CLI con la cuenta nicoperez04.
Todos los comandos se ejecutan desde mobile/.

## Tu tarea
Realizá las siguientes tareas en orden.
Completá y reportá cada una antes de pasar a la siguiente.

---

### Tarea 1 — Actualizar app.json

En app.json realizar los siguientes cambios:

1. Agregar android.package:
   "android": {
     "package": "com.rondaapp.mobile",
     "adaptiveIcon": { ... },  // mantener existente
     "predictiveBackGestureEnabled": false  // mantener existente
   }

2. Agregar expo.version actualizada a "2.0.0"
   (estamos en E2, el build debe reflejarlo)

3. Agregar expo.android.versionCode: 2
   (código de versión interno para Android)

4. NO tocar ningún otro campo existente

Archivos esperados:
- app.json (modificado)

---

### Tarea 2 — Crear eas.json

Crear eas.json en la raíz de mobile/ con el siguiente contenido:

{
  "cli": {
    "version": ">= 16.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}

Explicación de perfiles:
- development: para desarrollo con expo-dev-client (futuro)
- preview: APK instalable para pruebas y entrega — este es el que usamos ahora
- production: AAB para Google Play Store (futuro)

Archivos esperados:
- eas.json (nuevo)

---

### Tarea 3 — Verificar y preparar el proyecto

Antes de lanzar el build verificar:

1. Ejecutar npx tsc --noEmit y confirmar que no hay errores TypeScript
2. Verificar que no hay imports rotos o archivos faltantes
3. Confirmar que babel.config.js tiene el plugin de Reanimated
   como último plugin (ya debería estar del Bloque 3)

Reportar resultado de cada verificación.
No continuar si hay errores TypeScript.

---

### Tarea 4 — Lanzar el build de preview

Ejecutar el build desde mobile/:

npx eas build --platform android --profile preview

Durante el proceso:
- Si pregunta si querés crear un nuevo proyecto EAS: responder Yes
- Si pregunta por el android.package: confirmar com.rondaapp.mobile
- Si pregunta por credenciales: elegir que EAS las maneje
  automáticamente (opción recomendada)
- Copiar y reportar la URL del build que aparece en la consola
  (formato: https://expo.dev/accounts/nicoperez04/projects/...)

IMPORTANTE: el build se ejecuta en la nube de EAS, no localmente.
Tarda entre 10 y 20 minutos. No cancelar el proceso.
Una vez lanzado, el build corre en background —
se puede cerrar la terminal y monitorear desde
https://expo.dev

Reportar:
- URL del build en expo.dev
- Si hubo algún error al lanzarlo

---

### Tarea 5 — Documentar este prompt

Crear ia/entrega-2/prompts/bloque-5/01_eas_build_setup.md
con el contenido completo de este prompt.

Actualizar ia/entrega-2/indice_ia.md agregando:
[número siguiente] - EAS Build setup: eas.json, android.package,
  perfil preview, APK E2

No hacer:
- No tocar archivos de código fuera de app.json y eas.json
- No hacer commits

Archivos esperados:
- app.json (modificado)
- eas.json (nuevo)
- ia/entrega-2/prompts/bloque-5/01_eas_build_setup.md
- ia/entrega-2/indice_ia.md (actualizado)

---

## Reglas generales
- No hacer commits
- Reportar cada tarea antes de pasar a la siguiente
- Si algo es ambiguo o EAS pregunta algo no cubierto
  en este prompt, detenerse y reportar antes de continuar

## Al finalizar
Resumen con:
1. Cambios en app.json
2. Contenido final de eas.json
3. URL del build o error encontrado
4. Próximos pasos para descargar e instalar el APK

**Respuesta de Cursor:**

Cursor actualizó app.json con android.package, version 2.0.0 y versionCode 2; creó eas.json con perfiles development, preview y production; verificó tsc --noEmit; lanzó eas build --platform android --profile preview y reportó URL del build en expo.dev.

### Prompt 2 — 02_backend_notificaciones.md

**Contenido del prompt:**

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

**Respuesta de Cursor:**

Cursor creó migración 009_notifications.sql; Edge Function send-push-notification en Deno; instaló expo-notifications y expo-device; creó módulo notifications con types, notificationService y useNotifications; registró push token en App.tsx; integró sendNotification en eventos joined, transferred, review_enabled y scheduleReminder en confirmación de asistencia.

### Prompt 3 — 03_fix_expo_go_notifications.md

**Contenido del prompt:**

# Corrección — expo-notifications compatible con Expo Go

## Problema
expo-notifications crash en Expo Go SDK 55 porque las push
notifications remotas fueron removidas desde SDK 53.
La app no puede ni abrirse en Expo Go.

## Solución
Detectar si estamos en Expo Go y deshabilitar las push
notifications en ese contexto. La app funciona normalmente
en Expo Go (sin push) y con push en el APK standalone.

---

### Corrección 1 — notificationService.ts

En registerPushToken() agregar detección de Expo Go
ANTES de cualquier otra lógica:

import Constants from 'expo-constants';

// Al inicio de registerPushToken():
// Detectar si estamos corriendo en Expo Go
const isExpoGo = Constants.appOwnership === 'expo';
if (isExpoGo) {
  console.log('[Push] Expo Go detectado — push notifications deshabilitadas');
  return { data: null, error: null };
}

Esto debe ser la PRIMERA verificación, antes de Device.isDevice
y antes de pedir permisos.

También agregar el mismo guard en scheduleReminderNotification():
const isExpoGo = Constants.appOwnership === 'expo';
if (isExpoGo) return null;

No hacer:
- No cambiar la lógica para builds nativos (APK)
- No remover los logs de diagnóstico agregados anteriormente

Archivos esperados:
- src/features/notifications/services/notificationService.ts

---

### Corrección 2 — App.tsx

El setNotificationHandler también puede crashear en Expo Go.
Envolverlo en el mismo guard:

import Constants from 'expo-constants';

Reemplazar:
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

Por:
const isExpoGo = Constants.appOwnership === 'expo';
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

No hacer:
- No cambiar ninguna otra lógica de App.tsx

Archivos esperados:
- mobile/App.tsx

---

### Corrección 3 — Documentar este prompt

Crear ia/entrega-2/prompts/bloque-5/03_fix_expo_go_notifications.md
con el contenido completo de este prompt.

Actualizar ia/entrega-2/indice_ia.md agregando:
[número siguiente] - Fix: expo-notifications compatible con Expo Go
  (guard isExpoGo en registerPushToken y setNotificationHandler)

No hacer:
- No tocar archivos fuera de los indicados
- No hacer commits

Archivos esperados:
- ia/entrega-2/prompts/bloque-5/03_fix_expo_go_notifications.md
- ia/entrega-2/indice_ia.md (actualizado)

---

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- No hacer commits
- Reportar archivos modificados al finalizar

## Al finalizar
Resumen con:
1. Archivos modificados
2. Verificar que npx tsc --noEmit pasa sin errores
3. Instrucciones para probar

**Respuesta de Cursor:**

Cursor agregó guard isExpoGo (Constants.appOwnership === "expo") en registerPushToken, scheduleReminderNotification y setNotificationHandler. En sesión posterior también migró a imports dinámicos de expo-notifications y expo-device para evitar crash al cargar el módulo antes de ejecutar guards.

### Prompt 4 — 04_frontend_notificaciones.md

**Contenido del prompt:**

# Bloque 5c — Frontend de notificaciones

## Contexto
Rama actual: feature/bloque-5-notificaciones
El backend está completo y funcionando:
- push_token se registra correctamente en profiles
- Edge Function send-push-notification funciona
- Tabla notifications tiene datos reales
- La campana ya existe visualmente en MeetupHomeScreen
  pero sin funcionalidad

Stack relevante:
- React Native + Expo SDK 55 + TypeScript
- TanStack Query v5
- useNotifications y notificationService ya implementados
- Design tokens en src/shared/constants/theme.ts
- @expo/vector-icons (MaterialCommunityIcons) ya instalado
- Sin TypeScript any, comentarios en español

## Modelo de negocio definido
- Banner flotante: aparece 4 segundos, animación entrada/salida
- Si usuario descarta el banner: notificación marcada como leída
- Si banner se auto-descarta por tiempo: notificación queda no leída
- Badge en campana: count de no leídas
- Panel: últimas 10 notificaciones, botón "Ver más" si hay más
- Swipe para descartar cada notificación (marcar como leída)
- Perfil: toggle activar/desactivar notificaciones

## Tu tarea
Realizá las siguientes tareas en orden.

---

### Tarea 1 — Hook de tiempo real para notificaciones

En src/features/notifications/hooks/useNotifications.ts agregar:

1. useRealtimeNotifications(userId):
   - Suscripción a Supabase Realtime en la tabla notifications
   - Filtra por user_id = userId
   - Al recibir INSERT: invalida la query ['notifications', userId]
     y dispara un evento global para mostrar el banner
   - Retorna la suscripción para poder cancelarla

2. Para el evento global del banner usar un simple EventEmitter
   o un callback store en Zustand:
   - Crear src/features/notifications/store/notificationStore.ts
   - Estado: { pendingBanner: Notification | null }
   - Acciones: setPendingBanner, clearPendingBanner
   - Usar Zustand (ya instalado)

No hacer:
- No crear componentes todavía
- No hacer commits

Archivos esperados:
- src/features/notifications/hooks/useNotifications.ts (modificado)
- src/features/notifications/store/notificationStore.ts (nuevo)

---

### Tarea 2 — Componente banner flotante

Crear src/features/notifications/components/NotificationBanner.tsx

Comportamiento:
- Lee pendingBanner del notificationStore
- Si pendingBanner es null: no renderiza nada
- Si hay una notificación pendiente:
  * Aparece desde arriba con animación slide down + fade in
  * Se muestra durante 4 segundos
  * Al terminar los 4 segundos: desaparece con slide up + fade out
    y NO marca como leída (queda en no leída)
  * Si el usuario lo toca: desaparece inmediatamente,
    llama a markAsRead y clearPendingBanner
  * Si el usuario lo desliza hacia arriba: mismo comportamiento que toque

UI del banner:
- Posición: fixed en la parte superior de la pantalla,
  debajo del status bar, z-index alto
- Ancho: 90% del ancho de pantalla, centrado
- Fondo: color primario del theme con opacidad 0.95
- Ícono de campana a la izquierda
- Título en negrita + body debajo
- Border radius generoso
- Sombra pronunciada
- Animación de entrada/salida con Animated de React Native

No hacer:
- No instalar librerías de animación
- No hacer commits

Archivos esperados:
- src/features/notifications/components/NotificationBanner.tsx

---

### Tarea 3 — Integrar banner en App.tsx

En App.tsx:
1. Importar NotificationBanner
2. Renderizarlo en el nivel más alto del árbol,
   encima de todo el contenido pero dentro del SafeAreaProvider
3. Inicializar useRealtimeNotifications cuando el usuario
   está autenticado

El banner debe ser visible en cualquier pantalla de la app.

No hacer:
- No cambiar ninguna otra lógica de App.tsx
- No hacer commits

Archivos esperados:
- mobile/App.tsx (modificado)

---

### Tarea 4 — Badge en la campana

Contexto:
- La campana ya existe en MeetupHomeScreen.tsx
- Es un botón con ícono notifications-outline
- No tiene funcionalidad actualmente

Alcance:
En MeetupHomeScreen.tsx:
1. Usar useUnreadCount(userId) del hook existente
2. Mostrar un badge rojo con el número sobre la campana
   si unreadCount > 0
3. Si unreadCount > 9: mostrar "9+" en lugar del número
4. El badge debe estar posicionado en la esquina superior
   derecha del ícono de campana
5. El botón de campana por ahora no navega a ningún lado
   (la navegación al panel va en Tarea 5)

UI del badge:
- Círculo rojo pequeño (20dp) con número blanco
- Posicionado en la esquina superior derecha del ícono
- Usando position: absolute

No hacer:
- No implementar el panel todavía
- No hacer commits

Archivos esperados:
- src/features/meetups/screens/MeetupHomeScreen.tsx (modificado)

---

### Tarea 5 — Panel de notificaciones

Crear src/features/notifications/components/NotificationPanel.tsx

Props:
- visible: boolean
- onClose: () => void
- userId: string

Comportamiento:
- Modal o panel que aparece desde arriba al tocar la campana
- Muestra las últimas 10 notificaciones del usuario
- Si hay más de 10: botón "Ver más" que carga las siguientes 10
- Cada notificación muestra: ícono según type, título, body,
  tiempo relativo (ej: "hace 2 horas")
- Swipe hacia la izquierda en cada notificación:
  revela botón rojo "Eliminar" que llama a deleteNotification
- Botón "Marcar todas como leídas" en el header del panel
- Notificaciones no leídas tienen fondo ligeramente diferente
  (más claro o con indicador de punto)
- Al tocar una notificación: marcarla como leída

Íconos por tipo:
- joined: account-plus (MaterialCommunityIcons)
- transferred: crown (MaterialCommunityIcons)
- review_enabled: star (MaterialCommunityIcons)
- reminder: clock (MaterialCommunityIcons)

Tiempo relativo:
- Menos de 1 hora: "hace X minutos"
- Menos de 24 horas: "hace X horas"
- Más de 24 horas: fecha formateada "DD/MM"

Animación de apertura:
- El panel baja desde arriba con slide down
- Backdrop oscuro detrás con fade in
- Al cerrar: slide up + fade out

No hacer:
- No instalar librerías adicionales
- No hacer commits

Archivos esperados:
- src/features/notifications/components/NotificationPanel.tsx

---

### Tarea 6 — Conectar campana con panel

En MeetupHomeScreen.tsx:
1. Agregar estado local: panelVisible (boolean)
2. Al tocar la campana: setPanelVisible(true)
3. Renderizar NotificationPanel con visible={panelVisible}
   y onClose={() => setPanelVisible(false)}

No hacer:
- No cambiar el diseño del header
- No hacer commits

Archivos esperados:
- src/features/meetups/screens/MeetupHomeScreen.tsx (modificado)

---

### Tarea 7 — Toggle de notificaciones en perfil

Contexto:
- Existe una pantalla de perfil (buscar ProfileScreen o similar)
- Hay que agregar un toggle simple de notificaciones

Alcance:
1. Buscar dónde está la pantalla de perfil en el proyecto
2. Agregar una sección "Notificaciones" con un Switch de React Native
3. Estado del toggle: guardado en AsyncStorage con key
   'notifications_enabled'
4. Cuando se desactiva:
   - Actualizar profiles SET push_token = NULL en Supabase
   - Guardar false en AsyncStorage
5. Cuando se activa:
   - Llamar a notificationService.registerPushToken(userId)
   - Guardar true en AsyncStorage
6. Al abrir la pantalla: leer el estado desde AsyncStorage

No hacer:
- No cambiar el diseño existente del perfil
- No hacer commits

Archivos esperados:
- Pantalla de perfil existente (modificada)

---

### Tarea 8 — Documentar este prompt

Crear ia/entrega-2/prompts/bloque-5/04_frontend_notificaciones.md
con el contenido completo de este prompt.

Actualizar ia/entrega-2/indice_ia.md agregando:
[número siguiente] - useRealtimeNotifications + notificationStore Zustand
[número siguiente] - NotificationBanner: banner flotante animado
[número siguiente] - Badge de notificaciones en campana del home
[número siguiente] - NotificationPanel: panel con lista y swipe
[número siguiente] - Toggle de notificaciones en perfil

No hacer:
- No tocar archivos de código fuera de los indicados
- No hacer commits

Archivos esperados:
- ia/entrega-2/prompts/bloque-5/04_frontend_notificaciones.md
- ia/entrega-2/indice_ia.md (actualizado)

---

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- Seguir tokens de src/shared/constants/theme.ts
- No hacer commits
- Reportar archivos modificados y decisiones al finalizar cada tarea
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar
Resumen con:
1. Archivos creados y modificados
2. Decisiones tomadas
3. Cómo probarlo en dispositivo y en APK

**Respuesta de Cursor:**

Cursor implementó useRealtimeNotifications y notificationStore Zustand; NotificationBanner animado con PanResponder; badge en campana de MeetupHomeScreen; NotificationPanel con paginación y swipe; toggle de notificaciones en ProfileScreen con AsyncStorage; SafeAreaProvider y AppNotificationsBootstrap en App.tsx.

### Prompt 5 — 05_documentar_bloque-5.md

**Contenido del prompt:**

# Documentación — Cierre del Bloque 5: Notificaciones

## Tarea
Organizá la evidencia del Bloque 5 dentro de `ia/entrega-2/`.

## 1. Completar ia/entrega-2/conversaciones/bloque-5/cursor-bloque-5-completo.md

# Conversación Bloque 5 — Notificaciones

**Herramienta:** Cursor Agent
**Rama:** feature/bloque-5-notificaciones

## Resumen

### Lo que se implementó
- EAS Build configurado: eas.json, android.package, versionCode 2,
  google-services.json con FCM V1, Service Account Key subida a EAS
- APK de preview generado y funcional como entrega de E2
- Migración 009_notifications.sql: push_token en profiles,
  enum notification_type, tabla notifications con RLS
- Edge Function send-push-notification deployada en Supabase:
  inserta notificación in-app y envía push via Expo Push API
- expo-notifications instalado con imports dinámicos para
  compatibilidad con Expo Go (guard isExpoGo)
- notificationService con 8 métodos: registerPushToken,
  sendNotification, getNotifications, markAsRead, markAllAsRead,
  deleteNotification, scheduleReminderNotification,
  cancelReminderNotification, clearPushToken
- useNotifications con TanStack Query v5 y useRealtimeNotifications
  con suscripción a Supabase Realtime
- notificationStore con Zustand para estado del banner
- NotificationBanner: banner flotante animado 4 segundos,
  PanResponder para swipe, auto-descarte vs descarte manual
- NotificationPanel: lista paginada de 10 en 10, swipe para
  eliminar, marcar todas como leídas, tiempo relativo
- Badge en campana del home con count de no leídas y 9+
- Toggle de notificaciones en ProfileScreen con AsyncStorage
- Realtime habilitado en tabla notifications desde Publications

### Decisiones tomadas
- imports dinámicos de expo-notifications para evitar crash
  en Expo Go (SDK 53+ removió push de Expo Go)
- FCM V1 con Service Account JSON en lugar de Legacy Server Key
  (Firebase deprecó la API heredada)
- Edge Function sin validación de JWT de usuario — solo apikey —
  para evitar problemas con el contexto asíncrono fire-and-forget
- Notificaciones in-app siempre se insertan aunque la push falle
- Auto-descarte del banner no marca como leída (queda pendiente
  en el badge); descarte manual sí marca como leída
- SafeAreaProvider agregado en App.tsx (no existía previamente)
- clearPushToken() en el servicio para respetar arquitectura
  al desactivar notificaciones desde el perfil

### Problemas encontrados y resueltos
- expo-notifications crasheaba en Expo Go al importarse —
  resuelto con imports dinámicos y guard isExpoGo
- supabaseUrl undefined en Edge Function —
  resuelto moviendo Deno.env.get() dentro del handler
- FCM Legacy API inhabilitada en Firebase —
  resuelto migrando a FCM V1 con Service Account JSON
- push_token no se guardaba — causado por Firebase no
  inicializado; resuelto agregando google-services.json al build
- Edge Function retornaba 401 con validación JWT —
  resuelto reemplazando auth por validación de apikey

### Deuda técnica documentada
- push token se re-registra al reiniciar app aunque
  notificaciones estén desactivadas en perfil
- Animaciones del panel y swipe pendientes de pulido
  (pase de animaciones general pendiente)
- error TS2688 @types/node preexistente sin resolver

## Conversación completa
[Pegar acá la conversación exportada de Cursor]

## 2. Verificá estructura de prompts

ia/entrega-2/prompts/bloque-5/
├── 01_eas_build_setup.md ✓
├── 02_backend_notificaciones.md ✓
├── 03_fix_expo_go_notifications.md ✓
├── 04_frontend_notificaciones.md ✓
└── 05_documentar_bloque-5.md ← este prompt

## 3. Actualizá ia/entrega-2/indice_ia.md

Verificar que todos los ítems del bloque 5 existen y agregar:
[número siguiente] - Documentación y cierre del Bloque 5

## Restricciones
- No tocar ningún archivo de código
- No hacer commits
- Solo crear o modificar archivos dentro de ia/entrega-2/

## Al finalizar reportá
1. Archivos creados o modificados
2. Cualquier inconsistencia encontrada

**Respuesta de Cursor:**

Cursor completó cursor-bloque-5-completo.md, verificó prompts en bloque-5/ y actualizó indice_ia.md con entrada 60. La conversación exportada quedó pendiente.

## Conversación exportada de Cursor

Este documento incluye **prompts y respuestas finales completas** extraídas de los agent transcripts de Cursor (JSONL local). No incluye tool calls ni razonamiento intermedio.

**Transcripts fuente:** `841f1af8-03bd-4b0c-b23d-31adefc9efaf`, `0b14cc6f-af86-4d6c-b4cb-bed2716f2f10`, `e98c56a3-4383-4f72-83a2-f726d3acd3ac`

---

## Sesión 1 — Análisis pre-implementación notificaciones

### Prompt (mensaje en chat)

# Análisis — Estado actual para implementación de notificaciones

## Tarea
Analizá el estado actual del proyecto y respondé cada punto
con precisión. No tocar ningún archivo, solo reportar.

---

### Punto 1 — Supabase CLI

1. ¿Existe algún archivo de configuración de Supabase CLI
   en el proyecto? Buscar:
   - supabase/config.toml
   - supabase/.gitignore
   - cualquier archivo dentro de supabase/ que no sea migrations/

2. ¿Existe alguna carpeta supabase/functions/?

3. En package.json, ¿hay algún script relacionado a supabase
   o edge functions?

4. ¿Hay alguna referencia a supabase CLI en README.md
   o cualquier archivo de documentación?

---

### Punto 2 — Push token en profiles

1. Revisá todos los archivos en supabase/migrations/ en orden
   cronológico y buscá:
   - ¿Existe alguna columna push_token en la tabla profiles?
   - ¿Existe alguna migración que la agregue?

2. En src/features/auth/ o src/features/profile/, buscá
   cualquier referencia a:
   - push_token
   - pushToken
   - expo-notifications
   - Notifications (de expo)
   Pegá las líneas exactas donde aparezcan.

3. En el tipo Profile o similar en types.ts, ¿existe
   algún campo push_token o pushToken?

---

### Punto 3 — expo-notifications

1. En package.json, ¿está instalado expo-notifications?
   Pegá la línea exacta si existe.

2. Si está instalado, ¿hay algún archivo que lo importe
   o configure? Buscar en todo src/:
   - import * from 'expo-notifications'
   - import { ... } from 'expo-notifications'
   Pegá todas las referencias encontradas.

3. En app.json o app.config.js, ¿hay alguna configuración
   de notifications, androidMode, androidCollapsedTitle,
   o permisos relacionados a notificaciones?
   Pegá las secciones relevantes.

4. ¿Existe algún archivo de configuración de notificaciones
   en src/shared/ o src/config/?

---

### Punto 4 — Android físico confirmado

Solo confirmá: ¿la app se está probando en Android físico
(no emulador)? Revisá si hay alguna referencia en el
proyecto que lo indique (ej: comentarios, README, etc.)

---

## Al finalizar reportá
Un resumen estructurado por punto con todos los hallazgos,
indicando explícitamente cuando algo NO existe.

### Respuesta

Voy a revisar el repo de forma sistemática (Supabase CLI, migraciones, código mobile y documentación) para responder cada punto con precisión.

---

# Análisis — Estado actual para implementación de notificaciones

---

## Punto 1 — Supabase CLI

### 1.1 Archivos de configuración de Supabase CLI

| Archivo | ¿Existe? |
|---------|----------|
| `supabase/config.toml` | **NO existe** |
| `supabase/.gitignore` | **NO existe** |
| Otros archivos en `supabase/` fuera de `migrations/` | **Sí:** solo `supabase/README.md` |

Contenido de `supabase/README.md`:

```1:1:juntadas-app/supabase/README.md
# Supabase — Configuración y migraciones
```

No hay instrucciones de CLI, solo ese título.

### 1.2 Carpeta `supabase/functions/`

**NO existe.** En `supabase/` solo hay:
- `migrations/` (8 archivos SQL: `001` a `008`)
- `README.md`

### 1.3 Scripts en `package.json`

**NO hay scripts relacionados con Supabase ni Edge Functions.**

Scripts actuales en `mobile/package.json`:

```5:12:juntadas-app/mobile/package.json
  "scripts": {
    "start": "expo start --lan",
    "start:localhost": "expo start --localhost",
    "start:usb": "powershell -ExecutionPolicy Bypass -File ./scripts/start-usb.ps1",
    "start:tunnel": "expo start --tunnel",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
```

La única referencia a Supabase en `package.json` es la dependencia `@supabase/supabase-js`, no la CLI.

### 1.4 Referencias a Supabase CLI en documentación

**NO hay referencias explícitas a Supabase CLI** en `README.md` ni en la documentación principal del proyecto.

- `README.md` menciona Supabase como backend (PostgreSQL, RLS, triggers) y variables `.env`, pero **no** la CLI.
- El flujo documentado para migraciones es **manual**: SQL Editor de Supabase (ej. en prompts de entrega-2: *"La migración la ejecuta el equipo manualmente en el SQL Editor de Supabase"*).
- En `ia/` aparece Supabase como plataforma/skill, pero **no** comandos tipo `supabase init`, `supabase db push` o `supabase functions deploy`.

---

## Punto 2 — Push token en `profiles`

### 2.1 Migraciones (`supabase/migrations/`)

Revisadas en orden cronológico (`001` → `008`):

| Migración | Contenido relevante a `profiles` |
|-----------|----------------------------------|
| `001_initial_schema.sql` | Crea `profiles` con: `id`, `full_name`, `username`, `avatar_url`, `created_at`, `updated_at` |
| `002` – `008` | Referencias a `profiles` por FK/RLS; **ninguna altera la tabla para agregar columnas** |

Definición original de `profiles`:

```41:48:juntadas-app/supabase/migrations/001_initial_schema.sql
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  username    TEXT UNIQUE NOT NULL,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Conclusión:**
- **NO existe** columna `push_token` en `profiles`.
- **NO existe** migración que la agregue.

Búsqueda global de `push_token` / `pushToken` en todo el repo: **0 coincidencias**.

### 2.2 Referencias en `src/features/auth/` y `src/features/profile/`

- **`src/features/profile/` NO existe.** El perfil vive en `src/features/auth/`.
- En `src/features/auth/` **NO hay** referencias a:
  - `push_token`
  - `pushToken`
  - `expo-notifications`
  - `Notifications` (de expo)

**No hay líneas que pegar** para esos términos: simplemente no aparecen.

*(Nota: hay un botón visual con ícono `notifications-outline` en `MeetupHomeScreen`, pero no está en auth/profile y no implementa push.)*

### 2.3 Tipo `Profile` / equivalente en `types.ts`

**NO existe** un tipo `Profile` con `push_token` o `pushToken`.

El modelo de dominio es `AuthUser` en `src/features/auth/types.ts`:

```68:78:juntadas-app/mobile/src/features/auth/types.ts
export interface AuthUser {
  /** UUID generado por Supabase Auth */
  id: string;
  email: string;
  /** Nombre completo proveniente de raw_user_meta_data */
  fullName: string;
  /** Username único elegido en CompleteProfileScreen */
  username: string;
  /** URL pública de la foto de perfil almacenada en Supabase Storage; null si no fue cargada */
  avatarUrl: string | null;
}
```

En el servicio, `ProfileRow` tampoco incluye push token:

```55:60:juntadas-app/mobile/src/features/auth/services/authService.ts
interface ProfileRow {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
}
```

---

## Punto 3 — `expo-notifications`

### 3.1 ¿Está en `package.json`?

**NO está instalado.** No hay línea con `expo-notifications` en `dependencies` ni `devDependencies`.

Dependencias Expo actuales: `expo-clipboard`, `expo-constants`, `expo-haptics`, `expo-image-picker`, `expo-screen-orientation`, `expo-secure-store`, `expo-status-bar`.

### 3.2 Imports en `src/`

**NO hay** imports de `expo-notifications` en todo `src/`:

- `import * from 'expo-notifications'` → **0**
- `import { ... } from 'expo-notifications'` → **0**

Referencias parecidas pero **no relacionadas** con push:
- `Haptics.notificationAsync(...)` en `src/shared/utils/haptics.ts` → es **expo-haptics**, no push.
- Ícono `notifications-outline` en `MeetupHomeScreen.tsx` → solo UI, sin handler ni librería de notificaciones.

### 3.3 Configuración en `app.json` / `app.config.js`

- **`app.config.js` NO existe.**
- En `app.json` **NO hay** configuración de notificaciones (`notifications`, `androidMode`, `androidCollapsedTitle`, permisos de notificaciones).

Contenido relevante de `app.json` (plugins y Android):

```17:30:juntadas-app/mobile/app.json
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#7C3AED",
        "foregroundImage": "./assets/adaptive-icon.png"
      },
      "predictiveBackGestureEnabled": false
    },
    ...
    "plugins": [
      "expo-secure-store",
      "@react-native-community/datetimepicker"
    ]
```

### 3.4 Archivos de configuración en `src/shared/` o `src/config/`

**NO existe** ningún archivo de configuración de notificaciones push.

- `src/config/appConfig.ts` y `src/config/env.ts` → sin referencias a notification/push.
- `src/shared/` → sin módulo de notificaciones (solo haptics con `notificationAsync` de feedback táctil).

---

## Punto 4 — Android físico confirmado

**No se puede confirmar con certeza** que la app se esté probando *ahora mismo* en Android físico solo desde el código. No hay flag, env var ni log que lo indique en runtime.

**Evidencia indirecta** de que el equipo usa o planea usar dispositivo físico Android:

| Fuente | Qué dice |
|--------|----------|
| `README.md` | Recomienda **Expo Go en dispositivo físico** como método principal de prueba |
| `mobile/scripts/start-usb.ps1` | Script `npm run start:usb` para celular conectado por USB vía `adb reverse` |
| `ia/entrega-1/conversaciones/expo-router-navigation.md` | Conversaciones reales sobre Expo Go en celular Android (SDK 55, tunnel, USB) |
| `ia/entrega-2/skills_instaladas.md` | Ejemplo de bug report con *"Plataforma: Android físico"* (plantilla, no estado en vivo) |
| `docs/BACKLOG_E2_E3.md` | *"Notificaciones push"* listado como pendiente de Entrega 2 |

**Conclusión Punto 4:** El proyecto está **orientado** a pruebas en Android físico (README + script USB + historial IA), pero **no hay confirmación explícita del estado actual** de testing. También documenta emulador como alternativa (`npm run android`, tecla `a`).

---

## Resumen ejecutivo

| Área | Estado | Gap principal |
|------|--------|---------------|
| **Supabase CLI** | Solo migraciones SQL + README mínimo | Sin `config.toml`, sin `functions/`, sin scripts CLI |
| **Push token en DB** | No implementado | Falta columna + migración + persistencia en servicio |
| **Código mobile (token)** | No implementado | Sin referencias en auth; no hay feature `profile/` separada |
| **expo-notifications** | No instalado ni configurado | Falta dependencia, plugin en `app.json`, código de registro de token |
| **Android físico** | Probable en desarrollo, no verificable al 100% | Relevante para push (Expo Go tiene limitaciones vs dev build) |

### Pendientes detectados para implementar notificaciones

1. Migración SQL: agregar `push_token` (o tabla dedicada) en `profiles`.
2. Instalar y configurar `expo-notifications` + plugin en `app.json`.
3. Hook/servicio para obtener Expo Push Token y guardarlo vía `authService`.
4. Backend para enviar push: Edge Function en Supabase (hoy **no hay** infraestructura CLI/functions).
5. Definir si las pruebas serán con **Expo Go** o **development build** (push en producción suele requerir build nativo / credenciales FCM).

### Contradicciones con reglas del proyecto

- Ninguna: las notificaciones push están en backlog (`docs/BACKLOG_E2_E3.md`) y aún no se implementaron, coherente con el estado del código.

<details>
<summary>Metadatos del intercambio</summary>

- **Transcript:** `841f1af8-03bd-4b0c-b23d-31adefc9efaf`
- **Índice:** 0

</details>

---

## Sesión 2 — Análisis pre-EAS Build

### Prompt (mensaje en chat)

# Análisis — Estado actual para EAS Build

## Tarea
Analizá el estado actual del proyecto y respondé cada punto
con precisión. No tocar ningún archivo, solo reportar.

---

### Punto 1 — eas.json y configuración EAS

1. ¿Existe el archivo eas.json en la raíz del proyecto mobile/?
2. ¿Existe el archivo .easignore?
3. En app.json, ¿existe el campo expo.extra.eas o expo.owner?
   Pegá las secciones relevantes de app.json completas.

---

### Punto 2 — Identificadores de la app

En app.json buscá y pegá exactamente:
1. expo.name
2. expo.slug
3. expo.version
4. expo.android.package (si existe)
5. expo.ios.bundleIdentifier (si existe)
6. expo.runtimeVersion o expo.updates (si existe)

---

### Punto 3 — EAS CLI

1. Ejecutá este comando y pegá el resultado completo:
   npx eas --version

2. Ejecutá este comando y pegá el resultado completo:
   npx eas whoami

3. ¿Está eas-cli instalado globalmente?
   npm list -g eas-cli
   Pegá el resultado.

---

### Punto 4 — Dependencias relevantes para el build

En package.json buscá y pegá:
1. La versión exacta de expo
2. La versión exacta de react-native
3. ¿Existe expo-dev-client?
4. ¿Existe expo-updates?
5. El campo "main" si existe

---

### Punto 5 — Plugins en app.json

Pegá el array completo de "plugins" en app.json tal como está ahora.

---

## Al finalizar reportá
Un resumen estructurado por punto con todos los hallazgos,
indicando explícitamente cuando algo NO existe.

### Respuesta

Revisando configuración EAS y ejecutando los comandos solicitados.

---

Los comandos EAS no devolvieron salida; los reintento con permisos de red.

---

# Análisis — Estado actual para EAS Build

---

## Punto 1 — `eas.json` y configuración EAS

### 1.1 ¿Existe `eas.json` en `mobile/`?

**NO existe.** No hay `eas.json` en `mobile/` ni en ningún otro directorio del repo (`juntadas-app/`).

### 1.2 ¿Existe `.easignore`?

**NO existe.**

### 1.3 `expo.extra.eas` y `expo.owner` en `app.json`

**NO existen** ninguno de los dos campos.

Sección completa de `app.json` (no hay `extra`, `owner`, `runtimeVersion` ni `updates`):

```json
{
  "expo": {
    "name": "Ronda App",
    "slug": "ronda-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#7C3AED"
    },
    "ios": {
      "supportsTablet": false
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#7C3AED",
        "foregroundImage": "./assets/adaptive-icon.png"
      },
      "predictiveBackGestureEnabled": false
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-secure-store",
      "@react-native-community/datetimepicker"
    ]
  }
}
```

Tampoco existe `app.config.js` / `app.config.ts` que pudiera definir esos campos dinámicamente.

---

## Punto 2 — Identificadores de la app

Valores exactos en `app.json`:

| Campo | Valor |
|-------|-------|
| `expo.name` | `"Ronda App"` |
| `expo.slug` | `"ronda-app"` |
| `expo.version` | `"1.0.0"` |
| `expo.android.package` | **NO existe** |
| `expo.ios.bundleIdentifier` | **NO existe** |
| `expo.runtimeVersion` | **NO existe** |
| `expo.updates` | **NO existe** |

Bloque `android` actual (sin `package`):

```json
"android": {
  "adaptiveIcon": {
    "backgroundColor": "#7C3AED",
    "foregroundImage": "./assets/adaptive-icon.png"
  },
  "predictiveBackGestureEnabled": false
}
```

Bloque `ios` actual (sin `bundleIdentifier`):

```json
"ios": {
  "supportsTablet": false
}
```

---

## Punto 3 — EAS CLI

**No pude ejecutar los comandos en este entorno** (Ask mode): la terminal no devolvió salida para ningún comando, incluidos `npx eas --version`, `npx eas whoami` y `npm list -g eas-cli`.

Para obtener los resultados, ejecutalos localmente desde `mobile/`:

```bash
cd juntadas-app/mobile
npx eas --version
npx eas whoami
npm list -g eas-cli
```

**Estado inferible desde el repo (sin ejecutar CLI):**
- `eas-cli` **no** está en `dependencies` ni `devDependencies` de `package.json`.
- No hay scripts de EAS en `package.json` (no hay `eas build`, etc.).
- La CLI solo estaría disponible vía `npx eas` o instalación global; eso **no pude verificarlo** desde acá.

---

## Punto 4 — Dependencias relevantes para el build

Desde `mobile/package.json`:

| Item | Valor |
|------|-------|
| **expo** | `"~55.0.26"` |
| **react-native** | `"0.83.6"` |
| **expo-dev-client** | **NO existe** |
| **expo-updates** | **NO existe** |
| **main** | `"index.ts"` |

Líneas exactas:

```json
"main": "index.ts",
```

```json
"expo": "~55.0.26",
```

```json
"react-native": "0.83.6",
```

---

## Punto 5 — Plugins en `app.json`

Array completo tal como está ahora:

```json
"plugins": [
  "expo-secure-store",
  "@react-native-community/datetimepicker"
]
```

---

## Resumen ejecutivo

| Punto | Hallazgo | Estado |
|-------|----------|--------|
| **1 — Config EAS** | Sin `eas.json`, sin `.easignore`, sin `expo.owner` ni `expo.extra.eas` | **Sin configurar** |
| **2 — Identificadores** | `name`, `slug`, `version` definidos; sin `android.package`, `ios.bundleIdentifier`, `runtimeVersion` ni `updates` | **Incompleto para EAS Build** |
| **3 — EAS CLI** | Comandos no ejecutables en este entorno | **Pendiente verificación local** |
| **4 — Dependencias** | Expo SDK 55 + RN 0.83.6; sin `expo-dev-client` ni `expo-updates` | **Proyecto Expo Go / managed, sin dev client** |
| **5 — Plugins** | Solo `expo-secure-store` y `@react-native-community/datetimepicker` | **Mínimo, sin plugins de build especiales** |

### Gaps principales antes de un EAS Build

1. Crear `eas.json` (`eas build:configure`).
2. Definir `android.package` y/o `ios.bundleIdentifier` en `app.json`.
3. Configurar cuenta Expo (`expo.owner` o login con `eas whoami`).
4. Decidir perfil de build: **development build** (`expo-dev-client`) vs **production/preview**.
5. Si se usan OTA updates: agregar `expo-updates` + `runtimeVersion`.
6. Verificar localmente versión de EAS CLI y sesión autenticada (Punto 3).

### Nota sobre el flujo actual

El proyecto está orientado a **Expo Go** (scripts `start`, `start:tunnel`, `start:usb`; sin dev client). Para push notifications, módulos nativos no soportados en Go, o builds de store, hará falta migrar a **EAS Build + development/production build**.

<details>
<summary>Metadatos del intercambio</summary>

- **Transcript:** `841f1af8-03bd-4b0c-b23d-31adefc9efaf`
- **Índice:** 1

</details>

---

## Sesión 3 — @c:\Users\nicop\.cursor\projects\c-Users-nicop-OneDrive-Escritorio-Facultad-4toA-o-Electivas-4to-Desarrollo...

### Prompt (mensaje en chat)

@c:\Users\nicop\.cursor\projects\c-Users-nicop-OneDrive-Escritorio-Facultad-4toA-o-Electivas-4to-Desarrollo-de-Aplicaciones-Moviles-1C-Juntadas-App\terminals\16.txt:19-28 Porque no me deja loguearme

### Respuesta

El error **no es de credenciales ni de Expo**: es de **npm/npx**, que no encuentra qué ejecutable correr.

## Qué significa el error

```text
npm error could not determine executable to run
```

Aparece cuando corrés:

```bash
npx eas login
npx eas whoami
```

`npx` busca un paquete llamado **`eas`**, pero el CLI oficial de Expo se publica como **`eas-cli`**. Por eso npm no sabe qué binario ejecutar.

En tu `package.json` tampoco está `eas-cli` como dependencia local, así que `npx eas` no tiene de dónde sacar el comando.

---

## Cómo loguearte correctamente

### Opción A — Sin instalar global (recomendada para probar)

Desde `mobile/`:

```bash
npx eas-cli login
npx eas-cli whoami
```

Si querés fijar versión:

```bash
npx eas-cli@latest login
```

### Opción B — Instalación global

```bash
npm install -g eas-cli
eas login
eas whoami
```

Después de instalar globalmente, el comando es **`eas`**, no `npx eas`.

---

## Verificación rápida

```bash
npx eas-cli --version
```

Si eso funciona, el CLI está bien; el problema era solo el nombre del paquete.

---

## Resumen

| Comando | Resultado |
|---------|-----------|
| `npx eas login` | Falla — paquete incorrecto |
| `npx eas-cli login` | Correcto |
| `eas login` (con `eas-cli` global) | Correcto |

Cuando te loguees, Expo te pedirá email/usuario y contraseña (o abrirá el browser según la versión del CLI). Eso recién empieza **después** de usar `eas-cli`.

Si `npx eas-cli login` también falla, pegá la salida completa y lo vemos.

<details>
<summary>Metadatos del intercambio</summary>

- **Transcript:** `841f1af8-03bd-4b0c-b23d-31adefc9efaf`
- **Índice:** 2

</details>

---

## Sesión 4 — EAS Build setup

### Prompt (archivo guardado: `prompts/bloque-5/01_eas_build_setup.md`)

# Bloque 5a — EAS Build setup + APK de E2

## Contexto
Rama actual: feature/bloque-5-notificaciones
El objetivo es configurar EAS Build y generar el APK de E2
para cumplir con el requisito de entrega.

El usuario ya está logueado en EAS CLI con la cuenta nicoperez04.
Todos los comandos se ejecutan desde mobile/.

## Tu tarea
Realizá las siguientes tareas en orden.
Completá y reportá cada una antes de pasar a la siguiente.

---

### Tarea 1 — Actualizar app.json

En app.json realizar los siguientes cambios:

1. Agregar android.package:
   "android": {
     "package": "com.rondaapp.mobile",
     "adaptiveIcon": { ... },  // mantener existente
     "predictiveBackGestureEnabled": false  // mantener existente
   }

2. Agregar expo.version actualizada a "2.0.0"
   (estamos en E2, el build debe reflejarlo)

3. Agregar expo.android.versionCode: 2
   (código de versión interno para Android)

4. NO tocar ningún otro campo existente

Archivos esperados:
- app.json (modificado)

---

### Tarea 2 — Crear eas.json

Crear eas.json en la raíz de mobile/ con el siguiente contenido:

{
  "cli": {
    "version": ">= 16.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}

Explicación de perfiles:
- development: para desarrollo con expo-dev-client (futuro)
- preview: APK instalable para pruebas y entrega — este es el que usamos ahora
- production: AAB para Google Play Store (futuro)

Archivos esperados:
- eas.json (nuevo)

---

### Tarea 3 — Verificar y preparar el proyecto

Antes de lanzar el build verificar:

1. Ejecutar npx tsc --noEmit y confirmar que no hay errores TypeScript
2. Verificar que no hay imports rotos o archivos faltantes
3. Confirmar que babel.config.js tiene el plugin de Reanimated
   como último plugin (ya debería estar del Bloque 3)

Reportar resultado de cada verificación.
No continuar si hay errores TypeScript.

---

### Tarea 4 — Lanzar el build de preview

Ejecutar el build desde mobile/:

npx eas build --platform android --profile preview

Durante el proceso:
- Si pregunta si querés crear un nuevo proyecto EAS: responder Yes
- Si pregunta por el android.package: confirmar com.rondaapp.mobile
- Si pregunta por credenciales: elegir que EAS las maneje
  automáticamente (opción recomendada)
- Copiar y reportar la URL del build que aparece en la consola
  (formato: https://expo.dev/accounts/nicoperez04/projects/...)

IMPORTANTE: el build se ejecuta en la nube de EAS, no localmente.
Tarda entre 10 y 20 minutos. No cancelar el proceso.
Una vez lanzado, el build corre en background —
se puede cerrar la terminal y monitorear desde
https://expo.dev

Reportar:
- URL del build en expo.dev
- Si hubo algún error al lanzarlo

---

### Tarea 5 — Documentar este prompt

Crear ia/entrega-2/prompts/bloque-5/01_eas_build_setup.md
con el contenido completo de este prompt.

Actualizar ia/entrega-2/indice_ia.md agregando:
[número siguiente] - EAS Build setup: eas.json, android.package,
  perfil preview, APK E2

No hacer:
- No tocar archivos de código fuera de app.json y eas.json
- No hacer commits

Archivos esperados:
- app.json (modificado)
- eas.json (nuevo)
- ia/entrega-2/prompts/bloque-5/01_eas_build_setup.md
- ia/entrega-2/indice_ia.md (actualizado)

---

## Reglas generales
- No hacer commits
- Reportar cada tarea antes de pasar a la siguiente
- Si algo es ambiguo o EAS pregunta algo no cubierto
  en este prompt, detenerse y reportar antes de continuar

## Al finalizar
Resumen con:
1. Cambios en app.json
2. Contenido final de eas.json
3. URL del build o error encontrado
4. Próximos pasos para descargar e instalar el APK

### Prompt (mensaje en chat)

# Bloque 5a — EAS Build setup + APK de E2

## Contexto
Rama actual: feature/bloque-5-notificaciones
El objetivo es configurar EAS Build y generar el APK de E2
para cumplir con el requisito de entrega.

El usuario ya está logueado en EAS CLI con la cuenta nicoperez04.
Todos los comandos se ejecutan desde mobile/.

## Tu tarea
Realizá las siguientes tareas en orden.
Completá y reportá cada una antes de pasar a la siguiente.

---

### Tarea 1 — Actualizar app.json

En app.json realizar los siguientes cambios:

1. Agregar android.package:
   "android": {
     "package": "com.rondaapp.mobile",
     "adaptiveIcon": { ... },  // mantener existente
     "predictiveBackGestureEnabled": false  // mantener existente
   }

2. Agregar expo.version actualizada a "2.0.0"
   (estamos en E2, el build debe reflejarlo)

3. Agregar expo.android.versionCode: 2
   (código de versión interno para Android)

4. NO tocar ningún otro campo existente

Archivos esperados:
- app.json (modificado)

---

### Tarea 2 — Crear eas.json

Crear eas.json en la raíz de mobile/ con el siguiente contenido:

{
  "cli": {
    "version": ">= 16.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}

Explicación de perfiles:
- development: para desarrollo con expo-dev-client (futuro)
- preview: APK instalable para pruebas y entrega — este es el que usamos ahora
- production: AAB para Google Play Store (futuro)

Archivos esperados:
- eas.json (nuevo)

---

### Tarea 3 — Verificar y preparar el proyecto

Antes de lanzar el build verificar:

1. Ejecutar npx tsc --noEmit y confirmar que no hay errores TypeScript
2. Verificar que no hay imports rotos o archivos faltantes
3. Confirmar que babel.config.js tiene el plugin de Reanimated
   como último plugin (ya debería estar del Bloque 3)

Reportar resultado de cada verificación.
No continuar si hay errores TypeScript.

---

### Tarea 4 — Lanzar el build de preview

Ejecutar el build desde mobile/:

npx eas build --platform android --profile preview

Durante el proceso:
- Si pregunta si querés crear un nuevo proyecto EAS: responder Yes
- Si pregunta por el android.package: confirmar com.rondaapp.mobile
- Si pregunta por credenciales: elegir que EAS las maneje
  automáticamente (opción recomendada)
- Copiar y reportar la URL del build que aparece en la consola
  (formato: https://expo.dev/accounts/nicoperez04/projects/...)

IMPORTANTE: el build se ejecuta en la nube de EAS, no localmente.
Tarda entre 10 y 20 minutos. No cancelar el proceso.
Una vez lanzado, el build corre en background —
se puede cerrar la terminal y monitorear desde
https://expo.dev

Reportar:
- URL del build en expo.dev
- Si hubo algún error al lanzarlo

---

### Tarea 5 — Documentar este prompt

Crear ia/entrega-2/prompts/bloque-5/01_eas_build_setup.md
con el contenido completo de este prompt.

Actualizar ia/entrega-2/indice_ia.md agregando:
[número siguiente] - EAS Build setup: eas.json, android.package,
  perfil preview, APK E2

No hacer:
- No tocar archivos de código fuera de app.json y eas.json
- No hacer commits

Archivos esperados:
- app.json (modificado)
- eas.json (nuevo)
- ia/entrega-2/prompts/bloque-5/01_eas_build_setup.md
- ia/entrega-2/indice_ia.md (actualizado)

---

## Reglas generales
- No hacer commits
- Reportar cada tarea antes de pasar a la siguiente
- Si algo es ambiguo o EAS pregunta algo no cubierto
  en este prompt, detenerse y reportar antes de continuar

## Al finalizar
Resumen con:
1. Cambios en app.json
2. Contenido final de eas.json
3. URL del build o error encontrado
4. Próximos pasos para descargar e instalar el APK

### Respuesta

Configurando EAS Build paso a paso: primero leo los archivos actuales y aplico los cambios de `app.json` y `eas.json`.

---

Tareas 1 y 2 listas. Ejecuto las verificaciones de la Tarea 3.

---

Build lanzado. Creando la documentación y monitoreando el estado del build.

---

# Bloque 5a — Reporte completo

---

## Tarea 1 — `app.json` ✅

Cambios aplicados manualmente:

| Campo | Antes | Después |
|-------|-------|---------|
| `expo.version` | `"1.0.0"` | `"2.0.0"` |
| `expo.android.package` | *(no existía)* | `"com.rondaapp.mobile"` |
| `expo.android.versionCode` | *(no existía)* | `2` |

Resto de campos intactos (`adaptiveIcon`, `predictiveBackGestureEnabled`, plugins, etc.).

**Decisión no especificada en el prompt:** al ejecutar `eas init --force` (necesario para crear el proyecto EAS), el CLI agregó automáticamente:

```json
"extra": {
  "eas": {
    "projectId": "4e795c92-2a3e-4984-939e-168bca1db737"
  }
},
"owner": "nicoperez04"
```

Sin esto el build no podía vincularse al proyecto `@nicoperez04/ronda-app`.

---

## Tarea 2 — `eas.json` ✅

Archivo creado en `mobile/eas.json` con los 3 perfiles (`development`, `preview`, `production`) y `submit.production` vacío, tal como pedía el prompt.

---

## Tarea 3 — Verificaciones ✅

| Verificación | Resultado |
|--------------|-----------|
| `npx tsc --noEmit` | **Exit code 0** — sin errores TypeScript |
| Imports rotos / archivos faltantes | **OK** — `tsc` compila todo el proyecto sin fallos |
| `babel.config.js` + Reanimated | **OK** — usa solo `babel-preset-expo`, que según el comentario del Bloque 3 agrega automáticamente `react-native-worklets/plugin` como último plugin. No hay plugins manuales duplicados |

---

## Tarea 4 — Build preview ✅ (en cola)

Comando ejecutado (con `eas-cli`, no `eas`, porque `npx eas` falla en tu entorno):

```bash
npx eas-cli init --non-interactive --force
npx eas-cli build --platform android --profile preview --non-interactive
```

**Resultado al lanzar:**
- Proyecto EAS creado: `@nicoperez04/ronda-app`
- Keystore Android generado en la nube por EAS
- Proyecto subido y build encolado
- **Sin errores al lanzarlo**

**URL del build:**
https://expo.dev/accounts/nicoperez04/projects/ronda-app/builds/abd5ffa9-eaf9-43d0-ae2d-c3ee609e8428

**Estado actual:** `IN_QUEUE` (compilando en la nube; suele tardar 10–20 min)

**Advertencias (no bloquean el build):**
- `cli.appVersionSource` no está configurado — será requerido en el futuro
- No hay variables de entorno en el perfil `preview` en EAS (normal si usás `.env` local)

---

## Tarea 5 — Documentación ✅

- Creado: `ia/entrega-2/prompts/bloque-5/01_eas_build_setup.md`
- Actualizado: `ia/entrega-2/indice_ia.md` → entrada **48** en Bloque 5

---

## Archivos creados/modificados

| Archivo | Acción |
|---------|--------|
| `mobile/app.json` | Modificado |
| `mobile/eas.json` | Creado |
| `ia/entrega-2/prompts/bloque-5/01_eas_build_setup.md` | Creado |
| `ia/entrega-2/indice_ia.md` | Actualizado |

*(Sin commits, como pediste.)*

---

## Próximos pasos — descargar e instalar el APK

1. **Monitorear el build** en la URL de arriba o en https://expo.dev → Projects → ronda-app → Builds.
2. Cuando el estado pase a **Finished**, aparecerá el botón **Download** (APK).
3. **Instalar en Android físico:**
   - Transferí el APK al celular (USB, Drive, etc.)
   - Activá *Instalar apps desconocidas* para el origen que uses
   - Abrí el APK e instalá
4. **Alternativa por CLI** (cuando termine):
   ```bash
   npx eas-cli build:view abd5ffa9-eaf9-43d0-ae2d-c3ee609e8428
   ```
   El JSON incluirá la URL de descarga en `artifacts.buildUrl`.

5. **Importante:** este build es un **APK standalone** (no Expo Go). Necesitás el `.env` embebido en el build o variables configuradas en EAS Dashboard → Environment variables → preview, con `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`, si la app no conecta a Supabase al abrirse.

¿Querés que monitoree el build hasta que termine y te avise con el link de descarga del APK?

### Archivos modificados

- `mobile/app.json` — modificado
- `mobile/eas.json` — modificado


<details>
<summary>Metadatos del intercambio</summary>

- **Transcript:** `841f1af8-03bd-4b0c-b23d-31adefc9efaf`
- **Índice:** 3

</details>

---

## Sesión 5 — Backend de notificaciones

### Prompt (archivo guardado: `prompts/bloque-5/02_backend_notificaciones.md`)

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

### Prompt (mensaje en chat)

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

### Respuesta

Let me start by exploring the current codebase structure to understand what exists before making changes.

---

Voy a explorar la estructura del proyecto antes de comenzar.

---

Ahora voy a revisar más archivos relevantes en paralelo.

Now let me check the app.json and look for the MeetupOrganizerActions component, the navigation AppNavigator (to understand the auth flow), and the ia/entrega-2 folder structure.

---

Ahora tengo todo el contexto necesario. Voy a implementar las tareas en paralelo donde sea posible.

Now I have enough context to start implementing all the tasks. Let me proceed systematically.

Let me check the AppNavigator to understand auth state management before working on App.tsx.

---

Tengo todo el contexto necesario. Empiezo con las tareas en paralelo.

**Tarea 1:** Migración SQL

Now I have all the context I need. Let me start implementing the tasks.

**Tarea 1: Migración SQL 009_notifications.sql**
**Tarea 2: Edge Function send-push-notification**

These can be done in parallel with the others.

Let me look at the meetup detail to understand how attendance status is updated (for scheduleReminderNotification on join).

Actually I have enough context. Let me start:

1. Create the SQL migration
2. Create the Edge Function
3. Install expo-notifications + update app.json
4. Create notification types/service/hooks
5. Modify App.tsx


6. Integrate sendNotification in meetupService and useMeetups
7. Documentation

I'll need to run the expo-notifications install from the mobile directory, then create all the necessary files in parallel: the SQL migration, Edge Function, type definitions, notification service, and the custom hook. After that I'll update app.json, modify App.tsx, and integrate everything into the existing services.

---

**Tarea 2:** Edge Function

---

**Tarea 3:** Instalar dependencias

---

Instalado correctamente. Ahora actualizo `app.json`:

---

**Tarea 4:** Tipos, servicio y hook de notificaciones

---

**Tarea 5:** Modificar App.tsx

---

**Tarea 6:** Integrar llamadas en los servicios existentes

Primero necesito entender cómo se obtiene el perfil del usuario en `meetupService` para poder incluir el username en los mensajes.

---

Now I have enough context to integrate the notifications in meetupService.ts and the hooks. Let me analyze what changes need to be made:

1. **joinMeetup** in meetupService.ts: after successful join, notify the organizer
   - Need to get the organizer's userId and the joining user's username
   - The meetup has `created_by` field which is the organizer's userId
   - Need to get the joining user's profile to get the username
   
2. **transferOrganizer** in meetupService.ts: after successful transfer, notify the new organizer
   - Recipient: newOrganizerUserId
   - Need the meetup title

3. **finishMeetup** in meetupService.ts: after finish with reviewsEnabled=true, notify all participants
   - Get all participants except the one who finishes
   - Send notification to each one

4. **After joining** (in useMeetups.ts or meetupService.ts): schedule reminder notification

For `joinMeetup`, I'll query the joining user's profile to get their username, then send a notification to the organizer with the meetup details.

For `transferOrganizer`, I need to fetch the meetup data first since only the meetupId is available to get the title.

For `finishMeetup`, I'll need to fetch all participants and the meetup title since I only have the meetupId and userId.

The reminder scheduling after joining already has access to the full meetup object, so I can schedule it and store the notification ID in AsyncStorage.

I think the cleanest approach is adding notification logic directly to meetupService.ts where the core operations happen, keeping everything self-contained. For `joinMeetup`, after a successful join I'll fetch the user's profile for their username and send the organizer a notification.

For `transferOrganizer`, after the transfer succeeds I'll fetch the meetup title and notify the new organizer.

For `finishMeetup` with reviews enabled, I'll fetch all active participants and send each one (except the current user) a notification.

Looking back at the requirements, "confirmar asistencia" means the reminder should be scheduled when the user confirms attendance through the joinMeetup service.

---

Ahora integro las notificaciones en `meetupService.ts`:

Now I have enough context to integrate notifications. The `updateAttendance` method in `participantService` is where attendance confirmation happens.

For the reminder scheduling after confirming attendance, the prompt says to call `scheduleReminderNotification(meetup)` when "usuario confirma asistencia". So this should be in `participantService.updateAttendance` when status === 'confirmed'.

However, `participantService.updateAttendance` doesn't have the meetup object - it only has `meetupId` and `userId`. I'd need to fetch the meetup to schedule the reminder, OR I can do this at the hook level.


The prompt specifies this should happen "en el servicio", so I need to add it directly to `participantService.updateAttendance` when confirming. I'll fetch the meetup data to get the necessary details, then schedule the reminder and store its ID in AsyncStorage with the key `reminder_[meetupId]`.

Now I'm mapping out the changes needed across meetupService.ts. For `joinMeetup`, I'll fetch the joining user's profile and send a fire-and-forget notification to the organizer. In `transferOrganizer`, I need to fetch the meetup first to get the title for the notification body before sending it to the new organizer. For `finishMeetup` with reviews enabled, I'll fetch all participants except the current user and send notifications to each of them.

For `participantService.updateAttendance`, when the status is confirmed, I need to fetch the meetup data, schedule a reminder, and save it to AsyncStorage. All these changes live at the service level since that's where the business logic belongs.

Now I'm checking the profile query structure to understand how to retrieve usernames for notifications. When someone joins a meetup, I need to fetch their profile to get their username, then send a notification to the meetup organizer. I'll implement these as fire-and-forget calls with error handling that won't disrupt the main flow.

Adding notification calls to joinMeetup... For `finishMeetup`, after enabling reviews, I need to fetch all participants and send them notifications. When updating attendance status to confirmed in `participantService`, I should schedule a reminder notification and store its ID in AsyncStorage so it can be cancelled later if needed. Though I'm reconsidering the architecture here—adding the notifications service to participantService could create circular dependencies, so I need to think through how to handle this cleanly.

Now I'll implement these changes.

---

Ahora agrego la notificación en `joinMeetup` (después del join exitoso):

---

También necesito notificar cuando el usuario re-activa (rejoins). Busco esa parte del código y agrego la notificación al organizador ahí también:

---

Ahora agrego la notificación en `finishMeetup`:

---

Ahora agrego notificación en `transferOrganizer`. Necesito el título de la juntada, así que lo fetcho al inicio:

---

Ahora agrego el recordatorio de asistencia en `participantService.ts`. Primero necesito ver cómo luce el método `updateAttendance` completo para saber exactamente dónde insertar:

---

Sin errores. Verifico también los otros archivos nuevos:

---

**Tarea 7:** Documentación

---

Ahora actualizo el índice:

---

---

## Resumen final

### 1. Archivos creados

| Archivo | Descripción |
|---|---|
| `supabase/migrations/009_notifications.sql` | Migración: columna `push_token` en profiles, enum `notification_type`, tabla `notifications`, índice compuesto y 3 políticas RLS |
| `supabase/functions/send-push-notification/index.ts` | Edge Function Deno: valida JWT, inserta notificación in-app y envía push via Expo API |
| `mobile/src/features/notifications/types.ts` | `Notification`, `NotificationInput`, `NotificationRow`, `NotificationType` enum |
| `mobile/src/features/notifications/services/notificationService.ts` | 8 métodos: register token, send, get, markAsRead, markAllAsRead, delete, schedule reminder, cancel reminder |
| `mobile/src/features/notifications/hooks/useNotifications.ts` | `useNotifications`, `useUnreadCount`, `useMarkAsRead`, `useMarkAllAsRead`, `useDeleteNotification` |
| `ia/entrega-2/prompts/bloque-5/02_backend_notificaciones.md` | Copia completa del prompt |

### 2. Archivos modificados

| Archivo | Cambios |
|---|---|
| `mobile/package.json` | `expo-notifications` y `expo-device` instalados via `npx expo install` |
| `mobile/app.json` | Plugin `expo-notifications` con `icon.png` fallback + permisos Android |
| `mobile/App.tsx` | `setNotificationHandler` + `useEffect` con `onAuthStateChange` para registrar push token |
| `mobile/src/features/meetups/services/meetupService.ts` | Notificaciones fire-and-forget en `joinMeetup`, `finishMeetup` y `transferOrganizer` |
| `mobile/src/features/participants/services/participantService.ts` | Recordatorio local al confirmar asistencia en `updateAttendance` |
| `ia/entrega-2/indice_ia.md` | Entradas 49–53 del bloque 5 |

### 3. Decisiones tomadas

- **`setNotificationHandler` en App.tsx a nivel de módulo** (fuera del componente): se registra una sola vez al importar el archivo, evitando re-registros en cada render.
- **`shouldShowBanner` y `shouldShowList` agregados** al handler: la versión de `expo-notifications` instalada requiere esos campos en `NotificationBehavior`; se detectó via linter y se corrigió.
- **Recordatorio en `participantService` (no en hook)**: el hook no tiene acceso directo al objeto `Meetup` completo en el momento de la mutación; el servicio puede hacer la query adicional sin exponer la dependencia a la UI.
- **`location: ''` en el mapeo de Meetup dentro de participantService**: el campo `location` no se selecciona en esa query por no ser necesario para el recordatorio; se usa string vacío para satisfacer el tipo sin lanzar error.
- **Notificación al organizador también en el caso de "rejoin"**: cuando un usuario que había abandonado vuelve a unirse, también se notifica al organizador (misma lógica que el join nuevo).
- **`Promise.allSettled`** para notificar a múltiples participantes al finalizar juntada: evita que un fallo en un destinatario cancele las notificaciones a los demás.

### 4. Pendientes manuales

1. **Aplicar la migración SQL**: ejecutar `supabase db push` o correr `009_notifications.sql` en el dashboard de Supabase.
2. **Deploy de la Edge Function**: `supabase functions deploy send-push-notification` desde la raíz del proyecto.
3. **Verificar variables de entorno** en el dashboard de Supabase para la Edge Function: `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` (generalmente ya disponibles en el runtime de Supabase).

### 5. Cómo probarlo

1. Levantar la app en un **dispositivo físico** (las push no funcionan en emulador).
2. Al iniciar sesión, se debería pedir permiso de notificaciones; aceptarlo.
3. Verificar en Supabase Dashboard (tabla `profiles`) que la columna `push_token` se llenó con el token `ExponentPushToken[...]`.
4. Desde otra cuenta, unirse a una juntada con el código; el organizador debería recibir la push "Nueva confirmación 🎉".
5. Confirmar asistencia; en 2 horas antes de la juntada se debería disparar el recordatorio local.
6. Finalizar una juntada con reseñas habilitadas; todos los participantes deberían recibir "¿Cómo estuvo? ⭐".

### Archivos modificados

- `supabase/migrations/009_notifications.sql` — modificado
- `supabase/functions/send-push-notification/index.ts` — modificado
- `mobile/app.json` — modificado
- `mobile/src/features/notifications/types.ts` — modificado
- `mobile/src/features/notifications/services/notificationService.ts` — modificado
- `mobile/src/features/notifications/hooks/useNotifications.ts` — modificado
- `mobile/App.tsx` — modificado
- `mobile/src/features/meetups/services/meetupService.ts` — modificado
- `mobile/src/features/participants/services/participantService.ts` — modificado


<details>
<summary>Metadatos del intercambio</summary>

- **Transcript:** `0b14cc6f-af86-4d6c-b4cb-bed2716f2f10`
- **Índice:** 0

</details>

---

## Sesión 6 — Diagnóstico push_token

### Prompt (mensaje en chat)

# Diagnóstico — Registro de push token

Revisá el código de notificationService.registerPushToken()
y App.tsx y respondé:

1. ¿En qué condición exacta se llama registerPushToken()
   desde App.tsx? ¿Hay alguna condición que pueda hacer
   que no se llame?

2. En registerPushToken(), ¿qué pasa si Device.isDevice
   es false? ¿Retorna null silenciosamente?

3. ¿El projectId se está leyendo correctamente desde
   Constants.expoConfig?.extra?.eas?.projectId?
   Pegá el valor que tendría en runtime según app.json actual.

4. ¿Hay algún try/catch que esté tragando errores
   sin logearlos?

No tocar ningún archivo, solo reportar.

### Respuesta

Voy a leer los archivos relevantes para el diagnóstico.

The user wants me to analyze the code and answer diagnostic questions without modifying any files. Let me read the relevant files.

---

---

## Diagnóstico — Registro de push token

### 1. ¿En qué condición exacta se llama `registerPushToken()` desde App.tsx?

```52:63:juntadas-app/mobile/App.tsx
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user?.id) {
          // Fire-and-forget: si el registro falla no debe bloquear nada
          void notificationService.registerPushToken(session.user.id);
        }
      },
    );

    return () => subscription.unsubscribe();
  }, []);
```

Se llama **cada vez que `onAuthStateChange` dispara un evento con sesión activa**. Eso incluye:

- `SIGNED_IN` → login normal ✓
- `TOKEN_REFRESHED` → renovación silenciosa del JWT ← **problema potencial**: si el token se renueva cada hora, `registerPushToken` se llama de nuevo innecesariamente (aunque no rompe nada, pide permisos de nuevo o hace un UPDATE redundante a la DB).
- `USER_UPDATED` → si el usuario cambia datos de perfil.
- `INITIAL_SESSION` → el evento que Supabase dispara al resolver la sesión cacheada al arrancar la app.

**Condición que puede hacer que NO se llame**: si `session?.user?.id` es falsy. Eso ocurre en:
- Eventos de logout (`SIGNED_OUT`) — correcto, no queremos registrar token sin usuario.
- Si la sesión expiró y no se pudo renovar.
- Si el usuario nunca inició sesión (primera apertura de la app).

**Problema oculto**: el `useEffect` no hace un `getSession()` inicial. Esto significa que **si la app ya tiene sesión cacheada cuando monta (usuario que ya estaba logueado y reabre la app)**, el `useEffect` espera a que `onAuthStateChange` dispare `INITIAL_SESSION`. Supabase JS v2 sí dispara ese evento automáticamente al suscribirse, por lo que en la práctica funciona — pero depende de ese comportamiento implícito de la librería.

---

### 2. ¿Qué pasa si `Device.isDevice` es false?

```61:63:juntadas-app/mobile/src/features/notifications/services/notificationService.ts
      if (!Device.isDevice) {
        return { data: null, error: null };
      }
```

Sí, retorna `{ data: null, error: null }` **silenciosamente**. No hay ningún log ni indicación de por qué no se registró el token. En el caller (App.tsx) el retorno se ignora por completo (`void`), así que **en emulador o en web nunca sabrás si el registro se omitió o si directamente falló**.

Esto es intencional por diseño (los emuladores no tienen push real), pero puede confundir en debugging.

---

### 3. ¿El `projectId` se lee correctamente?

```75:75:juntadas-app/mobile/src/features/notifications/services/notificationService.ts
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
```

**Ruta de lectura**: `Constants.expoConfig` → `extra` → `eas` → `projectId`.

Según `app.json`, la estructura es:

```json
"extra": {
  "eas": {
    "projectId": "4e795c92-2a3e-4984-939e-168bca1db737"
  }
}
```

Eso coincide exactamente con la ruta que lee el código. El valor en runtime sería:

```
"4e795c92-2a3e-4984-939e-168bca1db737"
```

**Advertencia importante**: `Constants.expoConfig` solo está disponible cuando la app corre con el runtime de Expo (Expo Go, `expo start`, o build EAS). Si se buildea como bare React Native sin `expo-constants` configurado correctamente, puede ser `undefined`. En ese caso `projectId` sería `undefined`, y `getExpoPushTokenAsync({ projectId: undefined })` puede fallar o devolver un token vinculado a un proyecto incorrecto dependiendo de la versión.

**Verificación práctica**: la ruta es correcta y el projectId existe en `app.json`. Debería funcionar en Expo Go y en builds EAS.

---

### 4. ¿Hay `try/catch` que trague errores sin loguearlos?

Sí, hay **dos lugares** donde se silencian errores sin dejar traza:

**A) En el `catch` general de `registerPushToken`** (líneas 91–94):

```90:94:juntadas-app/mobile/src/features/notifications/services/notificationService.ts
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      return { data: null, error: message || 'Error al registrar el token de notificaciones' };
    }
```

Este sí captura el mensaje, pero como el caller lo llama con `void` y nunca inspecciona el retorno `{ data, error }`, el `error` nunca llega a ningún lado. Si `getExpoPushTokenAsync` lanza (por ejemplo, por `projectId: undefined`), el error queda atrapado en el `ServiceResult` y desaparece.

**B) En el caller en App.tsx**:

```57:57:juntadas-app/mobile/App.tsx
          void notificationService.registerPushToken(session.user.id);
```

El `void` descarta la Promise completa. Si `registerPushToken` retorna `{ data: null, error: 'algo' }`, ese `error` nunca se lee. Si la Promise rechaza (teóricamente imposible porque `registerPushToken` tiene su propio `try/catch`), sería un unhandled rejection silenciosa.

---

### Resumen de riesgos

| # | Riesgo | Severidad |
|---|---|---|
| `TOKEN_REFRESHED` llama `registerPushToken` repetidamente | Bajo (no rompe, solo redundante) |
| `Device.isDevice === false` no tiene log | Bajo (comportamiento esperado, solo dificulta debug) |
| `projectId: undefined` si `Constants.expoConfig` es null | Medio (haría fallar `getExpoPushTokenAsync` silenciosamente) |
| El `error` del `ServiceResult` nunca se lee en App.tsx | Medio (imposible saber si el registro falló en producción) |

<details>
<summary>Metadatos del intercambio</summary>

- **Transcript:** `0b14cc6f-af86-4d6c-b4cb-bed2716f2f10`
- **Índice:** 1

</details>

---

## Sesión 7 — Corrección push_token / Firebase

### Prompt (mensaje en chat)

# Corrección — Registro de push token

## Problema identificado
El token no se está guardando en la DB. La causa más probable
es que Constants.expoConfig sea null/undefined en el APK
standalone, haciendo que projectId sea undefined y
getExpoPushTokenAsync falle silenciosamente.

## Correcciones a realizar

### Corrección 1 — notificationService.ts

1. Agregar logs temporales de diagnóstico en registerPushToken():
   - Antes de Device.isDevice: console.log('[Push] Iniciando registro...')
   - Después de Device.isDevice: console.log('[Push] isDevice:', Device.isDevice)
   - Después de obtener projectId: console.log('[Push] projectId:', projectId)
   - Después de obtener permisos: console.log('[Push] permisos:', status)
   - Después de obtener token: console.log('[Push] token obtenido:', token.data)
   - En el catch: console.error('[Push] Error:', err)

2. Hacer más robusto el projectId:
   Reemplazar:
   const projectId = Constants.expoConfig?.extra?.eas?.projectId;
   
   Por:
   const projectId =
     Constants.expoConfig?.extra?.eas?.projectId ??
     Constants.easConfig?.projectId ??
     '4e795c92-2a3e-4984-939e-168bca1db737'; // fallback hardcodeado
   
   El fallback hardcodeado garantiza que aunque Constants falle,
   el projectId siempre tenga el valor correcto.

3. Si projectId sigue siendo undefined después del fallback:
   console.error('[Push] projectId no disponible') y retornar null

### Corrección 2 — App.tsx

Cambiar el void por un log del resultado:
   Reemplazar:
   void notificationService.registerPushToken(session.user.id);
   
   Por:
   notificationService.registerPushToken(session.user.id)
     .then(result => {
       if (result.error) {
         console.error('[Push] Error al registrar token:', result.error);
       } else if (result.data) {
         console.log('[Push] Token registrado correctamente');
       }
     })
     .catch(err => console.error('[Push] Error inesperado:', err));

No hacer:
- No cambiar la lógica de negocio
- No hacer commits

Archivos esperados:
- src/features/notifications/services/notificationService.ts
- mobile/App.tsx

### Respuesta

The user wants me to make two corrections:
1. Add diagnostic logs to notificationService.ts registerPushToken() and make projectId more robust
2. Change the void call in App.tsx to log the result

Let me read the current files first, then make the changes.

---

Sin errores. Los cambios aplicados:

**`notificationService.ts`** — `registerPushToken()`:

- Log al inicio, antes y después de cada paso crítico (`isDevice`, permisos, `projectId`, token).
- `projectId` ahora tiene tres fuentes en cascada:
  1. `Constants.expoConfig?.extra?.eas?.projectId` (Expo Go / dev)
  2. `Constants.easConfig?.projectId` (builds EAS recientes)
  3. `'4e795c92-...'` hardcodeado como fallback garantizado
- Si por algún motivo el fallback también fuera falsy, loguea el error y retorna `null` con mensaje explicativo en lugar de pasar `undefined` a `getExpoPushTokenAsync`.
- `console.error('[Push] Error:', err)` en el `catch` para no perder la causa real de ninguna excepción.

**`App.tsx`** — caller:

- Reemplaza el `void` por un `.then()/.catch()` que loguea tanto el `error` del `ServiceResult` como excepciones inesperadas de la Promise, sin bloquear el flujo.

Todos los `console.log/error` están marcados con `// TODO: remover` para limpiarlos después de confirmar que el registro funciona en el APK.

### Archivos modificados

- `mobile/src/features/notifications/services/notificationService.ts` — modificado
- `mobile/App.tsx` — modificado


<details>
<summary>Metadatos del intercambio</summary>

- **Transcript:** `0b14cc6f-af86-4d6c-b4cb-bed2716f2f10`
- **Índice:** 2

</details>

---

## Sesión 8 — Fix Expo Go (guard isExpoGo)

### Prompt (archivo guardado: `prompts/bloque-5/03_fix_expo_go_notifications.md`)

# Corrección — expo-notifications compatible con Expo Go

## Problema
expo-notifications crash en Expo Go SDK 55 porque las push
notifications remotas fueron removidas desde SDK 53.
La app no puede ni abrirse en Expo Go.

## Solución
Detectar si estamos en Expo Go y deshabilitar las push
notifications en ese contexto. La app funciona normalmente
en Expo Go (sin push) y con push en el APK standalone.

---

### Corrección 1 — notificationService.ts

En registerPushToken() agregar detección de Expo Go
ANTES de cualquier otra lógica:

import Constants from 'expo-constants';

// Al inicio de registerPushToken():
// Detectar si estamos corriendo en Expo Go
const isExpoGo = Constants.appOwnership === 'expo';
if (isExpoGo) {
  console.log('[Push] Expo Go detectado — push notifications deshabilitadas');
  return { data: null, error: null };
}

Esto debe ser la PRIMERA verificación, antes de Device.isDevice
y antes de pedir permisos.

También agregar el mismo guard en scheduleReminderNotification():
const isExpoGo = Constants.appOwnership === 'expo';
if (isExpoGo) return null;

No hacer:
- No cambiar la lógica para builds nativos (APK)
- No remover los logs de diagnóstico agregados anteriormente

Archivos esperados:
- src/features/notifications/services/notificationService.ts

---

### Corrección 2 — App.tsx

El setNotificationHandler también puede crashear en Expo Go.
Envolverlo en el mismo guard:

import Constants from 'expo-constants';

Reemplazar:
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

Por:
const isExpoGo = Constants.appOwnership === 'expo';
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

No hacer:
- No cambiar ninguna otra lógica de App.tsx

Archivos esperados:
- mobile/App.tsx

---

### Corrección 3 — Documentar este prompt

Crear ia/entrega-2/prompts/bloque-5/03_fix_expo_go_notifications.md
con el contenido completo de este prompt.

Actualizar ia/entrega-2/indice_ia.md agregando:
[número siguiente] - Fix: expo-notifications compatible con Expo Go
  (guard isExpoGo en registerPushToken y setNotificationHandler)

No hacer:
- No tocar archivos fuera de los indicados
- No hacer commits

Archivos esperados:
- ia/entrega-2/prompts/bloque-5/03_fix_expo_go_notifications.md
- ia/entrega-2/indice_ia.md (actualizado)

---

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- No hacer commits
- Reportar archivos modificados al finalizar

## Al finalizar
Resumen con:
1. Archivos modificados
2. Verificar que npx tsc --noEmit pasa sin errores
3. Instrucciones para probar

### Prompt (mensaje en chat)

# Corrección — expo-notifications compatible con Expo Go

## Problema
expo-notifications crash en Expo Go SDK 55 porque las push
notifications remotas fueron removidas desde SDK 53.
La app no puede ni abrirse en Expo Go.

## Solución
Detectar si estamos en Expo Go y deshabilitar las push
notifications en ese contexto. La app funciona normalmente
en Expo Go (sin push) y con push en el APK standalone.

---

### Corrección 1 — notificationService.ts

En registerPushToken() agregar detección de Expo Go
ANTES de cualquier otra lógica:

import Constants from 'expo-constants';

// Al inicio de registerPushToken():
// Detectar si estamos corriendo en Expo Go
const isExpoGo = Constants.appOwnership === 'expo';
if (isExpoGo) {
  console.log('[Push] Expo Go detectado — push notifications deshabilitadas');
  return { data: null, error: null };
}

Esto debe ser la PRIMERA verificación, antes de Device.isDevice
y antes de pedir permisos.

También agregar el mismo guard en scheduleReminderNotification():
const isExpoGo = Constants.appOwnership === 'expo';
if (isExpoGo) return null;

No hacer:
- No cambiar la lógica para builds nativos (APK)
- No remover los logs de diagnóstico agregados anteriormente

Archivos esperados:
- src/features/notifications/services/notificationService.ts

---

### Corrección 2 — App.tsx

El setNotificationHandler también puede crashear en Expo Go.
Envolverlo en el mismo guard:

import Constants from 'expo-constants';

Reemplazar:
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

Por:
const isExpoGo = Constants.appOwnership === 'expo';
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

No hacer:
- No cambiar ninguna otra lógica de App.tsx

Archivos esperados:
- mobile/App.tsx

---

### Corrección 3 — Documentar este prompt

Crear ia/entrega-2/prompts/bloque-5/03_fix_expo_go_notifications.md
con el contenido completo de este prompt.

Actualizar ia/entrega-2/indice_ia.md agregando:
[número siguiente] - Fix: expo-notifications compatible con Expo Go
  (guard isExpoGo en registerPushToken y setNotificationHandler)

No hacer:
- No tocar archivos fuera de los indicados
- No hacer commits

Archivos esperados:
- ia/entrega-2/prompts/bloque-5/03_fix_expo_go_notifications.md
- ia/entrega-2/indice_ia.md (actualizado)

---

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- No hacer commits
- Reportar archivos modificados al finalizar

## Al finalizar
Resumen con:
1. Archivos modificados
2. Verificar que npx tsc --noEmit pasa sin errores
3. Instrucciones para probar

### Respuesta

Voy a aplicar los guards de Expo Go en notificaciones y documentar el prompt. Primero reviso los archivos afectados.

---

Aplicando los guards de Expo Go y creando la documentación.

---

Corrección aplicada. La app ya no debería crashear en Expo Go por `expo-notifications`.

## Resumen

### 1. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `mobile/src/features/notifications/services/notificationService.ts` | Guard `isExpoGo` al inicio de `registerPushToken()` y `scheduleReminderNotification()` |
| `mobile/App.tsx` | `setNotificationHandler` envuelto en guard `!isExpoGo` |
| `ia/entrega-2/prompts/bloque-5/03_fix_expo_go_notifications.md` | Prompt documentado (creado) |
| `ia/entrega-2/indice_ia.md` | Entrada **54** agregada en Bloque 5 |

### 2. TypeScript (`npx tsc --noEmit`)

El comando falla con un error **preexistente**, no relacionado con estos cambios:

```
error TS2688: Cannot find type definition file for 'node'.
```

Los archivos editados no tienen errores de linter. La detección usa `Constants.appOwnership === 'expo'`, el criterio recomendado por Expo.

**Nota:** En `scheduleReminderNotification()` el prompt decía `return null`, pero la función retorna `ServiceResult<string | null>`, así que se usa `{ data: null, error: null }` para mantener tipado estricto.

### 3. Cómo probar

**En Expo Go (sin push):**
1. Reiniciá Metro con caché limpia: `npx expo start --clear`
2. Abrí la app en Expo Go — debe arrancar sin crash
3. Iniciá sesión y revisá la consola: debería aparecer `[Push] Expo Go detectado — push notifications deshabilitadas`
4. Navegá por la app (home, juntadas, historial, juegos) — todo debería funcionar normalmente

**En APK standalone (con push):**
1. Instalá el APK de preview/EAS
2. Iniciá sesión — en consola debería verse `[Push] Token registrado correctamente`
3. Provocá un evento (ej. unirse a juntada) y verificá que llegue la push

### Decisiones tomadas

- Se conservaron los logs de diagnóstico existentes (`// TODO: remover`)
- Se mantuvieron `shouldShowBanner` y `shouldShowList` en el handler de `App.tsx` (no se tocó la lógica nativa)
- `Constants` ya estaba importado en `notificationService.ts`; solo se agregó en `App.tsx`

### Pendientes de validación

- Confirmar arranque en Expo Go en tu dispositivo (tenés Metro corriendo con `--tunnel --clear`)
- Resolver el error TS2688 de `@types/node` si querés que `tsc --noEmit` pase limpio en CI

### Archivos modificados

- `mobile/src/features/notifications/services/notificationService.ts` — modificado
- `mobile/App.tsx` — modificado


<details>
<summary>Metadatos del intercambio</summary>

- **Transcript:** `e98c56a3-4383-4f72-83a2-f726d3acd3ac`
- **Índice:** 0

</details>

---

## Sesión 9 — Fix Expo Go (imports dinámicos)

### Prompt (mensaje en chat)

# Corrección 2 — expo-notifications: lazy import para Expo Go

## Problema
El crash ocurre al importar expo-notifications, antes de que
cualquier guard pueda ejecutarse. La librería se inicializa
al momento del import y Expo Go lanza el error en ese punto.

## Solución
Reemplazar el import estático de expo-notifications por
imports dinámicos que solo se ejecutan cuando no estamos
en Expo Go.

## Alcance

### En notificationService.ts:

1. Eliminar TODOS los imports estáticos de expo-notifications
   al inicio del archivo. Es decir, eliminar líneas como:
   import * as Notifications from 'expo-notifications';
   import * as Device from 'expo-device';

2. En cada método que usa Notifications o Device,
   reemplazar el uso directo por import dinámico:

   // En lugar de usar Notifications directamente:
   const Notifications = await import('expo-notifications');
   const Device = await import('expo-device');

3. El guard de isExpoGo debe ejecutarse ANTES del import
   dinámico en cada método:

   async registerPushToken(userId: string) {
     const Constants = (await import('expo-constants')).default;
     const isExpoGo = Constants.appOwnership === 'expo';
     if (isExpoGo) {
       console.log('[Push] Expo Go — push deshabilitadas');
       return { data: null, error: null };
     }
     // Recién acá importamos expo-notifications
     const Notifications = await import('expo-notifications');
     const Device = await import('expo-device');
     // ... resto de la lógica
   }

4. Aplicar el mismo patrón en scheduleReminderNotification()
   y cancelReminderNotification()

### En App.tsx:

1. Eliminar el import estático de expo-notifications

2. El setNotificationHandler debe hacerse con import dinámico:
   
   // En el useEffect o al inicio del componente:
   const isExpoGo = Constants.appOwnership === 'expo';
   if (!isExpoGo) {
     import('expo-notifications').then((Notifications) => {
       Notifications.setNotificationHandler({
         handleNotification: async () => ({
           shouldShowAlert: true,
           shouldPlaySound: true,
           shouldSetBadge: true,
           shouldShowBanner: true,
           shouldShowList: true,
         }),
       });
     });
   }

### Verificación:
Después de los cambios ejecutar npx tsc --noEmit
(ignorar el error preexistente de @types/node)
Confirmar que no hay errores nuevos relacionados
con los imports dinámicos.

No hacer:
- No cambiar la lógica de negocio
- No hacer commits

Archivos esperados:
- src/features/notifications/services/notificationService.ts
- mobile/App.tsx

## Al finalizar
Resumen con:
1. Archivos modificados
2. Resultado de tsc --noEmit
3. Cómo verificar que funciona en Expo Go

### Respuesta

Revisando los archivos actuales para reemplazar los imports estáticos por imports dinámicos.

---

Aplicando imports dinámicos en los métodos que usan `expo-notifications` y `expo-device`.

---

## Resumen

### 1. Archivos modificados

- **`mobile/src/features/notifications/services/notificationService.ts`**
  - Eliminados imports estáticos de `expo-notifications` y `expo-device`
  - `registerPushToken()`: guard `isExpoGo` con `expo-constants` dinámico → luego import dinámico de ambas librerías
  - `scheduleReminderNotification()` y `cancelReminderNotification()`: mismo patrón guard → import dinámico
  - `cancelReminderForMeetup()`: mismo patrón (necesario porque también usaba `Notifications` y dejaría error de compilación)

- **`mobile/App.tsx`**
  - Eliminado import estático de `expo-notifications`
  - `setNotificationHandler` movido a un `useEffect` con import dinámico condicionado a `!isExpoGo`

### 2. Resultado de `npx tsc --noEmit`

Solo el error **preexistente**:

```
error TS2688: Cannot find type definition file for 'node'.
```

Sin errores nuevos relacionados con los imports dinámicos. No quedan imports estáticos de `expo-notifications` ni `expo-device` en `mobile/`.

### 3. Cómo verificar en Expo Go

1. Reiniciá Metro: `npx expo start --clear`
2. Abrí la app en Expo Go — debe arrancar **sin crash** (antes fallaba al importar el módulo)
3. Iniciá sesión y confirmá en consola: `[Push] Expo Go detectado — push notifications deshabilitadas`
4. Navegá por la app con normalidad (home, juntadas, historial, juegos)

**En APK standalone:** instalá el build, iniciá sesión y verificá que aparezca `[Push] Token registrado correctamente` y que las push funcionen.

### Archivos modificados

- `mobile/src/features/notifications/services/notificationService.ts` — modificado
- `mobile/App.tsx` — modificado


<details>
<summary>Metadatos del intercambio</summary>

- **Transcript:** `e98c56a3-4383-4f72-83a2-f726d3acd3ac`
- **Índice:** 1

</details>

---

## Sesión 10 — # Diagnóstico — registerPushToken no guarda en DB

### Prompt (mensaje en chat)

# Diagnóstico — registerPushToken no guarda en DB

## Problema
El token se obtiene del dispositivo (el diálogo de permisos
apareció y fue aceptado) pero no se guarda en profiles.
El UPDATE desde SQL Editor funciona correctamente.
El problema está en el cliente.

## Tarea
En notificationService.ts, en el método registerPushToken(),
agregar logs detallados en cada paso DESPUÉS del guard isExpoGo:

1. Después de obtener permisos:
   console.log('[Push] Status permisos:', status);

2. Después de obtener el token:
   console.log('[Push] Token obtenido:', token?.data);

3. Antes del UPDATE a Supabase:
   console.log('[Push] Intentando guardar token para userId:', userId);

4. Después del UPDATE:
   console.log('[Push] Resultado UPDATE:', JSON.stringify(updateResult));

5. Si hay error en el UPDATE:
   console.error('[Push] Error en UPDATE:', updateError);

También verificar: ¿el método recibe el userId correctamente?
Agregar al inicio:
   console.log('[Push] registerPushToken llamado con userId:', userId);

No cambiar ninguna lógica, solo agregar logs.
No hacer commits.

Archivos esperados:
- src/features/notifications/services/notificationService.ts

### Respuesta

Agregando los logs de diagnóstico solicitados en `registerPushToken`.

---

Logs de diagnóstico agregados en `registerPushToken()` sin cambiar la lógica.

## Archivo modificado
- `mobile/src/features/notifications/services/notificationService.ts`

## Logs agregados (después del guard `isExpoGo`)
1. `[Push] registerPushToken llamado con userId:` — al inicio del flujo
2. `[Push] Status permisos:` — tras `requestPermissionsAsync`
3. `[Push] Token obtenido:` — tras `getExpoPushTokenAsync` (usa `tokenData?.data`)
4. `[Push] Intentando guardar token para userId:` — antes del UPDATE
5. `[Push] Resultado UPDATE:` — respuesta completa de Supabase (`JSON.stringify`)
6. `[Push] Error en UPDATE:` — si `updateError` existe

## Cómo probar
1. Reiniciá la app en el APK (no Expo Go).
2. Aceptá permisos de notificaciones.
3. Revisá la consola de Metro / Logcat filtrando por `[Push]`.

**Qué mirar:**
- Si `userId` es `undefined` o incorrecto → el problema está en `onAuthStateChange` de `App.tsx`.
- Si el token aparece pero `Resultado UPDATE` muestra `error` → probable RLS o permisos en `profiles`.
- Si `Resultado UPDATE` tiene `data: []` y sin error → el UPDATE no matcheó ninguna fila (userId no existe en `profiles` o no coincide con `id`).

### Archivos modificados

- `mobile/src/features/notifications/services/notificationService.ts` — modificado


<details>
<summary>Metadatos del intercambio</summary>

- **Transcript:** `e98c56a3-4383-4f72-83a2-f726d3acd3ac`
- **Índice:** 2

</details>

---

## Sesión 11 — Como reinicio la app en el APK

### Prompt (mensaje en chat)

Como reinicio la app en el APK

### Respuesta

Para reiniciar la app en el **APK standalone** (no Expo Go):

## Opción rápida (recomendada)
1. Abrí el **selector de apps recientes** (botón cuadrado o gesto de swipe desde abajo).
2. Deslizá **Juntadas** hacia arriba para cerrarla por completo.
3. Volvé al ícono de la app y abrila de nuevo.

Así se reinicia el proceso y vuelve a ejecutarse `registerPushToken` al iniciar sesión.

## Forzar cierre desde Ajustes
1. **Ajustes → Apps → Juntadas**
2. Tocá **Forzar detención**
3. Abrí la app otra vez

## Ver los logs `[Push]`
En el APK **no** vas a ver la consola de Metro. Para diagnosticar:

**Android (con cable USB):**
```bash
adb logcat | findstr Push
```
(o en PowerShell: `adb logcat | Select-String Push`)

**Alternativa:** conectá el teléfono a la PC, abrí la app, y en la terminal de Metro no vas a ver nada — los logs van por `adb logcat`.

## Si cambiaste código y querés probar de nuevo
El APK **no se actualiza solo** cuando editás código. Tenés que:
1. Hacer un **nuevo build** (`eas build --profile preview` o el perfil que uses), o
2. Probar con **development build** conectado a Metro (`npx expo start` + app dev client).

Si solo agregaste logs y **no** recompilaste el APK, esos logs **no van a aparecer** hasta que instales un build nuevo con esos cambios.

¿Estás probando con un APK ya instalado o con un build conectado a Metro?

<details>
<summary>Metadatos del intercambio</summary>

- **Transcript:** `e98c56a3-4383-4f72-83a2-f726d3acd3ac`
- **Índice:** 3

</details>

---

## Sesión 12 — # Diagnóstico — llamada a Edge Function desde cliente

### Prompt (mensaje en chat)

# Diagnóstico — llamada a Edge Function desde cliente

Revisá meetupService.ts y cualquier otro archivo donde se llame
a notificationService.sendNotification() y respondé:

1. ¿En qué parte exacta de joinMeetup() o el hook/servicio
   correspondiente se llama a sendNotification()?
   Pegá las líneas exactas.

2. ¿Cómo se obtiene el organizadorId para enviársela?
   ¿Se hace una query adicional o viene de los datos ya cargados?

3. En notificationService.sendNotification(), ¿cómo se llama
   a la Edge Function? ¿Usa supabase.functions.invoke() o fetch()?
   Pegá las líneas exactas.

4. ¿El invoke incluye el header de Authorization automáticamente
   o hay que pasarlo manualmente?

No tocar ningún archivo, solo reportar.

### Respuesta

Revisando el flujo de `sendNotification` y las llamadas a la Edge Function sin modificar archivos.

---

Reporte de diagnóstico (solo lectura, sin cambios en archivos).

---

## 1. ¿Dónde se llama `sendNotification()` en `joinMeetup()`?

Solo en **`meetupService.ts`**, dentro de `joinMeetup()`. Hay **dos ramas** (rejoin y join nuevo), ambas fire-and-forget con `void (async () => { ... })()`.

**Rama A — usuario que había abandonado y se reactiva:**

```465:487:juntadas-app/mobile/src/features/meetups/services/meetupService.ts
        // Notificar al organizador (fire-and-forget)
        void (async () => {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', userId)
              .single();

            const username = profile?.username ?? 'Alguien';
            const mappedMeetup = mapMeetupRow(meetup as MeetupRow);

            await notificationService.sendNotification({
              recipientUserId: meetup.created_by,
              type: NotificationType.Joined,
              title: 'Nueva confirmación 🎉',
              body: `${username} se unió a ${mappedMeetup.title}`,
              meetupId: mappedMeetup.id,
            });
          } catch {
            // Error en la notificación: no afecta el flujo principal
          }
        })();
```

**Rama B — INSERT normal (primera vez que se une):**

```504:526:juntadas-app/mobile/src/features/meetups/services/meetupService.ts
      // Notificar al organizador que alguien se unió (fire-and-forget)
      void (async () => {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', userId)
            .single();

          const username = profile?.username ?? 'Alguien';
          const mappedMeetup = mapMeetupRow(meetup as MeetupRow);

          await notificationService.sendNotification({
            recipientUserId: meetup.created_by,
            type: NotificationType.Joined,
            title: 'Nueva confirmación 🎉',
            body: `${username} se unió a ${mappedMeetup.title}`,
            meetupId: mappedMeetup.id,
          });
        } catch {
          // Error en la notificación: no afecta el flujo principal
        }
      })();
```

**Hook:** `useMeetups.ts` solo delega al servicio, **no** llama a `sendNotification`:

```222:227:juntadas-app/mobile/src/features/meetups/hooks/useMeetups.ts
  const joinMeetupMutation = useMutation({
    ...
      return meetupService.joinMeetup(userId, joinCode);
```

**Otros usos de `sendNotification()`** (fuera de `joinMeetup`):
- `finishMeetup()` → notifica participantes si `reviewsEnabled` (línea ~736)
- `transferOrganizer()` → notifica al nuevo organizador (línea ~1286)

---

## 2. ¿Cómo se obtiene el `organizerId`?

**No hay query adicional** para el organizador.

Viene del **`meetup` ya cargado** al inicio de `joinMeetup()`:

```418:423:juntadas-app/mobile/src/features/meetups/services/meetupService.ts
      const { data: meetup, error: meetupError } = await supabase
        .from('meetups')
        .select('*')
        .eq('join_code', joinCode)
        .eq('status', 'active')
        .maybeSingle();
```

El destinatario de la notificación es **`meetup.created_by`** (campo `created_by` de esa fila).

La **única query extra** dentro del bloque de notificación es para el **username del usuario que se une** (`profiles` con `userId`), no para el organizador.

---

## 3. ¿Cómo se invoca la Edge Function en `sendNotification()`?

Usa **`supabase.functions.invoke()`**, no `fetch()`:

```139:154:juntadas-app/mobile/src/features/notifications/services/notificationService.ts
  async sendNotification(input: NotificationInput): Promise<ServiceResult<unknown>> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'send-push-notification',
        { body: input },
      );

      if (error) {
        return { data: null, error: error.message || 'Error al enviar la notificación' };
      }

      return { data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      return { data: null, error: message || 'Error inesperado al enviar la notificación' };
    }
```

El cliente Supabase es el estándar del proyecto:

```6:16:juntadas-app/mobile/src/lib/supabase/client.ts
export const supabase = createClient(
  env.supabase.url,
  env.supabase.anonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

---

## 4. ¿El `Authorization` va automático o hay que pasarlo manual?

**Automático.** No se pasa ningún header manual en el código.

Con `@supabase/supabase-js`, `functions.invoke()` adjunta el **`Authorization: Bearer <JWT>`** de la sesión activa (si el usuario está logueado), junto con la **`apikey`** (anon key). No hay `headers: { Authorization: ... }` en la llamada.

Si no hay sesión válida, la invoke va **sin JWT de usuario** (solo anon key), lo que puede hacer fallar la Edge Function si exige autenticación.

---

### Resumen rápido para depurar

| Punto | Valor |
|-------|--------|
| Trigger join | `meetupService.joinMeetup()` → 2 bloques async fire-and-forget |
| Organizador | `meetup.created_by` (del `select('*')` inicial) |
| Mecanismo | `supabase.functions.invoke('send-push-notification', { body: input })` |
| Auth | Automática vía cliente Supabase + sesión en AsyncStorage |

<details>
<summary>Metadatos del intercambio</summary>

- **Transcript:** `e98c56a3-4383-4f72-83a2-f726d3acd3ac`
- **Índice:** 4

</details>

---

## Sesión 13 — Frontend de notificaciones

### Prompt (archivo guardado: `prompts/bloque-5/04_frontend_notificaciones.md`)

# Bloque 5c — Frontend de notificaciones

## Contexto
Rama actual: feature/bloque-5-notificaciones
El backend está completo y funcionando:
- push_token se registra correctamente en profiles
- Edge Function send-push-notification funciona
- Tabla notifications tiene datos reales
- La campana ya existe visualmente en MeetupHomeScreen
  pero sin funcionalidad

Stack relevante:
- React Native + Expo SDK 55 + TypeScript
- TanStack Query v5
- useNotifications y notificationService ya implementados
- Design tokens en src/shared/constants/theme.ts
- @expo/vector-icons (MaterialCommunityIcons) ya instalado
- Sin TypeScript any, comentarios en español

## Modelo de negocio definido
- Banner flotante: aparece 4 segundos, animación entrada/salida
- Si usuario descarta el banner: notificación marcada como leída
- Si banner se auto-descarta por tiempo: notificación queda no leída
- Badge en campana: count de no leídas
- Panel: últimas 10 notificaciones, botón "Ver más" si hay más
- Swipe para descartar cada notificación (marcar como leída)
- Perfil: toggle activar/desactivar notificaciones

## Tu tarea
Realizá las siguientes tareas en orden.

---

### Tarea 1 — Hook de tiempo real para notificaciones

En src/features/notifications/hooks/useNotifications.ts agregar:

1. useRealtimeNotifications(userId):
   - Suscripción a Supabase Realtime en la tabla notifications
   - Filtra por user_id = userId
   - Al recibir INSERT: invalida la query ['notifications', userId]
     y dispara un evento global para mostrar el banner
   - Retorna la suscripción para poder cancelarla

2. Para el evento global del banner usar un simple EventEmitter
   o un callback store en Zustand:
   - Crear src/features/notifications/store/notificationStore.ts
   - Estado: { pendingBanner: Notification | null }
   - Acciones: setPendingBanner, clearPendingBanner
   - Usar Zustand (ya instalado)

No hacer:
- No crear componentes todavía
- No hacer commits

Archivos esperados:
- src/features/notifications/hooks/useNotifications.ts (modificado)
- src/features/notifications/store/notificationStore.ts (nuevo)

---

### Tarea 2 — Componente banner flotante

Crear src/features/notifications/components/NotificationBanner.tsx

Comportamiento:
- Lee pendingBanner del notificationStore
- Si pendingBanner es null: no renderiza nada
- Si hay una notificación pendiente:
  * Aparece desde arriba con animación slide down + fade in
  * Se muestra durante 4 segundos
  * Al terminar los 4 segundos: desaparece con slide up + fade out
    y NO marca como leída (queda en no leída)
  * Si el usuario lo toca: desaparece inmediatamente,
    llama a markAsRead y clearPendingBanner
  * Si el usuario lo desliza hacia arriba: mismo comportamiento que toque

UI del banner:
- Posición: fixed en la parte superior de la pantalla,
  debajo del status bar, z-index alto
- Ancho: 90% del ancho de pantalla, centrado
- Fondo: color primario del theme con opacidad 0.95
- Ícono de campana a la izquierda
- Título en negrita + body debajo
- Border radius generoso
- Sombra pronunciada
- Animación de entrada/salida con Animated de React Native

No hacer:
- No instalar librerías de animación
- No hacer commits

Archivos esperados:
- src/features/notifications/components/NotificationBanner.tsx

---

### Tarea 3 — Integrar banner en App.tsx

En App.tsx:
1. Importar NotificationBanner
2. Renderizarlo en el nivel más alto del árbol,
   encima de todo el contenido pero dentro del SafeAreaProvider
3. Inicializar useRealtimeNotifications cuando el usuario
   está autenticado

El banner debe ser visible en cualquier pantalla de la app.

No hacer:
- No cambiar ninguna otra lógica de App.tsx
- No hacer commits

Archivos esperados:
- mobile/App.tsx (modificado)

---

### Tarea 4 — Badge en la campana

Contexto:
- La campana ya existe en MeetupHomeScreen.tsx
- Es un botón con ícono notifications-outline
- No tiene funcionalidad actualmente

Alcance:
En MeetupHomeScreen.tsx:
1. Usar useUnreadCount(userId) del hook existente
2. Mostrar un badge rojo con el número sobre la campana
   si unreadCount > 0
3. Si unreadCount > 9: mostrar "9+" en lugar del número
4. El badge debe estar posicionado en la esquina superior
   derecha del ícono de campana
5. El botón de campana por ahora no navega a ningún lado
   (la navegación al panel va en Tarea 5)

UI del badge:
- Círculo rojo pequeño (20dp) con número blanco
- Posicionado en la esquina superior derecha del ícono
- Usando position: absolute

No hacer:
- No implementar el panel todavía
- No hacer commits

Archivos esperados:
- src/features/meetups/screens/MeetupHomeScreen.tsx (modificado)

---

### Tarea 5 — Panel de notificaciones

Crear src/features/notifications/components/NotificationPanel.tsx

Props:
- visible: boolean
- onClose: () => void
- userId: string

Comportamiento:
- Modal o panel que aparece desde arriba al tocar la campana
- Muestra las últimas 10 notificaciones del usuario
- Si hay más de 10: botón "Ver más" que carga las siguientes 10
- Cada notificación muestra: ícono según type, título, body,
  tiempo relativo (ej: "hace 2 horas")
- Swipe hacia la izquierda en cada notificación:
  revela botón rojo "Eliminar" que llama a deleteNotification
- Botón "Marcar todas como leídas" en el header del panel
- Notificaciones no leídas tienen fondo ligeramente diferente
  (más claro o con indicador de punto)
- Al tocar una notificación: marcarla como leída

Íconos por tipo:
- joined: account-plus (MaterialCommunityIcons)
- transferred: crown (MaterialCommunityIcons)
- review_enabled: star (MaterialCommunityIcons)
- reminder: clock (MaterialCommunityIcons)

Tiempo relativo:
- Menos de 1 hora: "hace X minutos"
- Menos de 24 horas: "hace X horas"
- Más de 24 horas: fecha formateada "DD/MM"

Animación de apertura:
- El panel baja desde arriba con slide down
- Backdrop oscuro detrás con fade in
- Al cerrar: slide up + fade out

No hacer:
- No instalar librerías adicionales
- No hacer commits

Archivos esperados:
- src/features/notifications/components/NotificationPanel.tsx

---

### Tarea 6 — Conectar campana con panel

En MeetupHomeScreen.tsx:
1. Agregar estado local: panelVisible (boolean)
2. Al tocar la campana: setPanelVisible(true)
3. Renderizar NotificationPanel con visible={panelVisible}
   y onClose={() => setPanelVisible(false)}

No hacer:
- No cambiar el diseño del header
- No hacer commits

Archivos esperados:
- src/features/meetups/screens/MeetupHomeScreen.tsx (modificado)

---

### Tarea 7 — Toggle de notificaciones en perfil

Contexto:
- Existe una pantalla de perfil (buscar ProfileScreen o similar)
- Hay que agregar un toggle simple de notificaciones

Alcance:
1. Buscar dónde está la pantalla de perfil en el proyecto
2. Agregar una sección "Notificaciones" con un Switch de React Native
3. Estado del toggle: guardado en AsyncStorage con key
   'notifications_enabled'
4. Cuando se desactiva:
   - Actualizar profiles SET push_token = NULL en Supabase
   - Guardar false en AsyncStorage
5. Cuando se activa:
   - Llamar a notificationService.registerPushToken(userId)
   - Guardar true en AsyncStorage
6. Al abrir la pantalla: leer el estado desde AsyncStorage

No hacer:
- No cambiar el diseño existente del perfil
- No hacer commits

Archivos esperados:
- Pantalla de perfil existente (modificada)

---

### Tarea 8 — Documentar este prompt

Crear ia/entrega-2/prompts/bloque-5/04_frontend_notificaciones.md
con el contenido completo de este prompt.

Actualizar ia/entrega-2/indice_ia.md agregando:
[número siguiente] - useRealtimeNotifications + notificationStore Zustand
[número siguiente] - NotificationBanner: banner flotante animado
[número siguiente] - Badge de notificaciones en campana del home
[número siguiente] - NotificationPanel: panel con lista y swipe
[número siguiente] - Toggle de notificaciones en perfil

No hacer:
- No tocar archivos de código fuera de los indicados
- No hacer commits

Archivos esperados:
- ia/entrega-2/prompts/bloque-5/04_frontend_notificaciones.md
- ia/entrega-2/indice_ia.md (actualizado)

---

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- Seguir tokens de src/shared/constants/theme.ts
- No hacer commits
- Reportar archivos modificados y decisiones al finalizar cada tarea
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar
Resumen con:
1. Archivos creados y modificados
2. Decisiones tomadas
3. Cómo probarlo en dispositivo y en APK

### Prompt (mensaje en chat)

# Bloque 5c — Frontend de notificaciones

## Contexto
Rama actual: feature/bloque-5-notificaciones
El backend está completo y funcionando:
- push_token se registra correctamente en profiles
- Edge Function send-push-notification funciona
- Tabla notifications tiene datos reales
- La campana ya existe visualmente en MeetupHomeScreen
  pero sin funcionalidad

Stack relevante:
- React Native + Expo SDK 55 + TypeScript
- TanStack Query v5
- useNotifications y notificationService ya implementados
- Design tokens en src/shared/constants/theme.ts
- @expo/vector-icons (MaterialCommunityIcons) ya instalado
- Sin TypeScript any, comentarios en español

## Modelo de negocio definido
- Banner flotante: aparece 4 segundos, animación entrada/salida
- Si usuario descarta el banner: notificación marcada como leída
- Si banner se auto-descarta por tiempo: notificación queda no leída
- Badge en campana: count de no leídas
- Panel: últimas 10 notificaciones, botón "Ver más" si hay más
- Swipe para descartar cada notificación (marcar como leída)
- Perfil: toggle activar/desactivar notificaciones

## Tu tarea
Realizá las siguientes tareas en orden.

---

### Tarea 1 — Hook de tiempo real para notificaciones

En src/features/notifications/hooks/useNotifications.ts agregar:

1. useRealtimeNotifications(userId):
   - Suscripción a Supabase Realtime en la tabla notifications
   - Filtra por user_id = userId
   - Al recibir INSERT: invalida la query ['notifications', userId]
     y dispara un evento global para mostrar el banner
   - Retorna la suscripción para poder cancelarla

2. Para el evento global del banner usar un simple EventEmitter
   o un callback store en Zustand:
   - Crear src/features/notifications/store/notificationStore.ts
   - Estado: { pendingBanner: Notification | null }
   - Acciones: setPendingBanner, clearPendingBanner
   - Usar Zustand (ya instalado)

No hacer:
- No crear componentes todavía
- No hacer commits

Archivos esperados:
- src/features/notifications/hooks/useNotifications.ts (modificado)
- src/features/notifications/store/notificationStore.ts (nuevo)

---

### Tarea 2 — Componente banner flotante

Crear src/features/notifications/components/NotificationBanner.tsx

Comportamiento:
- Lee pendingBanner del notificationStore
- Si pendingBanner es null: no renderiza nada
- Si hay una notificación pendiente:
  * Aparece desde arriba con animación slide down + fade in
  * Se muestra durante 4 segundos
  * Al terminar los 4 segundos: desaparece con slide up + fade out
    y NO marca como leída (queda en no leída)
  * Si el usuario lo toca: desaparece inmediatamente,
    llama a markAsRead y clearPendingBanner
  * Si el usuario lo desliza hacia arriba: mismo comportamiento que toque

UI del banner:
- Posición: fixed en la parte superior de la pantalla,
  debajo del status bar, z-index alto
- Ancho: 90% del ancho de pantalla, centrado
- Fondo: color primario del theme con opacidad 0.95
- Ícono de campana a la izquierda
- Título en negrita + body debajo
- Border radius generoso
- Sombra pronunciada
- Animación de entrada/salida con Animated de React Native

No hacer:
- No instalar librerías de animación
- No hacer commits

Archivos esperados:
- src/features/notifications/components/NotificationBanner.tsx

---

### Tarea 3 — Integrar banner en App.tsx

En App.tsx:
1. Importar NotificationBanner
2. Renderizarlo en el nivel más alto del árbol,
   encima de todo el contenido pero dentro del SafeAreaProvider
3. Inicializar useRealtimeNotifications cuando el usuario
   está autenticado

El banner debe ser visible en cualquier pantalla de la app.

No hacer:
- No cambiar ninguna otra lógica de App.tsx
- No hacer commits

Archivos esperados:
- mobile/App.tsx (modificado)

---

### Tarea 4 — Badge en la campana

Contexto:
- La campana ya existe en MeetupHomeScreen.tsx
- Es un botón con ícono notifications-outline
- No tiene funcionalidad actualmente

Alcance:
En MeetupHomeScreen.tsx:
1. Usar useUnreadCount(userId) del hook existente
2. Mostrar un badge rojo con el número sobre la campana
   si unreadCount > 0
3. Si unreadCount > 9: mostrar "9+" en lugar del número
4. El badge debe estar posicionado en la esquina superior
   derecha del ícono de campana
5. El botón de campana por ahora no navega a ningún lado
   (la navegación al panel va en Tarea 5)

UI del badge:
- Círculo rojo pequeño (20dp) con número blanco
- Posicionado en la esquina superior derecha del ícono
- Usando position: absolute

No hacer:
- No implementar el panel todavía
- No hacer commits

Archivos esperados:
- src/features/meetups/screens/MeetupHomeScreen.tsx (modificado)

---

### Tarea 5 — Panel de notificaciones

Crear src/features/notifications/components/NotificationPanel.tsx

Props:
- visible: boolean
- onClose: () => void
- userId: string

Comportamiento:
- Modal o panel que aparece desde arriba al tocar la campana
- Muestra las últimas 10 notificaciones del usuario
- Si hay más de 10: botón "Ver más" que carga las siguientes 10
- Cada notificación muestra: ícono según type, título, body,
  tiempo relativo (ej: "hace 2 horas")
- Swipe hacia la izquierda en cada notificación:
  revela botón rojo "Eliminar" que llama a deleteNotification
- Botón "Marcar todas como leídas" en el header del panel
- Notificaciones no leídas tienen fondo ligeramente diferente
  (más claro o con indicador de punto)
- Al tocar una notificación: marcarla como leída

Íconos por tipo:
- joined: account-plus (MaterialCommunityIcons)
- transferred: crown (MaterialCommunityIcons)
- review_enabled: star (MaterialCommunityIcons)
- reminder: clock (MaterialCommunityIcons)

Tiempo relativo:
- Menos de 1 hora: "hace X minutos"
- Menos de 24 horas: "hace X horas"
- Más de 24 horas: fecha formateada "DD/MM"

Animación de apertura:
- El panel baja desde arriba con slide down
- Backdrop oscuro detrás con fade in
- Al cerrar: slide up + fade out

No hacer:
- No instalar librerías adicionales
- No hacer commits

Archivos esperados:
- src/features/notifications/components/NotificationPanel.tsx

---

### Tarea 6 — Conectar campana con panel

En MeetupHomeScreen.tsx:
1. Agregar estado local: panelVisible (boolean)
2. Al tocar la campana: setPanelVisible(true)
3. Renderizar NotificationPanel con visible={panelVisible}
   y onClose={() => setPanelVisible(false)}

No hacer:
- No cambiar el diseño del header
- No hacer commits

Archivos esperados:
- src/features/meetups/screens/MeetupHomeScreen.tsx (modificado)

---

### Tarea 7 — Toggle de notificaciones en perfil

Contexto:
- Existe una pantalla de perfil (buscar ProfileScreen o similar)
- Hay que agregar un toggle simple de notificaciones

Alcance:
1. Buscar dónde está la pantalla de perfil en el proyecto
2. Agregar una sección "Notificaciones" con un Switch de React Native
3. Estado del toggle: guardado en AsyncStorage con key
   'notifications_enabled'
4. Cuando se desactiva:
   - Actualizar profiles SET push_token = NULL en Supabase
   - Guardar false en AsyncStorage
5. Cuando se activa:
   - Llamar a notificationService.registerPushToken(userId)
   - Guardar true en AsyncStorage
6. Al abrir la pantalla: leer el estado desde AsyncStorage

No hacer:
- No cambiar el diseño existente del perfil
- No hacer commits

Archivos esperados:
- Pantalla de perfil existente (modificada)

---

### Tarea 8 — Documentar este prompt

Crear ia/entrega-2/prompts/bloque-5/04_frontend_notificaciones.md
con el contenido completo de este prompt.

Actualizar ia/entrega-2/indice_ia.md agregando:
[número siguiente] - useRealtimeNotifications + notificationStore Zustand
[número siguiente] - NotificationBanner: banner flotante animado
[número siguiente] - Badge de notificaciones en campana del home
[número siguiente] - NotificationPanel: panel con lista y swipe
[número siguiente] - Toggle de notificaciones en perfil

No hacer:
- No tocar archivos de código fuera de los indicados
- No hacer commits

Archivos esperados:
- ia/entrega-2/prompts/bloque-5/04_frontend_notificaciones.md
- ia/entrega-2/indice_ia.md (actualizado)

---

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- Seguir tokens de src/shared/constants/theme.ts
- No hacer commits
- Reportar archivos modificados y decisiones al finalizar cada tarea
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar
Resumen con:
1. Archivos creados y modificados
2. Decisiones tomadas
3. Cómo probarlo en dispositivo y en APK

### Respuesta

Explorando el código existente de notificaciones y las pantallas relacionadas antes de implementar.

---

Implementando las 8 tareas: creando store, hooks y componentes.

---

## Bloque 5c completado

### 1. Archivos creados
- `src/features/notifications/store/notificationStore.ts`
- `src/features/notifications/components/NotificationBanner.tsx`
- `src/features/notifications/components/NotificationPanel.tsx`
- `ia/entrega-2/prompts/bloque-5/04_frontend_notificaciones.md`

### 2. Archivos modificados
- `src/features/notifications/hooks/useNotifications.ts` — `useRealtimeNotifications`
- `src/features/notifications/services/notificationService.ts` — `clearPushToken()` (para el toggle del perfil)
- `mobile/App.tsx` — `SafeAreaProvider`, banner, bootstrap Realtime
- `src/features/meetups/screens/MeetupHomeScreen.tsx` — badge, panel, campana funcional
- `src/features/auth/screens/ProfileScreen.tsx` — toggle de notificaciones
- `ia/entrega-2/indice_ia.md` — entradas 55–59

---

### Decisiones tomadas

| Tarea | Decisión |
|-------|----------|
| **1** | Store Zustand con `pendingBanner`, `setPendingBanner`, `clearPendingBanner`. Realtime filtra `user_id=eq.{userId}` e invalida `['notifications', userId]`. |
| **2** | Banner 4 s con `Animated` + `PanResponder` (swipe up = descarte). Toque/swipe → `markAsRead` + `clearPendingBanner`. Auto-cierre → solo `clearPendingBanner`. |
| **3** | `AppNotificationsBootstrap` dentro de `QueryClientProvider`. Se agregó `SafeAreaProvider` (no existía en App). |
| **4–6** | Badge rojo 20dp con `9+` si `unreadCount > 9`. Panel modal desde arriba con paginación local de 10 en 10. |
| **5** | Swipe izquierda revela **Eliminar** (`deleteNotification`), no marcar como leída (según spec de Tarea 5). Toque en ítem → marcar como leída. |
| **7** | Preferencia en AsyncStorage `notifications_enabled`. Se agregó `clearPushToken()` al servicio para respetar la arquitectura (sin queries directas en pantalla). Default: `true` si no hay valor guardado. |

**TypeScript:** solo el error preexistente `@types/node`. Sin errores nuevos ni linter.

---

### 3. Cómo probar

**Expo Go / dispositivo con Metro:**
1. `npx expo start --clear`
2. Iniciá sesión como organizador en un dispositivo y como participante en otro (o unite a una juntada)
3. Verificá:
   - **Badge** en campana del home con count de no leídas
   - **Banner** flotante al llegar notificación (Realtime o push)
   - **Panel** al tocar campana: lista, “Marcar todas”, swipe → Eliminar, “Ver más”
   - **Perfil** → toggle Notificaciones push ON/OFF

**APK standalone:**
1. Nuevo build EAS con estos cambios
2. Probá push real + banner in-app
3. Desactivá toggle en perfil → `push_token` debe quedar `NULL` en Supabase

**Checklist rápido:**

| Acción | Resultado esperado |
|--------|-------------------|
| Alguien se une a tu juntada | Badge +1, banner 4 s (si Realtime activo) |
| Tocar banner | Desaparece y queda **leída** |
| Esperar 4 s sin tocar | Desaparece y queda **no leída** |
| Tocar campana | Panel con historial |
| Swipe izquierda en ítem | Botón Eliminar |
| Toggle OFF en perfil | `push_token = null` en DB |

---

### Pendiente de validación
- **Realtime:** la tabla `notifications` debe estar habilitada en la publicación `supabase_realtime` del dashboard de Supabase; si no, el banner no aparece en vivo (el badge sí se actualiza con refetch cada 60 s).
- **App.tsx** sigue registrando push token al login sin consultar `notifications_enabled`; si desactivás en perfil y reiniciás la app, podría volver a registrarse hasta integrar esa preferencia en el `onAuthStateChange`.

### Archivos modificados

- `mobile/src/features/notifications/store/notificationStore.ts` — modificado
- `mobile/src/features/notifications/hooks/useNotifications.ts` — modificado
- `mobile/src/features/notifications/components/NotificationBanner.tsx` — modificado
- `mobile/src/features/notifications/components/NotificationPanel.tsx` — modificado
- `mobile/src/features/notifications/services/notificationService.ts` — modificado
- `mobile/App.tsx` — modificado
- `mobile/src/features/meetups/screens/MeetupHomeScreen.tsx` — modificado
- `mobile/src/features/auth/screens/ProfileScreen.tsx` — modificado


<details>
<summary>Metadatos del intercambio</summary>

- **Transcript:** `e98c56a3-4383-4f72-83a2-f726d3acd3ac`
- **Índice:** 5

</details>

---

## Sesión 14 — Documentación cierre Bloque 5

### Prompt (archivo guardado: `prompts/bloque-5/05_documentar_bloque-5.md`)

# Documentación — Cierre del Bloque 5: Notificaciones

## Tarea
Organizá la evidencia del Bloque 5 dentro de `ia/entrega-2/`.

## 1. Completar ia/entrega-2/conversaciones/bloque-5/cursor-bloque-5-completo.md

# Conversación Bloque 5 — Notificaciones

**Herramienta:** Cursor Agent
**Rama:** feature/bloque-5-notificaciones

## Resumen

### Lo que se implementó
- EAS Build configurado: eas.json, android.package, versionCode 2,
  google-services.json con FCM V1, Service Account Key subida a EAS
- APK de preview generado y funcional como entrega de E2
- Migración 009_notifications.sql: push_token en profiles,
  enum notification_type, tabla notifications con RLS
- Edge Function send-push-notification deployada en Supabase:
  inserta notificación in-app y envía push via Expo Push API
- expo-notifications instalado con imports dinámicos para
  compatibilidad con Expo Go (guard isExpoGo)
- notificationService con 8 métodos: registerPushToken,
  sendNotification, getNotifications, markAsRead, markAllAsRead,
  deleteNotification, scheduleReminderNotification,
  cancelReminderNotification, clearPushToken
- useNotifications con TanStack Query v5 y useRealtimeNotifications
  con suscripción a Supabase Realtime
- notificationStore con Zustand para estado del banner
- NotificationBanner: banner flotante animado 4 segundos,
  PanResponder para swipe, auto-descarte vs descarte manual
- NotificationPanel: lista paginada de 10 en 10, swipe para
  eliminar, marcar todas como leídas, tiempo relativo
- Badge en campana del home con count de no leídas y 9+
- Toggle de notificaciones en ProfileScreen con AsyncStorage
- Realtime habilitado en tabla notifications desde Publications

### Decisiones tomadas
- imports dinámicos de expo-notifications para evitar crash
  en Expo Go (SDK 53+ removió push de Expo Go)
- FCM V1 con Service Account JSON en lugar de Legacy Server Key
  (Firebase deprecó la API heredada)
- Edge Function sin validación de JWT de usuario — solo apikey —
  para evitar problemas con el contexto asíncrono fire-and-forget
- Notificaciones in-app siempre se insertan aunque la push falle
- Auto-descarte del banner no marca como leída (queda pendiente
  en el badge); descarte manual sí marca como leída
- SafeAreaProvider agregado en App.tsx (no existía previamente)
- clearPushToken() en el servicio para respetar arquitectura
  al desactivar notificaciones desde el perfil

### Problemas encontrados y resueltos
- expo-notifications crasheaba en Expo Go al importarse —
  resuelto con imports dinámicos y guard isExpoGo
- supabaseUrl undefined en Edge Function —
  resuelto moviendo Deno.env.get() dentro del handler
- FCM Legacy API inhabilitada en Firebase —
  resuelto migrando a FCM V1 con Service Account JSON
- push_token no se guardaba — causado por Firebase no
  inicializado; resuelto agregando google-services.json al build
- Edge Function retornaba 401 con validación JWT —
  resuelto reemplazando auth por validación de apikey

### Deuda técnica documentada
- push token se re-registra al reiniciar app aunque
  notificaciones estén desactivadas en perfil
- Animaciones del panel y swipe pendientes de pulido
  (pase de animaciones general pendiente)
- error TS2688 @types/node preexistente sin resolver

## Conversación completa
[Pegar acá la conversación exportada de Cursor]

## 2. Verificá estructura de prompts

ia/entrega-2/prompts/bloque-5/
├── 01_eas_build_setup.md ✓
├── 02_backend_notificaciones.md ✓
├── 03_fix_expo_go_notifications.md ✓
├── 04_frontend_notificaciones.md ✓
└── 05_documentar_bloque-5.md ← este prompt

## 3. Actualizá ia/entrega-2/indice_ia.md

Verificar que todos los ítems del bloque 5 existen y agregar:
[número siguiente] - Documentación y cierre del Bloque 5

## Restricciones
- No tocar ningún archivo de código
- No hacer commits
- Solo crear o modificar archivos dentro de ia/entrega-2/

## Al finalizar reportá
1. Archivos creados o modificados
2. Cualquier inconsistencia encontrada

### Prompt (mensaje en chat)

# Documentación — Cierre del Bloque 5: Notificaciones

## Tarea
Organizá la evidencia del Bloque 5 dentro de `ia/entrega-2/`.

## 1. Completar ia/entrega-2/conversaciones/bloque-5/cursor-bloque-5-completo.md

# Conversación Bloque 5 — Notificaciones

**Herramienta:** Cursor Agent
**Rama:** feature/bloque-5-notificaciones

## Resumen

### Lo que se implementó
- EAS Build configurado: eas.json, android.package, versionCode 2,
  google-services.json con FCM V1, Service Account Key subida a EAS
- APK de preview generado y funcional como entrega de E2
- Migración 009_notifications.sql: push_token en profiles,
  enum notification_type, tabla notifications con RLS
- Edge Function send-push-notification deployada en Supabase:
  inserta notificación in-app y envía push via Expo Push API
- expo-notifications instalado con imports dinámicos para
  compatibilidad con Expo Go (guard isExpoGo)
- notificationService con 8 métodos: registerPushToken,
  sendNotification, getNotifications, markAsRead, markAllAsRead,
  deleteNotification, scheduleReminderNotification,
  cancelReminderNotification, clearPushToken
- useNotifications con TanStack Query v5 y useRealtimeNotifications
  con suscripción a Supabase Realtime
- notificationStore con Zustand para estado del banner
- NotificationBanner: banner flotante animado 4 segundos,
  PanResponder para swipe, auto-descarte vs descarte manual
- NotificationPanel: lista paginada de 10 en 10, swipe para
  eliminar, marcar todas como leídas, tiempo relativo
- Badge en campana del home con count de no leídas y 9+
- Toggle de notificaciones en ProfileScreen con AsyncStorage
- Realtime habilitado en tabla notifications desde Publications

### Decisiones tomadas
- imports dinámicos de expo-notifications para evitar crash
  en Expo Go (SDK 53+ removió push de Expo Go)
- FCM V1 con Service Account JSON en lugar de Legacy Server Key
  (Firebase deprecó la API heredada)
- Edge Function sin validación de JWT de usuario — solo apikey —
  para evitar problemas con el contexto asíncrono fire-and-forget
- Notificaciones in-app siempre se insertan aunque la push falle
- Auto-descarte del banner no marca como leída (queda pendiente
  en el badge); descarte manual sí marca como leída
- SafeAreaProvider agregado en App.tsx (no existía previamente)
- clearPushToken() en el servicio para respetar arquitectura
  al desactivar notificaciones desde el perfil

### Problemas encontrados y resueltos
- expo-notifications crasheaba en Expo Go al importarse —
  resuelto con imports dinámicos y guard isExpoGo
- supabaseUrl undefined en Edge Function —
  resuelto moviendo Deno.env.get() dentro del handler
- FCM Legacy API inhabilitada en Firebase —
  resuelto migrando a FCM V1 con Service Account JSON
- push_token no se guardaba — causado por Firebase no
  inicializado; resuelto agregando google-services.json al build
- Edge Function retornaba 401 con validación JWT —
  resuelto reemplazando auth por validación de apikey

### Deuda técnica documentada
- push token se re-registra al reiniciar app aunque
  notificaciones estén desactivadas en perfil
- Animaciones del panel y swipe pendientes de pulido
  (pase de animaciones general pendiente)
- error TS2688 @types/node preexistente sin resolver

## Conversación completa
[Pegar acá la conversación exportada de Cursor]

## 2. Verificá estructura de prompts

ia/entrega-2/prompts/bloque-5/
├── 01_eas_build_setup.md ✓
├── 02_backend_notificaciones.md ✓
├── 03_fix_expo_go_notifications.md ✓
├── 04_frontend_notificaciones.md ✓
└── 05_documentar_bloque-5.md ← este prompt

## 3. Actualizá ia/entrega-2/indice_ia.md

Verificar que todos los ítems del bloque 5 existen y agregar:
[número siguiente] - Documentación y cierre del Bloque 5

## Restricciones
- No tocar ningún archivo de código
- No hacer commits
- Solo crear o modificar archivos dentro de ia/entrega-2/

## Al finalizar reportá
1. Archivos creados o modificados
2. Cualquier inconsistencia encontrada

### Respuesta

Revisando la estructura existente en `ia/entrega-2/` y creando la documentación de cierre del Bloque 5.

---

Creando la documentación de cierre y actualizando el índice con enlaces a la conversación del bloque 5.

---

## Reporte — Cierre Bloque 5

### 1. Archivos creados o modificados

| Archivo | Acción |
|---------|--------|
| `ia/entrega-2/conversaciones/bloque-5/cursor-bloque-5-completo.md` | **Creado** — resumen + 8 sesiones cronológicas |
| `ia/entrega-2/prompts/bloque-5/05_documentar_bloque-5.md` | **Creado** — este prompt de cierre |
| `ia/entrega-2/indice_ia.md` | **Modificado** — entrada **60** + links a conversación en ítems 48–60 |

### 2. Estructura de prompts verificada

```
ia/entrega-2/prompts/bloque-5/
├── 01_eas_build_setup.md ✓
├── 02_backend_notificaciones.md ✓
├── 03_fix_expo_go_notifications.md ✓
├── 04_frontend_notificaciones.md ✓
└── 05_documentar_bloque-5.md ✓
```

### 3. Inconsistencias encontradas

1. **Conteo de métodos:** el template dice "8 métodos" pero enumera 9 (`clearPushToken` incluido). En el archivo de conversación se aclaró la lista y se mencionaron además `saveReminderIdForMeetup` y `cancelReminderForMeetup`.

2. **Conversación raw:** no había export de Cursor pegado; se siguió el patrón de Bloque 4 con resumen cronológico por sesiones y nota para obtener el historial raw desde la rama `feature/bloque-5-notificaciones`.

3. **Índice Bloque 5:** los ítems 48–59 existían pero **no tenían link a conversaciones** (a diferencia de Bloques 3 y 4). Se corrigió al cerrar el bloque, agregando `conversaciones/bloque-5/cursor-bloque-5-completo.md` en todos.

4. **Prompts sin conversación dedicada:** los fixes de imports dinámicos y los diagnósticos (push_token, Edge Function) no tienen prompt propio; quedaron documentados solo en la conversación consolidada (sesiones 4–6).

5. **Modelo de negocio vs implementación:** el encabezado del Bloque 5c mencionaba swipe para "descartar = marcar leída", pero la Tarea 5 implementó swipe para **Eliminar** (`deleteNotification`). La conversación refleja lo implementado.

<details>
<summary>Metadatos del intercambio</summary>

- **Transcript:** `e98c56a3-4383-4f72-83a2-f726d3acd3ac`
- **Índice:** 6

</details>

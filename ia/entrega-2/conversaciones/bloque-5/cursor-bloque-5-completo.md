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
- notificationService con métodos: registerPushToken,
  sendNotification, getNotifications, markAsRead, markAllAsRead,
  deleteNotification, scheduleReminderNotification,
  cancelReminderNotification, clearPushToken
  (más helpers saveReminderIdForMeetup y cancelReminderForMeetup)
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

> Nota: resumen cronológico de las sesiones de Cursor Agent en este bloque.
> Para el export raw completo, usar el historial de chat de Cursor en la rama
> feature/bloque-5-notificaciones.

### Sesión 1 — Bloque 5a: EAS Build setup

- Configuración de eas.json con perfil preview (APK)
- android.package, versionCode 2, plugin expo-notifications
- google-services.json y FCM V1 con Service Account Key en EAS
- APK de preview generado como entrega de E2

### Sesión 2 — Bloque 5b: Backend de notificaciones

- Migración 009_notifications.sql (push_token, enum, tabla, RLS)
- Edge Function send-push-notification (insert in-app + Expo Push API)
- notificationService base y useNotifications con TanStack Query
- Registro de push token en App.tsx e integración en meetupService
  (joined, transferred, review_enabled, reminder)

### Sesión 3 — Fix Expo Go (guard isExpoGo)

- Guard Constants.appOwnership === 'expo' en registerPushToken,
  scheduleReminderNotification y setNotificationHandler
- Documentado en prompts/bloque-5/03_fix_expo_go_notifications.md

### Sesión 4 — Fix Expo Go (imports dinámicos)

- Eliminados imports estáticos de expo-notifications y expo-device
- Import dinámico condicionado al guard isExpoGo en servicio y App.tsx
- Resuelve crash al cargar el módulo antes de ejecutar guards

### Sesión 5 — Diagnóstico push_token

- Logs detallados en registerPushToken para depurar UPDATE a profiles
- Confirmado que el problema era Firebase/FCM no inicializado en build

### Sesión 6 — Diagnóstico Edge Function (solo lectura)

- Relevamiento de joinMeetup → sendNotification → functions.invoke
- Documentado flujo de organizerId (meetup.created_by) y auth automática

### Sesión 7 — Bloque 5c: Frontend de notificaciones

- useRealtimeNotifications + notificationStore (Zustand)
- NotificationBanner animado (4 s, PanResponder, markAsRead manual)
- NotificationPanel (paginación 10, swipe eliminar, marcar todas)
- Badge en campana del home (9+)
- Toggle en ProfileScreen con AsyncStorage notifications_enabled
- SafeAreaProvider y AppNotificationsBootstrap en App.tsx

### Sesión 8 — Documentación cierre Bloque 5

- Este archivo + prompt 05_documentar_bloque-5.md + actualización de índice

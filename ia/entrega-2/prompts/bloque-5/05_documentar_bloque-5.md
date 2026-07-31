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

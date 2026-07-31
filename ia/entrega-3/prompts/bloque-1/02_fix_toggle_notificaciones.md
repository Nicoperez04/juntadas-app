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

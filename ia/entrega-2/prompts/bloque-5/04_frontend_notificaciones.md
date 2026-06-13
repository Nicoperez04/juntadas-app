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

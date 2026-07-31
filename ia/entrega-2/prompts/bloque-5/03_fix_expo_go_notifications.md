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

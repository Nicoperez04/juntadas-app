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

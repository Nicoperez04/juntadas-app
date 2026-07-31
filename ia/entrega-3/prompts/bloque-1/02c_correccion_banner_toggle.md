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

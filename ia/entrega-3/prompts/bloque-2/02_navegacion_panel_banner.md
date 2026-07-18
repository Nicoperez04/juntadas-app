# Prompt 02 — Bloque 2: Navegación desde panel y banner

## Contexto
Rama actual: feature/bloque-2-notificaciones
Hoy tocar una notificación en el panel solo la marca
como leída pero no navega. Tocar el banner solo lo
descarta. Hay que agregar navegación a MeetupDetail
en ambos componentes.

Situación técnica:
- NotificationPanel: está dentro del NavigationContainer
  (montado desde MeetupHomeScreen). Puede usar
  useNavigation directamente.
- NotificationBanner: está en App.tsx como hermano
  de AppNavigator, FUERA del NavigationContainer.
  Necesita un navigationRef exportable.
- El navigationRef existente en AppNavigator.tsx está
  tipado con AuthStackParamList (no MainStackParamList)
  y no está exportado — no se puede reutilizar.

Regla de negocio para ambos:
- Si la notificación tiene meetupId → marcar como leída
  + navegar a MeetupDetail
- Si meetupId es null/undefined → solo marcar como
  leída / descartar sin navegar

Stack relevante:
- React Native + Expo SDK 55 + TypeScript
- React Navigation 7
- MainStackParamList en mobile/src/navigation/types.ts
- Routes.MeetupDetail = 'MeetupDetail'
- Sin TypeScript any, comentarios en español

## Tarea 1 — Análisis previo
Sin tocar ningún archivo, reportá:

1. En NotificationPanel.tsx, función
   handlePressNotification (líneas 257-264):
   a. Pegá el código completo con número de líneas
   b. ¿Hay algún onClose disponible en las props
      para cerrar el panel antes de navegar?

2. En NotificationBanner.tsx:
   a. ¿Qué hace hideBanner(true) exactamente?
      ¿Marca como leída y anima la salida?
   b. ¿El componente tiene acceso al objeto
      notification completo con meetupId?
   c. Pegá el bloque del Pressable con onPress
      con número de líneas

3. En App.tsx:
   a. ¿En qué línea exacta está NotificationBanner?
   b. ¿En qué línea exacta está AppNavigator?
   c. ¿Hay algún NavigationContainer visible en
      App.tsx o está dentro de AppNavigator?

No tocar ningún archivo, solo reportar.

## Tarea 2 — Crear navigationService.ts
Crear el archivo:
mobile/src/navigation/navigationService.ts

Contenido:
```typescript
import { createNavigationContainerRef } from '@react-navigation/native';
import type { MainStackParamList } from './types';

/**
 * Ref global de navegación para componentes fuera del NavigationContainer.
 * Tipado con MainStackParamList para acceder a todas las rutas principales.
 * Se usa principalmente desde NotificationBanner.
 */
export const mainNavigationRef =
  createNavigationContainerRef<MainStackParamList>();
```

No hacer commits.
Archivos esperados:
- mobile/src/navigation/navigationService.ts

## Tarea 3 — Conectar navigationRef en AppNavigator
En AppNavigator.tsx:

1. Importar mainNavigationRef desde navigationService.ts
2. En el NavigationContainer que contiene MainNavigator,
   agregar el prop ref={mainNavigationRef}
   (además del ref existente si lo tiene, o reemplazando
   el de AuthStackParamList si es el mismo container)

IMPORTANTE: verificar si hay un NavigationContainer
para el flujo de Auth y otro para el Main, o si es
uno solo. Si son dos containers separados, el ref
debe ir en el que contiene MainNavigator.

No modificar ninguna otra lógica de AppNavigator.
No hacer commits.
Archivos esperados:
- mobile/src/navigation/AppNavigator.tsx

## Tarea 4 — Navegación en NotificationPanel
En NotificationPanel.tsx:

1. Importar useNavigation y NavigationProp de
   @react-navigation/native
2. Importar MainStackParamList desde navigation/types
3. Importar Routes desde navigation/routes
4. Dentro del componente, agregar:
   const navigation = useNavigation<NavigationProp<MainStackParamList>>();

5. Modificar handlePressNotification:
   - Si notification.meetupId existe:
     * Marcar como leída (lógica existente)
     * Llamar onClose() para cerrar el panel
     * Navegar: navigation.navigate(Routes.MeetupDetail,
       { meetupId: notification.meetupId })
   - Si notification.meetupId es null/undefined:
     * Solo marcar como leída (comportamiento actual)
     * No navegar ni cerrar el panel

No modificar ninguna otra lógica del componente.
No hacer commits.
Archivos esperados:
- mobile/src/features/notifications/components/NotificationPanel.tsx

## Tarea 5 — Navegación en NotificationBanner
En NotificationBanner.tsx:

1. Importar mainNavigationRef desde
   navigation/navigationService
2. Importar Routes desde navigation/routes

3. Modificar el onPress del Pressable principal:
   - Si pendingBanner?.meetupId existe:
     * Llamar hideBanner(true) para descartar
       el banner y marcar como leída
     * Si mainNavigationRef.isReady():
       mainNavigationRef.navigate(
         Routes.MeetupDetail,
         { meetupId: pendingBanner.meetupId }
       )
   - Si meetupId es null/undefined:
     * Solo llamar hideBanner(true) como antes

No modificar el comportamiento de swipe ni
el auto-cierre de 4 segundos.
No hacer commits.
Archivos esperados:
- mobile/src/features/notifications/components/NotificationBanner.tsx

## Tarea 6 — Mover NotificationBanner en App.tsx
En App.tsx:

1. Mover <NotificationBanner /> para que quede
   DENTRO del árbol que contiene AppNavigator,
   específicamente después de AppNavigator pero
   dentro del mismo contenedor padre que tenga
   acceso al NavigationContainer

   El orden correcto dentro del QueryClientProvider:
   <AppNotificationsBootstrap />
   <AppNavigator />
   <NotificationBanner />

   Esto garantiza que cuando el banner se renderiza,
   el NavigationContainer ya está montado y
   mainNavigationRef.isReady() devuelve true.

2. No cambiar ningún otro orden ni lógica de App.tsx.

No hacer commits.
Archivos esperados:
- mobile/App.tsx

## Tarea 7 — Documentar este prompt
Crear el archivo:
ia/entrega-3/prompts/bloque-2/02_navegacion_panel_banner.md
con el contenido completo de este prompt.
Actualizar ia/entrega-3/indice_ia.md agregando:
02 - Navegación desde panel y banner a MeetupDetail

No hacer commits.

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- No hacer commits
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar reportar
1. Archivos creados o modificados
2. Decisiones tomadas, especialmente:
   - Cómo quedó el ref en AppNavigator
     (si había un solo container o dos)
   - Cómo quedó el onPress del banner exactamente
3. Cómo probarlo en Expo Go:
   - Panel: tocar notificación con meetupId →
     panel se cierra y navega a MeetupDetail
   - Panel: tocar notificación sin meetupId →
     solo se marca como leída, sin navegar
   - Banner: tocar banner con meetupId →
     banner desaparece y navega a MeetupDetail
   - Banner: banner sin meetupId → solo descarta

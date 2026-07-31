> **Nota de recuperación:** Este archivo fue reconstruido desde el transcript
> `44a62921-3ad2-4c27-88f0-5eb142f1d040`. El mensaje original en Cursor quedó
> truncado antes del cierre de la Tarea 6. Las secciones finales (cierre de
> Tarea 6, Tarea 7, reglas generales y reporte final) se completaron según el
> patrón de los demás prompts del bloque y la respuesta del agente en la misma
> sesión.

# Prompt 05 — Bloque 1: Auto-refresh Realtime, pull-to-refresh y skeleton

## Contexto
Rama actual: feature/bloque-1-deuda-tecnica
Tres mejoras relacionadas que se implementan juntas:

1. Auto-refresh por Realtime: el callback de
   useRealtimeNotifications solo invalida
   ['notifications', userId]. Las pantallas de Home y
   Detalle no se actualizan cuando llegan notificaciones.
   Hay que invalidar queries adicionales según el tipo
   de notificación recibida.

2. Pull-to-refresh: MeetupHomeScreen y MeetupDetailScreen
   usan ScrollView sin RefreshControl. El usuario no puede
   forzar una recarga manual con gesto de deslizar.

3. Skeleton: durante isPageLoading, Home muestra
   ActivityIndicator + texto. Hay que reemplazarlo por
   3 MeetupCardSkeleton con shimmer usando
   expo-linear-gradient (ya instalado).

Stack relevante:
- React Native + Expo SDK 55 + TypeScript
- expo-linear-gradient (ya instalado)
- TanStack Query v5 con queryClient.invalidateQueries
- Zustand para notificationStore
- theme.ts para todos los tokens de color y spacing
- Sin TypeScript any, comentarios en español

Query keys confirmadas:
- Home: ['meetups', userId], ['notifications', userId],
  ['pendingReviews', userId]
- Detalle: ['meetup', meetupId], ['participants', meetupId],
  ['userParticipation', meetupId, currentUserId],
  ['reviews', meetupId], ['userReview', meetupId, userId]

Tipos de notificación del servidor que pasan por Realtime:
- joined: alguien se unió a la juntada del organizador
- transferred: te transfirieron el rol de organizador
- review_enabled: se habilitaron reseñas al finalizar
- (reminder es local, no pasa por Realtime)

Mapa de invalidaciones acordado:
- joined → ['meetup', meetupId] + ['participants', meetupId]
  + ['meetups', userId]
- transferred → ['meetup', meetupId] +
  ['participants', meetupId] + ['meetups', userId]
- review_enabled → ['meetup', meetupId] + ['meetups', userId]

Estructura visual de MeetupCard (para replicar en skeleton):
- Fila superior: thumbnail 60×60 (opcional) + cardBody
- cardBody: título (línea larga) + badge rol (línea corta)
  + fila fecha (línea media) + fila ubicación (línea media)
- Footer: avatares apilados (3 círculos) + texto confirmados
- Fondo: theme.colors.surface, borderRadius: theme.radius.lg
- Separador footer: theme.colors.border

## Tarea 1 — Análisis previo
Sin tocar ningún archivo, reportá:

1. En useNotifications.ts:
   a. ¿El objeto notification que llega en el callback
      tiene el campo type disponible después de
      mapNotificationRow? ¿Qué tipo TypeScript tiene?
   b. ¿meetupId puede ser null en algunos tipos de
      notificación? ¿Hay que guardarlo antes de
      invalidar queries con él?
   c. ¿queryClient está disponible en el scope del
      callback? ¿Cómo se obtiene?

2. En MeetupHomeScreen.tsx:
   a. ¿Cómo se llama la función de refresh de
      ['meetups', userId]? ¿Es refetch(), refresh()
      o invalidateQueries()?
   b. El ScrollView principal, ¿tiene algún prop
      contentContainerStyle u otros props que haya
      que mantener al agregar RefreshControl?
   c. ¿userId está disponible en el scope del
      componente principal o solo dentro de hooks?

3. En MeetupDetailScreen.tsx:
   a. ¿Cómo se obtiene meetupId en el componente?
      ¿Viene de route.params?
   b. ¿El ScrollView principal tiene props existentes
      que haya que mantener?
   c. ¿Hay una función de reload o refetch disponible
      para las queries del detalle?

4. ¿expo-linear-gradient está importable como
   import { LinearGradient } from 'expo-linear-gradient'?
   Verificar en package.json que la instalación fue exitosa.

No tocar ningún archivo, solo reportar.

## Tarea 2 — Auto-refresh en useRealtimeNotifications
En useNotifications.ts, dentro del callback de Realtime
(líneas 185-191):

Después de la línea existente:
void queryClient.invalidateQueries({
  queryKey: ['notifications', userId]
});

Agregar invalidaciones según el tipo de notificación:

1. Si notification.type === 'joined' y notification.meetupId:
   - Invalidar ['meetup', notification.meetupId]
   - Invalidar ['participants', notification.meetupId]
   - Invalidar ['meetups', userId]

2. Si notification.type === 'transferred' y
   notification.meetupId:
   - Invalidar ['meetup', notification.meetupId]
   - Invalidar ['participants', notification.meetupId]
   - Invalidar ['meetups', userId]

3. Si notification.type === 'review_enabled' y
   notification.meetupId:
   - Invalidar ['meetup', notification.meetupId]
   - Invalidar ['meetups', userId]

Usar un switch o if/else según lo que quede más limpio.
No modificar ninguna otra lógica del hook.
No hacer commits.
Archivos esperados:
- mobile/src/features/notifications/hooks/useNotifications.ts

## Tarea 3 — Pull-to-refresh en MeetupHomeScreen
En MeetupHomeScreen.tsx:

1. Importar RefreshControl de 'react-native'
2. Agregar estado local:
   const [isRefreshing, setIsRefreshing] = useState(false)
3. Crear función handleRefresh:
   - setIsRefreshing(true)
   - Invalidar ['meetups', userId] y
     ['pendingReviews', userId] con queryClient
   - await de ambas invalidaciones
   - setIsRefreshing(false) en finally
4. Agregar RefreshControl al ScrollView principal:
   refreshControl={
     <RefreshControl
       refreshing={isRefreshing}
       onRefresh={handleRefresh}
       tintColor={theme.colors.primary}
       colors={[theme.colors.primary]}
     />
   }
5. Mantener todos los props existentes del ScrollView
   sin cambios

No modificar ninguna otra lógica de la pantalla.
No hacer commits.
Archivos esperados:
- mobile/src/features/notifications/MeetupHomeScreen.tsx
  (verificar ruta exacta con Tarea 1)

## Tarea 4 — Pull-to-refresh en MeetupDetailScreen
En MeetupDetailScreen.tsx, mismo patrón que Tarea 3:

1. Importar RefreshControl de 'react-native'
2. Agregar estado local isRefreshing
3. Crear función handleRefresh:
   - setIsRefreshing(true)
   - Invalidar ['meetup', meetupId],
     ['participants', meetupId],
     ['userParticipation', meetupId, currentUserId]
   - await de todas las invalidaciones
   - setIsRefreshing(false) en finally
4. Agregar RefreshControl al ScrollView principal
   con tintColor={theme.colors.primary}
5. Mantener todos los props existentes del ScrollView

No modificar ninguna otra lógica de la pantalla.
No hacer commits.
Archivos esperados:
- mobile/src/features/meetups/screens/MeetupDetailScreen.tsx
  (verificar ruta exacta con Tarea 1)

## Tarea 5 — Componente MeetupCardSkeleton con shimmer
Crear el archivo:
mobile/src/features/meetups/components/MeetupCardSkeleton.tsx

El componente debe:

1. Replicar exactamente la estructura visual de MeetupCard:
   - Contenedor con mismo fondo (theme.colors.surface),
     borderRadius (theme.radius.lg) y sombra
     (theme.shadows.md) que la card real
   - Fila superior: bloque 60×60 redondeado (thumbnail)
     + columna con:
     * Línea larga ~60% ancho (título)
     * Línea corta ~25% ancho alineada a la derecha (badge)
     * Línea media ~70% ancho (fecha)
     * Línea media ~50% ancho (ubicación)
   - Separador horizontal (theme.colors.border)
   - Footer: 3 círculos apilados (avatares) + línea
     corta a la derecha (confirmados)

2. Efecto shimmer con expo-linear-gradient:
   - Animated.Value de 0 a 1 en loop con
     Animated.timing, duración 1200ms, easing lineal
   - LinearGradient horizontal con colores:
     ['#E8E8F0', '#F5F5FF', '#E8E8F0']
   - El gradiente se desplaza de izquierda a derecha
     usando interpolate sobre la Animated.Value
     para translateX desde -width hasta +width
   - Aplicar el shimmer sobre cada placeholder usando
     overflow: 'hidden' + posición absoluta del gradiente

3. El componente no recibe props (es siempre igual)

4. Usar solo tokens de theme.ts para spacing, radius
   y colores base. Los colores del shimmer
   (#E8E8F0, #F5F5FF) son fijos porque no están
   en theme.ts — documentarlo con comentario en español

No hacer commits.
Archivos esperados:
- mobile/src/features/meetups/components/MeetupCardSkeleton.tsx

## Tarea 6 — Reemplazar ActivityIndicator en Home
En MeetupHomeScreen.tsx:

1. Importar MeetupCardSkeleton desde su ruta
2. Reemplazar el bloque isPageLoading que hoy muestra
   ActivityIndicator + texto por 3 instancias de
   MeetupCardSkeleton apiladas verticalmente con el
   mismo espaciado que las cards reales:
   {isPageLoading ? (
     <View style={styles.loadingContainer}>
       <MeetupCardSkeleton />
       <MeetupCardSkeleton />
       <MeetupCardSkeleton />
     </View>
   ) : (
     ... contenido real ...
   )}
3. Mantener el estilo loadingContainer existente o
   ajustarlo si el espaciado no queda bien con las
   cards skeleton

No eliminar el ActivityIndicator de MeetupDetailScreen
(eso va al Bloque 8).

No modificar ninguna otra lógica de la pantalla.
No hacer commits.
Archivos esperados:
- mobile/src/features/meetups/screens/MeetupHomeScreen.tsx

## Tarea 7 — Documentar este prompt
Crear el archivo:
ia/entrega-3/prompts/bloque-1/05_autorefresh_pulltorefresh_skeleton.md
con el contenido completo de este prompt.
Actualizar ia/entrega-3/indice_ia.md agregando:
05 - Auto-refresh Realtime por tipo de notificación,
     pull-to-refresh en Home y Detalle, skeleton con shimmer

No hacer commits.

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- No hacer commits
- Si algo es ambiguo, preguntar antes de asumir
- No modificar archivos fuera de los listados en cada tarea

## Al finalizar reportar
1. Archivos modificados/creados
2. Decisiones tomadas (especialmente invalidaciones Realtime
   y estructura del skeleton)
3. Cómo probarlo en Expo Go:
   - Auto-refresh: generar notificación joined/transferred
     y verificar que Home y Detalle se actualizan sin navegar
   - Pull-to-refresh: deslizar hacia abajo en Home y Detalle
   - Skeleton: verificar shimmer en carga inicial de Home
   - Confirmar que MeetupDetailScreen mantiene ActivityIndicator
     en carga inicial (sin skeleton en este bloque)

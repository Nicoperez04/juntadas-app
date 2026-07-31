# Conversación Bloque 2 — Notificaciones mejoradas

**Herramienta:** Cursor Agent
**Rama:** feature/bloque-2-notificaciones

## Resumen

### Lo que se implementó
- Prompt 01: Nuevos tipos de notificación (cancelled,
  finished, left) — extensión del enum en DB (migración
  012), Edge Function y cliente móvil. Triggers en
  cancelMeetup, finishMeetup y leaveMeetup.
- Prompt 01b: Fix RLS notificaciones — función RPC
  get_meetup_participant_ids con SECURITY DEFINER
  (migración 013) para saltear RLS al obtener
  destinatarios desde el cliente móvil.
- Prompt 02: Navegación desde panel y banner —
  navigationService.ts con mainNavigationRef exportable,
  useNavigation en NotificationPanel, navegación
  imperativa en NotificationBanner, reordenamiento
  de NotificationBanner en App.tsx dentro del árbol
  del NavigationContainer.

### Decisiones tomadas
- Nuevos tipos via RPC con SECURITY DEFINER en vez
  de supabaseAdmin en el cliente — el cliente móvil
  no tiene service_role; la RPC corre con permisos
  elevados en el servidor
- navigationRef separado (navigationService.ts) en
  vez de reutilizar el de AppNavigator — el existente
  estaba tipado con AuthStackParamList y no exportado
- Un solo NavigationContainer en AppNavigator que
  alterna entre MainNavigator y AuthNavigator — el
  mainNavigationRef se conecta a ese container;
  el cast a AuthStackParamList se mantiene solo en
  flushPendingNavigation para el deep link de recovery
- Banner siempre descarta con hideBanner(true) antes
  de navegar — evita que el banner quede visible
  mientras se navega
- Panel cierra con onClose() antes de navegar —
  evita que el modal quede abierto encima del detalle
- Notificaciones de grupos, juegos y estadísticas
  anotadas como deuda para sus bloques correspondientes

### Problemas encontrados y resueltos
- Nuevos tipos no se insertaban en DB (Prompt 01):
  la RLS de meetup_participants bloqueaba la query
  de destinatarios desde el cliente normal —
  resuelto con función RPC SECURITY DEFINER
- navigationRef existente no exportable ni compatible
  con MainStackParamList — resuelto creando
  navigationService.ts con ref propio

### Deuda técnica pendiente
- Notificaciones de Grupos (Bloque 4):
  agregado a grupo, alguien se fue, grupo disuelto,
  nueva juntada del grupo
- Notificaciones de Juegos (Bloque 5):
  invitación a Liga/Torneo, resultados de fecha
- Notificaciones de Estadísticas (Bloque 6):
  hitos alcanzados (a evaluar al llegar al bloque)

## Conversación completa

Este documento incluye **prompts y respuestas finales** extraídas de los agent transcripts de Cursor (JSONL local) y de los archivos en `prompts/bloque-2/`. No incluye tool calls ni razonamiento intermedio.

**Transcripts fuente:**
- `ab150f15-a89f-4e5b-b525-28ac26100ed5` — Diagnósticos previos, Prompt 01 (implementación), Prompt 01b, diagnósticos RPC/logs
- `798ceebf-0d4c-4dc4-8018-4ef72e5fc054` — Diagnóstico navegación, Prompt 02, Prompt 03

---

## Prompts y respuestas

### 01_nuevos_tipos_notificacion.md

# Prompt 01 — Bloque 2: Nuevos tipos de notificación

## Contexto
Rama actual: feature/bloque-2-notificaciones
Hoy existen 4 tipos de notificación (joined, transferred,
review_enabled, reminder). Hay tres acciones críticas que
ocurren en la app sin generar notificación:

- cancelMeetup: la juntada se cancela pero los participantes
  no reciben aviso
- finishMeetup: la juntada se finaliza pero los participantes
  no reciben aviso (solo reciben review_enabled si está
  habilitado, que es distinto)
- leaveMeetup: alguien abandona la juntada pero el organizador
  no recibe aviso

Nuevos tipos a agregar:
- cancelled → a todos los participantes activos excepto el
  organizador cuando se cancela la juntada
- finished → a todos los participantes activos excepto el
  organizador cuando se finaliza la juntada
- left → al organizador cuando alguien abandona su juntada

Patrón de envío existente (referencia de finishMeetup):
- Query a meetup_participants con left_at IS NULL y
  neq(user_id, organizador)
- Promise.allSettled con sendNotification por cada participante
- Fire-and-forget envuelto en void (async () => {})()
- Si falla el envío de notificaciones, no afecta el resultado
  de la operación principal

Stack relevante:
- React Native + Expo SDK 55 + TypeScript
- Supabase Edge Function send-push-notification
- notificationService.sendNotification como único punto
  de envío
- Sin TypeScript any, comentarios en español

## Tarea 1 — Análisis previo
Sin tocar ningún archivo, reportá:

1. En supabase/functions/send-push-notification/index.ts:
   a. ¿En qué línea exacta está la lista de tipos
      permitidos que hay que extender?
   b. ¿Cómo está definida esa lista? ¿Es un array,
      un Set, un objeto?

2. En mobile/src/features/notifications/types.ts:
   a. ¿El enum NotificationType se exporta e importa
      en meetupService.ts y participantService.ts?
   b. ¿Hay algún otro archivo que importe
      NotificationType que pueda verse afectado
      por agregar valores nuevos?

3. En meetupService.ts, función cancelMeetup
   (líneas 620-668):
   a. ¿En qué punto exacto del flujo conviene
      agregar el bloque de notificaciones?
      ¿Antes o después del return de éxito?
   b. ¿El objeto meetup (MeetupRow) tiene title
      disponible antes del UPDATE?

4. En participantService.ts, función leaveMeetup
   (líneas 345-383):
   a. ¿En qué punto exacto conviene agregar la
      query a meetups para obtener created_by
      y title?
   b. ¿participantService.ts importa ya
      notificationService o hay que agregarlo?
   c. ¿participantService.ts importa NotificationType?

No tocar ningún archivo, solo reportar.

## Tarea 2 — Extender Edge Function
En supabase/functions/send-push-notification/index.ts:

1. Agregar los tres nuevos tipos a la lista de
   tipos permitidos:
   - 'cancelled'
   - 'finished'
   - 'left'

2. No modificar ninguna otra lógica de la función.
   Los nuevos tipos no necesitan tratamiento especial —
   se insertan en notifications y se envía push
   exactamente igual que los tipos existentes.

No hacer commits.
Archivos esperados:
- supabase/functions/send-push-notification/index.ts

## Tarea 3 — Extender NotificationType en cliente móvil
En mobile/src/features/notifications/types.ts:

Agregar al enum NotificationType:
/** La juntada fue cancelada — todos los participantes */
Cancelled = 'cancelled',
/** La juntada fue finalizada — todos los participantes */
Finished = 'finished',
/** Alguien abandonó tu juntada — el organizador lo recibe */
Left = 'left',

Mantener los valores existentes sin cambios.
No hacer commits.
Archivos esperados:
- mobile/src/features/notifications/types.ts

## Tarea 4 — Notificación en cancelMeetup
En meetupService.ts, función cancelMeetup:

Después del UPDATE exitoso (después de verificar
que updateError es null y antes del return de éxito),
agregar bloque fire-and-forget siguiendo el mismo
patrón que finishMeetup:

1. Query a meetup_participants:
   - meetup_id = meetupId
   - left_at IS NULL
   - user_id != userId (excluir al organizador)
   - SELECT solo user_id

2. Usar mapMeetupRow(meetup as MeetupRow) para
   obtener el título de la juntada

3. Promise.allSettled con sendNotification por
   cada participante:
   - recipientUserId: p.user_id
   - type: NotificationType.Cancelled
   - title: 'Juntada cancelada 😔'
   - body: `${mappedMeetup.title} fue cancelada`
   - meetupId: mappedMeetup.id

4. Envolver en void (async () => {})() igual que
   finishMeetup — si falla no afecta el return

No modificar ninguna otra lógica de cancelMeetup.
No hacer commits.
Archivos esperados:
- mobile/src/features/meetups/services/meetupService.ts

## Tarea 5 — Notificación en finishMeetup
En meetupService.ts, función finishMeetup:

El bloque de notificaciones de review_enabled ya
existe y funciona. Hay que agregar la notificación
finished de forma independiente:

1. Agregar un segundo bloque fire-and-forget
   SEPARADO del de review_enabled, que se ejecute
   SIEMPRE (no condicionado a reviewsEnabled):

   - Misma query de participantes activos
     (left_at IS NULL, neq userId)
   - Promise.allSettled con sendNotification:
     * recipientUserId: p.user_id
     * type: NotificationType.Finished
     * title: '¡Juntada finalizada! 🎊'
     * body: `${mappedMeetup.title} ha finalizado`
     * meetupId: mappedMeetup.id

2. Si reviewsEnabled también es true, ambos bloques
   se ejecutan: uno para finished y otro para
   review_enabled. Son notificaciones distintas
   con propósitos distintos.

3. Mantener el bloque de review_enabled sin cambios.

No modificar ninguna otra lógica de finishMeetup.
No hacer commits.
Archivos esperados:
- mobile/src/features/meetups/services/meetupService.ts

## Tarea 6 — Notificación en leaveMeetup
En participantService.ts, función leaveMeetup:

Después del UPDATE exitoso (left_at seteado,
updateError null), agregar bloque fire-and-forget:

1. Query a meetups para obtener created_by y title:
   SELECT id, title, created_by
   FROM meetups
   WHERE id = meetupId

2. Con created_by y title disponibles, llamar a
   sendNotification:
   - recipientUserId: meetup.created_by
   - type: NotificationType.Left
   - title: 'Alguien abandonó tu juntada'
   - body: 'Un participante se fue de ${meetup.title}'
     (sin username — participantService no tiene
     acceso al perfil del usuario que abandona)
   - meetupId: meetupId

3. Importar notificationService si no está importado
4. Importar NotificationType si no está importado

No modificar ninguna otra lógica de leaveMeetup.
No hacer commits.
Archivos esperados:
- mobile/src/features/participants/services/participantService.ts

## Tarea 7 — Deployar Edge Function
Después de modificar send-push-notification/index.ts,
deployar la función actualizada:
supabase functions deploy send-push-notification
--project-ref tgxedyffizwbgidexpfj

Reportar si el deploy fue exitoso.

## Tarea 8 — Documentar este prompt
Crear el archivo:
ia/entrega-3/prompts/bloque-2/01_nuevos_tipos_notificacion.md
con el contenido completo de este prompt.
Crear ia/entrega-3/indice_ia.md si no existe la
sección de bloque-2, o agregar la entrada:
01 - Bloque 2: Nuevos tipos de notificación
     (cancelled, finished, left)

No hacer commits.

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- No hacer commits
- Si algo es ambiguo, preguntar antes de asumir
- Seguir exactamente el patrón fire-and-forget
  de finishMeetup para los nuevos bloques

## Al finalizar reportar
1. Archivos modificados
2. Decisiones tomadas, especialmente:
   - Cómo quedó la lista de tipos en la Edge Function
   - Si participantService necesitó imports nuevos
   - Si el deploy fue exitoso
3. Cómo probarlo en Expo Go:
   - cancelled: organizador cancela juntada →
     participantes reciben push y notificación in-app
     "Juntada cancelada"
   - finished: organizador finaliza juntada →
     participantes reciben "¡Juntada finalizada!"
     además de review_enabled si aplica
   - left: participante abandona juntada →
     organizador recibe "Alguien abandonó tu juntada"

### Respuesta (implementación Prompt 01)

Archivos modificados: migración 012, Edge Function, types.ts, meetupService.ts (cancelMeetup + finishMeetup), participantService.ts (leaveMeetup), documentación.

Decisiones: migración 012 incluida (enum PostgreSQL); participantService solo necesitó import de NotificationType; finishMeetup ejecuta bloque `finished` siempre y `review_enabled` condicionalmente.

Deploy Edge Function: no exitoso en sesión inicial (falta `supabase login`); corregido en sesión posterior ejecutando deploy desde raíz del repo.

---

### 01b_fix_rls_notificaciones.md

# Prompt 01b — Bloque 2: Fix RLS notificaciones cancelada/finalizada/abandono

## Contexto
Rama actual: feature/bloque-2-notificaciones
Las notificaciones cancelled, finished y left no se envían
porque las queries de meetup_participants en cancelMeetup,
finishMeetup y leaveMeetup usan el cliente normal con RLS.
La RLS solo devuelve la fila del usuario autenticado, no
las de otros participantes, por lo que la lista de
destinatarios siempre queda vacía.

Solución: crear una función RPC en PostgreSQL con
SECURITY DEFINER que se ejecute con permisos elevados
y devuelva los user_id de participantes activos dado
un meetup_id y un excluded_user_id.

## Tarea 1 — Análisis previo
Sin tocar ningún archivo, reportá:

1. En supabase/migrations/, ¿cuál es el número
   de la última migración? (debe ser 012)

2. En meetupService.ts y participantService.ts,
   ¿cómo se llama a supabase.rpc() en algún otro
   lugar del código? Mostrar un ejemplo existente
   si hay alguno.

3. ¿Existe alguna política RLS en meetup_participants
   que permita SELECT a participantes de la misma
   juntada, o solo permite ver la fila propia?
   Buscar en las migraciones SQL.

No tocar ningún archivo, solo reportar.

## Tarea 2 — Migración 013: función RPC
Crear el archivo:
supabase/migrations/013_get_meetup_participant_ids.sql

Contenido:
```sql
-- Retorna los user_id de participantes activos de una juntada
-- excluyendo a un usuario específico (generalmente el organizador).
-- SECURITY DEFINER permite ejecutar sin restricciones de RLS.
CREATE OR REPLACE FUNCTION get_meetup_participant_ids(
  p_meetup_id UUID,
  p_excluded_user_id UUID
)
RETURNS TABLE(user_id UUID)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT mp.user_id
  FROM meetup_participants mp
  WHERE mp.meetup_id = p_meetup_id
    AND mp.left_at IS NULL
    AND mp.user_id != p_excluded_user_id;
$$;
```

No ejecutar la migración todavía.
No hacer commits.
Archivos esperados:
- supabase/migrations/013_get_meetup_participant_ids.sql

## Tarea 3 — Usar RPC en cancelMeetup
En meetupService.ts, función cancelMeetup,
reemplazar en el bloque fire-and-forget:

La query actual:
```typescript
const { data: participants } = await supabase
  .from('meetup_participants')
  .select('user_id')
  .eq('meetup_id', meetupId)
  .is('left_at', null)
  .neq('user_id', userId);
```

Por la llamada RPC:
```typescript
const { data: participants } = await supabase
  .rpc('get_meetup_participant_ids', {
    p_meetup_id: meetupId,
    p_excluded_user_id: userId,
  });
```

No modificar ninguna otra lógica.
No hacer commits.
Archivos esperados:
- mobile/src/features/meetups/services/meetupService.ts

## Tarea 4 — Usar RPC en finishMeetup
En meetupService.ts, función finishMeetup,
reemplazar la misma query en el bloque finished
Y en el bloque review_enabled por la llamada RPC:
```typescript
const { data: participants } = await supabase
  .rpc('get_meetup_participant_ids', {
    p_meetup_id: meetupId,
    p_excluded_user_id: userId,
  });
```

Aplicar el reemplazo en ambos bloques fire-and-forget
(finished y review_enabled usan la misma query).
No modificar ninguna otra lógica.
No hacer commits.
Archivos esperados:
- mobile/src/features/meetups/services/meetupService.ts

## Tarea 5 — Documentar este prompt
Crear el archivo:
ia/entrega-3/prompts/bloque-2/01b_fix_rls_notificaciones.md
con el contenido completo de este prompt.
Actualizar ia/entrega-3/indice_ia.md agregando:
01b - Fix RLS notificaciones: función RPC
      get_meetup_participant_ids con SECURITY DEFINER

No hacer commits.

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- No hacer commits
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar reportar
1. Archivos creados o modificados
2. Cómo quedó la llamada RPC en cada función
3. Cómo probarlo:
   - Aplicar migración 013 en Supabase SQL Editor
   - Con Expo Go: cancelar/finalizar juntada con
     participantes → verificar filas nuevas en
     tabla notifications con types cancelled/finished
   - Participante abandona → verificar fila left
     en notifications del organizador

### Respuesta (implementación Prompt 01b)

Archivos: `013_get_meetup_participant_ids.sql` (con `public.`, `SET search_path = public`, `GRANT EXECUTE`), meetupService.ts (RPC en cancelMeetup, finishMeetup finished y review_enabled).

Problema resuelto: RLS limitaba destinatarios; RPC SECURITY DEFINER devuelve participantes activos excluyendo organizador.

Corrección migración 013: alineada con patrón de funciones RPC existentes (002, 007) tras error `permission denied for schema public`.

---

### 02_navegacion_panel_banner.md

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

### Respuesta (implementación Prompt 02)

Archivos: navigationService.ts, AppNavigator.tsx, NotificationPanel.tsx, NotificationBanner.tsx, App.tsx, documentación.

Ref: un solo NavigationContainer; `mainNavigationRef` reemplaza navigationRef local; cast a AuthStackParamList solo en flushPendingNavigation.

Banner onPress: hideBanner(true) siempre; navega si meetupId && mainNavigationRef.isReady().

Panel: useNavigation + onClose() + navigate a MeetupDetail cuando hay meetupId.

---

### 03_documentacion_cierre_bloque2.md

# Prompt 03 — Documentación y cierre del Bloque 2

## Tarea
Organizá la evidencia del Bloque 2 dentro de ia/entrega-3/.

## 1. Crear ia/entrega-3/conversaciones/bloque-2/cursor-bloque-2-completo.md

El archivo debe tener esta estructura exacta:

# Conversación Bloque 2 — Notificaciones mejoradas

**Herramienta:** Cursor Agent
**Rama:** feature/bloque-2-notificaciones

## Resumen

### Lo que se implementó
- Prompt 01: Nuevos tipos de notificación (cancelled,
  finished, left) — extensión del enum en DB (migración
  012), Edge Function y cliente móvil. Triggers en
  cancelMeetup, finishMeetup y leaveMeetup.
- Prompt 01b: Fix RLS notificaciones — función RPC
  get_meetup_participant_ids con SECURITY DEFINER
  (migración 013) para saltear RLS al obtener
  destinatarios desde el cliente móvil.
- Prompt 02: Navegación desde panel y banner —
  navigationService.ts con mainNavigationRef exportable,
  useNavigation en NotificationPanel, navegación
  imperativa en NotificationBanner, reordenamiento
  de NotificationBanner en App.tsx dentro del árbol
  del NavigationContainer.

### Decisiones tomadas
- Nuevos tipos via RPC con SECURITY DEFINER en vez
  de supabaseAdmin en el cliente — el cliente móvil
  no tiene service_role; la RPC corre con permisos
  elevados en el servidor
- navigationRef separado (navigationService.ts) en
  vez de reutilizar el de AppNavigator — el existente
  estaba tipado con AuthStackParamList y no exportado
- Un solo NavigationContainer en AppNavigator que
  alterna entre MainNavigator y AuthNavigator — el
  mainNavigationRef se conecta a ese container;
  el cast a AuthStackParamList se mantiene solo en
  flushPendingNavigation para el deep link de recovery
- Banner siempre descarta con hideBanner(true) antes
  de navegar — evita que el banner quede visible
  mientras se navega
- Panel cierra con onClose() antes de navegar —
  evita que el modal quede abierto encima del detalle
- Notificaciones de grupos, juegos y estadísticas
  anotadas como deuda para sus bloques correspondientes

### Problemas encontrados y resueltos
- Nuevos tipos no se insertaban en DB (Prompt 01):
  la RLS de meetup_participants bloqueaba la query
  de destinatarios desde el cliente normal —
  resuelto con función RPC SECURITY DEFINER
- navigationRef existente no exportable ni compatible
  con MainStackParamList — resuelto creando
  navigationService.ts con ref propio

### Deuda técnica pendiente
- Notificaciones de Grupos (Bloque 4):
  agregado a grupo, alguien se fue, grupo disuelto,
  nueva juntada del grupo
- Notificaciones de Juegos (Bloque 5):
  invitación a Liga/Torneo, resultados de fecha
- Notificaciones de Estadísticas (Bloque 6):
  hitos alcanzados (a evaluar al llegar al bloque)

## Conversación completa
[Pegar acá la conversación exportada de Cursor]

## 2. Verificá estructura de prompts del Bloque 2

ia/entrega-3/prompts/bloque-2/
├── 01_nuevos_tipos_notificacion.md ✓
├── 01b_fix_rls_notificaciones.md ✓
├── 02_navegacion_panel_banner.md ✓
└── 03_documentacion_cierre_bloque2.md ← este prompt

Verificar que todos existen. Si falta alguno, reportarlo.

## 3. Actualizá ia/entrega-3/indice_ia.md

Verificar que todos los ítems del bloque 2 existen
y agregar al final:
03 - Documentación y cierre del Bloque 2

## Restricciones
- No tocar ningún archivo de código
- No hacer commits
- Solo crear o modificar archivos dentro de
  ia/entrega-3/

## Al finalizar reportar
1. Archivos creados o modificados
2. Prompts faltantes si los hay
3. Cualquier inconsistencia encontrada en el índice

### Respuesta

Documentación del Bloque 2 organizada en ia/entrega-3/: conversación completa, verificación de prompts, índice actualizado con ítem 03.

---

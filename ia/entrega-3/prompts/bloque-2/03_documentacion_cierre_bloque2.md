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

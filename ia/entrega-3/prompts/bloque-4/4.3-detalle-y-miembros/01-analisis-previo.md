# Prompt 01 — Bloque 4.3: Análisis previo — Detalle y miembros de grupo

## Contexto
Rama feature/bloque-4-grupos. 4.1 (modelo de datos) y 4.2 (crear/unirse/
listar) ya commiteados y funcionando.

Este prompt implementa: ver detalle de un grupo, ver lista de miembros
(sin poder expulsar todavía), salir del grupo, eliminar grupo. NO incluye:
expulsar miembros, transferir administración, contenido real de las
pestañas Juntadas/Multimedia (placeholders solamente) — todo eso es
4.5/4.4/4.6.

## Tarea 1 — Análisis previo (sin tocar archivos)

1. Estructura y convención de `MeetupDetailScreen.tsx` para replicar 1:1.
2. Cómo `meetupService` implementa "compartir código".
3. Patrón de tabs/secciones dentro de una pantalla de detalle, si existe.
4. Patrón de pantalla "placeholder/próximamente" existente.

## Hallazgos

### 1. Estructura de MeetupDetailScreen
Header propio (back + título + acción contextual a la derecha) fuera del
ScrollView; dentro: card principal de datos, action cards, sección de
compartir, acciones del organizador, sección de abandonar, "zona
destructiva" al final. Los modales de confirmación comparten un mismo set
de estilos (`modalOverlay`/`modalCard`/`modalIconBox`/`modalTitle`/
`modalSubtitle`/`modalActions`/`modalDestructiveBtn`) copiado en cada
pantalla que necesita confirmación — no hay un componente `ConfirmModal`
compartido, es duplicación deliberada consistente con cómo
`ParticipantListScreen` duplica su propia lógica de "Abandonar juntada"
(ahí usando `Alert.alert` nativo en vez de `Modal` custom — dos
convenciones conviven). Feedback vía `SuccessAnimation`/`ErrorAnimation`.

### 2. Compartir código — es un componente, no lógica de servicio
`meetupService.ts` no tiene funciones de compartir. Vive todo en
`MeetupShareButton.tsx` (bottom sheet: copiar/WhatsApp/share nativo),
recibe `{ meetupTitle, joinCode, onFeedback }`. Genérico salvo el nombre
del prop y el texto del mensaje, que funciona igual de bien para un
grupo. Se reutiliza tal cual, importado desde
`@/features/meetups/components/MeetupShareButton`, sin modificarlo.

### 3. Tabs/secciones en un detalle
No existe `@react-navigation/material-top-tabs` en el proyecto ni ningún
patrón de tabs-que-cambian-contenido-inline. Lo más cercano es el badge
"Próximamente" de `GamesScreen` para cards no disponibles (deshabilitada,
no navega). Como el prompt pide que "Juntadas"/"Multimedia" naveguen a un
placeholder real, se implementaron como dos cards que hacen
`navigation.navigate(Routes.GroupPlaceholder, { groupId, section })` —
sin librería nueva.

### 4. Pantalla "placeholder/próximamente"
No existe como pantalla independiente. Se creó `GroupPlaceholderScreen.tsx`
nuevo, reutilizando el copy "Próximamente" de `GamesScreen` para mantener
el tono, parametrizada por `section` para no duplicar el componente entre
"Juntadas" y "Multimedia".

## Decisiones confirmadas antes de la Tarea 2

- `GroupDetailScreen`: sin botón "Editar" (no hay `EditGroupScreen` en
  este alcance) ni "Transferir administración" (excluido). Reutiliza el
  set de estilos de modal de `MeetupDetailScreen`.
- `GroupMembersScreen`: chip de rol único por fila (el mockup mostraba dos
  chips distintos para admin vs. uno para member — se unificó). Menú "⋮"
  sin `onPress` (TODO explícito para 4.4/4.5).
- Tap en card de `GroupHomeScreen` (antes no interactiva) ahora navega a
  `GroupDetailScreen`.
- Aclaración del usuario incorporada: si el admin toca "Salir del grupo",
  `leave_group()` lanza la excepción "El admin debe transferir su rol
  antes de salir del grupo" — comportamiento esperado, no un bug. Ese
  mensaje específico se muestra tal cual en el toast de error, sin
  reemplazarlo por uno genérico.

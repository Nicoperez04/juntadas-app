# Conversación Bloque 4 — Juegos

**Herramienta:** Cursor Agent  
**Rama:** feature/bloque-4-juegos

## Resumen

### Lo que se implementó

- TimerScreen: temporizador con cuenta regresiva y cronómetro,
  alerta visual y haptic al llegar a 0
- TeamRandomizerScreen: equipos aleatorios con dos modos,
  mezclar de nuevo, copiar al portapapeles
- Rediseño GamesScreen: migrada de features/impostor a features/games,
  grid 2 columnas, secciones Juegos/Herramientas, cards animadas
  con entrada escalonada y press effect, cards Próximamente con badge
- WhoAmISetupScreen + WhoAmIGameScreen: juego ¿Qué soy? con 6
  categorías + todas mezcladas, dataset en whoAmIData.ts,
  pantalla en landscape, animación de cartas fade in/out
- GroupQuestionsScreen: preguntas para el grupo con dataset de 100
  preguntas en groupQuestionsData.ts, animación lateral,
  re-barajado automático al agotar el mazo
- ScorerSetupScreen + ScorerGameScreen: anotador genérico con
  configuración, puntaje objetivo opcional, edición inline,
  agregar/quitar jugadores mid-game, banner dismissible al llegar
  al objetivo, back interceptado con confirmación
- Corrección: botón "Jugar" en juntada navega a GamesScreen con
  meetupId, prellenado de participantes en Impostor, Equipos
  aleatorios y Anotador desde impostorService.getParticipantsForGame
- Correctivos UX del Anotador: input numérico estricto (number-pad +
  toggle de signo), puntaje sin recorte en modal, banner de objetivo
  centrado con animación fade + scale + slide

### Decisiones tomadas

- GamesScreen migrada a features/games/ por coherencia arquitectónica
- Todos los juegos son stateless (sin persistencia en DB ni AsyncStorage)
- expo-screen-orientation para landscape en ¿Qué soy?
- expo-clipboard para copiar equipos
- Fisher-Yates para barajado en whoAmIData y groupQuestionsData
- navigation.reset en ScorerGameScreen para no acumular pantallas
- beforeRemove interceptado en ScorerGameScreen para confirmar salida
- meetupId propagado desde GamesScreen solo a Impostor,
  Equipos aleatorios y Anotador — resto sin contexto de juntada
- Solo participantes con attendanceStatus confirmed se precargan
- Índice IA del anotador en entradas 43–45 (40–42 ya ocupadas por correctivos previos)
- Banner de victoria/derrota como overlay flotante centrado (no bloquea el juego)

### Problemas encontrados y resueltos

- GamesScreen estaba en features/impostor — migrada en 4b
- Botón "Jugar" navegaba directo a Impostor — corregido en correctivo
- Games: undefined rompía TypeScript al agregar meetupId —
  corregidas 3 llamadas colaterales (MeetupHomeScreen, AppTabBar,
  ImpostorRoleScreen) con navigate(Routes.Games, {})
- Input de edición de puntaje permitía letras — resuelto con number-pad
  y filtrado estricto de dígitos; signo negativo vía toggle +/−
- Número del puntaje cortado en modal — resuelto con input más alto,
  padding vertical e includeFontPadding: false en Android
- Banner de objetivo arriba y sin animación — resuelto con TargetBanner
  flotante centrado y animación de entrada/salida

### Deuda técnica documentada

- Animaciones de transición en TeamRandomizer pendientes de pulido
- Datasets expandibles en E3
- Deshacer última acción en Anotador (E3)
- Historial de partidas jugadas (E3)

## Conversación completa

> Nota: resumen cronológico de las sesiones de Cursor Agent en este bloque.
> Para el export raw completo, usar el historial de chat de Cursor en la rama
> feature/bloque-4-juegos.

### Sesión 1 — Bloque 4a: Herramientas (Timer + Equipos aleatorios)

- Implementación de TimerScreen y TeamRandomizerScreen
- Registro de rutas Timer y TeamRandomizer en MainNavigator
- Navegación desde GamesScreen

### Sesión 2 — Bloque 4b: Rediseño GamesScreen

- Migración de GamesScreen de features/impostor a features/games
- Grid 2 columnas, secciones Juegos/Herramientas, animaciones escalonadas

### Sesión 3 — Bloque 4c: ¿Qué soy?

- Dataset whoAmIData.ts con 6 categorías + todas mezcladas
- WhoAmISetupScreen y WhoAmIGameScreen en landscape
- Navegación WhoAmISetup / WhoAmIGame

### Sesión 4 — Bloque 4d: Preguntas para el grupo

- Dataset groupQuestionsData.ts (100 preguntas, 5 categorías)
- GroupQuestionsScreen con animación lateral y re-barajado automático

### Sesión 5 — Correctivos Timer y Equipos

- Cronómetro: milisegundos solo en modo cronómetro
- Equipos: input numérico, validación de división, scroll desde el tercer participante

### Sesión 6 — Bloque 4e: Anotador genérico

- ScorerSetupScreen + ScorerGameScreen completos
- Rutas ScorerSetup y ScorerGame
- Conexión desde GamesScreen (card dejó de ser "Próximamente")

### Sesión 7 — Correctivo UX Anotador

- Input numérico estricto en edición de puntaje
- Fix recorte visual del número en modal
- Banner de ganó/perdió centrado con animación

### Sesión 8 — Consulta estructura (solo lectura)

- Relevamiento de acceso a juegos desde MeetupDetailScreen
- Documentado patrón ImpostorStart + getParticipantsForGame

### Sesión 9 — Correctivo juegos desde juntada

- "Jugar" en juntada → GamesScreen con meetupId
- Propagación de meetupId a Impostor, Equipos y Anotador
- Prellenado en TeamRandomizerScreen y ScorerSetupScreen vía useFocusEffect

### Sesión 10 — Documentación cierre Bloque 4

- Este archivo + prompt 07_documentar_bloque-4.md + actualización de índice

# Bloque 4e — Anotador genérico

## Contexto
Rama actual: feature/bloque-4-juegos
Bloques 4a, 4b, 4c y 4d completos.
GamesScreen tiene la card "Anotador genérico" con toast "Próximamente".
Hay que implementar el juego completo y conectar la navegación.

Stack relevante:
- React Native + Expo SDK 55 + TypeScript
- @expo/vector-icons (MaterialCommunityIcons)
- expo-haptics ya instalado
- React Hook Form + Zod ya instalados
- Design tokens en src/shared/constants/theme.ts
- Sin TypeScript any, comentarios en español

---

### Tarea 1 — Pantalla de configuración

Crear src/features/games/screens/ScorerSetupScreen.tsx

Comportamiento:
- Campo de texto + botón "Agregar" para sumar jugadores uno por uno
- Lista de jugadores agregados con botón X para quitar cada uno
- Validación: no se pueden agregar nombres vacíos ni duplicados
- Botón "Empezar" deshabilitado si hay menos de 2 jugadores

Puntaje objetivo (opcional):
- Toggle "¿Hay puntaje límite?"
- Si está activo mostrar:
  * Input numérico para el valor límite (solo números positivos)
  * Selector de tipo: "Ganar al llegar a X" / "Perder al llegar a X"
    (dos opciones seleccionables, no dropdown)
- Si está desactivado: ocultar esos campos

UI:
- Título "Anotador" con subtítulo "Definí los jugadores o equipos"
- Lista de jugadores con scroll si hay muchos
- Sección de puntaje objetivo separada visualmente
- Botón "Empezar" al final, fijo o con scroll
- Seguir tokens de theme.ts
- Animación de entrada de jugadores al agregarlos
  (fade in suave con Animated)

No hacer:
- No instalar librerías adicionales
- No hacer commits

Archivos esperados:
- src/features/games/screens/ScorerSetupScreen.tsx

---

### Tarea 2 — Pantalla de juego

Crear src/features/games/screens/ScorerGameScreen.tsx

Parámetros de navegación:
{
  players: string[],
  targetScore?: number,
  targetType?: 'win' | 'lose'
}

Estado interno:
- scores: Record<string, number> — puntaje por jugador, todos inician en 0
- players: string[] — lista mutable (se pueden agregar/quitar mid-game)
- editingPlayer: string | null — jugador cuyo puntaje se está editando

Layout:
- Header con título "Anotador" y botones "Agregar jugador" y "Resetear"
- Lista de jugadores con scroll si hay muchos
- Cada fila de jugador:
  * Nombre del jugador (texto, una línea con ellipsis si es largo)
  * Botón - (resta 1 punto)
  * Puntaje actual (número grande, tocable para editar)
  * Botón + (suma 1 punto)
  * Botón X para quitar el jugador (con confirmación)
  * Si hay puntaje objetivo: barra de progreso debajo del nombre
    proporcional al avance hacia el objetivo

Editar puntaje al tocar el número:
- Abre un Modal con un input numérico centrado
- El input acepta números positivos y negativos
- Botones "Cancelar" y "Guardar"
- Al guardar actualiza el puntaje del jugador

Agregar jugador mid-game:
- Botón en el header abre un Modal con input de nombre
- Validación: no vacío, no duplicado
- Al confirmar: agrega jugador con puntaje 0

Resetear:
- Modal de confirmación: "¿Resetear todos los puntajes a 0?"
- Al confirmar: todos los puntajes vuelven a 0

Quitar jugador:
- Modal de confirmación: "¿Eliminar a [nombre] del juego?"
- Al confirmar: se elimina con su puntaje
- Si quedan menos de 2 jugadores tras eliminar: mostrar toast
  informativo pero no bloquear

Puntaje objetivo:
- Si targetScore está definido:
  * Cada fila muestra barra de progreso
  * Al llegar al objetivo (ganar o perder según targetType):
    banner no bloqueante en la partes superior:
    "🏆 ¡[nombre] ganó!" o "💀 ¡[nombre] perdió!"
    con botón X para cerrar el banner
  * El juego continúa normalmente tras el aviso
  * Si múltiples jugadores llegan al objetivo, mostrar un banner
    por cada uno

Salir:
- Botón en el header o back navigation
- Modal de confirmación: "¿Salir del juego? Se perderá el progreso."
- Al confirmar: navega a GamesScreen (no a ScorerSetupScreen)

UI:
- Diseño limpio tipo tabla/scoreboard
- Colores consistentes con theme.ts
- Botones + y - grandes y fáciles de tocar (mínimo 44dp)
- Puntaje en tipografía grande (mínimo 28sp)
- Haptic al sumar y restar punto

No hacer:
- No instalar librerías adicionales
- No hacer commits

Archivos esperados:
- src/features/games/screens/ScorerGameScreen.tsx

---

### Tarea 3 — Navegación

Alcance:
1. Agregar en routes.ts:
   - Routes.ScorerSetup
   - Routes.ScorerGame

2. Agregar en navigation/types.ts en MainStackParamList:
   - ScorerSetup: undefined
   - ScorerGame: {
       players: string[],
       targetScore?: number,
       targetType?: 'win' | 'lose'
     }

3. Registrar ScorerSetupScreen y ScorerGameScreen en MainNavigator.tsx

4. En GamesScreen reemplazar el toast "Próximamente" de la card
   "Anotador genérico" por navegación a Routes.ScorerSetup

5. En ScorerSetupScreen conectar el botón "Empezar" para navegar
   a Routes.ScorerGame con los parámetros correctos

No hacer:
- No tocar otras rutas
- No modificar otros juegos

Archivos esperados:
- src/navigation/routes.ts (modificado)
- src/navigation/types.ts (modificado)
- src/navigation/MainNavigator.tsx (modificado)
- src/features/games/screens/GamesScreen.tsx (navegación conectada)
- src/features/games/screens/ScorerSetupScreen.tsx (navegación conectada)

---

### Tarea 4 — Documentar este prompt

Crear ia/entrega-2/prompts/bloque-4/05_anotador_generico.md
con el contenido completo de este prompt.

Actualizar ia/entrega-2/indice_ia.md agregando:
40 - ScorerSetupScreen: configuración de jugadores y puntaje objetivo
41 - ScorerGameScreen: anotador con edición inline, mid-game y objetivo
42 - Navegación: rutas ScorerSetup y ScorerGame

No hacer:
- No tocar archivos de código fuera de los indicados
- No hacer commits

Archivos esperados:
- ia/entrega-2/prompts/bloque-4/05_anotador_generico.md
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
3. Cómo probarlo en dispositivo

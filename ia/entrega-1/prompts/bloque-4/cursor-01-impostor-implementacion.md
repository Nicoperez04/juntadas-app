# Prompt — Bloque 4: Juego Impostor (Implementación)

Implementación — Bloque 4: Juego Impostor

## Contexto del proyecto

App móvil Juntadas, React Native + Expo SDK 55 + TypeScript. Backend Supabase. Rama activa: feature/bloque-4-impostor.

Arquitectura modular por features. Todo el código vive en `mobile/src/features/impostor/`. Sistema de diseño en `mobile/src/shared/constants/theme.ts` — ningún valor hardcodeado. Consultá Figma via MCP antes de implementar cada pantalla. Usá las skills instaladas sleek-design-mobile-apps, frontend-design y vercel-react-native-skills.

## Mecánica del juego

Modo un solo celular — el organizador maneja la partida desde su dispositivo y lo pasa de mano en mano:

1. El organizador elige el tema y la palabra
2. Define la lista de jugadores (pre-cargada desde participantes confirmados, editable)
3. Inicia la partida — aparece "Pasá el teléfono a [Nombre]"
4. Cada jugador toca para ver su rol (con flip animado), luego toca "Listo" para pasar al siguiente
5. Cuando todos vieron su rol, aparece "¡A jugar! Descubrí quién es el impostor"
6. Al terminar, el organizador puede reiniciar con nueva ronda

Sin temporizador. Sin votación guardada. Sin resultado persistido. El juego es 100% presencial.

## Dataset de palabras

Implementá un dataset local grande en `mobile/src/features/impostor/data/wordBank.ts` con las siguientes categorías y al menos 25 palabras por categoría:

comida, bebidas, deportes, animales, películas, series, música, lugares, profesiones, objetos_cotidianos, naturaleza, tecnología, ropa, transportes, videojuegos, países, historia, ciencia, marcas_conocidas, arte

El archivo debe exportar:

- `export const WORD_BANK: Record<string, string[]> = { ... }`
- `export const CATEGORIES = Object.keys(WORD_BANK)`
- `export const getRandomWord = (category: string): string => ...`
- `export const getWordSuggestions = (category: string, count = 6): string[] => ...`
- `export const getCategoryLabel = (key: string): string => ...` // nombre en español

## Tipos (`mobile/src/features/impostor/types.ts`)

Ver interfaces `Player`, `GameSession`, `ImpostorGame`, `GameStatus` en el spec original.

El `GameSession` vive en estado local (`useState`/`useReducer`), NO en Supabase. Solo se persiste en `impostor_games` el registro de que se jugó (para historial futuro), no el estado del juego en tiempo real.

## Servicio (`mobile/src/features/impostor/services/impostorService.ts`)

- `saveGameRecord(userId, meetupId, data)` — guarda un registro en `impostor_games` al iniciar. Solo para historial, no para estado del juego.
- `getParticipantsForGame(meetupId)` — obtiene participantes confirmados de la juntada para pre-cargar la lista de jugadores.

## Hook (`mobile/src/features/impostor/hooks/useImpostor.ts`)

Maneja el estado completo del juego localmente con `setupGame`, `nextPlayer`, `resetGame`, `currentPlayer`, `currentIsImpostor`.

## Pantallas

### ImpostorStartScreen.tsx

Pantalla de configuración con intro, setup de jugadores, categorías/palabra, modal "Cómo se juega", botón "Iniciar partida".

### ImpostorRoleScreen.tsx

Revelación de roles con flip 3D, pantalla final "¡A jugar!", botones "Nueva ronda" y "Terminar".

## Tab bar

El tab bar debe estar visible en `ImpostorStartScreen` e `ImpostorRoleScreen`. Pantallas dentro del stack principal en `MainNavigator.tsx`.

## MeetupDetailScreen.tsx

El botón "Jugar" navega a `ImpostorStartScreen` pasando `{ meetupId }`. Solo si `isActive`.

## Navegación

En `MainNavigator.tsx` reemplazá los placeholders:

- `ImpostorStartScreen` → `Routes.ImpostorStart` con params `{ meetupId: string }`
- `ImpostorRoleScreen` → `Routes.ImpostorRole` con params `{ meetupId: string }`

## Restricciones

- No instalar dependencias sin informarlo
- No modificar `AppNavigator.tsx`, `client.ts`, `env.ts`
- No hacer commits
- Comentar todo el código en español
- Usar siempre `StyleSheet.create`
- Usar siempre constantes de `Routes`

## Reporte al finalizar

- Archivos creados o modificados
- Cuántas palabras quedaron en el dataset total
- Cómo quedó la animación flip
- Cómo se maneja el estado entre jugadores
- Estado final de MainNavigator
- Puntos pendientes de validación

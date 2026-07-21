# Prompt 02 — Bloque 5: Anotador de Generala: Planilla Interactiva de Dados

## Contexto
Rama actual: feature/bloque-5-juegos
Desarrollo de la segunda herramienta del Bloque 5 (Juegos Nuevos): el Anotador de Generala. Esta herramienta debe permitir registrar la puntuación de múltiples jugadores en una partida local de Generala, ofreciendo una grilla de anotación interactiva para las categorías numéricas y juegos mayores (incluyendo Doble Generala), sumatoria automática de totales y la posibilidad de tachar juegos.
Stack relevante:
- React Native + Expo SDK 55 + TypeScript + Supabase
- Design tokens desde `src/shared/constants/theme.ts`
- Sin TypeScript any, comentarios en español, sin librerías de animación externas.

## Tarea 1 — Análisis previo
Sin tocar ningún archivo, reportá:
1. ¿Cómo se configuró la navegación y enrutamiento del Anotador de Truco implementado anteriormente?
2. ¿Cómo se estructuró la lista de rutas en `src/navigation/routes.ts` y sus parámetros en `MainStackParamList`?

## Tarea 2 — Integrar Rutas del Anotador de Generala
1. Modificar `src/navigation/routes.ts` agregando las constantes `GeneralaSetup` y `GeneralaGame`.
2. Modificar `src/navigation/types.ts` incorporando el tipado correspondiente a `MainStackParamList` para las dos rutas.
3. Modificar `src/navigation/MainNavigator.tsx` para importar y registrar las nuevas pantallas.
4. Modificar `src/features/games/screens/GamesScreen.tsx` agregando la card del Anotador de Generala dentro de la sección de Juegos y configurando la navegación al presionarla.

## Tarea 3 — Crear Lógica y Pantallas de la Planilla de Generala
1. Crear el archivo de tipos `src/features/games/types/generala.ts` con la estructura de jugadores, categorías (balas a generala doble) y scores.
2. Crear el hook `src/features/games/hooks/useGeneralaGame.ts` para gestionar el estado de la planilla de cada jugador, marcar servido/armado, tachar casilleros y calcular el puntaje total.
3. Crear la pantalla `src/features/games/screens/GeneralaSetupScreen.tsx` para configurar los participantes de la partida y cargarlos si viene con un `meetupId`.
4. Crear la pantalla `src/features/games/screens/GeneralaGameScreen.tsx` con el selector de pestañas de jugador, la grilla interactiva para anotar los puntos, y la pantalla de finalización.

## Tarea 4 — Documentar este prompt
Crear el archivo:
ia/entrega-3/prompts/bloque-5/02_anotador_generala.md
con el contenido completo de este prompt.
Actualizar el archivo ia/entrega-3/indice_ia.md agregando la entrada de Generala.

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- No hacer commits
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar reportar
1. Archivos modificados y creados
2. Decisiones tomadas
3. Cómo probarlo en el dispositivo físico

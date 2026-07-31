# Prompt 04 — Bloque 5: Generador de Ligas (League)

## Contexto
Rama actual: feature/bloque-5-juegos
Desarrollo de la cuarta herramienta del Bloque 5 (Juegos Nuevos): el Generador de Ligas (Round Robin). La herramienta permite agregar participantes/equipos (mínimo 3), generar un fixture automático todos contra todos de ida simple usando el algoritmo Berger de rotación (con soporte para fechas libres si el número es impar), registrar puntuaciones dinámicamente y computar una tabla de posiciones en tiempo real con criterios de desempate específicos.
Stack relevante:
- React Native + Expo SDK 55 + TypeScript + Supabase
- Design tokens desde `src/shared/constants/theme.ts`
- Sin TypeScript any, comentarios en español, sin librerías de animación externas.

## Tarea 1 — Análisis previo
Sin tocar ningún archivo, reportá:
1. ¿Cómo se configuró la navegación y enrutamiento del Sorteador (Raffle) implementado anteriormente?
2. ¿Cómo se interactúa con el listado de participantes en la pantalla de setup de otros juegos?

## Tarea 2 — Registrar Rutas del Generador de Ligas
1. Modificar `src/navigation/routes.ts` agregando las constantes `LeagueSetup` y `LeagueGame`.
2. Modificar `src/navigation/types.ts` incorporando el tipado correspondiente a `MainStackParamList` para `LeagueSetup` y `LeagueGame`.
3. Modificar `src/navigation/MainNavigator.tsx` para importar y registrar las nuevas pantallas.
4. Modificar `src/features/games/screens/GamesScreen.tsx` agregando la card del Generador de Ligas dentro de la sección de Juegos y configurando la navegación al presionarla.

## Tarea 3 — Crear la Lógica y Pantallas de la Liga
1. Crear el archivo de tipos `src/features/games/types/league.ts` para representar equipos, partidos del fixture, y la tabla de posiciones.
2. Crear el hook `src/features/games/hooks/useLeagueGame.ts` que implemente el algoritmo de Round Robin (Berger / rotación), registre los marcadores de cada partido y recalcule la tabla de posiciones dinámicamente.
3. Crear la pantalla `src/features/games/screens/LeagueSetupScreen.tsx` para agregar los competidores y configurar la liga.
4. Crear la pantalla `src/features/games/screens/LeagueGameScreen.tsx` con dos pestañas: una para cargar los resultados del Fixture (por Fechas) y otra para visualizar la Tabla de Posiciones en tiempo real.

## Tarea 4 — Documentar este prompt
Crear el archivo:
ia/entrega-3/prompts/bloque-5/04_generador_ligas.md
con el contenido completo de este prompt.
Actualizar el archivo ia/entrega-3/indice_ia.md agregando la entrada de Generador de Ligas.

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- No hacer commits
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar reportar
1. Archivos modificados y creados
2. Decisiones tomadas
3. Cómo probarlo en el dispositivo físico

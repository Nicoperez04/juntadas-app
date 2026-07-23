# Prompt 05 — Bloque 5: Generador de Torneos (Tournament)

## Contexto
Rama actual: feature/bloque-5-juegos
Desarrollo de la quinta y última herramienta del Bloque 5 (Juegos Nuevos): el Generador de Torneos (Playoffs). La herramienta permite agregar participantes (mínimo 4), estructurar automáticamente llaves de eliminación directa basadas en potencias de 2 (Octavos, Cuartos, Semifinal, Final), asignar Byes dinámicos de forma aleatoria para balancear el cuadro si no coincide con una potencia de 2 exacta, avanzar automáticamente los ganadores e identificar al campeón.
Stack relevante:
- React Native + Expo SDK 55 + TypeScript + Supabase
- Design tokens desde `src/shared/constants/theme.ts`
- Sin TypeScript any, comentarios en español, sin librerías de animación externas.

## Tarea 1 — Análisis previo
Sin tocar ningún archivo, reportá:
1. ¿Cómo se configuró el enrutamiento y la tabla del fixture del Generador de Ligas (League) implementado anteriormente?
2. ¿Cómo se organizó el enrutamiento de vistas y hooks locales en `src/features/games/`?

## Tarea 2 — Registrar Rutas del Torneo
1. Modificar `src/navigation/routes.ts` agregando las constantes `TournamentSetup` y `TournamentGame`.
2. Modificar `src/navigation/types.ts` incorporando el tipado correspondiente a `MainStackParamList` para `TournamentSetup` y `TournamentGame`.
3. Modificar `src/navigation/MainNavigator.tsx` para importar y registrar `TournamentSetupScreen` y `TournamentGameScreen`.
4. Modificar `src/features/games/screens/GamesScreen.tsx` agregando la card del Generador de Torneos dentro de la sección de Juegos y configurando la navegación al presionarla.

## Tarea 3 — Crear la Lógica y Pantallas del Torneo
1. Crear el archivo de tipos `src/features/games/types/tournament.ts` para representar partidos del cuadro, llaves, rondas y Byes.
2. Crear el hook `src/features/games/hooks/useTournamentGame.ts` que implemente el algoritmo de emparejamientos y distribución de Byes, la promoción automática de ganadores al siguiente nodo y el reset.
3. Crear la pantalla `src/features/games/screens/TournamentSetupScreen.tsx` para configurar a los jugadores.
4. Crear la pantalla `src/features/games/screens/TournamentGameScreen.tsx` con la pestaña de Rondas y la asignación interactiva del ganador de cada llave.

## Tarea 4 — Documentar este prompt
Crear el archivo:
ia/entrega-3/prompts/bloque-5/05_generador_torneos.md
con el contenido completo de este prompt.
Actualizar el archivo ia/entrega-3/indice_ia.md agregando la entrada de Generador de Torneos.

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- No hacer commits
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar reportar
1. Archivos modificados y creados
2. Decisiones tomadas
3. Cómo probarlo en el dispositivo físico

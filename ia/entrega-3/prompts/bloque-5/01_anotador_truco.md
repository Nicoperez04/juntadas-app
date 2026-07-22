# Prompt 01 — Bloque 5: Anotador de Truco: Implementación Completa

## Contexto
Rama actual: feature/bloque-5-juegos
En el marco de la Entrega 3 (E3), iniciamos con el desarrollo del Bloque 5 (Juegos Nuevos), priorizando la creación del Anotador de Truco como primer paso. Este anotador debe incluir configuración de puntos (15/30), dibujo programático de fósforos (la fosforera) mediante vistas nativas simulando fósforos clásicos de madera y cabezas inflamables rojas, además de la integración para registrar resultados de la partida asociados a una juntada.
Stack relevante:
- React Native + Expo SDK 55 + TypeScript + Supabase
- Design tokens desde `src/shared/constants/theme.ts`
- Sin TypeScript any, comentarios en español, sin librerías de animación externas.

## Tarea 1 — Análisis previo
Sin tocar ningún archivo, reportá:
1. ¿En qué archivos y rutas se encuentra configurada la navegación principal?
2. ¿Cómo está armada la lista de juegos activos y herramientas del hub principal en `GamesScreen.tsx`?
3. ¿Cuál es el formato del servicio que interactúa con Supabase para participantes en `impostorService.ts`?

## Tarea 2 — Implementar Estructura e Integrar Navegación
1. Modificar `src/navigation/routes.ts` agregando las constantes `TrucoSetup` y `TrucoGame`.
2. Modificar `src/navigation/types.ts` incorporando el tipado correspondiente a `MainStackParamList` para las dos rutas.
3. Modificar `src/navigation/MainNavigator.tsx` para importar y registrar las nuevas pantallas.
4. Modificar `src/features/games/screens/GamesScreen.tsx` agregando la card del Anotador de Truco dentro de la sección de Juegos y configurando la navegación al presionarla.

## Tarea 3 — Crear Lógica, Componente y Pantallas del Anotador
1. Crear el archivo de tipos `src/features/games/types/truco.ts` con las interfaces de configuración y estado de la partida de Truco.
2. Crear el hook `src/features/games/hooks/useTrucoGame.ts` para encapsular el estado de puntos de ambos equipos, validaciones de fin de partida (15 o 30), y reinicio del marcador.
3. Crear el componente visual `src/features/games/components/TrucoFosforera.tsx` que dibuje los fósforos de a 5 programáticamente usando componentes `View` con estilos simulando fósforos reales.
4. Crear la pantalla `src/features/games/screens/TrucoSetupScreen.tsx` que permita configurar los nombres de los equipos, el objetivo de puntos (15 o 30), y pre-cargar participantes de la juntada si se pasa un `meetupId`.
5. Crear la pantalla `src/features/games/screens/TrucoGameScreen.tsx` con controles grandes de sumar/restar puntos, la visualización de la fosforera para cada equipo, la distinción de buenas/malas si es a 30 puntos, y la acción de registrar el resultado en Supabase si vino asociada a un `meetupId`.

## Tarea 4 — Documentar este prompt
Crear el archivo:
ia/entrega-3/prompts/bloque-5/01_anotador_truco.md
con el contenido completo de este prompt.
Actualizar el archivo ia/entrega-3/indice_ia.md agregando la entrada del Bloque 5.

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- No hacer commits
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar reportar
1. Archivos modificados y creados
2. Decisiones tomadas
3. Cómo probarlo en el dispositivo físico

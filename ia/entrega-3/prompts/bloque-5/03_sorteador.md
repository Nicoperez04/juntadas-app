# Prompt 03 — Bloque 5: Sorteador (Raffle)

## Contexto
Rama actual: feature/bloque-5-juegos
Desarrollo de la tercera herramienta del Bloque 5 (Juegos Nuevos): el Sorteador (Raffle). La herramienta permite agregar opciones de texto una por una o cargarlas desde la juntada en curso, ofrece la opción de "Excluir ganadores (sin repeticiones)" mediante un Switch, realiza un sorteo aleatorio con una animación de cambio rápido de nombres (efecto carrusel de suspenso durante 1.6 segundos) y conserva un historial de la sesión.
Stack relevante:
- React Native + Expo SDK 55 + TypeScript + Supabase
- Design tokens desde `src/shared/constants/theme.ts`
- Sin TypeScript any, comentarios en español, sin librerías de animación externas.

## Tarea 1 — Análisis previo
Sin tocar ningún archivo, reportá:
1. ¿Dónde se registran las rutas de juegos y herramientas?
2. ¿Cómo se accede a los participantes del meetup en los servicios compartidos?

## Tarea 2 — Registrar Ruta del Sorteador
1. Modificar `src/navigation/routes.ts` agregando la constante `Raffle`.
2. Modificar `src/navigation/types.ts` incorporando el tipado correspondiente a `MainStackParamList` para `Raffle`.
3. Modificar `src/navigation/MainNavigator.tsx` para importar y registrar `RaffleScreen`.
4. Modificar `src/features/games/screens/GamesScreen.tsx` agregando la card del Sorteador dentro de la sección de Herramientas y configurando la navegación al presionarla.

## Tarea 3 — Crear la Pantalla RaffleScreen
1. Crear la pantalla `src/features/games/screens/RaffleScreen.tsx` que integre el setup de opciones, la lógica de exclusión de ganadores (Switch) para evitar repeticiones, la animación de cambio veloz de nombres (efecto carrusel) con `Animated` nativo, y el historial de sorteos de la sesión.

## Tarea 4 — Documentar este prompt
Crear el archivo:
ia/entrega-3/prompts/bloque-5/03_sorteador.md
con el contenido completo de este prompt.
Actualizar el archivo ia/entrega-3/indice_ia.md agregando la entrada de Sorteador.

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- No hacer commits
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar reportar
1. Archivos modificados y creados
2. Decisiones tomadas
3. Cómo probarlo en el dispositivo físico

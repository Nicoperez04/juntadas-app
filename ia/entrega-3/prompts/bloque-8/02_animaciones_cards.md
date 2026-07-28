# Prompt 02 — Bloque 8: Animaciones de Micro-interacción en Listados y Tarjetas

## Contexto de la tarea
Estamos en la Fase 2 del Bloque 8 (Pulido Visual). Ya corregimos los Skeletons y los detalles de layout. Ahora debemos agregar animaciones de micro-interacción para mejorar la fluidez de la app en listados y tarjetas.

## Tareas de Implementación
1. **Implementar Staggered Entrance Animation en Listados**:
   - Modificar `MeetupCard.tsx` para incorporar un efecto de entrada escalonado (stagger) en base a un prop `index` opcional.
   - Utilizar `Animated.timing` para transicionar de `opacity: 0` a `1` y de `translateY: 20` a `0` de forma secuencial y en cascada.
2. **Implementar Press Feedback (Scale) en Tarjetas**:
   - Añadir una animación de escala en `MeetupCard.tsx` utilizando `Animated.spring`.
   - Modificar las props del `Pressable` incorporando `onPressIn` (escala a 0.97) y `onPressOut` (escala de retorno a 1) para brindar una respuesta táctil fluida y elástica.
3. **Integración en Pantallas**:
   - Actualizar `MeetupHomeScreen.tsx` y `GroupMeetupsScreen.tsx` para pasar el prop `index` a cada `MeetupCard`.

## Restricciones explícitas
- Código en TypeScript estricto.
- Comentarios y documentación estrictamente en español.
- NO realizar ningún `git commit` automático.

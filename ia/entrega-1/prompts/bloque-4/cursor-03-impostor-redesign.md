# Prompt — Bloque 4: Rediseño y correcciones Impostor

Rediseño y correcciones — Bloque 4: Juego Impostor

## Contexto

App Juntadas, React Native + Expo SDK 55 + TypeScript. Rama feature/bloque-4-impostor. Sistema de diseño en theme.ts.

## Fix 1 — GamesScreen independiente del tab bar

Crear `mobile/src/features/impostor/screens/GamesScreen.tsx`:

- Pantalla accesible desde el tab bar sin meetupId
- Impostor como única opción con badge "POPULAR"
- "Jugar ahora" → ImpostorStartScreen sin meetupId
- Sección "Más juegos próximamente" con card deshabilitada
- Actualizar MainNavigator y Routes.Games

## Fix 2 — meetupId opcional

- `meetupId` en params es `string | undefined`
- Con meetupId: pre-carga participantes confirmados como sugerencia
- Sin meetupId: lista vacía, siempre editable

## Fix 3 — Rediseño del sistema de diseño del juego

- GamesScreen e ImpostorStartScreen: `theme.colors.background`, cards blancas con `theme.shadows.sm`
- Hero card: violeta oscuro `#3B0764` como único elemento oscuro
- ImpostorRoleScreen: fondo inmersivo `#0F0F1A`
- AppButton primary donde corresponda

## Fix 4 — Lógica de palabra aleatoria

- Opción A: aleatorio todas las categorías (misterio)
- Opción B: categoría específica + palabra auto + "🔀 Otra palabra"
- Organizador nunca ve la palabra — solo "Palabra seleccionada ✓"
- Pista del impostor opcional manual

## Fix 5 — Mejoras UX

- Contador "Jugador X de Y" en ImpostorRoleScreen
- `usedWords[]` en sesión para evitar repetición
- Dots de progreso de revelación

## Restricciones

- No instalar dependencias sin informarlo
- No modificar AppNavigator.tsx, client.ts, env.ts
- No commits
- Comentarios en español
- StyleSheet.create y Routes

## Reporte al finalizar

- Archivos creados o modificados
- Flujo de selección de palabra
- Navegación tab bar → GamesScreen
- meetupId opcional
- Decisiones de diseño
- Puntos pendientes de validación

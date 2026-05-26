# Fix cursor-13 — Scroll inferior en inicio de Impostor

## Contexto

App Ronda App, React Native + Expo SDK 55 + TypeScript. Pantalla:
`mobile/src/features/impostor/screens/ImpostorStartScreen.tsx`.

## Prompt

Ahora necesito que arregles un problema con el scrollbar en el momento de
iniciar el juego impostor. El scrollbar vertical no baja lo suficiente para
poder presionar el boton de jugar o empezar juego.

Esto va al bloque debugging porque estamos con un fix.

## Diagnostico

`ImpostorStartScreen` renderiza `ImpostorTabBar`, que internamente usa el
`AppTabBar` fijo en la parte inferior. El `ScrollView` solo tenia
`paddingBottom: theme.spacing.xl`, por lo que el ultimo boton podia quedar
tapado por el tab bar y no habia suficiente espacio de scroll para alcanzarlo.

## Restricciones asumidas

- No modificar la navegacion ni el flujo del juego.
- No cambiar `AppTabBar`.
- Reutilizar el offset compartido del tab bar.
- Documentar el fix en Bloque Debugging.

## Archivos modificados

- `mobile/src/features/impostor/screens/ImpostorStartScreen.tsx`
- `ia/entrega-1/prompts/bloque-debugging/cursor-13-impostor-scroll-start.md` (este archivo)
- `ia/entrega-1/conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`
- `ia/entrega-1/indice_ia.md`

# Fix cursor-16 — Botones cortados en fin de ronda de Impostor

## Contexto

App Ronda App, React Native + Expo SDK 55 + TypeScript. Pantalla:
`ImpostorRoleScreen` (fase `playing` — fin de ronda).

## Prompt

Necesito que analices y corrijas un problema visual/responsivo en el flujo del
juego Impostor.

En la pantalla de resultado o fin de ronda aparecen dos acciones: "Nueva ronda"
y "Terminar". Cuando la ronda tiene muchos participantes, el contenido vertical
crece demasiado y el botón "Terminar" queda cortado o parcialmente fuera de
pantalla.

Comportamiento esperado: la pantalla debe adaptarse con scroll si hace falta y
los botones finales deben verse completos y ser tocables siempre.

Esto va al bloque debugging porque estamos con un fix.

## Diagnostico

La fase final (`session.phase === 'playing'`) metía la lista de jugadores y los
botones dentro del mismo `ScrollView`, pero:

- El `ScrollView` no tenía `flex: 1`, por lo que no acotaba bien el alto
  disponible entre header y tab bar.
- `paddingBottom` era solo `theme.spacing.xl`, insuficiente para el tab bar fijo
  (`APP_TAB_BAR_OFFSET = 80`).
- Con 10+ participantes, el scroll no alcanzaba a dejar visible "Terminar".

## Restricciones asumidas

- No modificar lógica del juego.
- Solo layout/comportamiento visual.
- Reutilizar `APP_TAB_BAR_OFFSET` del tab bar compartido.
- Documentar el fix en Bloque Debugging.

## Cambios aplicados

- Separar contenido variable (icono, títulos, lista de jugadores) en un
  `ScrollView` con `flex: 1`.
- Mover "Nueva ronda" y "Terminar" a un footer fijo inferior (`finalActions`).
- Reservar `paddingBottom: APP_TAB_BAR_OFFSET + theme.spacing.sm` en el footer
  para que los botones no queden tapados por el tab bar absoluto.

## Casos de prueba

- [ ] Ronda con 3 participantes — botones visibles.
- [ ] Ronda con 6 participantes — botones visibles, lista scrolleable.
- [ ] Ronda con 10+ participantes — "Terminar" siempre tocable.
- [ ] Emulador compacto — sin botones cortados.

## Archivos modificados

- `mobile/src/features/impostor/screens/ImpostorRoleScreen.tsx`
- `ia/entrega-1/prompts/bloque-debugging/cursor-16-impostor-fin-ronda-scroll.md` (este archivo)
- `ia/entrega-1/conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`
- `ia/entrega-1/indice_ia.md`

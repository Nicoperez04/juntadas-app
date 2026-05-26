# Fix cursor-15 — Jugadores manuales desaparecen al tocar Nueva ronda

## Contexto

App Ronda App, React Native + Expo SDK 55 + TypeScript. Feature Impostor:
`ImpostorStartScreen`, `ImpostorRoleScreen`, hook `useImpostor`.

## Prompt

Necesito que analices y corrijas un bug en el flujo del juego Impostor.

Contexto funcional:
Desde la pantalla Detalle de juntada se inicia el juego Impostor. Al entrar al
juego, la lista inicial de jugadores debe cargarse por defecto con los
participantes confirmados de la juntada. Esto actualmente funciona bien.

Problema:
Dentro del juego existe un botón para "Agregar jugador". Cuando agrego un jugador
manualmente desde esa pantalla, el jugador se agrega correctamente y puedo jugar
la ronda con esa persona incluida. El mínimo para jugar es de 3 personas.

El bug aparece al terminar la ronda: si toco "Nueva ronda", se vuelve a abrir el
menú/configuración de la ronda, pero desaparecen los jugadores agregados
manualmente. Solo vuelven a mostrarse los participantes confirmados originales de
la juntada.

Comportamiento esperado:
Los jugadores agregados manualmente dentro del juego deben mantenerse en la lista
mientras el usuario siga dentro del flujo del juego Impostor, incluso después de
terminar una ronda y tocar "Nueva ronda".

Importante:
- Los participantes confirmados de la juntada siguen siendo la base inicial.
- Los jugadores agregados manualmente no necesariamente son participantes reales.
- No deben guardarse obligatoriamente como participantes de la juntada.
- Deben persistir al reiniciar o crear una nueva ronda dentro de la misma sesión.
- No deben duplicarse si ya existen en la lista.
- La validación de mínimo 3 jugadores debe seguir funcionando.
- No romper el flujo de inicio desde Detalle de juntada.

Esto va al bloque debugging porque estamos con un fix.

## Diagnostico

`ImpostorStartScreen` tenía dos `useFocusEffect` en conflicto:

1. Uno restauraba jugadores desde la sesión Zustand al volver de "Nueva ronda".
2. Otro **siempre** recargaba desde Supabase los participantes confirmados cuando
   había `meetupId`, pisando la lista restaurada (incluidos jugadores manuales).

La carga async de Supabase completaba después del restore y dejaba solo los
confirmados originales.

## Restricciones asumidas

- No persistir jugadores manuales en Supabase ni en participantes de la juntada.
- Mantener Zustand como store de sesión local.
- Limpiar sesión al tocar "Terminar" para permitir reentrada desde cero.
- Documentar el fix en Bloque Debugging.

## Cambios aplicados

- Unificar la lógica de carga en un solo `useFocusEffect`:
  - Si hay sesión activa (`playing` / `revealing`): restaurar jugadores y config
    desde Zustand; **no** recargar desde Supabase.
  - Si no hay sesión y hay `meetupId`: cargar base inicial desde confirmados.
- Agregar `updateSessionPlayers` en `useImpostor` para sincronizar altas/bajas
  manuales en el setup entre rondas.
- Validar nombres duplicados (case-insensitive) al agregar jugador manual.
- `clearSession()` al tocar "Terminar" para que la próxima entrada recargue la
  base desde participantes confirmados.

## Casos de prueba

- [ ] Entrar desde detalle con 3 confirmados y jugar.
- [ ] Agregar 1 manual, jugar, Nueva ronda → sigue apareciendo.
- [ ] Agregar 2 manuales, jugar, Nueva ronda → ambos siguen apareciendo.
- [ ] Intentar agregar nombre repetido → toast de error, sin duplicado.
- [ ] Terminar juego, volver a entrar → lista inicial desde confirmados.

## Archivos modificados

- `mobile/src/features/impostor/screens/ImpostorStartScreen.tsx`
- `mobile/src/features/impostor/screens/ImpostorRoleScreen.tsx`
- `mobile/src/features/impostor/hooks/useImpostor.ts`
- `ia/entrega-1/prompts/bloque-debugging/cursor-15-impostor-jugadores-nueva-ronda.md` (este archivo)
- `ia/entrega-1/conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`
- `ia/entrega-1/indice_ia.md`

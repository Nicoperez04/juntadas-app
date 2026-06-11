# Bloque 4 — Correctivo: scroll de participantes en equipos aleatorios

## Contexto
Pantalla `TeamRandomizerScreen` — paso de configuración con lista de participantes y modo de división.

## Prompt

Ahora existe un error de visualización. Si yo agrego más de cuatro participantes, a partir del quinto, empieza a bloquear lo que sería la parte de modo de visión, es decir, se pone el label sobre ese modo de visión. Existe una distribución que está funcionando mal, lo que genera que los botones se desplacen hacia abajo y a partir del quinto participante se choquen los labels. Los participantes deberían poder deslizar a partir del tercero, es decir, agrego tres participantes y a partir de ahí debería ser un scroll bar que me permita ir hacia abajo. para ver el resto de los participantes agregados y tener la misma posibilidad de eliminarlos.

## Comportamiento esperado

- Con 1–2 participantes: lista normal sin scroll
- Con 3 o más participantes: la lista tiene altura fija (2 participantes visibles) y scroll vertical
- El scroll debe mostrar indicador cuando hay más participantes por ver
- Cada participante mantiene botón X para eliminar
- La sección "Modo de división" y el resto del formulario no se solapan ni se desplazan incorrectamente

## Alcance

- Modificar `src/features/games/screens/TeamRandomizerScreen.tsx`
- Usar `ScrollView` anidado con altura máxima fija para la lista de nombres
- No instalar dependencias nuevas
- No hacer commits

## Reglas

- Comentarios en español
- Sin TypeScript `any`
- Seguir tokens de `theme.ts`

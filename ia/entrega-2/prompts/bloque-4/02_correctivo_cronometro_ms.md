# Bloque 4 — Correctivo: milisegundos en cronómetro

## Contexto
Pantalla `TimerScreen` ya implementada con modos cuenta regresiva y cronómetro.

## Prompt

agrega los ms a la vista cuando arranco el cronometro, no en la cuenta regresiva

## Comportamiento esperado

- **Cuenta regresiva:** display en formato `MM:SS` (sin milisegundos)
- **Cronómetro en idle:** `00:00`
- **Cronómetro al iniciar (corriendo o pausado):** `MM:SS.mmm` con actualización fluida
- Al pausar, el valor queda congelado incluyendo los ms

## Alcance

- Modificar solo `src/features/games/screens/TimerScreen.tsx`
- No instalar dependencias nuevas
- No tocar cuenta regresiva salvo mantener formato `MM:SS`

## Reglas

- Comentarios en español
- Sin TypeScript `any`
- Seguir tokens de `theme.ts`
- No hacer commits

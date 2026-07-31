# Bloque 4 — Correctivo: input y lógica de división en equipos aleatorios

## Contexto
Pantalla `TeamRandomizerScreen` con flujo de configuración y resultado.

## Prompt

Actualmente existe un placeholder, en el cuantos equipos, que yo si quiero cambiar, por ejemplo, de dos equipos a tres, borro el dos y aparece uno automáticamente, es decir, si quiero colocar otro número, por ejemplo, si quiero colocar un tres para formar tres equipos, se me forman trece. pero, em... Otra cosa que dice mal es el hecho de que, por ejemplo, pongo cuántos equipos, doce, y tengo tres personas, me deja crearlo, pero y tengo en personas por equipo dos. Me crea tres equipos de una persona, lo cual funciona mal. Arregla ese placeholder para que funcione correctamente y luego revisa la lógica de personas por equipo y cantidad por equipo actual.

## Problemas a corregir

### Input numérico
- Al borrar el valor no debe prefijarse `1` automáticamente
- El usuario debe poder escribir un dígito nuevo sin concatenar (ej. `2` → borrar → `3`, no `13`)
- Placeholder visual separado del valor en estado

### Modo "Cantidad de equipos"
- No permitir más equipos que participantes (ej. 12 equipos con 3 personas → error)
- No recortar en silencio: mostrar mensaje y deshabilitar "Formar equipos"

### Modo "Personas por equipo"
- Con 3 personas y 2 por equipo → 2 equipos (uno de 2, uno de 1)
- Vista previa debe describir la distribución real

## Alcance

- Modificar `src/features/games/screens/TeamRandomizerScreen.tsx`
- No instalar dependencias nuevas
- No hacer commits

## Reglas

- Comentarios en español
- Sin TypeScript `any`
- Seguir tokens de `theme.ts`

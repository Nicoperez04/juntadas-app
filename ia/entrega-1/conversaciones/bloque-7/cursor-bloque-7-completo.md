# Conversacion Bloque 7 — Marca

**Herramienta:** ChatGPT / Codex  
**Fecha:** 26/05/2026  
**Tema:** Logo oficial de la aplicacion

---

## Resumen

Se reemplazo el icono generico de personas que usaba `AppLogo` por el asset
oficial `mobile/assets/logo-nobg.png`.

### Lo que se modifico

- `AppLogo` dejo de importar `Ionicons`.
- Se agrego `Image` de React Native.
- El componente carga `../../../assets/logo-nobg.png` con `require`.
- El logo mantiene las dimensiones definidas por `theme.components.logoSize`.
- Se usa `resizeMode="contain"` para respetar la proporcion del PNG.

### Decision tomada

No se agrego fondo ni borde al contenedor porque `logo-nobg.png` ya representa
la marca de la aplicacion y tiene fondo transparente.

---

## Sesion 1 — Reemplazo de icono por logo oficial

### Prompt

Ahora necesito que reemplacemos el icono que utiliza `AppLogo.tsx` con el
archivo `logo-nobg.png` que agregue recien, ese es el logo de la aplicacion,
esto tambien documentalo en la documentacion de ia bajo un nuevo bloque 7 -
marca.

### Respuesta

Se actualizo `AppLogo` para renderizar el PNG oficial de la app en lugar del
icono `people` de Ionicons.

### Cambios aplicados

- `mobile/src/shared/components/AppLogo.tsx` ahora importa `Image`.
- Se elimino el uso de `Ionicons`.
- Se agrego `const appLogo = require('../../../assets/logo-nobg.png')`.
- Se renderiza `<Image source={appLogo} resizeMode="contain" />`.
- El contenedor conserva `theme.components.logoSize`.

### Archivos modificados

- `mobile/src/shared/components/AppLogo.tsx`
- `ia/entrega-1/prompts/bloque-7/cursor-01-logo-app.md`
- `ia/entrega-1/conversaciones/bloque-7/cursor-bloque-7-completo.md`
- `ia/entrega-1/indice_ia.md`
- `ia/entrega-1/conversaciones/statistics.json`

---

## Sesion 2 — Logo en heading y nombre Ronda App

### Prompt

Ahora agrega el logo como icono a la izquierda del heading de "Mis juntadas" y
cambia el nombre de la aplicacion a Ronda App, en `app.json` esta.

Esto tambien documentalo bajo el mismo bloque.

### Respuesta

Se reforzo la marca en la pantalla principal y se actualizo el nombre visible de
la aplicacion.

### Cambios aplicados

- `MeetupHomeScreen` carga `mobile/assets/logo-nobg.png`.
- El heading "Mis juntadas" ahora se renderiza en una fila con el logo a la
  izquierda.
- El logo del header usa `resizeMode="contain"` y dimensiones fijas de 22x22.
- `mobile/app.json` cambia `expo.name` de `Juntadas` a `Ronda App`.

### Archivos modificados

- `mobile/src/features/meetups/screens/MeetupHomeScreen.tsx`
- `mobile/app.json`
- `ia/entrega-1/prompts/bloque-7/cursor-02-home-logo-app-name.md`
- `ia/entrega-1/conversaciones/bloque-7/cursor-bloque-7-completo.md`
- `ia/entrega-1/indice_ia.md`

# Fix cursor-14 — Logo en bienvenida y nombre Ronda App

## Contexto

App Ronda App, React Native + Expo SDK 55 + TypeScript. Pantallas afectadas:
`WelcomeScreen`, `AppLogo`, `MeetupHomeScreen` y configuración Expo en
`mobile/app.json`.

## Prompt

Debemos resolver el siguiente inconveniente. Ahora mismo sobre la pantalla de
bienvenida no aparece el logo correspondiente que esta en assets y el nombre de
la aplicacion debe ser Ronda App. El problema es que a mi no me aparece el logo
pero a mi compañero si, tambien hay que corregir el slug dentro del app.json
para que respete ese nombre.

Almacena este prompt dentro del bloque debugging con la informacion
correspondiente.

## Diagnostico

- `AppLogo` ya apuntaba a `mobile/assets/logo-nobg.png`, pero el `require()`
  estaba duplicado en varios archivos con rutas relativas distintas, lo que
  complica la resolución de assets entre entornos (Metro cache, OneDrive, etc.).
- `WelcomeScreen` seguía mostrando el texto hardcodeado **Juntadas** aunque
  `app.json` ya tenía `expo.name: "Ronda App"`.
- `app.json` mantenía `slug: "juntadas"`, desalineado con el nombre comercial.
- El síntoma reportado (icono genérico violeta con personas en lugar del PNG
  oficial) coincide con bundle cacheado de la versión anterior de `AppLogo`
  basada en `Ionicons`.

## Restricciones asumidas

- No instalar dependencias nuevas.
- Reutilizar `mobile/assets/logo-nobg.png`.
- Mantener `AppLogo` como componente compartido.
- Documentar el fix en Bloque Debugging.

## Cambios aplicados

- Se creó `src/shared/assets/appAssets.ts` como única fuente del `require()` del
  logo.
- `AppLogo` y `MeetupHomeScreen` consumen `appLogoSource` desde ese módulo.
- `WelcomeScreen` muestra `appConfig.app.name` (`Ronda App`) en lugar de
  `Juntadas`.
- `appConfig.app.name` se actualizó a `Ronda App`.
- `app.json`: `slug` cambiado de `juntadas` a `ronda-app`.

## Validación recomendada

Si el logo sigue sin verse tras el pull, limpiar cache de Metro:

```bash
cd mobile
npx expo start -c
```

Verificar también que `mobile/assets/logo-nobg.png` exista localmente y no sea
un placeholder de OneDrive sin descargar.

## Archivos modificados

- `mobile/src/shared/assets/appAssets.ts` (nuevo)
- `mobile/src/shared/components/AppLogo.tsx`
- `mobile/src/features/meetups/screens/MeetupHomeScreen.tsx`
- `mobile/src/features/auth/screens/WelcomeScreen.tsx`
- `mobile/src/config/appConfig.ts`
- `mobile/app.json`
- `ia/entrega-1/prompts/bloque-debugging/cursor-14-welcome-logo-app-name.md` (este archivo)
- `ia/entrega-1/conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`
- `ia/entrega-1/indice_ia.md`

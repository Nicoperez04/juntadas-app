# Fixes — Cierre del Bloque 1: Autenticación

## Contexto

El Bloque 1 de autenticación está casi completo. Quedan dos fixes puntuales antes de cerrar el bloque.

## Fix 1 — Traducir error de rate limit al español

En `mobile/src/features/auth/services/authService.ts` existe una función `mapAuthError` que traduce los errores de Supabase Auth al español. Falta mapear el error de rate limit que actualmente llega en inglés al usuario.

El mensaje original de Supabase es:

```
For security purposes, you can only request this after X seconds
```

Agregá este caso al `mapAuthError` para que detecte ese mensaje y lo reemplace por:

```
Por seguridad, esperá unos segundos antes de intentarlo nuevamente.
```

El match debe ser flexible — usá `includes('security purposes')` o similar para capturar el mensaje independientemente del número de segundos que indique.

## Fix 2 — Agregar CompleteProfileScreen a MainNavigator

En `mobile/src/navigation/MainNavigator.tsx` la pantalla `CompleteProfileScreen` figura como `() => null` placeholder. Importá la pantalla real desde `@/features/auth/screens/CompleteProfileScreen` y reemplazá el placeholder.

## Fix 3 — Verificación general de AuthNavigator y MainNavigator

Revisá ambos navigators y confirmá que:

- Todas las pantallas del flujo auth tienen su import real (no `() => null`)
- `CompleteProfileScreen` está en `MainNavigator` y no en `AuthNavigator`
- Las rutas usan siempre las constantes de `Routes`, nunca strings hardcodeados

## Restricciones

- No instalar dependencias nuevas
- No modificar ningún archivo fuera de los mencionados
- No hacer commits
- No modificar `AppNavigator.tsx`, `client.ts`, `env.ts`

## Al finalizar reportá

- Archivos modificados con path exacto
- Cómo quedó el `mapAuthError` con el nuevo caso agregado
- Estado final de `AuthNavigator` y `MainNavigator` — listá cada pantalla y si tiene import real o placeholder
- Cualquier inconsistencia encontrada

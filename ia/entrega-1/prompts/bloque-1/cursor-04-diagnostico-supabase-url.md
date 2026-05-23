# Diagnóstico — Error "Invalid path specified in request URL"

## Contexto

La app Juntadas está desarrollada con React Native + Expo SDK 55 + TypeScript. El backend es Supabase. Al intentar registrarse, iniciar sesión o enviar instrucciones de recuperación de contraseña, aparece el error: **"Invalid path specified in request URL"**.

El error se muestra en pantalla como un banner rojo, lo que indica que está siendo capturado correctamente por el manejo de errores del servicio. No es un crash.

El archivo `.env` tiene:

```
EXPO_PUBLIC_SUPABASE_URL=https://[proyecto].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Lo que necesito

Analizá los siguientes archivos **sin modificar nada todavía**:

- `mobile/src/lib/supabase/client.ts`
- `mobile/src/config/env.ts`
- `mobile/src/features/auth/services/authService.ts`
- `mobile/src/features/auth/hooks/useAuth.ts`

Para cada archivo respondé:

1. ¿Cómo se lee y usa la URL de Supabase?
2. ¿Hay algún lugar donde se modifique, concatene o transforme la URL?
3. ¿Hay algo que pueda estar causando que llegue una URL malformada al cliente de Supabase?

Al finalizar el análisis:

- Identificá la **causa raíz** del error
- Describí el **fix exacto** con el código corregido
- Listá **todos los archivos** que hay que modificar
- **No apliques ningún cambio todavía** — esperá confirmación

## Restricciones

- No modificar ningún archivo
- No hacer commits
- No instalar dependencias

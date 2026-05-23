# Fixes previos al test — Bloque 2: Juntadas

## Fix 1 — Formato de fecha en createMeetup

En `mobile/src/features/meetups/services/meetupService.ts`, la función `createMeetup` guarda la fecha en formato `DD/MM/YYYY` pero la columna `date` en PostgreSQL es de tipo `DATE` y espera `YYYY-MM-DD`.

Agregá una función interna `formatDateForDB(date: string): string` que convierta de `DD/MM/YYYY` a `YYYY-MM-DD` y usala antes de persistir. También agregá `formatDateForDisplay(date: string): string` que convierta de `YYYY-MM-DD` a `DD/MM/YYYY` para mostrar en pantalla.

## Fix 2 — Reemplazar expo-clipboard

En `MeetupDetailScreen.tsx` hay un TODO para implementar la copia al clipboard. `expo-clipboard` ya está instalado. Reemplazá el fallback del Share Sheet por:

```typescript
import * as Clipboard from 'expo-clipboard';
await Clipboard.setStringAsync(meetup.joinCode);
```

Después de copiar, mostrá feedback visual cambiando el ícono del botón de copiar por un checkmark durante 2 segundos, luego volvé al ícono original.

## Fix 3 — Verificar y corregir el join con profiles

En `getMeetupParticipants` del servicio, el join actual es:

```
.select('*, profiles!inner(full_name, username, avatar_url)')
```

Cambialo por la sintaxis explícita que especifica la columna de join:

```typescript
.select(`
  *,
  profiles:user_id (
    full_name,
    username,
    avatar_url
  )
`)
```

Esto evita que Supabase tenga que inferir la relación y es más robusto.

## Fix 4 — Comentarios en código nuevo

Revisá los 4 archivos nuevos del bloque y verificá que sigan las reglas de comentarios del proyecto: en español, explicando el por qué, con cabecera en cada función.

## Restricciones

- No instalar dependencias adicionales
- No hacer commits
- No modificar archivos fuera de los mencionados

## Al finalizar reportá

- Archivos modificados
- Cómo quedó la función de conversión de fechas
- Cómo quedó el feedback visual del clipboard
- Confirmación del fix del join con profiles

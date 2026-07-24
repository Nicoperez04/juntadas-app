# Prompt 02b — Bloque 4.3: Fix — mensaje específico al admin no llegaba

## Contexto
Rama feature/bloque-4-grupos. Al salir del grupo siendo Admin, se
esperaba el mensaje específico "El admin debe transferir su rol antes de
salir del grupo", pero se mostraba el genérico "No se pudo salir del
grupo".

## Diagnóstico

Se confirmó con un `console.log` temporal en el `catch` de
`groupService.leaveGroup()` que el error crudo devuelto por
`supabase.rpc('leave_group', ...)` es:

```json
{"code":"P0001","message":"El admin debe transferir su rol antes de salir del grupo", ...}
```

El texto es exactamente correcto — la migración SQL y el substring
buscado (`'debe transferir su rol'`) coinciden al 100%. El problema real
es la línea:

```typescript
const message = err instanceof Error ? err.message : '';
```

`err instanceof Error` **no siempre da `true` en Hermes/React Native**
para un `PostgrestError` lanzado por el RPC, aunque la clase
`PostgrestError` (en `@supabase/postgrest-js`) sí extiende `Error` a nivel
de código fuente TypeScript. El resultado: `message` queda en `''`, el
`.includes('debe transferir su rol')` nunca matchea, y siempre cae al
fallback genérico — silenciosamente, sin ningún error visible que delate
el problema.

## Tarea 1 — Fix aplicado en `groupService.leaveGroup()`

Se reemplazó el chequeo `instanceof Error` por acceso directo a la
propiedad `message` (duck typing), sin depender de la cadena de
prototipos:

```typescript
const message =
  err && typeof err === 'object' && 'message' in err
    ? String((err as { message: unknown }).message)
    : '';
```

El resto de la función (el `.includes('debe transferir su rol')` y el
fallback) no cambió.

## Tarea 2 — Relevamiento de `instanceof Error` en groupService.ts y meetupService.ts

Se buscaron todas las ocurrencias del patrón. **No se corrigió ninguna
otra — solo se reporta para decidir si amerita un prompt aparte.**

### `groupService.ts`
- **Línea 176 (`createGroup`)**: `message.includes('No se pudo generar')`.
  Bajo impacto: ese substring viene de un `new Error(...)` lanzado a mano
  en `generateJoinCode()` (no de un `PostgrestError`), así que no le
  afecta este bug. Pero si en el futuro se agrega un chequeo de mensaje
  específico para un error real de Supabase en este mismo catch (por
  ejemplo un choque de `join_code` único), quedaría expuesto al mismo
  problema.
- **Línea 517 (`leaveGroup`)**: ya corregida en este prompt.

### `meetupService.ts` — 11 ocurrencias, todas con el mismo patrón

Líneas 264, 347, 530, 692, 814, 887, 971, 1188, 1216, 1242, 1284. Todas
alimentan `message` hacia `translateError(message)` (o, en el caso de la
línea 530, hacia un chequeo directo de `.includes('cancelled')` /
`.includes('finished')`).

**El caso de mayor riesgo real es dentro de `translateError`:**

```typescript
if (message.includes('unique') && message.includes('meetup_participants')) {
  return 'El usuario ya es participante de esta juntada';
}
```

Esta rama está diseñada explícitamente para reconocer el texto crudo de
una violación de constraint único de Postgres — es decir, depende de que
`message` contenga el texto real de un `PostgrestError` lanzado por
Supabase, exactamente el mismo escenario que rompió `leaveGroup`. Si
`instanceof Error` falla ahí también, un usuario que dispare esa
condición de carrera vería el genérico "Ocurrió un error inesperado —
intentá de nuevo" en vez del mensaje específico "El usuario ya es
participante de esta juntada" — degradación silenciosa de UX, sin logs
de error visibles, igual que pasó acá.

El resto de las ramas de `translateError` (`'No se pudo generar'`, `'El
usuario ya es participante'`, `'Juntada no encontrada'`, `'La juntada
está cancelada'`) matchean contra mensajes que en la mayoría de los casos
provienen de `new Error(...)` propios del código (no de `PostgrestError`
crudo), así que su exposición real al bug es menor, pero no se puede
descartar sin revisar cada call site en detalle — varias de esas mismas
funciones también hacen `if (error) throw error` sobre errores crudos de
Supabase antes de llegar al mismo catch compartido.

**No se tocó nada de esto.** Es un hallazgo más amplio que el bug puntual
de este prompt — corresponde decidir en conjunto si vale un prompt
dedicado para migrar los 11 call sites de `meetupService.ts` (y el de
`groupService.createGroup`) al mismo patrón de duck typing.

## Tarea 3 — `console.log` de diagnóstico removido

Se quitó la línea `console.log('DEBUG leaveGroup raw error:', ...)`
agregada para el diagnóstico previo.

## Qué NO se tocó

- Migración SQL (`014_groups.sql`): sin cambios, ya confirmada correcta.
- Los 11 call sites de `meetupService.ts` ni el de `groupService.createGroup`:
  solo relevados, no corregidos.
- Sin commits.

## Cómo probarlo

1. Con una cuenta admin de un grupo, entrar al detalle y tocar "Salir del
   grupo" → confirmar en el modal → debe aparecer el toast con el mensaje
   exacto "El admin debe transferir su rol antes de salir del grupo" (ya
   no el genérico).
2. Con una cuenta miembro normal, confirmar que "Salir del grupo" sigue
   funcionando sin errores y navega a "Mis grupos".
3. Confirmar que no queda ningún `console.log` de debug en
   `groupService.ts`.

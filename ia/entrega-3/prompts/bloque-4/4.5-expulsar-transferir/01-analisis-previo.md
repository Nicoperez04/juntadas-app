# Prompt 01 — Bloque 4.5: Análisis previo — Expulsar y transferir administración

## Contexto
Rama feature/bloque-4-grupos. 4.1 a 4.4b commiteados y funcionando. Este
prompt implementa las dos acciones pendientes del menú "⋮" en
`GroupMembersScreen`: expulsar un miembro y transferir la administración.

## Tarea 1 — Análisis previo (sin tocar archivos)

### 1. `transferOrganizer` — confirmado, y confirmado que no se replica

`meetupService.transferOrganizer()` (`meetupService.ts:1312-1386`) hace 3
llamadas secuenciales separadas desde el cliente, sin transacción:

1. `UPDATE meetup_participants SET role='participant'` (degradar actual)
2. `UPDATE meetup_participants SET role='organizer'` (promover nuevo)
3. `UPDATE meetups SET created_by=...`

No hay un comentario literal sobre "estado parcial", pero la estructura
lo confirma: si el paso 2 falla después de que el paso 1 tuvo éxito, la
juntada queda sin organizador en `meetup_participants` mientras
`meetups.created_by` sigue apuntando al organizador viejo — estado
inconsistente real, sin rollback de los pasos anteriores.

**Confirmado: no se replica este patrón para grupos.** `transfer_group_admin`
va en una única función `SECURITY DEFINER`, atómica de verdad (ambos
UPDATEs dentro de la misma función PL/pgSQL).

### 2. Firma de `leave_group` — confirmada, mismo estilo para las nuevas

```sql
CREATE OR REPLACE FUNCTION public.leave_group(p_group_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$ ... $$;

GRANT EXECUTE ON FUNCTION public.leave_group(uuid) TO authenticated;
```

`expel_group_member`/`transfer_group_admin` siguen el mismo estilo:
mismo `RETURNS VOID`, mismo `SET search_path`, mismo patrón de
`RAISE EXCEPTION` con mensaje en español.

### 3. Estructura de `GroupMembersScreen.tsx`

El menú "⋮" ya existía por fila (`MemberRow`) con TODO explícito, sin
`onPress`. El set de estilos de modal (`modalOverlay`/`modalCard`/
`modalIconBoxWarning`/`modalIconBoxDanger`/etc.) que había en esta
pantalla se sacó en 4.4b (fix UI) junto con los botones "Compartir
código"/"Salir del grupo" — se vuelve a agregar acá (duplicación
deliberada, mismo criterio que `GroupDetailScreen`).

`MemberRow` era un componente puro sin acceso al usuario actual. Se
resuelve con `useCurrentUser()` para el `userId`, derivando el propio rol
directamente de `members` (ya trae la fila del usuario actual) — sin
query nueva ni traer `useGroupDetail` de vuelta a esta pantalla.

No existía ningún patrón de "menú desplegable anclado a un ícono" en el
proyecto (`MeetupHistoryScreen` usa swipe-to-reveal, no dropdown). Se
implementó como un `Modal` transparente posicionado con
`measureInWindow()` del ícono "⋮" tocado.

### Nota sobre `one_admin_per_group` — confirmado, sin violación intermedia

El índice único (`WHERE role = 'admin' AND left_at IS NULL`) se evalúa
al final de cada `UPDATE` individual (no es un constraint
`DEFERRABLE`). Como el primer `UPDATE` de `transfer_group_admin` degrada
al admin actual **antes** de que el segundo promueva al nuevo, la
cantidad de admins activos pasa de 1→0→1 y nunca hay dos filas con
`role='admin'` simultáneamente — el índice nunca se viola en ningún
punto de la función.

## Confirmación del usuario

Los 3 puntos fueron confirmados sin ajustes — se procedió a la Tarea 2
tal como estaba planteada en el prompt original.

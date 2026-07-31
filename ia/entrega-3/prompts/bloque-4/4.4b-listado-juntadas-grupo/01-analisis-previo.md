# Prompt 01 — Bloque 4.4b: Análisis previo — Listado de juntadas del grupo

## Contexto
Rama feature/bloque-4-grupos. 4.1-4.4 ya commiteados. Completa RF-41:
mostrar el listado real de juntadas de un grupo, reemplazando el
placeholder de la card "Juntadas" en `GroupDetailScreen`, y corrige el
ícono de esa card.

## Tarea 1 — Análisis previo (sin tocar archivos)

### 1. RLS — confirmado: no hace falta función/policy nueva

La policy `"meetups: select by join_code"` (`002_fix_rls_circular.sql:91-96`):

```sql
CREATE POLICY "meetups: select by join_code"
  ON meetups FOR SELECT
  USING (
    status = 'active'
    AND auth.uid() IS NOT NULL
  );
```

Las policies RLS se combinan con OR, así que esta se suma a `"meetups:
select as member or organizer"`. Resultado: cualquier usuario autenticado
puede leer cualquier juntada activa, sin validar membresía de grupo ni
participación — la condición es solo `status = 'active'`. Confirmado:
`.eq('group_id', groupId).eq('status', 'active')` funciona directo desde
el cliente, sin RLS nueva.

**Nota de seguridad (preexistente, no introducida por esta feature):**
esta policy ya permite hoy que cualquier usuario autenticado lea
cualquier juntada activa por ID o código, sea o no miembro del grupo —
comportamiento vigente desde 4.1 para el flujo "unirse por código". Se
menciona porque `getGroupMeetups` se apoya en esa misma permisividad.

### 2. Caso reportado — confirmado, es real

Para juntadas **no activas** (`cancelled`/`finished`), aplica
`"meetups: select as member or organizer"`: `created_by = auth.uid() OR
is_active_meetup_member(id)`. `is_active_meetup_member` exige una fila en
`meetup_participants` con `left_at IS NULL` **para esa juntada
puntual**. `invite_group_to_meetup` (4.4) solo corre una vez, al crear la
juntada, para los miembros activos del grupo *en ese momento*. Un usuario
que se une al grupo **después** de que esa juntada terminó o fue
cancelada nunca tuvo esa fila — no es organizador ni participante de esa
juntada específica — así que no la vería en el listado del grupo una vez
que deje de estar `active`. **Confirmado como caso real. No se
soluciona en este prompt, solo se reporta.**

### 3. Ícono de calendario

`GroupDetailScreen.tsx:237` usa `Ionicons name="calendar-outline"` en la
fila "Creado el...". Es el ícono a reusar en la card "Juntadas" (antes
`"game-controller"`, heredado del clon de `MeetupHomeScreen`).

### 4. Reuso de tipos de `getUserMeetups`

`meetupService.getUserMeetups()` sigue un patrón de 3 queries
(participaciones → juntadas → conteos) y arma `MeetupWithRole[]`. El
mapeo de fila (`mapMeetupRow`) y la interfaz `MeetupRow` **no están
exportados** de `meetupService.ts` — son privados a ese archivo. Como la
restricción es no tocar `meetupService.ts` salvo import de tipos, se
replica un mapeo equivalente pequeño en `groupService.ts`, importando
solo los tipos públicos (`Meetup`, `MeetupWithRole`, `MeetupStatus`,
`ParticipantRole`, `AttendanceStatus`) desde `../types` de meetups.

## Decisión de diseño confirmada con el usuario antes de la Tarea 2

Reuso del componente visual `MeetupCard`: estaba definido como `const`
privado dentro de `MeetupHomeScreen.tsx`. Se decidió **extraerlo a un
componente compartido** (`@/features/meetups/components/MeetupCard.tsx`)
en vez de duplicar el JSX/estilos en una card nueva — toca
`MeetupHomeScreen.tsx` solo para reemplazar la definición local por el
import, sin cambiar su lógica ni su render.

# Prompt 01 — Bloque 4.4: Análisis previo — Juntada de grupo

## Contexto
Rama feature/bloque-4-grupos. 4.1, 4.2, 4.3 ya commiteados y funcionando.
Este prompt agrega: crear una juntada desde el grupo (reutilizando
`CreateMeetupScreen` existente, con `group_id` opcional) que invita
automáticamente a todos los miembros activos del grupo, todos con
`attendance_status: 'pending'`.

## Tarea 1 — Análisis previo (sin tocar archivos)

### 1. Punto crítico de seguridad — confirmado: hace falta función SECURITY DEFINER

La policy `"meetup_participants: insert own"` (`001_initial_schema.sql:242-244`):

```sql
CREATE POLICY "meetup_participants: insert own"
  ON meetup_participants FOR INSERT
  WITH CHECK (user_id = auth.uid());
```

Sin excepciones: un usuario solo puede insertar su propia fila. Se revisaron
las únicas Edge Functions del proyecto (`send-push-notification`,
`delete-account`) y ninguna inserta en `meetup_participants` — no existe
mecanismo de inserción masiva ya establecido. Confirmado: hace falta la
función `SECURITY DEFINER` propuesta, mismo patrón que `leave_group`
(014) y `rejoin_group` (016).

Columnas reales de `meetup_participants` (`001_initial_schema.sql:82-94`):
`meetup_id`, `user_id`, `role` (enum `participant_role`: `organizer`/
`participant`), `attendance_status` (enum `attendance_status`: `pending`/
`confirmed`/`declined`), `left_at`. Constraint única: `uq_meetup_participant
UNIQUE (meetup_id, user_id)` — sin filtro por `left_at` (a diferencia de
`group_members_active_unique`), así que el `ON CONFLICT` de la función
apunta explícitamente a `(meetup_id, user_id)`.

### 2. Punto de enganche en `createMeetup()`

`meetupService.createMeetup()` (`meetupService.ts:216-267`) ya inserta al
creador como `organizer`/`confirmed` antes del `return` final, con rollback
manual si esa inserción falla. El enganche es **después de esa inserción
exitosa, antes del `return`**: si se pasa `groupId`, se llama al RPC
`invite_group_to_meetup`. A diferencia del rollback de la auto-inscripción
del organizador, un fallo en la invitación al grupo **no revierte la
juntada** — ya es válida sin invitados extra.

### 3. Navegación

`routes.ts`/`types.ts` definían `CreateMeetup: undefined`. Se agrega
`{ groupId?: string; groupName?: string } | undefined` — no rompe las
llamadas existentes sin params (tab "Crear"). `CreateMeetupScreen` no
tenía `useRoute()` porque hoy no recibe params.

## Decisión de diseño confirmada con el usuario antes de la Tarea 2

El botón "+ Crear juntada" se agrega **como botón nuevo separado**, sin
reemplazar la card "Juntadas" existente en `GroupDetailScreen` (que sigue
yendo al placeholder sin cambios).

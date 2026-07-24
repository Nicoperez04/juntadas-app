# Conversación Bloque 4 — Grupos

**Herramienta:** Claude Code CLI
**Rama:** feature/bloque-4-grupos

## Resumen

### Lo que se implementó

- **4.1 — Migración del modelo de datos de Grupos**: enum `group_role`
  (`admin`/`member`/`guest`), tablas `groups` y `group_members`, columna
  `group_id` opcional en `meetups`, función `SECURITY DEFINER`
  `get_user_group_role` y políticas RLS asociadas (migración
  `014_groups.sql`).
- **4.1b — Fix de escalamiento de privilegios** detectado en revisión
  previa a correr `014_groups.sql` en producción: `group_members_insert_self`
  forzada a `role = 'member'`, la policy de `UPDATE` abierta sobre la
  propia fila reemplazada por la función `leave_group()` (`SECURITY
  DEFINER`), y trigger `assign_group_creator_as_admin` para que el
  creador del grupo quede como admin automáticamente (ya no puede
  auto-insertarse como tal).
- **4.2 — Crear, unirse y listar grupos**: migración `015_groups_search_by_code.sql`
  (policy `groups_select_by_join_code`), feature completo
  `src/features/groups/` (types, schemas, service, hook, pantallas
  `CreateGroupScreen`/`JoinGroupScreen`/`ChooseJoinTypeScreen`/
  `GroupHomeScreen`) según diseño de Figma, card "Tus grupos" agregada
  en Home.
- **4.2b — Fix reactivar membresía**: migración `016_rejoin_group.sql`
  (`rejoin_group`, `SECURITY DEFINER`) para evitar filas duplicadas en
  `group_members` al volver a unirse a un grupo del que ya se había
  salido antes.
- **4.3 — Detalle y miembros de grupo**: `GroupDetailScreen`,
  `GroupMembersScreen`, `GroupPlaceholderScreen` (placeholder de
  Juntadas/Multimedia), salir del grupo, eliminar grupo (solo admin),
  mensaje específico cuando el admin intenta salir sin transferir su
  rol antes.
- **4.3b — Fix del mensaje específico de admin**: `instanceof Error` no
  confiable en Hermes/React Native para un `PostgrestError` real,
  reemplazado por duck typing en `leaveGroup()`; relevados (sin
  corregir) 11 call sites del mismo patrón en `meetupService.ts`.
- **4.4 — Juntada de grupo**: migración `017_invite_group_to_meetup.sql`
  (`invite_group_to_meetup`, `SECURITY DEFINER`), `createMeetup` acepta
  `groupId` opcional e invita automáticamente a todos los miembros
  activos del grupo como `pending`, botón "+ Crear juntada" en
  `GroupDetailScreen`.
- **4.4b — Listado real de juntadas del grupo**: `MeetupCard` extraído
  a componente compartido (antes privado de `MeetupHomeScreen`),
  `groupService.getGroupMeetups` (sin RLS nueva, se apoya en una policy
  existente de `meetups`), `GroupMeetupsScreen` nueva, ícono de la card
  "Juntadas" corregido a `calendar-outline`.
- **4.4b (fix UI)** — Ícono de "juntada(s) activa(s)" diferenciado del
  de "Creado el..." (calendar sólido vs. outline); botones redundantes
  "Compartir código"/"Salir del grupo" quitados de `GroupMembersScreen`
  (ya viven en `GroupDetailScreen`).
- **4.5 — Expulsar miembros y transferir administración**: migraciones
  `018_group_admin_actions.sql` → `019_group_admin_actions_fixes.sql`
  (`expel_group_member`/`transfer_group_admin`, ambas `SECURITY
  DEFINER`, atómicas), menú "⋮" con dropdown anclado en
  `GroupMembersScreen`, wrapper de cliente `groupService.expelMember`
  que notifica las cancelaciones automáticas de juntadas.
- **4.6 — Eliminación consciente del placeholder de Multimedia
  grupal**: sacada la card de `GroupDetailScreen`,
  `GroupPlaceholderScreen.tsx` eliminado por completo, 3 entradas de
  navegación removidas (`routes.ts`/`types.ts`/`MainNavigator.tsx`).
- **4.7 — Notificaciones de 5 eventos de grupo** (unión, expulsión,
  transferencia de admin, salida, invitación a juntada de grupo):
  migración `020_group_notifications.sql` (tipos nuevos + `group_id`
  en `notifications`), deep-link a `GroupDetail` en el panel de
  notificaciones, más dos rondas adicionales de fixes descubiertos en
  testing (migraciones `021`, `022`, `023`) para un bug de RLS
  todo-o-nada, un bug de shadowing de variable en PL/pgSQL, la
  asimetría entre `leave_group`/`expel_group_member`, y el fix
  arquitectónico de `GroupDetailScreen` para el caso "ya no soy
  miembro".

### Decisiones tomadas

- **3 roles de grupo (admin/member/guest), sin un rol de "moderador"
  intermedio.** El modelo de "grupo cerrado de amigos" no lo necesita;
  invitados puntuales se resuelven vía código de juntada individual, no
  vía un rol de grupo dedicado.
- **`guest` se mantiene en el enum pese a no tener ningún caso de uso
  activo.** El intento de eliminarlo se abortó por el costo/riesgo de
  sus dependencias en cascada frente al tiempo disponible (ver
  "Problemas encontrados").
- **Patrón `SECURITY DEFINER` como estándar para toda operación
  multiusuario sensible en Grupos** (`get_user_group_role`,
  `leave_group`, `rejoin_group`, `invite_group_to_meetup`,
  `expel_group_member`, `transfer_group_admin`, `get_group_member_ids`):
  nunca se abre una policy RLS genérica cuando la alternativa es una
  función acotada que valida el permiso puntual dentro de sí misma.
- **`transfer_group_admin` es atómico de verdad** (degradar al admin
  actual y promover al nuevo dentro de la misma función PL/pgSQL) —
  decisión consciente de **no** replicar el patrón de
  `meetupService.transferOrganizer` (3 `UPDATE`s secuenciales sin
  transacción desde el cliente, con riesgo real de estado parcial si
  falla a mitad de camino).
- **Reactivación de membresía (`rejoin_group`) en vez de insertar una
  fila nueva** cada vez que alguien vuelve a unirse a un grupo del que
  salió — evita duplicados históricos, mismo criterio que `joinMeetup`
  usa para juntadas.
- **Consolidación multimedia de grupo descartada del alcance final**
  (RF-32 en `docs/ENTREGA_1/alcance_e1.md`, posiblemente renumerado en
  `alcance_final.docx`), decisión consciente a 8 días del cierre:
  priorizar pulir lo que sí estaba en alcance (crear/unirse/listar,
  detalle, miembros, juntada de grupo, expulsar/transferir admin) antes
  que sumar una función nueva de agregación de multimedia.
- **Un valor de enum `notification_type` por evento, nunca un tipo
  genérico** — convención heredada de Bloque 2, extendida a los 5
  eventos de grupo de 4.7.
- **Deep-link de notificación a `GroupDetail` deliberadamente excluido
  para `GroupMemberExpelled`** — el destinatario ya no tiene acceso
  real a esa pantalla; los otros 3 tipos con `groupId` sí navegan.
- **`getGroupDetail` valida membresía primero, vía RPC `SECURITY
  DEFINER`, antes de ejecutar las demás lecturas** — decisión
  arquitectónica para no depender de que las policies RLS se comporten
  igual (fail explícito vs. fail silencioso en 0) entre una lectura
  single-row y varias lecturas multi-row.

### Problemas encontrados y resueltos

- **Bug de privilegio escalado en la v1 de la migración 018**
  (`!= 'admin'` sobre una subquery que devuelve `NULL` si `auth.uid()`
  no es miembro del grupo). En PL/pgSQL, `IF NULL THEN` se evalúa como
  `FALSE`, así que un usuario **no miembro** del grupo pasaba el
  chequeo de autorización sin excepción y podía ejecutar
  `expel_group_member`/`transfer_group_admin` igual. Corregido en 019
  reemplazando por `SELECT ... INTO variable` + `IS DISTINCT FROM
  'admin'`, que sí trata `NULL` como comparable.
- **Intento abortado de eliminar `'guest'` del enum `group_role`.**
  Postgres no permite `ALTER TYPE ... DROP VALUE`, así que la única vía
  era recrear el tipo completo. Se abortó tras revelar dependencias en
  cascada no vistas en un primer análisis: el índice único
  `one_admin_per_group` (predicate con literal `group_role`), la
  función `get_user_group_role` (`RETURNS group_role`), 5 policies que
  llaman a esa función, el `DEFAULT 'member'` de la columna, y una
  **sexta** policy (`group_members_insert_self`) que dependía de la
  columna `role` sin mencionar el nombre del tipo en ningún lado — no
  apareció en los greps por el string `"group_role"`. Se decidió no
  forzar la eliminación por el costo/riesgo frente al tiempo
  disponible; `'guest'` queda como dead code de dominio.
- **Bug de organizador huérfano al expulsar o salir de un grupo.**
  Encontrado en testing real en dispositivo (no en revisión de
  código): al expulsar a alguien que organizaba una juntada activa del
  grupo, quedaba con `left_at` seteado en `meetup_participants` pero
  seguía figurando como organizador (`meetup_participants.role` y
  `meetups.created_by` nunca se actualizaban), y `useMeetupDetail.ts`
  deriva `isOrganizer` de ese `role` sin filtrar por `left_at`. Fix en
  019 (para expulsión): antes de remover la participación, se busca
  otro participante activo para transferirle la organización, o se
  cancela la juntada si el expulsado era el único. La misma asimetría
  existía para la salida **voluntaria** (`leave_group` nunca tocaba
  `meetup_participants` en absoluto) — corregida más tarde, en 4.7, con
  la migración `023_leave_group_meetup_cleanup.sql`, replicando la
  misma lógica.
- **Bug de RLS todo-o-nada al notificar la salida de un grupo (4.7).**
  `getOtherActiveMemberIds` hacía un `SELECT` directo sobre
  `group_members`, gobernado por una policy que evalúa si **quien
  pregunta** sigue siendo miembro activo — no filtra fila por fila.
  Como `leave_group()` ya había dado de baja al propio usuario antes de
  que el cliente disparara la notificación, RLS bloqueaba la lectura
  completa (0 filas, sin error de Postgrest) y la notificación se
  enviaba a una lista vacía, en completo silencio. Fix: función
  `SECURITY DEFINER` dedicada (`get_group_member_ids`, migración 021),
  mismo patrón que `get_meetup_participant_ids` de Bloque 2.
- **Bug de shadowing de variable en PL/pgSQL (4.7).** El fix anterior
  introdujo uno nuevo: `get_group_member_ids` declaraba `RETURNS
  TABLE(user_id UUID)`, lo cual en PL/pgSQL expone `user_id` como
  variable de salida visible en **todo** el cuerpo de la función, no
  solo en el `RETURN QUERY` final. La validación de permisos
  comparaba `user_id = auth.uid()` sin calificar con alias de tabla —
  Postgres resolvió esa referencia ambigua a favor de la variable de
  salida (`NULL`, sin asignar), así que la comparación siempre daba
  `NULL` (falsy) y la función rechazaba a **cualquier** llamador, en
  cualquier caso. Se detectó porque, tras el fix anterior, tanto la
  notificación de unión como la de salida dejaron de funcionar a la
  vez — la pista de que ya no era un problema de timing/RLS sino algo
  que rompía la función entera. Corregido en la migración 022
  calificando la referencia (`gm.user_id = auth.uid()`).
- **Confusión de numeración de RF entre versiones del documento de
  alcance.** Se cuestionó si "Consolidación multimedia grupal" era
  RF-32 o RF-33 en `docs/ENTREGA_1/alcance_e1.md` — verificado
  directamente contra el documento dos veces, la cita original (RF-32)
  era la correcta; no había ninguna otra versión que respaldara RF-33.
  Por separado (y sin relación directa con esa disputa puntual),
  `alcance_final.docx` — mencionado pero no versionado en el repo, no
  verificable directamente — parece renumerar varios RF; 4.4b citaba
  "RF-41" para el listado de juntadas de grupo, un RF distinto en esa
  numeración final.
- **Bug del mensaje de error de admin no llegando (4.3b).** Al salir
  del grupo siendo admin, se esperaba el mensaje específico "El admin
  debe transferir su rol antes de salir del grupo", pero se mostraba el
  genérico "No se pudo salir del grupo". Causa: `err instanceof Error`
  no siempre da `true` en Hermes/React Native para un `PostgrestError`
  real lanzado por un RPC, aunque la clase sí extiende `Error` a nivel
  de código fuente TypeScript — el `message` quedaba en `''` y el
  `.includes(...)` nunca matcheaba, sin ningún error visible que
  delatara el problema. Corregido con duck typing
  (`typeof err === 'object' && 'message' in err`). Se relevó (sin
  corregir) el mismo patrón en 11 call sites de `meetupService.ts`.
- **Bug de filas duplicadas al reunirse a un grupo (4.2b).**
  `joinGroupByCode` insertaba una fila nueva en `group_members` cada
  vez, incluso si el usuario ya tenía una fila anterior con `left_at`
  seteado (por haber salido antes) — generaba duplicados históricos.
  Corregido con `rejoin_group()` (migración 016), que reactiva la fila
  existente en vez de insertar una nueva.
- **Fix arquitectónico de `GroupDetailScreen` para "ya no soy
  miembro" (4.7).** Reportado en testing: navegar al detalle de un
  grupo del que ya no se es miembro (notificación vieja o deep-link
  directo) mostraba una pantalla rota ("0 miembros", botón "Salir del
  grupo" de un grupo ajeno). Causa raíz: 3 lecturas RLS-protegidas
  dentro de `getGroupDetail`, con 2 comportamientos distintos ante un
  no-miembro — el `SELECT` de `groups` con `.single()` sí falla
  explícito (0 filas → error de Postgrest), pero los `count` de
  miembros y juntadas (sin `.single()`) devuelven `0` como resultado
  "exitoso", indistinguible de un dato real. Agravado por el
  `staleTime` de 30s del `QueryClient` global, que podía servir datos
  cacheados sin refetch alguno. Fix: `getGroupDetail` valida membresía
  primero vía `get_user_group_role` (RPC `SECURITY DEFINER`, no sujeto
  a esa inconsistencia) y corta con un código de error distinguible
  (`'NOT_MEMBER'`) antes de las otras 3 queries.
- **Lección repetida: errores de RPC ignorados silenciosamente.** Dos
  veces en el mismo sub-bloque (4.7) un fallo de RPC pasó
  completamente inadvertido porque el código cliente solo
  desestructuraba `data` y descartaba `error` —
  `supabase.rpc()` no lanza una excepción JS cuando el lado de Postgres
  falla, devuelve `{ data: null, error: {...} }` como resultado normal.
  Pasó primero con el `SELECT` bloqueado por RLS, y de nuevo con el
  propio RPC de reemplazo fallando por el shadowing. Se corrigió el
  patrón puntual en `getOtherActiveMemberIds` (loguea y documenta el
  `[]` como fallback ante error, no como comportamiento esperado).

### Deuda técnica pendiente

- **Consolidación multimedia de grupo** (RF-32 de `alcance_e1.md`,
  posiblemente distinto en `alcance_final.docx`): descartada
  conscientemente del alcance final — a definir si se retoma como
  mérito extra.
- **11 call sites de `instanceof Error` en `meetupService.ts`** (+ 1 en
  `groupService.createGroup`) con el mismo riesgo que rompió el
  mensaje de admin en 4.3 — relevados en 4.3b, no corregidos. El de
  mayor riesgo real está dentro de `translateError`, que reconoce el
  texto crudo de una violación de constraint único de Postgres.
- **Caso reportado en 4.4b, sin resolver:** un usuario que se une a un
  grupo *después* de que una juntada de ese grupo ya terminó o fue
  cancelada no la ve en el listado — la policy que aplica a juntadas
  no activas exige ser organizador o tener una fila propia en
  `meetup_participants` para esa juntada puntual, y
  `invite_group_to_meetup` solo inscribe a los miembros activos al
  momento de crear la juntada. Confirmado como caso real con el
  esquema actual; podría requerir una policy adicional basada en
  membresía histórica del grupo, o aceptarse como comportamiento
  esperado.
- **`'guest'` sigue en el enum `group_role`** sin ningún caso de uso
  activo en ningún flujo ni UI de la app — el intento de eliminación se
  abortó por las dependencias en cascada (ver "Problemas encontrados").
- **`deleteGroup` no notifica a los demás miembros** cuando un admin
  elimina el grupo — 4.7 cubrió 5 eventos específicos de grupo (unión,
  expulsión, transferencia, salida, invitación a juntada), pero
  "grupo disuelto" no es uno de ellos pese a haber quedado anotado como
  deuda desde el cierre de Bloque 2. Sin resolver.

## Conversación completa

A diferencia de Cursor, no hay transcripts JSONL locales de Claude Code
CLI para extraer automáticamente. Esta sección se compone pegando el
contenido real de cada archivo en `ia/entrega-3/prompts/bloque-4/` (4.1
a 4.7 y todas sus subcarpetas), en orden cronológico. El orden dentro de
4.1 sigue la secuencia real de eventos (el fix de escalamiento de
privilegios, `01b`, se aplicó sobre `014_groups.sql` después de que `02`
lo generara, revisado antes de correrlo en producción) en vez del orden
alfabético de archivos.

---

### 4.1-migracion-modelo-datos/01-analisis-previo.md

# Prompt 01 — Bloque 4.1: Análisis previo — Modelo de datos de Grupos

## Contexto
Rama actual: feature/bloque-4-grupos (creada desde entrega-3 actualizado).
Entrega 3, Bloque 4 (Grupos) — el feature más grande de la entrega. Este
sub-bloque (4.1) ataca solo la capa de base de datos, sin pantallas ni
componentes de UI.

Stack relevante: Supabase (PostgreSQL + RLS), migraciones en
supabase/migrations/ con numeración correlativa (última existente:
013_get_meetup_participant_ids.sql).

## Tarea 1 — Análisis previo (sin tocar archivos)

Antes de escribir nada, reportar:

1. Contenido completo de supabase/migrations/013_get_meetup_participant_ids.sql
   — confirmar el patrón exacto de función SECURITY DEFINER ya usado.
2. Contenido completo de supabase/migrations/002_fix_rls_circular.sql
   — entender el bug circular para no repetirlo con los roles de grupo.
3. Estructura de la tabla meetups actual (columnas exactas) — confirmar
   cómo agregar group_id sin conflicto.
4. Confirmar si existe algún enum de PostgreSQL ya definido en migraciones
   anteriores (buscar CREATE TYPE) — seguir la misma convención de nombres.

No modificar ningún archivo en esta tarea. Solo reportar lo encontrado y
esperar confirmación antes de continuar a la Tarea 2.

## Hallazgos

### 1. Patrón SECURITY DEFINER (013)
```sql
CREATE OR REPLACE FUNCTION public.get_meetup_participant_ids(...)
RETURNS TABLE(user_id UUID)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$ ... $$;

GRANT EXECUTE ON FUNCTION public.get_meetup_participant_ids(uuid, uuid) TO authenticated;
```
Patrón con 3 elementos de convención: prefijo `public.` explícito,
`SET search_path = public`, y `GRANT EXECUTE ... TO authenticated` después
del `CREATE FUNCTION`.

### 2. Bug circular (002)
Una política RLS de meetup_participants hacía SELECT sobre la propia tabla
dentro de su cláusula USING, causando "infinite recursion detected in
policy for relation meetup_participants". La solución fue una función
SECURITY DEFINER (is_active_meetup_member) que consulta la tabla
bypaseando RLS, más políticas separadas para fila propia (sin subquery) y
co-participantes (vía función).

### 3. Estructura de meetups (001_initial_schema.sql)
```
id, title, description, date, time, location, estimated_cost,
status (meetup_status), join_code, created_by (FK → profiles.id ON DELETE CASCADE),
created_at, updated_at, cancelled_at
```
Sin conflicto de nombre con group_id. Convención observada: todos los FKs
created_by/user_id/uploaded_by usan ON DELETE CASCADE, y toda columna FK
tiene un índice explícito asociado.

### 4. Enums existentes
meetup_status, participant_role, attendance_status, game_status,
media_type (001), notification_type (009). Convención: nombre singular
snake_case terminado en _status/_role/_type. group_role sigue esta
convención sin conflicto.

## Decisión — ajustes aplicados sobre la propuesta original
1. Función renombrada a public.get_user_group_role + SET search_path = public.
2. Agregado GRANT EXECUTE ON FUNCTION public.get_user_group_role(uuid, uuid) TO authenticated.
3. ON DELETE CASCADE agregado a groups.created_by y group_members.user_id.
4. Índices agregados: idx_groups_created_by, idx_group_members_group_id,
   idx_group_members_user_id, idx_meetups_group_id.
5. Trigger trg_groups_updated_at agregado (reutiliza update_updated_at()),
   para consistencia con profiles/meetups/meetup_participants.

Confirmado por el usuario para proceder a la Tarea 2.

---

### 4.1-migracion-modelo-datos/02-implementacion.md

# Prompt 02 — Bloque 4.1: Implementación — Migración 014_groups.sql

## Tarea 2 — Implementación: Migración 014_groups.sql

Crear el archivo supabase/migrations/014_groups.sql con enum group_role,
tablas groups y group_members, columna group_id opcional en meetups,
función SECURITY DEFINER get_user_group_role y políticas RLS asociadas.
Ajustar nombres/columnas exactos según lo confirmado en la Tarea 1
(01-analisis-previo.md) en vez de inventar convenciones nuevas.

## Qué NO tocar
- No modificar ninguna migración existente (001-013)
- No tocar meetupService.ts ni ningún archivo de src/features/meetups/
- No modificar app.json, tsconfig.json, package.json
- No crear ningún archivo de src/features/groups/ todavía (sub-bloque 4.2)
- No hacer commit

## Resultado

Archivo creado: `supabase/migrations/014_groups.sql`

Contenido (resumen):
- `CREATE TYPE group_role AS ENUM ('admin', 'member', 'guest')`
- Tabla `groups` (id, name, description, cover_url, join_code, created_by,
  created_at, updated_at) + índice `idx_groups_created_by`
- Tabla `group_members` (id, group_id, user_id, role, joined_at, left_at)
  + índices `idx_group_members_group_id`, `idx_group_members_user_id`
  + índice único parcial `group_members_active_unique` (group_id, user_id)
  WHERE left_at IS NULL
- `ALTER TABLE meetups ADD COLUMN group_id UUID REFERENCES groups(id)`
  + índice `idx_meetups_group_id`
- Trigger `trg_groups_updated_at` reutilizando `update_updated_at()`
- Función `public.get_user_group_role(p_group_id, p_user_id)` —
  `SECURITY DEFINER`, `SET search_path = public`, `STABLE` — con su
  `GRANT EXECUTE ... TO authenticated` correspondiente
- RLS habilitado en `groups` y `group_members` con policies:
  - `groups_select` / `groups_update` / `groups_delete` / `groups_insert`
  - `group_members_select` / `group_members_insert_self` /
    `group_members_update_self_leave` / `group_members_admin_manage`

## Diferencias aplicadas respecto a la propuesta original del prompt

Todas surgen del análisis previo (ver 01-analisis-previo.md) para replicar
las convenciones ya establecidas en el proyecto, no por preferencia propia:

1. Función renombrada `get_user_group_role` → `public.get_user_group_role`
   y agregado `SET search_path = public` (patrón de 013 y 002).
2. Agregado `GRANT EXECUTE ON FUNCTION public.get_user_group_role(uuid, uuid)
   TO authenticated;` (013 lo hace explícitamente; sin este grant, clientes
   con rol `authenticated` no podrían invocar la función desde políticas
   evaluadas en su propio contexto de sesión con seguridad consistente
   con el resto del proyecto).
3. `ON DELETE CASCADE` agregado a `groups.created_by` y
   `group_members.user_id` (coincide con `meetups.created_by`,
   `impostor_games.created_by`, `meetup_participants.user_id`, etc.)
4. Índices agregados para las 4 columnas FK que no los tenían en la
   propuesta original: `idx_groups_created_by`, `idx_group_members_group_id`,
   `idx_group_members_user_id`, `idx_meetups_group_id` (toda columna FK en
   el esquema existente tiene su índice — ver 001_initial_schema.sql).
5. Trigger `trg_groups_updated_at` agregado, ya que `groups` tiene columna
   `updated_at` igual que `profiles`/`meetups`/`meetup_participants`, que
   sí tienen su trigger correspondiente en 001.

No se modificó ninguna migración existente (001-013). No se tocó
meetupService.ts ni archivos de src/features/meetups/. No se creó nada en
src/features/groups/. No se hizo commit.

## Cómo probarlo

1. Abrir Supabase Dashboard → SQL Editor.
2. Pegar y ejecutar el contenido completo de
   `supabase/migrations/014_groups.sql`.
3. Verificar que no rompe la lectura/escritura de `meetups` existente:
   ```sql
   -- Debe seguir devolviendo las juntadas del usuario logueado
   SELECT id, title, group_id FROM meetups LIMIT 5;
   ```
   (`group_id` debe existir y venir NULL en las juntadas actuales, sin
   afectar las policies `meetups: select as member or organizer` ya
   vigentes, que no dependen de la nueva columna.)
4. Probar el flujo básico de grupos con un usuario autenticado:
   ```sql
   INSERT INTO groups (name, join_code, created_by)
   VALUES ('Grupo de prueba', 'ABC123', auth.uid())
   RETURNING id;

   INSERT INTO group_members (group_id, user_id, role)
   VALUES ('<id devuelto arriba>', auth.uid(), 'admin');

   SELECT * FROM groups; -- debe verse a sí mismo por groups_select
   ```
5. Confirmar que un segundo usuario sin membresía no ve el grupo
   (`groups_select` debe filtrar correctamente vía
   `get_user_group_role`).

---

### 4.1-migracion-modelo-datos/01b-fix-escalamiento-privilegios.md

# Prompt 01b — Bloque 4.1: Fix escalamiento de privilegios en group_members

## Contexto
Rama actual: feature/bloque-4-grupos. Archivo supabase/migrations/014_groups.sql
ya generado (Tarea 4.1) pero todavía no ejecutado en Supabase — revisión
previa a correr el SQL, no una corrección post-testeo.

## Problema identificado

Dos políticas RLS en group_members permitían escalamiento de privilegios:

1. **group_members_insert_self**: validaba `user_id = auth.uid()` pero no
   restringía el valor de `role` insertado. Cualquier usuario autenticado
   podía insertarse como `admin` en cualquier grupo existente, sin pasar
   por el join_code.

2. **group_members_update_self_leave**: pensada para que un usuario marque
   su propio `left_at` (salir del grupo), pero al no restringir columnas,
   permitía que cualquier miembro hiciera `UPDATE ... SET role = 'admin'`
   sobre su propia fila.

## Corrección aplicada

### 1. group_members_insert_self — ahora fuerza role = 'member'
```sql
CREATE POLICY "group_members_insert_self" ON group_members FOR INSERT
  WITH CHECK (user_id = auth.uid() AND role = 'member');
```
El auto-registro (unirse por join_code) solo puede crear la fila como
`member`, nunca `admin` ni `guest`.

### 2. group_members_update_self_leave — eliminada
Reemplazada por la función `public.leave_group(p_group_id)`
(SECURITY DEFINER, mismo patrón que `get_user_group_role` /
`is_active_meetup_member`), que:
- Verifica que el usuario no sea `admin` del grupo (si lo es, exige
  transferir el rol antes — se implementa en Bloque 4.2).
- Actualiza únicamente `left_at = now()` de la fila del propio usuario,
  sin exponer ninguna columna a modificación arbitraria por UPDATE directo.

```sql
CREATE OR REPLACE FUNCTION public.leave_group(p_group_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT role FROM group_members WHERE group_id = p_group_id AND user_id = auth.uid() AND left_at IS NULL) = 'admin' THEN
    RAISE EXCEPTION 'El admin debe transferir su rol antes de salir del grupo';
  END IF;

  UPDATE group_members
  SET left_at = now()
  WHERE group_id = p_group_id AND user_id = auth.uid() AND left_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.leave_group(uuid) TO authenticated;
```

### 3. Efecto colateral resuelto: el creador del grupo necesita ser admin

Como `group_members_insert_self` ya no permite crear filas con
`role != 'member'`, la app ya no puede insertar al creador del grupo como
`admin` directamente. Se agrega un trigger que lo hace automáticamente al
crear el grupo:

```sql
CREATE OR REPLACE FUNCTION public.assign_group_creator_as_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_assign_group_creator_as_admin
  AFTER INSERT ON groups
  FOR EACH ROW EXECUTE FUNCTION public.assign_group_creator_as_admin();
```

## Qué NO se tocó
- Resto de 014_groups.sql: tablas, índices, get_user_group_role,
  políticas de groups (select/update/delete/insert), group_members_select,
  group_members_admin_manage.
- Migraciones 001-013.
- Sin commits.

## Archivo modificado
- supabase/migrations/014_groups.sql (aún no ejecutado en Supabase)

## Cómo probarlo
1. Ejecutar el contenido completo de 014_groups.sql en Supabase Dashboard
   → SQL Editor.
2. Crear un grupo con un usuario A → verificar que el trigger lo insertó
   automáticamente como 'admin' en group_members (no hace falta INSERT
   manual desde la app).
3. Intentar como usuario B: `INSERT INTO group_members (group_id, user_id, role) VALUES (<id>, auth.uid(), 'admin')`
   → debe fallar (WITH CHECK viola role = 'member').
4. Como usuario B ya miembro: intentar `UPDATE group_members SET role = 'admin' WHERE user_id = auth.uid()`
   → debe fallar (ya no existe policy de UPDATE genérica sobre la propia fila).
5. Como usuario B miembro: `SELECT leave_group('<group_id>')` → debe
   marcar left_at correctamente.
6. Como usuario A admin: `SELECT leave_group('<group_id>')` → debe
   lanzar la excepción "El admin debe transferir su rol antes de salir
   del grupo".

---

### 4.2-crear-unirse-listar/01-analisis-previo.md

# Prompt 01 — Bloque 4.2: Análisis previo — Crear, unirse y listar grupos

## Contexto
Rama actual: feature/bloque-4-grupos. Migración 014_groups.sql ya ejecutada
en Supabase (tablas groups/group_members, RLS, función
get_user_group_role, trigger de admin automático, leave_group() — todo
probado y funcionando, incluida la corrección de escalamiento de
privilegios documentada en 01b-fix-escalamiento-privilegios.md).

Este prompt implementa: crear grupo, unirse por código, listar "Mis
grupos". Sin pantallas de gestión de miembros todavía (eso es 4.3).

## Tarea 1 — Análisis previo (sin tocar archivos)

1. Cómo meetupService.ts resuelve la búsqueda de una juntada por
   join_code antes de que el usuario sea participante.
2. Contenido de generateJoinCode en meetupService.ts.
3. Estructura exacta de useCurrentUser.
4. Estructura de carpetas de src/features/meetups/ para replicar 1:1 en
   src/features/groups/.

## Hallazgos

### 1. Búsqueda por join_code — el prompt asumía una función SECURITY DEFINER; el patrón real es otro

meetupService no usa una función SECURITY DEFINER para esto. El patrón
real es una policy RLS adicional y permisiva en meetups
(002_fix_rls_circular.sql):

```sql
CREATE POLICY "meetups: select by join_code"
  ON meetups FOR SELECT
  USING (status = 'active' AND auth.uid() IS NOT NULL);
```

Esto habilita a cualquier usuario autenticado a leer la fila completa de
cualquier meetup activo (no solo por código — el filtro por join_code lo
aplica el cliente en la query). Como groups no tiene columna status, el
equivalente exacto es abrir el SELECT a cualquier usuario autenticado sin
condición adicional.

Se presentaron dos opciones al usuario (replicar el patrón real de
meetups vs. mantener la función SECURITY DEFINER acotada que proponía el
prompt original) y se confirmó **replicar el patrón real de meetups**.

### 2. generateJoinCode — confirmado sin cambios
6 caracteres, charset `ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`, hasta 5
intentos verificando unicidad. groupService.generateJoinCode reutiliza el
mismo charset con el mismo criterio de reintento, pero con prefijo fijo
`G` + 5 caracteres al azar, según lo pedido en el prompt.

### 3. useCurrentUser
`src/shared/hooks/useCurrentUser.ts` expone `{ userId, user, session,
isLoading }` vía TanStack Query sobre `supabase.auth.getSession()`.
Reutilizado tal cual en useGroups.ts, sin duplicar lógica.

### 4. Estructura real de src/features/meetups/ — divergencias con lo propuesto en el prompt

| Propuesto en el prompt | Convención real en meetups | Decisión |
|---|---|---|
| schemas/groupSchema.ts | schemas/meetupSchemas.ts (plural) | Se usó groupSchemas.ts |
| hooks/useCreateGroup.ts, useJoinGroup.ts, useMyGroups.ts (3 archivos) | un solo hooks/useMeetups.ts con varios hooks exportados | Se usó un solo hooks/useGroups.ts |
| screens/GroupListScreen.tsx | screens/MeetupHomeScreen.tsx (el listado principal se llama Home) | Se usó screens/GroupHomeScreen.tsx |
| (no mencionado) | types.ts en la raíz del feature | Se agregó src/features/groups/types.ts |

Se presentaron ambas opciones al usuario (nombres tal cual el prompt vs.
convención real de meetups) y se confirmó **usar la convención real de
meetups**.

## Decisiones confirmadas por el usuario antes de la Tarea 2

1. RLS de búsqueda por código: policy permisiva `groups_select_by_join_code`
   (replica exacta del patrón de meetups), no función SECURITY DEFINER.
2. Nombres de archivo: convención real de meetups (`groupSchemas.ts`
   plural, un solo `useGroups.ts`, `GroupHomeScreen.tsx`, `types.ts`).

---

### 4.2-crear-unirse-listar/02-implementacion.md

# Prompt 02 — Bloque 4.2: Implementación — Crear, unirse y listar grupos

## Diseño usado

El prompt original citaba una página "MockUps" con zona "Grupos" que no
existía en el archivo de Figma configurado en theme.ts
(`Iu9DQtttfYfcuWrFqmJuwb`, página única "Wireframes"). El usuario aportó
la URL correcta:
`https://www.figma.com/design/Iu9DQtttfYfcuWrFqmJuwb/Diseño-de-Wireframes---MockUps---Ronda-App?node-id=73-23`

Frames usados (obtenidos vía Figma MCP `get_design_context`):

- `267:10` — Mockup - Crear Grupo
- `273:8` — Mockup - Elegir Tipo de Union
- `267:141` — Mockup - Unirse a Grupo
- `280:3` — Mockup - Mis grupos

(`267:448` Detalle de Grupo y `267:614` Miembros del Grupo existen en el
mismo archivo pero son del sub-bloque 4.3, fuera de este alcance.)

## Archivos creados

Migración:
- `supabase/migrations/015_groups_search_by_code.sql` — policy
  `groups_select_by_join_code` (SELECT abierto a cualquier usuario
  autenticado), replicando el patrón real de meetups confirmado en la
  Tarea 1.

Feature `src/features/groups/` (mobile):
- `types.ts` — `Group`, `GroupRole`, `GroupWithRole`, `GroupMemberPreview`,
  `JoinGroupFormData`
- `schemas/groupSchemas.ts` — `createGroupSchema`, `joinGroupSchema`
- `services/groupService.ts` — `createGroup`, `findGroupByJoinCode`,
  `joinGroupByCode`, `getMyGroups`
- `hooks/useGroups.ts` — hook combinado (lista + mutaciones), mismo
  patrón que `useMeetups`
- `components/GroupCardSkeleton.tsx` — skeleton de carga para la lista
- `screens/CreateGroupScreen.tsx`
- `screens/JoinGroupScreen.tsx`
- `screens/ChooseJoinTypeScreen.tsx`
- `screens/GroupHomeScreen.tsx` ("Mis grupos")

Navegación:
- `src/navigation/routes.ts` — rutas `ChooseJoinType`, `GroupHome`,
  `CreateGroup`, `JoinGroup`
- `src/navigation/types.ts` — entradas correspondientes en
  `MainStackParamList`
- `src/navigation/MainNavigator.tsx` — registro de las 4 pantallas nuevas

Sistema de diseño:
- `src/shared/constants/theme.ts` — se agregaron `colors.info` /
  `colors.infoLight` (azul), siguiendo el mismo patrón que
  `primary`/`primaryLight`. Es el color que Figma usa para diferenciar
  visualmente las acciones de "Grupo" (azul) de las de "Juntada"
  (violeta) en los mockups Elegir Tipo de Union y Mis grupos.

## Por qué se tocaron 2 archivos de `src/features/meetups/` pese a la restricción del prompt

El prompt pide explícitamente "No modificar meetupService.ts ni nada de
src/features/meetups/" pero al mismo tiempo pide, en la misma Tarea 2:
"Agregar card 'Tus grupos' en HomeScreen" y "Agregar pantalla Mockup -
Elegir Tipo de Union como paso intermedio en el tab Unirse". HomeScreen es
`MeetupHomeScreen.tsx`, que vive en `src/features/meetups/screens/`, y el
tab bar "Unirse" está definido tanto ahí (una copia local del tab bar) como
en el componente compartido `AppTabBar.tsx`. Ambos cambios son necesarios
para que el punto de entrada pedido funcione, así que se interpretó la
restricción como "no tocar la lógica de negocio de juntadas" y se hicieron
los dos cambios mínimos e indispensables:

1. `src/shared/components/AppTabBar.tsx`: el tab "join" ahora navega a
   `Routes.ChooseJoinType` en vez de `Routes.JoinMeetup` directamente.
   `JoinMeetupScreen.tsx` no se tocó — sigue siendo el mismo destino desde
   el nuevo paso intermedio.
2. `src/features/meetups/screens/MeetupHomeScreen.tsx`:
   - Se corrigió el `handleTabPress` local (esta pantalla no reutiliza
     `AppTabBar`, tiene su propio tab bar duplicado) para que "join"
     navegue también a `Routes.ChooseJoinType`.
   - Se agregó una card "Tus grupos" debajo de las dos quick actions
     existentes, que navega a `Routes.GroupHome`.

No se tocó `meetupService.ts` ni ningún archivo de
`src/features/meetups/hooks|schemas|services|types.ts`.

## Otras decisiones tomadas por diferencias/ambigüedades encontradas

1. **Portada de grupo (cover) no implementada en 4.2.** El mockup
   "Crear Grupo" muestra un selector de portada opcional, igual al de
   `CreateMeetupScreen`. Subir esa imagen requiere un bucket de Storage
   dedicado para grupos (análogo a `005_meetup_cover.sql` para
   `meetup-covers`), que no estaba autorizado en el alcance de este
   prompt (que solo preveía la migración 015 de RLS). Se implementó el
   formulario sin el picker de portada; `groups.cover_url` queda en
   `NULL` al crear. Queda pendiente para un sub-bloque futuro (junto con
   4.3, que también necesitará Storage para fotos de grupo).
2. **Cards de "Mis grupos" no son interactivas.** El mockup no define una
   acción de tap, y la pantalla de detalle de grupo es explícitamente del
   sub-bloque 4.3. Se dejaron como `View` informativo en vez de
   `Pressable` con destino inexistente.
3. **"Ver historial" del mockup "Mis grupos" se omitió.** No hay un
   historial de grupo definido todavía ni una pantalla destino; agregar
   un enlace sin funcionalidad real se consideró peor que omitirlo.
4. **Rejoin tras salir de un grupo:** a diferencia de `joinMeetup` (que
   reactiva la fila existente con `left_at = null`), `joinGroupByCode`
   inserta una fila nueva en `group_members`. Motivo: desde el fix de
   escalamiento de privilegios (01b), ya no existe una policy de UPDATE
   genérica sobre la propia fila (solo `leave_group()` vía función, y
   `group_members_admin_manage` para admins). El índice único parcial
   `group_members_active_unique` solo protege duplicados con
   `left_at IS NULL`, así que una fila nueva convive sin conflicto con
   las filas históricas de una salida anterior.
5. **Íconos:** los assets de Figma son SVGs propios exportados, no
   nombres de Ionicons. Se eligieron íconos de Ionicons semánticamente
   equivalentes (`people`, `person-add-outline`, `enter`), siguiendo el
   mismo criterio que ya usa `JoinMeetupScreen` (su ilustración usa
   `enter`, no el asset original de Figma).

## Cómo probarlo

1. Correr `015_groups_search_by_code.sql` en Supabase Dashboard → SQL
   Editor (después de confirmar que 014 ya está aplicada).
2. `npx tsc --noEmit` en `mobile/` — sin errores (verificado).
3. Levantar la app (`npm run start` en `mobile/`) y probar el flujo con
   dos cuentas:
   - Cuenta A: Home → card "Tus grupos" → "Crear grupo" → completar
     nombre → confirmar que aparece en "Mis grupos" con badge "Admin".
   - Copiar el `join_code` generado (revisar en Supabase Table Editor,
     columna `groups.join_code`, ya que la UI de 4.2 no expone un botón
     "compartir código" — queda para 4.3 junto con el detalle de grupo).
   - Cuenta B: tab "Unirse" (o card "Unirse a juntada" del tab bar) →
     pantalla "Unirse" → "Unirse a un Grupo" → ingresar el código → 6
     dígitos → confirmar que redirige a "Mis grupos" y el grupo aparece
     con badge "Miembro".
   - Confirmar en ambas cuentas que el conteo de miembros, el stack de
     avatares con iniciales y "X personas" coinciden.
   - Confirmar que el flujo existente "Unirse a una Juntada" desde la
     misma pantalla intermedia sigue funcionando sin cambios.

---

### 4.2-crear-unirse-listar/02b-fix-reactivar-membresia.md

# Prompt 02b — Bloque 4.2: Fix — reactivar membresía al volver a unirse

## Contexto
Rama actual: feature/bloque-4-grupos. groupService.joinGroupByCode ya
funciona pero inserta una fila nueva en group_members cada vez que
alguien se une, incluso si ya tuvo una fila anterior marcada con left_at
(por haber salido antes). Esto genera filas duplicadas históricas para el
mismo usuario+grupo.

## Problema

Comparado con el patrón real de joinMeetup en meetupService.ts: ahí, antes
de insertar, se verifica si existe una fila previa (activa o con left_at)
y si existe con left_at no nulo, se reactiva (UPDATE ... SET left_at =
null) en vez de insertar una nueva. joinGroupByCode no hacía esta
verificación — siempre insertaba.

## Restricción de RLS

Las policies actuales de group_members (014 + fix de escalamiento de
privilegios de 4.1b) no incluyen una policy de UPDATE genérica sobre la
propia fila — se sacó deliberadamente para cerrar el vector de
auto-ascenso a admin (ver 01b-fix-escalamiento-privilegios.md). Solo
existen group_members_admin_manage (admin sobre cualquier fila) y
funciones SECURITY DEFINER dedicadas (leave_group). Por eso la
reactivación no puede hacerse con un UPDATE directo desde el cliente y
necesita una función SECURITY DEFINER dedicada, mismo patrón que
leave_group.

## Tarea 1 — Análisis previo (confirmado)

1. Firma de leave_group (014_groups.sql): `RETURNS VOID`, `LANGUAGE
   plpgsql`, `SECURITY DEFINER`, `SET search_path = public`, sin `STABLE`
   (tiene side effects). rejoin_group sigue exactamente el mismo estilo,
   solo cambia a `RETURNS BOOLEAN` porque el caller necesita saber si
   reactivó una fila o no.
2. joinGroupByCode armaba el INSERT así: tras confirmar que no hay
   membresía activa (`left_at IS NULL`), insertaba directo `{ group_id,
   user_id, role: 'member' }` sin chequear si existía una fila con
   `left_at` no nulo.

## Tarea 2 — Migración `016_rejoin_group.sql`

Se creó tal cual la propuesta del prompt: función
`public.rejoin_group(p_group_id UUID) RETURNS BOOLEAN`, SECURITY DEFINER,
que busca la fila más reciente con `left_at IS NOT NULL` para
`(group_id, auth.uid())`, la reactiva (`left_at = NULL, role = 'member',
joined_at = now()`) y devuelve `true`; si no encuentra ninguna, devuelve
`false` sin tocar nada. `GRANT EXECUTE ... TO authenticated`, mismo
patrón que el resto de las funciones del módulo.

## Tarea 3 — Ajuste en `groupService.joinGroupByCode`

Después de descartar membresía activa (mismo chequeo que ya existía), se
agregó:

```ts
const { data: rejoined, error: rejoinError } = await supabase.rpc(
  'rejoin_group',
  { p_group_id: group.id },
);
if (rejoinError) throw rejoinError;

if (!rejoined) {
  // INSERT normal como 'member' — mismo código que antes
}
```

El contrato `ServiceResult<Group>` y los mensajes de error existentes
("Grupo no encontrado o código inválido", "Ya sos miembro de este grupo",
"Error al unirse al grupo") no cambiaron.

## Qué NO se tocó

- `leave_group`, `get_user_group_role`, políticas existentes de
  `group_members`/`groups`: sin cambios.
- `meetupService.ts`: sin cambios.
- Sin commits.

## Cómo probarlo

1. Ejecutar `016_rejoin_group.sql` en Supabase Dashboard → SQL Editor
   (después de 014 y 015).
2. Con una cuenta B: unirse a un grupo de la cuenta A con el `join_code`.
3. Salir del grupo (`leave_group` — desde donde esté expuesto en la UI, o
   invocando el RPC directo si 4.3 todavía no tiene el botón).
4. Volver a unirse con el mismo código.
5. En Supabase SQL Editor:
   ```sql
   SELECT * FROM group_members WHERE user_id = '<uuid de B>' AND group_id = '<uuid del grupo>';
   ```
   Debe devolver **una sola fila**, con `left_at IS NULL` y `role =
   'member'` — no dos filas.

---

### 4.3-detalle-y-miembros/01-analisis-previo.md

# Prompt 01 — Bloque 4.3: Análisis previo — Detalle y miembros de grupo

## Contexto
Rama feature/bloque-4-grupos. 4.1 (modelo de datos) y 4.2 (crear/unirse/
listar) ya commiteados y funcionando.

Este prompt implementa: ver detalle de un grupo, ver lista de miembros
(sin poder expulsar todavía), salir del grupo, eliminar grupo. NO incluye:
expulsar miembros, transferir administración, contenido real de las
pestañas Juntadas/Multimedia (placeholders solamente) — todo eso es
4.5/4.4/4.6.

## Tarea 1 — Análisis previo (sin tocar archivos)

1. Estructura y convención de `MeetupDetailScreen.tsx` para replicar 1:1.
2. Cómo `meetupService` implementa "compartir código".
3. Patrón de tabs/secciones dentro de una pantalla de detalle, si existe.
4. Patrón de pantalla "placeholder/próximamente" existente.

## Hallazgos

### 1. Estructura de MeetupDetailScreen
Header propio (back + título + acción contextual a la derecha) fuera del
ScrollView; dentro: card principal de datos, action cards, sección de
compartir, acciones del organizador, sección de abandonar, "zona
destructiva" al final. Los modales de confirmación comparten un mismo set
de estilos (`modalOverlay`/`modalCard`/`modalIconBox`/`modalTitle`/
`modalSubtitle`/`modalActions`/`modalDestructiveBtn`) copiado en cada
pantalla que necesita confirmación — no hay un componente `ConfirmModal`
compartido, es duplicación deliberada consistente con cómo
`ParticipantListScreen` duplica su propia lógica de "Abandonar juntada"
(ahí usando `Alert.alert` nativo en vez de `Modal` custom — dos
convenciones conviven). Feedback vía `SuccessAnimation`/`ErrorAnimation`.

### 2. Compartir código — es un componente, no lógica de servicio
`meetupService.ts` no tiene funciones de compartir. Vive todo en
`MeetupShareButton.tsx` (bottom sheet: copiar/WhatsApp/share nativo),
recibe `{ meetupTitle, joinCode, onFeedback }`. Genérico salvo el nombre
del prop y el texto del mensaje, que funciona igual de bien para un
grupo. Se reutiliza tal cual, importado desde
`@/features/meetups/components/MeetupShareButton`, sin modificarlo.

### 3. Tabs/secciones en un detalle
No existe `@react-navigation/material-top-tabs` en el proyecto ni ningún
patrón de tabs-que-cambian-contenido-inline. Lo más cercano es el badge
"Próximamente" de `GamesScreen` para cards no disponibles (deshabilitada,
no navega). Como el prompt pide que "Juntadas"/"Multimedia" naveguen a un
placeholder real, se implementaron como dos cards que hacen
`navigation.navigate(Routes.GroupPlaceholder, { groupId, section })` —
sin librería nueva.

### 4. Pantalla "placeholder/próximamente"
No existe como pantalla independiente. Se creó `GroupPlaceholderScreen.tsx`
nuevo, reutilizando el copy "Próximamente" de `GamesScreen` para mantener
el tono, parametrizada por `section` para no duplicar el componente entre
"Juntadas" y "Multimedia".

## Decisiones confirmadas antes de la Tarea 2

- `GroupDetailScreen`: sin botón "Editar" (no hay `EditGroupScreen` en
  este alcance) ni "Transferir administración" (excluido). Reutiliza el
  set de estilos de modal de `MeetupDetailScreen`.
- `GroupMembersScreen`: chip de rol único por fila (el mockup mostraba dos
  chips distintos para admin vs. uno para member — se unificó). Menú "⋮"
  sin `onPress` (TODO explícito para 4.4/4.5).
- Tap en card de `GroupHomeScreen` (antes no interactiva) ahora navega a
  `GroupDetailScreen`.
- Aclaración del usuario incorporada: si el admin toca "Salir del grupo",
  `leave_group()` lanza la excepción "El admin debe transferir su rol
  antes de salir del grupo" — comportamiento esperado, no un bug. Ese
  mensaje específico se muestra tal cual en el toast de error, sin
  reemplazarlo por uno genérico.

---

### 4.3-detalle-y-miembros/02-implementacion.md

# Prompt 02 — Bloque 4.3: Implementación — Detalle y miembros de grupo

## Diseño usado

Frames de Figma (mismo archivo que 4.1/4.2, `Iu9DQtttfYfcuWrFqmJuwb`):
- `267:448` — Mockup - Detalle de Grupo
- `267:614` — Mockup - Miembros del Grupo

## Archivos modificados/creados

`src/features/groups/`:
- `types.ts` — agregado `GroupDetail`, `GroupMember`
- `services/groupService.ts` — agregado `getGroupDetail`, `getGroupMembers`,
  `deleteGroup`, `leaveGroup`
- `hooks/useGroupDetail.ts` (nuevo) — query de detalle + mutaciones
  `deleteGroup`/`leaveGroup`, mismo criterio que `useMeetupDetail.ts`
- `hooks/useGroupMembers.ts` (nuevo) — query simple de miembros, mismo
  criterio que `useParticipants` (sin mutaciones: gestión de miembros es
  4.4/4.5)
- `screens/GroupDetailScreen.tsx` (nuevo)
- `screens/GroupMembersScreen.tsx` (nuevo)
- `screens/GroupPlaceholderScreen.tsx` (nuevo)
- `screens/GroupHomeScreen.tsx` — la card de grupo pasó de `View` a
  `Pressable`, navega a `GroupDetail`

Navegación:
- `routes.ts` / `navigation/types.ts` — rutas `GroupDetail { groupId }`,
  `GroupMembers { groupId, groupName, joinCode }`, `GroupPlaceholder
  { groupId, section }`
- `MainNavigator.tsx` — registro de las 3 pantallas nuevas

## Decisiones tomadas

1. **Sin botón "Editar grupo".** El mockup de detalle lo muestra en el
   header, pero no hay `EditGroupScreen` en el alcance de este prompt (ni
   fue pedido en la Tarea 2). Se omitió.
2. **Sin "Transferir administración".** Explícitamente fuera de alcance.
   El botón del mockup no se implementó.
3. **`groupName`/`joinCode` viajan como route params** de `GroupDetail` →
   `GroupMembers` en vez de que `GroupMembersScreen` vuelva a pedir el
   detalle del grupo — evita una query redundante ya que
   `GroupDetailScreen` los tiene cargados al momento de navegar.
4. **Chip de rol unificado en `GroupMembersScreen`.** El mockup mostraba
   para el admin un chip "Admin" (ámbar, bajo el username) + un chip
   "Desde may 2026" (verde, a la derecha), pero para el miembro normal
   solo un chip "Miembro" (verde, a la derecha) — dos variantes visuales
   distintas sin una regla clara. Se unificó a un solo chip de rol a la
   derecha de cada fila (Admin/Miembro/Invitado), coherente para todas
   las filas.
5. **Menú "⋮" sin acción.** Se renderiza en cada fila de
   `GroupMembersScreen` (`Ionicons name="ellipsis-vertical"`) sin
   `onPress`, con comentario `// TODO 4.4/4.5: expulsar miembro`, tal
   como pidió el prompt.
6. **"Salir del grupo" se duplica en `GroupDetailScreen` y
   `GroupMembersScreen`**, siguiendo el mismo patrón que
   `MeetupDetailScreen`/`ParticipantListScreen` (ambas también duplican
   "Abandonar juntada"). No se creó un componente compartido nuevo para
   no romper esa convención ya establecida.
7. **Mensaje específico cuando un admin intenta salir.** `leaveGroup()`
   en `groupService.ts` detecta el substring `'debe transferir su rol'`
   en el error del RPC `leave_group` y lo devuelve tal cual (mismo patrón
   que `translateError` en `meetupService.ts`); cualquier otro error cae
   al genérico "No se pudo salir del grupo". `GroupDetailScreen` muestra
   ese mensaje en el toast de error sin modificarlo — es comportamiento
   esperado (transferir administración es 4.5), no un error a esconder.
8. **Bug propio detectado y corregido antes de terminar:** el
   `SuccessAnimation` de `GroupDetailScreen` se comparte entre el toast de
   "grupo eliminado" (que debe navegar a `GroupHome`) y los toasts de
   `MeetupShareButton` (copiar código / compartir, que deben quedarse en
   la pantalla). La primera versión navegaba siempre al cerrar el toast,
   lo que habría sacado al usuario de la pantalla apenas copiaba el
   código. Se agregó el flag `shouldNavigateAfterToast`, seteado solo en
   el flujo de eliminación (mismo patrón que
   `shouldNavigateBackAfterToast` en `MeetupDetailScreen`).
9. **`getGroupDetail` usa el RPC `get_user_group_role`** (ya existente,
   `014_groups.sql`, `GRANT EXECUTE ... TO authenticated`) para resolver
   el rol del usuario — no hizo falta ninguna migración nueva.

## Qué NO se tocó

- Expulsar miembros, transferir administración: sin implementar.
- Contenido real de "Juntadas"/"Multimedia" del grupo: solo el
  placeholder genérico.
- `meetupService.ts`, migraciones existentes: sin cambios.
- Sin commits.

## Cómo probarlo

1. `npx tsc --noEmit` en `mobile/` — sin errores (verificado).
2. Con una cuenta **admin** de un grupo: entrar al detalle → confirmar
   que aparece "Eliminar grupo" además de "Salir del grupo".
   - Tocar "Salir del grupo" → confirmar en el modal → debe aparecer el
     toast de error "El admin debe transferir su rol antes de salir del
     grupo" (no un mensaje genérico), y la pantalla no debe navegar.
3. Con una cuenta **miembro normal**: entrar al detalle del mismo grupo →
   confirmar que "Eliminar grupo" **no aparece**.
   - Tocar "Salir del grupo" → confirmar → debe salir sin error y volver
     a "Mis grupos"; verificar en Supabase que la fila de
     `group_members` quedó con `left_at` seteado y no se duplicó
     (mismo chequeo de `left_at` ya validado en 4.2/4.2b).
4. Tocar "Ver miembros" desde el detalle → confirmar que la lista
   completa carga con roles correctos y que el ícono "⋮" no hace nada al
   tocarlo.
5. Tocar "Juntadas" y "Multimedia" desde el detalle → confirmar que cada
   una navega a su placeholder con el título correcto y el mensaje
   "Próximamente".

---

### 4.3-detalle-y-miembros/02b-fix-mensaje-error-admin.md

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

---

### 4.4-juntada-de-grupo/01-analisis-previo.md

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

---

### 4.4-juntada-de-grupo/02-implementacion.md

# Prompt 02 — Bloque 4.4: Implementación — Juntada de grupo

## Archivos creados/modificados

- `supabase/migrations/017_invite_group_to_meetup.sql` (nuevo) — función
  `invite_group_to_meetup(p_meetup_id, p_group_id)`, `SECURITY DEFINER`,
  valida que quien la llama es el organizador de la juntada y luego
  inserta una fila (`role: 'participant'`, `attendance_status: 'pending'`)
  por cada miembro activo del grupo, excluyendo al organizador. `ON
  CONFLICT (meetup_id, user_id) DO NOTHING` por si algún miembro ya se
  había unido manualmente antes de que se creara la juntada.
- `mobile/src/features/meetups/services/meetupService.ts` —
  `createMeetup()` acepta un tercer parámetro opcional `groupId`; lo pasa
  como `group_id` en el INSERT de `meetups` y, tras registrar al
  organizador, llama al RPC `invite_group_to_meetup` si vino `groupId`.
- `mobile/src/features/meetups/hooks/useMeetups.ts` — nueva interfaz
  `CreateMeetupVariables { formData, groupId? }`; `createMeetupMutation`
  y el callback público `createMeetup(formData, groupId?)` la propagan.
- `mobile/src/features/meetups/screens/CreateMeetupScreen.tsx` — lee
  `route.params?.groupId` y `route.params?.groupName` con `useRoute()`
  (nuevo en esta pantalla, antes no recibía params); pasa `groupId` a
  `createMeetup()`; si hay `groupName`, muestra "Creando juntada para:
  {groupName}" debajo de la intro.
- `mobile/src/navigation/types.ts` — `CreateMeetup: { groupId?: string;
  groupName?: string } | undefined` (antes `undefined`; retrocompatible
  con la navegación existente desde el tab "Crear", que no pasa params).
- `mobile/src/features/groups/screens/GroupDetailScreen.tsx` — nuevo
  botón `AppButton` "+ Crear juntada" entre las cards de secciones
  (Juntadas/Multimedia) y el preview de miembros; navega a
  `CreateMeetup` con `{ groupId, groupName: group.name }`. La card
  "Juntadas" existente no se tocó — sigue yendo al placeholder.

## Por qué hizo falta la función SECURITY DEFINER

Confirmado en la Tarea 1: la policy `meetup_participants: insert own`
exige `user_id = auth.uid()`, así que un organizador no puede insertar
filas para otros usuarios desde el cliente. `invite_group_to_meetup`
sigue el mismo patrón que `leave_group`/`rejoin_group`: valida el permiso
(ser organizador de esa juntada) dentro de la función y bypasea RLS solo
para ese INSERT puntual, sin abrir la policy general.

## Decisiones tomadas

1. **Fallo en la invitación no revierte la juntada.** A diferencia del
   rollback manual si falla la auto-inscripción del organizador (que sí
   deja la juntada en un estado inválido: sin organizador), un fallo al
   invitar al grupo dejaría una juntada igual de válida, solo sin
   invitados automáticos. Se maneja con `console.warn`, no con excepción
   ni rollback.
2. **Botón "+ Crear juntada" sin restricción de rol.** El prompt no pidió
   limitarlo a admins; cualquier miembro que vea el detalle del grupo
   puede crear una juntada para él.
3. **`groupName` viaja como route param** de `GroupDetail` → `CreateMeetup`
   (mismo criterio que `GroupDetail` → `GroupMembers` en 4.3), evitando
   que `CreateMeetupScreen` tenga que pedir el detalle del grupo solo
   para mostrar el nombre en el copy contextual.
4. **Copy contextual condicional.** El texto "Creando juntada para: X"
   solo aparece si `groupName` viene en los params — el flujo de creación
   suelta (sin grupo) no cambia visualmente.

## Qué NO se tocó

- Listado real de juntadas del grupo: sigue siendo el placeholder de 4.3.
- Policy de INSERT de `meetup_participants`: sin cambios, bypaseada por
  la función `SECURITY DEFINER`, no hace falta abrirla.
- Los 11 catch blocks de `instanceof Error` reportados en 4.3b: deuda
  técnica separada, no de este bloque.
- Sin commits.

## Cómo probarlo

1. `npx tsc --noEmit` en `mobile/` — sin errores (verificado).
2. Aplicar la migración `017_invite_group_to_meetup.sql` en Supabase.
3. Crear un grupo con al menos 2 miembros (usando 2 cuentas: A crea el
   grupo, B se une con el código).
4. Con la cuenta A, entrar al detalle del grupo y tocar "+ Crear juntada"
   → confirmar que aparece "Creando juntada para: {nombre del grupo}" →
   completar el formulario y crear.
5. Con la cuenta B, confirmar que la juntada le aparece automáticamente
   en su historial/notificaciones sin que ella haya hecho nada, con
   estado de asistencia "pending".
6. Confirmar en Supabase que la fila de `meetup_participants` de B tiene
   `role: 'participant'` y `attendance_status: 'pending'`, y que A quedó
   como `organizer`/`confirmed`.
7. Confirmar que crear una juntada suelta (sin pasar por un grupo, desde
   el tab "Crear") sigue funcionando igual que antes, sin el copy de
   grupo y sin invitar a nadie de más.

---

### 4.4b-listado-juntadas-grupo/01-analisis-previo.md

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

---

### 4.4b-listado-juntadas-grupo/02-implementacion.md

# Prompt 02 — Bloque 4.4b: Implementación — Listado de juntadas del grupo

## Archivos creados/modificados

- `mobile/src/features/meetups/components/MeetupCard.tsx` (nuevo) —
  `MeetupCard` extraído tal cual de `MeetupHomeScreen.tsx` (antes `const`
  privado), ahora exportado para reusarse también en
  `GroupMeetupsScreen`. Incluye su propia copia de `AVATAR_PALETTE` y
  `formatDate` (antes locales a `MeetupHomeScreen`) y reusa
  `isPastMeetup` de `../utils/meetupDateTime`.
- `mobile/src/features/meetups/screens/MeetupHomeScreen.tsx` — se quitó
  la definición local de `MeetupCard`/`MeetupCardProps`/`formatDate` y
  los estilos que solo usaba esa card (`card`, `cardTopRow`,
  `roleBadge`, `avatarStack`, etc.); ahora importa `MeetupCard` desde el
  componente compartido. Sin cambios de lógica ni de render — mismo
  comportamiento visual.
- `mobile/src/features/groups/services/groupService.ts` — nueva función
  `getGroupMeetups(groupId, userId)`: trae juntadas `status = 'active'`
  de `group_id = groupId`, ordenadas por fecha, con el mismo patrón de 3
  pasos que `meetupService.getUserMeetups` (juntadas → participantes →
  combinar) para calcular rol/conteos por juntada. Incluye un mapeo
  propio `mapMeetupRowForGroup` (duplica el mapeo equivalente de
  `meetupService.mapMeetupRow`, que no está exportado) y solo importa
  tipos de `@/features/meetups/types`.
- `mobile/src/features/groups/hooks/useGroupMeetups.ts` (nuevo) — query
  simple sin mutaciones, mismo criterio que `useGroupMembers`.
- `mobile/src/features/groups/screens/GroupMeetupsScreen.tsx` (nuevo) —
  header + lista de `MeetupCard` (navega a `MeetupDetail` al tocar cada
  una) + pull-to-refresh + skeleton (`MeetupCardSkeleton` reusado) +
  estado vacío ("Este grupo todavía no tiene juntadas" con botón
  "+ Crear juntada" que navega a `CreateMeetup` con `{ groupId,
  groupName }`, mismo destino que el botón del detalle de 4.4).
- `mobile/src/navigation/{routes.ts,types.ts,MainNavigator.tsx}` — ruta
  nueva `GroupMeetups: { groupId: string; groupName: string }`.
- `mobile/src/features/groups/screens/GroupDetailScreen.tsx` — la card
  "Juntadas" navega a `GroupMeetups` en vez de `GroupPlaceholder`, y su
  ícono pasa de `game-controller` a `calendar-outline` (mismo ícono que
  la fila "Creado el...").

## ¿Hizo falta RLS nueva?

**No.** Confirmado en la Tarea 1: la policy `"meetups: select by
join_code"` ya permite leer cualquier juntada activa a cualquier usuario
autenticado (sin validar membresía), así que el filtro
`.eq('group_id', groupId).eq('status', 'active')` funciona directo
desde el cliente sin política ni función nueva.

## Hallazgo reportado (Tarea 1, punto 2) — no resuelto

Un usuario que se une a un grupo **después** de que una juntada de ese
grupo ya terminó o fue cancelada **no la ve** en este listado: la policy
que aplica a juntadas no activas exige ser organizador o tener una fila
propia en `meetup_participants` para esa juntada puntual, y
`invite_group_to_meetup` solo inscribe a los miembros activos *al momento
de crear* la juntada. Confirmado como caso real con el esquema actual.
**No se solucionó** — queda para evaluar aparte (podría requerir una
policy adicional basada en membresía histórica del grupo, o aceptar la
limitación como comportamiento esperado).

## Qué NO se tocó

- El caso reportado arriba: sin cambios de RLS.
- `GroupPlaceholderScreen.tsx`: sigue existiendo tal cual, todavía usado
  por la card "Multimedia".
- `meetupService.ts`: sin cambios más allá de los tipos que ya
  importaba `groupService.ts` (no se tocó ese archivo en absoluto en
  este prompt).
- Sin commits.

## Cómo probarlo

1. `npx tsc --noEmit` en `mobile/` — sin errores (verificado).
2. Desde el grupo con la juntada creada en 4.4, entrar al detalle y
   confirmar que la card "Juntadas" ahora muestra el ícono de calendario
   (mismo que "Creado el...").
3. Tocar la card "Juntadas" → confirmar que navega a la lista real y
   aparece la juntada creada en 4.4, con fecha y conteo de confirmados.
4. Tocar la juntada en la lista → confirmar que navega a su detalle.
5. Con un grupo sin juntadas, confirmar el estado vacío ("Este grupo
   todavía no tiene juntadas") y que su botón "+ Crear juntada" navega
   a `CreateMeetup` con el contexto del grupo.
6. Confirmar que `MeetupHomeScreen` (listado de juntadas propias) se ve
   y se comporta exactamente igual que antes de la extracción de
   `MeetupCard`.

---

### 4.4b-listado-juntadas-grupo/02b-fix-ui.md

# Prompt 02b — Bloque 4.4b: Fix UI — ícono e íconos redundantes

Tres correcciones de UI detectadas al probar en dispositivo.

## Tarea 1 — Ícono en info del grupo

`GroupDetailScreen.tsx` — la fila "{N} juntada(s) activa(s)" dentro de la
card de info del grupo usaba `game-controller-outline` (heredado del
clon original). Se cambió a `calendar-outline`, mismo ícono ya corregido
en la card "Juntadas" (4.4b) y en la fila "Creado el...".

## Tarea 3 — Diferenciar los íconos de calendario duplicados

Tras la Tarea 1, "Creado el..." y "{N} juntada(s) activa(s)" quedaron con
el mismo ícono `calendar-outline`, sintiéndose redundantes. Se cambió el
de "{N} juntada(s) activa(s)" a `calendar` (versión sólida, sin
"-outline") — mismo patrón outline/sólido que ya usa `AppTabBar.tsx` para
distinguir estado. "Creado el..." se mantiene con `calendar-outline`.

## Tarea 2 — Sacar botones redundantes de Miembros

`GroupMembersScreen.tsx` — se quitaron "Compartir código de invitación"
(`MeetupShareButton`) y "Salir del grupo" (botón + modal de confirmación
+ estado `showLeaveModal`/`leaveError` + `confirmLeave` + el hook
`useGroupDetail`, ya no usado en esta pantalla) del final de la lista.
Esas acciones ya viven en `GroupDetailScreen` (pantalla padre) y no
correspondían acá — se alinea con el criterio real de
`ParticipantListScreen`, que es solo la lista sin acciones adicionales.

También se limpiaron los estilos que solo usaban esos elementos
(`footer`, `leaveErrorText`, `leaveBtn*`, `modal*`) y el comentario del
encabezado del archivo, que documentaba la duplicación ahora eliminada.
La ruta `GroupMembers` sigue recibiendo `groupName`/`joinCode` como
params (no se tocó `navigation/types.ts`) — simplemente ya no se usan
dentro de esta pantalla.

## Qué NO se tocó

- Sin cambios en la regla de "juntada activa" ni lógica de finalización
  por tiempo (D20, definitiva).
- Sin commits.

## Cómo probarlo

1. `npx tsc --noEmit` en `mobile/` — sin errores (verificado).
2. Entrar al detalle de un grupo → confirmar que la fila "{N} juntada(s)
   activa(s)" muestra el ícono de calendario sólido (no el de control de
   videojuego), y que se distingue a simple vista del `calendar-outline`
   de la fila "Creado el..." justo arriba, sin dejar de sentirse parte
   del mismo lenguaje visual.
3. Entrar a "Ver miembros" → confirmar que la lista termina en el último
   miembro, sin botones de "Compartir código" ni "Salir del grupo" al
   pie de la pantalla.
4. Confirmar que "Compartir código" y "Salir del grupo" siguen
   funcionando igual que antes, pero solo desde `GroupDetailScreen`.

---

### 4.5-expulsar-transferir/01-analisis-previo.md

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

---

### 4.5-expulsar-transferir/02-implementacion.md

# Prompt 02 — Bloque 4.5: Implementación — Expulsar y transferir administración

## Archivos creados/modificados

- `supabase/migrations/018_group_admin_actions.sql` (nuevo) —
  `expel_group_member(p_group_id, p_target_user_id)`: solo el admin
  puede ejecutarla, no puede expulsarse a sí mismo (para eso está
  `leave_group`), marca `left_at = now()` en la fila del destinatario.
  `transfer_group_admin(p_group_id, p_new_admin_user_id)`: valida que
  quien llama sea admin y que el destinatario sea miembro activo, y
  dentro de la misma función degrada al admin actual a `member` y
  promueve al destinatario a `admin` — atómico de verdad, sin el riesgo
  de estado parcial de `meetupService.transferOrganizer`.
- `mobile/src/features/groups/services/groupService.ts` — agregado
  `expelMember(groupId, targetUserId)` y `transferAdmin(groupId,
  newAdminUserId)`, wrappers de los RPCs con el mismo patrón de
  extracción de mensaje por duck-typing que `leaveGroup` (no
  `instanceof Error`, no confiable en Hermes/React Native para
  `PostgrestError`).
- `mobile/src/features/groups/hooks/useGroupMembers.ts` — agregadas dos
  mutaciones (`expelMember`, `transferAdmin`) que, al tener éxito,
  invalidan `['groupMembers', groupId]`, `['groupDetail', groupId]`
  (el rol propio puede cambiar) y `['groups', currentUserId]` (la card
  de "Mis grupos" también muestra el rol).
- `mobile/src/features/groups/screens/GroupMembersScreen.tsx` —
  - `MemberRow` ahora recibe `canManage` (el usuario actual es Admin y
    la fila no es la suya propia) y renderiza el ícono "⋮" solo si es
    `true`; al tocarlo mide su posición (`measureInWindow`) y abre un
    dropdown anclado con "Transferir administración" / "Expulsar del
    grupo".
  - Modal de confirmación compartido entre ambas acciones (mismo set de
    estilos `modalOverlay`/`modalCard`/`modalIconBoxWarning`/
    `modalIconBoxDanger`/etc. que `GroupDetailScreen`, reagregado a este
    archivo tras haberse sacado en 4.4b).
  - Tras confirmar con éxito, la lista se refresca sola por la
    invalidación de query — no hace falta refetch manual.

## Confirmación de atomicidad de `transfer_group_admin`

Las dos actualizaciones (`UPDATE ... SET role = 'member'` sobre el admin
actual, luego `UPDATE ... SET role = 'admin'` sobre el destinatario)
corren dentro de la misma función `PL/pgSQL SECURITY DEFINER`, es decir,
en una única transacción implícita: o se ejecutan ambas, o ninguna (un
`RAISE EXCEPTION` en cualquier validación previa aborta antes de tocar
una sola fila). El índice único `one_admin_per_group` (`WHERE
role='admin' AND left_at IS NULL`, de 4.1b) nunca se viola porque el
orden de los UPDATEs garantiza que la cantidad de admins activos pasa de
1→0→1, nunca de 1→2 en ningún punto intermedio.

## Qué NO se tocó

- `meetupService.transferOrganizer`: sin cambios, es de otro feature.
- Migraciones anteriores: sin cambios.
- Sin commits.

## Cómo probarlo

1. `npx tsc --noEmit` en `mobile/` — sin errores (verificado).
2. Con 2 cuentas en un grupo (A = admin, B = member):
   - Desde A, entrar a "Ver miembros" → confirmar que la fila de A (el
     propio Admin) no muestra el ícono "⋮", y la fila de B sí.
   - Desde B, entrar a "Ver miembros" → confirmar que **ninguna** fila
     muestra el ícono "⋮" (B no es Admin).
3. Desde A, tocar "⋮" en la fila de B → "Expulsar del grupo" → confirmar
   → B debe desaparecer de la lista de miembros, y al refrescar
   `GroupHomeScreen`/`GroupDetailScreen` con la cuenta B, el grupo ya no
   debe aparecer en su lista.
4. Con un tercer miembro C, desde A tocar "⋮" en la fila de C →
   "Transferir administración" → confirmar → recargar `GroupDetailScreen`
   con ambas cuentas: A debe verse como "Miembro" y C como "Admin"; en
   "Ver miembros", el ícono "⋮" debe aparecer ahora en la fila de A (ya
   no en la de C) si se entra con la cuenta de C.

---

### 4.6-eliminar-placeholder-media.md

# Prompt 4.6 — Eliminar placeholder de Multimedia grupal

## Por qué se sacó

La consolidación multimedia de grupo (vista unificada de fotos/álbumes de
todas las juntadas de un Grupo) es **RF-32** en el backlog viejo de
`docs/ENTREGA_1/alcance_e1.md` ("Consolidación multimedia grupal — vista
unificada que agrupe y permita gestionar todos los recuerdos y álbumes de
las distintas juntadas pertenecientes a un mismo Grupo", E3). Ese
documento no está en el repo actualizado a la numeración final del
proyecto — `alcance_final.docx` (mencionado por Agus, no está versionado
en el repo, no pude verificarlo directamente) renumeró varios RF; por
eso 4.4b citaba "RF-41" para el historial de juntadas del grupo, un RF
distinto al 32 de `alcance_e1.md`. Lo que sí es un hecho verificable en
el repo: la funcionalidad de multimedia grupal **nunca pasó de un botón
con ícono de cámara que navegaba a una pantalla "Próximamente"** — no
hay galería, no hay agregación de `memories` por grupo, no hay ninguna
lógica real detrás.

**Decisión consciente, tomada con tiempo limitado (8 días del cierre):**
no entra en el alcance final del proyecto. Se prioriza terminar y pulir
lo que sí está en alcance final (grupos: crear/unirse/listar, detalle,
miembros, juntada de grupo, expulsar/transferir admin) antes que sumar
una funcionalidad nueva de agregación multimedia. Se elimina el acceso y
la pantalla placeholder por completo en vez de dejarlos — un botón que
lleva a "Próximamente" en un PR final se lee como una funcionalidad a
medio hacer, no como una decisión de alcance.

## Qué se eliminó

- **`GroupDetailScreen.tsx`** — el `<Pressable>` completo de la card
  "Multimedia" (ícono de cámara, texto "Multimedia",
  `onPress` a `Routes.GroupPlaceholder`). La card "Juntadas" (que ya
  navega al listado real desde 4.4b) no se tocó; al quedar sola dentro
  de `sectionsRow` (`flexDirection: 'row'`, sus hijos con `flex: 1`), se
  estira sola para ocupar el ancho completo sin necesidad de ajustar
  ningún valor de layout — mismo criterio de estilos que ya tenía el
  archivo, nada hardcodeado fuera de `theme.ts`. También se eliminó el
  estilo `sectionCardMedia` (quedaba sin ningún consumidor).
- **`mobile/src/features/groups/screens/GroupPlaceholderScreen.tsx`** —
  archivo eliminado por completo. Ya no tenía ningún caller posible: el
  otro valor de `section` (`'Juntadas'`) era dead code desde que 4.4b
  reemplazó esa card por el listado real; al sacar `'Multimedia'`,
  quedaban cero rutas hacia esta pantalla.
- **`mobile/src/navigation/MainNavigator.tsx`** — import de
  `GroupPlaceholderScreen` y su `<Stack.Screen name={Routes.GroupPlaceholder} .../>`.
- **`mobile/src/navigation/routes.ts`** — entrada `GroupPlaceholder: 'GroupPlaceholder'`.
- **`mobile/src/navigation/types.ts`** — entrada `GroupPlaceholder: { groupId: string; section: 'Juntadas' | 'Multimedia' }` de `MainStackParamList`.

## Verificación

`npx tsc --noEmit` en `mobile/` — sin errores. Grep de `GroupPlaceholder`
en todo `mobile/src` después de los cambios: sin resultados — ninguna
referencia rota a `Routes.GroupPlaceholder`, `GroupPlaceholderScreen` ni
al tipo de params eliminado.

## Qué NO se tocó

- `GroupMeetupsScreen.tsx` ni la card "Juntadas" de `GroupDetailScreen`.
- Ninguna pantalla nueva agregada — esto fue pura eliminación.
- Sin commits.

## Cómo probarlo en dispositivo

1. Entrar al detalle de cualquier grupo → confirmar que ya no aparece la
   card "Multimedia" (ícono de cámara) en absoluto.
2. Confirmar que la card "Juntadas" se ve bien sola — ocupa el ancho
   completo de esa fila, sin espacio vacío raro ni desalineación.
3. Tocar "Juntadas" → sigue navegando normalmente al listado real de
   juntadas del grupo (`GroupMeetupsScreen`), sin cambios de
   comportamiento.

---

### 4.7-notificaciones-grupo.md

# Prompt 4.7 — Notificaciones de eventos de grupo

## Contexto

Bloque 4 (grupos) no disparaba ninguna notificación por sus propios
eventos — el patrón de tipo-por-evento ya existía para meetups (Bloque
2: `cancelled`/`finished`/`left`) y se extiende acá con 5 eventos de
grupo, mismo criterio (un valor de enum por evento, no un tipo genérico).

## Los 5 disparadores y decisión de destinatarios

| # | Evento | Función que lo dispara | Destinatarios |
|---|---|---|---|
| 1 | Alguien se une al grupo por código | `groupService.joinGroupByCode` | **Todos** los demás miembros activos |
| 2 | Alguien es expulsado | `groupService.expelMember` | **Solo** el expulsado |
| 3 | Se transfiere la administración | `groupService.transferAdmin` | **Solo** el nuevo admin |
| 4 | Alguien sale del grupo voluntariamente | `groupService.leaveGroup` | **Todos** los demás miembros activos |
| 5 | Se crea una juntada desde el grupo | `meetupService.createMeetup` (vía `invite_group_to_meetup`) | **Todos** los agregados como participantes |

Criterio: los eventos 1 y 4 son simétricos entre sí (cambio de
composición del grupo, relevante para todo el resto) y usan la misma
query de destinatarios (`group_members` activos, excluyendo a quien
disparó el evento). Los eventos 2 y 3 afectan a una sola persona
puntual, conocida de antemano por el caller — no hace falta ninguna
query de destinatarios. El evento 5 no es un evento "de grupo" en el
sentido estricto (no lleva `groupId`) sino un evento de juntada como
cualquier otro (lleva `meetupId`), simplemente su origen es una
invitación masiva de grupo.

## Tipos nuevos (3 lugares sincronizados)

1. **`mobile/src/features/notifications/types.ts`** — 5 valores nuevos
   en `NotificationType` (`GroupMemberJoined`, `GroupMemberExpelled`,
   `GroupAdminTransferred`, `GroupMemberLeft`, `GroupMeetupInvite`),
   `groupId?: string` agregado a `NotificationInput`, `groupId?: string
   | null` a `Notification`, `group_id: string | null` a
   `NotificationRow`.
2. **`supabase/migrations/020_group_notifications.sql`** —
   `ALTER TYPE notification_type ADD VALUE IF NOT EXISTS '...'` x5,
   mismo estilo que 012. Columna `group_id UUID REFERENCES groups(id)
   ON DELETE SET NULL` agregada a `notifications` (nullable, mismo
   patrón que `meetup_id`).
3. **`supabase/functions/send-push-notification/index.ts`** — la Edge
   Function tiene su **propia copia** del enum (`type NotificationType`
   en Deno, no puede importar el `.ts` del cliente) y una whitelist
   runtime (`tiposValidos`) que rechaza con 400 cualquier tipo no
   incluido — ambos actualizados con los 5 valores nuevos. También se
   agregó `groupId` al `NotificationRequestBody`, al `INSERT` sobre
   `notifications` (`group_id: groupId ?? null`) y al payload `data` de
   la push de Expo (paridad con `meetupId`).

Además se corrigió una **segunda copia** de `mapNotificationRow` que
vivía en `useNotifications.ts` (duplicada del hook, separada de la de
`notificationService.ts`, usada para mapear el payload de Realtime) —
sin el `groupId: row.group_id` ahí, las notificaciones de grupo
recibidas en vivo (no en el fetch inicial) hubieran llegado sin
`groupId`, rompiendo el deep-link para ese camino específico.

## `invite_group_to_meetup`: de `VOID` a `RETURNS TABLE(invited_user_id UUID)`

Migración 020 cambia la firma de la función (requiere `DROP FUNCTION`
previo, mismo motivo que 019 con `expel_group_member`: Postgres no deja
cambiar el tipo de retorno con `CREATE OR REPLACE`). Ahora el `INSERT`
usa `RETURN QUERY ... RETURNING meetup_participants.user_id`, devolviendo
a quién agregó. `meetupService.createMeetup()` lee ese `data`, mapea a
`invited_user_id`, y notifica a cada uno con `GroupMeetupInvite` y
`meetupId: newMeetup.id` — el deep-link existente de `meetupId` en el
panel ya lleva directo a la juntada, no hace falta `groupId` acá.

## `groupId` para deep-link

`notifications` no tenía forma de apuntar a un grupo — solo `meetup_id`.
Se agregó `group_id` nullable (misma migración 020). En
`NotificationPanel.tsx`, `handlePressNotification` ahora chequea
`notification.groupId` **antes** que `notification.meetupId` (grupo
puro tiene prioridad si algún evento futuro llegara a tener ambos,
aunque hoy ninguno de los 5 nuevos los combina) y navega a
`Routes.GroupDetail`. El comportamiento existente para `meetupId` no
cambió.

## Dónde se enganchó cada notificación

- **`joinGroupByCode`** (`groupService.ts`) — después del alta nueva o
  el `rejoin_group` exitoso, llama a `notifyGroupMemberJoined(groupId,
  userId)` (helper nuevo, fire-and-forget). Ese helper trae el
  `username` de quien se unió y la lista de los demás miembros activos
  vía un `SELECT` directo sobre `group_members` — la policy
  `group_members_select` ya permite esa lectura a cualquier miembro
  activo, **no hizo falta ninguna función `SECURITY DEFINER` nueva**
  (a diferencia de meetups, acá no hay bug de recursión RLS que
  resolver).
- **`expelMember`** — después de `if (error) throw error`, notifica
  directo a `targetUserId` (ya lo tiene como parámetro).
- **`transferAdmin`** — después de `if (error) throw error`, notifica
  directo a `newAdminUserId` (ya lo tiene como parámetro).
- **`leaveGroup`** — después de `if (error) throw error`, llama a
  `notifyGroupMemberLeft(groupId, userId)`. Como `leave_group()` usa
  `auth.uid()` del lado del servidor y la función cliente no recibe el
  `userId` como parámetro, se obtiene con `supabase.auth.getUser()`
  dentro del wrapper — sin cambiar la firma de `leaveGroup()` ni sus
  callers (`useGroupDetail.ts`).
- **`meetupService.createMeetup`** — ver sección de `invite_group_to_meetup`
  arriba.

Todos los bloques de notificación son fire-and-forget (`void (async ()
=> { try {...} catch {...} })()`), mismo patrón que `cancelMeetup` y
`joinMeetup`: un fallo en la notificación nunca afecta el resultado
principal de la operación, que ya ocurrió del lado del servidor.

## Qué NO se tocó

- Ninguna validación de permisos ni lógica de negocio de `leave_group`,
  `expel_group_member`, `transfer_group_admin` ni `invite_group_to_meetup`
  más allá del cambio de firma ya descrito (`RETURNS TABLE` en vez de
  `VOID`, exigido por Postgres para poder devolver la lista).
- El ícono por tipo de notificación en `NotificationPanel.tsx`
  (`getNotificationIcon`) no se tocó — ya tiene un `default: 'bell-outline'`
  que cubre los 5 tipos nuevos sin necesidad de casos explícitos, mismo
  tratamiento que ya reciben `cancelled`/`finished`/`left` hoy.
- El switch de invalidación de queries por Realtime en
  `useNotifications.ts` (líneas ~194 en adelante) no se tocó — está
  scopeado a `if (notification.meetupId)`, así que los eventos 1-4 (sin
  `meetupId`) no invalidan nada ahí; las pantallas de grupo ya se
  refrescan por las invalidaciones explícitas de cada mutación (4.5) y
  por polling normal. No se pidió agregar invalidación en tiempo real
  para grupo en este prompt.
- Sin commits.

## Bugs encontrados en testing y fixes

### Bug 1 — "Salir del grupo" no notificaba a nadie (RLS, no lógica)

Al probar los 5 casos en dispositivo, los 4 primeros funcionaron tras
desplegar la Edge Function actualizada, pero **la salida voluntaria
(evento 4) no generaba ninguna notificación**, sin ningún error visible
ni siquiera agregando `console.error` de diagnóstico en los 5 catches
fire-and-forget.

Causa real: `getOtherActiveMemberIds` hacía un `SELECT` directo sobre
`group_members`, gobernado por la policy:

```sql
-- 014_groups.sql:110-111
CREATE POLICY "group_members_select" ON group_members FOR SELECT
  USING (get_user_group_role(group_id, auth.uid()) IS NOT NULL);
```

y `get_user_group_role` exige `left_at IS NULL` para la fila de quien
pregunta. Esta policy es un gate de **todo o nada**: no filtra fila por
fila, evalúa si `auth.uid()` (quien hace la consulta) sigue siendo
miembro activo del grupo. En `leaveGroup`, el RPC `leave_group()` ya
había seteado `left_at = now()` en la fila del propio usuario **antes**
de que el cliente llamara a `notifyGroupMemberLeft` — así que en el
momento del `SELECT`, quien pregunta ya no es miembro activo, RLS
bloquea la lectura completa (0 filas, sin error de Postgrest) y
`recipientIds` queda vacío. `Promise.allSettled([])` no tiene nada que
iterar: ninguna notificación se envía, y no hay ninguna excepción que
un catch pueda atrapar — el fallo es silencioso por diseño de RLS, no
un bug de lógica JS.

Esto no afectaba a `notifyGroupMemberJoined` porque ahí quien pregunta
(el que se acaba de unir) sigue siendo miembro activo en el momento de
la consulta — la misma policy sí lo deja pasar. Tampoco afectaba a
`expelMember`/`transferAdmin`, que no consultan `group_members` en
absoluto (notifican directo a un `user_id` ya conocido como parámetro).

**Fix:** migración `021_get_group_member_ids.sql` — función
`get_group_member_ids(p_group_id, p_excluded_user_id)`
`SECURITY DEFINER` (mismo patrón que
`get_meetup_participant_ids`, `013_get_meetup_participant_ids.sql`) que
bypasea RLS, valida que quien llama haya tenido alguna relación con el
grupo (activo o recién dado de baja) y devuelve los miembros activos
excluyendo al indicado. `getOtherActiveMemberIds` en `groupService.ts`
ahora llama a este RPC en vez de hacer el `SELECT` directo — se
unificó también para `notifyGroupMemberJoined`, aunque ahí no estaba
roto, para no mantener dos caminos distintos resolviendo lo mismo y
evitar que un futuro cambio de RLS rompa uno de los dos otra vez sin
avisar.

Los 5 `console.error('[DIAG ...]', err)` agregados temporalmente
durante el diagnóstico ya se removieron de `groupService.ts`.

### Bug 2 — deep-link roto para el expulsado

El deep-link a `GroupDetailScreen` agregado en este prompt aplicaba a
los 4 tipos de notificación de grupo por igual. Para
`GroupMemberExpelled` específicamente, el destinatario ya no tiene
acceso al grupo (fue expulsado) — navegarlo ahí mostraba una pantalla
rota (0 miembros, opción de "Salir del grupo" de un grupo del que ya no
es parte, código de invitación ajeno).

**Fix:** en `NotificationPanel.tsx`, `handlePressNotification` ahora
excluye explícitamente ese tipo de la condición de navegación:

```ts
if (notification.groupId && notification.type !== NotificationType.GroupMemberExpelled) {
  // ...navega a GroupDetail
}
```

Al no cumplirse la condición para `GroupMemberExpelled`, cae al bloque
final (marcar como leída, sin navegar) — mismo comportamiento que tenía
antes de existir el deep-link de grupo. Los otros 3 tipos
(`GroupMemberJoined`, `GroupAdminTransferred`, `GroupMemberLeft`) no
cambiaron: siguen navegando a `GroupDetail` sin modificaciones.

### Bug 3 — shadowing de variable en PL/pgSQL: `get_group_member_ids` rechazaba a todo llamador

El fix del bug 1 (migración 021) introdujo uno nuevo: al migrar unión
y salida al RPC `get_group_member_ids`, **ambos** casos dejaron de
notificar a nadie — incluyendo unión, que antes funcionaba con el
`SELECT` directo. Que se rompieran los dos a la vez (no solo salida,
como el bug 1) fue la pista de que ya no era un problema de RLS/timing,
sino algo que rompía la función para cualquier invocación.

Causa: la función declaraba `RETURNS TABLE(user_id UUID)`, lo cual en
PL/pgSQL expone `user_id` como **variable de salida visible en todo el
cuerpo de la función**, no solo en el `RETURN QUERY` final. La
validación de permisos hacía:

```sql
IF NOT EXISTS (
  SELECT 1 FROM group_members
  WHERE group_id = p_group_id AND user_id = auth.uid()  -- sin alias
) THEN
  RAISE EXCEPTION 'No tenés relación con este grupo';
END IF;
```

La referencia sin calificar `user_id` es ambigua entre la columna de
`group_members` y la variable de salida homónima — Postgres resolvió
esa ambigüedad a favor de la variable PL/pgSQL, que en ese punto todavía
no tiene ningún valor asignado (`NULL`). `NULL = auth.uid()` siempre
evalúa a `NULL` (falsy), el `EXISTS` siempre daba `false`, y la función
lanzaba `RAISE EXCEPTION` **para cualquier llamador, en cualquier
caso**, sin importar el estado real de `group_members`.

**Fix:** migración `022_fix_get_group_member_ids_shadowing.sql` —
califica la referencia con el alias de tabla (`gm.user_id = auth.uid()`),
igual que ya se hacía correctamente en el `RETURN QUERY` de la misma
función. Ninguna otra lógica de la función cambió.

El `console.log('[DIAG get_group_member_ids]', ...)` temporal agregado
durante este segundo diagnóstico ya se removió de `groupService.ts`.

### Lección repetida: errores de RPC ignorados silenciosamente

Van dos veces en este mismo bloque que un fallo de RPC pasa
completamente inadvertido porque el código cliente solo desestructura
`data` y descarta `error` — `supabase.rpc()` no lanza una excepción JS
cuando el lado de Postgres falla (`RAISE EXCEPTION` incluido); devuelve
`{ data: null, error: {...} }` como resultado normal. Al no revisar
`error`, `data` queda `null`, se mapea a `[]`, y el fallo se disfraza de
"no había nadie a quien notificar" — indistinguible de un caso legítimo
sin destinatarios. Pasó primero con el `SELECT` directo bloqueado por
RLS (bug 1), y de nuevo con el propio RPC de reemplazo fallando por el
shadowing (bug 3).

**Fix aplicado en `getOtherActiveMemberIds`:** ahora se desestructura
también `error`, se loguea con `console.error` si está presente, y se
devuelve `[]` explícitamente documentado como fallback ante error (no
como comportamiento esperado):

```ts
const { data, error } = await supabase.rpc('get_group_member_ids', {
  p_group_id: groupId,
  p_excluded_user_id: excludedUserId,
});

if (error) {
  console.error('[get_group_member_ids] Error en el RPC:', error);
  return [];
}
```

Esto no elimina la posibilidad de un futuro fallo silencioso en otro
punto del código, pero corta el patrón puntual que ya se repitió dos
veces en este bloque.

## Problema A — asimetría entre `leave_group` y `expel_group_member` (ya resuelta)

`leave_group` (`014_groups.sql`) solo hacía `UPDATE group_members SET
left_at = now()` — nunca tocaba `meetup_participants` ni `meetups`. En
cambio `expel_group_member` (fix de organizador huérfano, `019`) sí
remueve al expulsado de las juntadas activas del grupo, transfiriendo
la organización a otro participante activo o cancelando la juntada si
era el único. Resultado: alguien que salía **voluntariamente** de un
grupo seguía figurando como participante (y potencialmente organizador)
de sus juntadas activas — comportamiento distinto según cómo dejaba el
grupo, sin ninguna razón de producto para esa diferencia.

**Fix:** migración `023_leave_group_meetup_cleanup.sql` — `DROP` +
recreación de `leave_group`, replicando la misma lógica de organizador
huérfano que ya tenía `expel_group_member`. Mismo motivo que en 019
para el cambio de firma: pasa de `RETURNS VOID` a
`RETURNS TABLE(cancelled_meetup_id UUID, cancelled_meetup_title TEXT)`,
porque el cliente necesita saber qué juntadas se cancelaron para
notificar a los participantes restantes (una función SQL no puede
invocar la Edge Function `send-push-notification` directamente).

`groupService.leaveGroup()` se actualizó para capturar ese `data` (antes
solo desestructuraba `error`, ignorando el resultado por completo — ver
la lección repetida del bug 3 más arriba) y, por cada juntada cancelada,
notificar a sus participantes restantes vía `get_meetup_participant_ids`
+ `notificationService.sendNotification`, mismo patrón fire-and-forget
que ya usa `expelMember` (dos bloques `void (async () => {...})()`
independientes: uno para notificar la salida del grupo, otro para las
cancelaciones). `useGroupDetail.ts` se actualizó en paralelo — el tipo
de `leaveMutation` y la invalidación de `['groupMeetups', groupId]` /
`['meetups', currentUserId]` / `['meetup', id]` por cada juntada
cancelada, mismo criterio que ya tenía `useGroupMembers`'s
`expelMutation`.

## Problema B — GroupDetailScreen sin manejo de "ya no soy miembro" (ya resuelta)

Reportado en testing: navegar a `GroupDetailScreen` desde una
notificación vieja (o por deep-link directo) después de haber dejado el
grupo mostraba una pantalla rota — "0 miembros", botón "Salir del
grupo" de un grupo ajeno, código de invitación que ya no correspondía.

Causa raíz (confirmada antes de tocar código): `getGroupDetail` hacía
3 lecturas RLS-protegidas con **2 comportamientos distintos** ante un
no-miembro:
- `groups.select('*').eq('id', groupId).single()` — con `.single()`,
  0 filas visibles por RLS **sí** dispara un error de Postgrest
  (`PGRST116`), que se propaga como error genérico.
- `count` sobre `group_members` y sobre `meetups` (ambos
  `{ count: 'exact', head: true }`, sin `.single()`) — para un SELECT
  de múltiples filas, RLS filtra en silencio y devuelve `count: 0` como
  resultado **exitoso**, indistinguible de un grupo real con 0
  miembros/juntadas.

Esto se agravaba con el `staleTime: 30_000` del `QueryClient` global
(`App.tsx`): si la pantalla ya estaba en caché de una visita reciente
(dentro de esos 30s), React Query servía los datos cacheados sin
refetch alguno, enmascarando el síntoma todavía más — ni siquiera
llegaba a dispararse la lectura que sí falla explícitamente.

**Fix:** en `getGroupDetail`, se llama primero a
`get_user_group_role` (RPC `SECURITY DEFINER`, bypasea RLS y devuelve
`NULL` de forma confiable si el usuario no tiene fila activa — a
diferencia de las otras 3 lecturas, no depende de que el gate de RLS se
comporte igual en todas). Si devuelve `NULL`, se corta ahí mismo con
`{ data: null, error: 'NOT_MEMBER' }` — un código distinguible, no un
mensaje genérico — sin ejecutar las otras 3 queries que hubieran
devuelto ceros silenciosos.

`useGroupDetail.ts` expone `isNotMember` (derivado de comparar
`groupQuery.error?.message` contra ese código), separado del `error`
genérico para no duplicar el manejo en la UI. `GroupDetailScreen.tsx`
chequea `isNotMember` **antes** que el guard genérico de `error || !group`
y renderiza un estado propio: "Ya no formás parte de este grupo", sin
counts, sin botones de "Salir"/"Eliminar", con un único botón para
volver a `GroupHome` (no tiene sentido ofrecer "Reintentar": va a
volver a fallar igual).

`useGroupMembers` ahora acepta un segundo parámetro opcional
`{ enabled?: boolean }` — `GroupDetailScreen` lo llama con
`{ enabled: !isNotMember }` para no gastar esa consulta cuando ya se
sabe que va a volver vacía por RLS. `GroupMembersScreen` (el otro
caller) no cambia: sigue llamando `useGroupMembers(groupId)` sin el
segundo argumento, que por default queda `enabled: true`.

## Cómo probarlo en dispositivo (2+ cuentas)

1. `npx tsc --noEmit` en `mobile/` — sin errores (verificado).
2. **Unión (evento 1):** con la cuenta A ya en un grupo, unir a la
   cuenta B por código → A debe recibir "Nuevo miembro 🎉" y, al
   tocarla, navegar al detalle del grupo.
3. **Expulsión (evento 2):** desde A (admin), expulsar a B → **solo** B
   recibe "Fuiste removido de un grupo"; A no recibe nada.
4. **Transferencia (evento 3):** desde A (admin), transferir a un
   tercer miembro C → **solo** C recibe "Ahora sos admin de un grupo 👑".
5. **Salida (evento 4):** con B (member) saliendo voluntariamente → el
   resto de los miembros activos (A, C) reciben "Un miembro se fue 👋".
6. **Invitación a juntada de grupo (evento 5):** desde A, crear una
   juntada desde el detalle del grupo → cada miembro agregado recibe
   "Nueva juntada de grupo 📅" y, al tocarla, navega directo al detalle
   de esa juntada (no del grupo).
7. Confirmar que tocar las notificaciones de los eventos 1, 3 y 4
   (`GroupMemberJoined`, `GroupAdminTransferred`, `GroupMemberLeft`)
   navega a `GroupDetailScreen` del grupo correspondiente. La del
   evento 2 (`GroupMemberExpelled`) **no** debe navegar — solo se marca
   como leída, ya que el expulsado no tiene acceso al grupo.
8. **Problema A (organizador huérfano al salir):** con B como único
   participante activo de una juntada activa del grupo (organizador),
   B sale del grupo → la juntada debe cancelarse automáticamente y
   notificar "Juntada cancelada 😔" a los demás participantes restantes
   (si los hay). Si en cambio B no es el único participante activo, la
   organización debe transferirse al participante activo más antiguo,
   sin cancelar la juntada.
9. **Problema B (ya no soy miembro):** navegar a `GroupDetailScreen` de
   un grupo del que ya no se es miembro (por notificación vieja o por
   URL/deep-link directo) → debe mostrar "Ya no formás parte de este
   grupo" con un único botón a Inicio, **no** datos parciales (0
   miembros, botón "Salir del grupo", etc.).


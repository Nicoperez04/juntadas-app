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

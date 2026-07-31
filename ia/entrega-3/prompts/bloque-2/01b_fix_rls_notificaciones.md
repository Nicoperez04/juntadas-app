# Prompt 01b — Bloque 2: Fix RLS notificaciones cancelada/finalizada/abandono

## Contexto
Rama actual: feature/bloque-2-notificaciones
Las notificaciones cancelled, finished y left no se envían
porque las queries de meetup_participants en cancelMeetup,
finishMeetup y leaveMeetup usan el cliente normal con RLS.
La RLS solo devuelve la fila del usuario autenticado, no
las de otros participantes, por lo que la lista de
destinatarios siempre queda vacía.

Solución: crear una función RPC en PostgreSQL con
SECURITY DEFINER que se ejecute con permisos elevados
y devuelva los user_id de participantes activos dado
un meetup_id y un excluded_user_id.

## Tarea 1 — Análisis previo
Sin tocar ningún archivo, reportá:

1. En supabase/migrations/, ¿cuál es el número
   de la última migración? (debe ser 012)

2. En meetupService.ts y participantService.ts,
   ¿cómo se llama a supabase.rpc() en algún otro
   lugar del código? Mostrar un ejemplo existente
   si hay alguno.

3. ¿Existe alguna política RLS en meetup_participants
   que permita SELECT a participantes de la misma
   juntada, o solo permite ver la fila propia?
   Buscar en las migraciones SQL.

No tocar ningún archivo, solo reportar.

## Tarea 2 — Migración 013: función RPC
Crear el archivo:
supabase/migrations/013_get_meetup_participant_ids.sql

Contenido:
```sql
-- Retorna los user_id de participantes activos de una juntada
-- excluyendo a un usuario específico (generalmente el organizador).
-- SECURITY DEFINER permite ejecutar sin restricciones de RLS.
CREATE OR REPLACE FUNCTION get_meetup_participant_ids(
  p_meetup_id UUID,
  p_excluded_user_id UUID
)
RETURNS TABLE(user_id UUID)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT mp.user_id
  FROM meetup_participants mp
  WHERE mp.meetup_id = p_meetup_id
    AND mp.left_at IS NULL
    AND mp.user_id != p_excluded_user_id;
$$;
```

No ejecutar la migración todavía.
No hacer commits.
Archivos esperados:
- supabase/migrations/013_get_meetup_participant_ids.sql

## Tarea 3 — Usar RPC en cancelMeetup
En meetupService.ts, función cancelMeetup,
reemplazar en el bloque fire-and-forget:

La query actual:
```typescript
const { data: participants } = await supabase
  .from('meetup_participants')
  .select('user_id')
  .eq('meetup_id', meetupId)
  .is('left_at', null)
  .neq('user_id', userId);
```

Por la llamada RPC:
```typescript
const { data: participants } = await supabase
  .rpc('get_meetup_participant_ids', {
    p_meetup_id: meetupId,
    p_excluded_user_id: userId,
  });
```

No modificar ninguna otra lógica.
No hacer commits.
Archivos esperados:
- mobile/src/features/meetups/services/meetupService.ts

## Tarea 4 — Usar RPC en finishMeetup
En meetupService.ts, función finishMeetup,
reemplazar la misma query en el bloque finished
Y en el bloque review_enabled por la llamada RPC:
```typescript
const { data: participants } = await supabase
  .rpc('get_meetup_participant_ids', {
    p_meetup_id: meetupId,
    p_excluded_user_id: userId,
  });
```

Aplicar el reemplazo en ambos bloques fire-and-forget
(finished y review_enabled usan la misma query).
No modificar ninguna otra lógica.
No hacer commits.
Archivos esperados:
- mobile/src/features/meetups/services/meetupService.ts

## Tarea 5 — Documentar este prompt
Crear el archivo:
ia/entrega-3/prompts/bloque-2/01b_fix_rls_notificaciones.md
con el contenido completo de este prompt.
Actualizar ia/entrega-3/indice_ia.md agregando:
01b - Fix RLS notificaciones: función RPC
      get_meetup_participant_ids con SECURITY DEFINER

No hacer commits.

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- No hacer commits
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar reportar
1. Archivos creados o modificados
2. Cómo quedó la llamada RPC en cada función
3. Cómo probarlo:
   - Aplicar migración 013 en Supabase SQL Editor
   - Con Expo Go: cancelar/finalizar juntada con
     participantes → verificar filas nuevas en
     tabla notifications con types cancelled/finished
   - Participante abandona → verificar fila left
     en notifications del organizador

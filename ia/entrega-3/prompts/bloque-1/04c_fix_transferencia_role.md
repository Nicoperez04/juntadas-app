# Prompt 04c COMPLETO— Fix transferencia organizador en delete-account
# (no documentar como los otros, es corrección interna)

## Contexto
Rama actual: feature/bloque-1-deuda-tecnica
La Edge Function delete-account transfiere meetups.created_by
correctamente al sucesor, pero no actualiza el campo role en
meetup_participants. El sucesor queda con role = 'participant'
en vez de role = 'organizer', por lo que la app no lo reconoce
como nuevo organizador.

## Tarea 1 — Análisis previo
Sin tocar ningún archivo, reportá:

1. En delete-account/index.ts, dentro de
   transferOrDeleteOrganizedMeetups, en el bloque donde
   se hace el UPDATE de created_by al sucesor:
   ¿Hay algún UPDATE posterior a meetup_participants
   para cambiar el role del sucesor?

2. ¿Qué valores puede tener la columna role en
   meetup_participants? Buscarlo en las migraciones SQL
   o en los tipos TypeScript del proyecto móvil.

No tocar ningún archivo, solo reportar.

## Tarea 2 — Fix: actualizar role del sucesor
En supabase/functions/delete-account/index.ts, dentro de
transferOrDeleteOrganizedMeetups, después del UPDATE exitoso
de meetups.created_by al sucesor, agregar:

UPDATE meetup_participants
SET role = 'organizer'
WHERE meetup_id = meetup.id
AND user_id = successor.user_id

Si este UPDATE falla, retornar stepError(1, mensaje).

No modificar ninguna otra lógica de la función.
No hacer commits.
Archivos esperados:
- supabase/functions/delete-account/index.ts

## Tarea 3 — Documentar
Crear el archivo:
ia/entrega-3/prompts/bloque-1/04c_fix_transferencia_role.md
con el contenido completo de este prompt.
Actualizar ia/entrega-3/indice_ia.md agregando:
04c - Fix transferencia organizador: actualizar role en
      meetup_participants al transferir created_by

No hacer commits.

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- No hacer commits
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar reportar
1. Archivos modificados
2. Cómo quedó el bloque de transferencia completo
3. Cómo probarlo:
   - supabase functions deploy delete-account
   - Cuenta de prueba con juntada donde sea organizador
     y tenga participante confirmado
   - Eliminar cuenta
   - Verificar que el participante confirmado aparece
     como organizador en la app (no solo en created_by
     de Supabase sino en su rol dentro de la juntada)

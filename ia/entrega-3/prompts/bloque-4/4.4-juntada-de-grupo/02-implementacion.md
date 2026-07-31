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

# Índice de temas consultados con IA — Entrega 3

Estructura espejo de `ia/entrega-2/indice_ia.md`. Cada bloque de E3 registra
sus prompts en `prompts/bloque-N/` y sus conversaciones exportadas en
`conversaciones/bloque-N/`.

## Cursor

### Bloque 1 — Deuda técnica (08/07/2026)

- **01** · ParticipantListScreen: reemplazar Alert.alert por ErrorAnimation → [`prompts/bloque-1/01_participant_list_error_animation.md`](prompts/bloque-1/01_participant_list_error_animation.md)
- **02** · Fix toggle notificaciones: guard AsyncStorage en App.tsx y control de suscripción Realtime desde ProfileScreen → [`prompts/bloque-1/02_fix_toggle_notificaciones.md`](prompts/bloque-1/02_fix_toggle_notificaciones.md)
- **02b** · Corrección fix toggle: AppNotificationsBootstrap con enabled dinámico y fix race condition en onAuthStateChange → [`prompts/bloque-1/02b_correccion_toggle_notificaciones.md`](prompts/bloque-1/02b_correccion_toggle_notificaciones.md)
- **02c** · Corrección banner flotante: eliminar doble lectura AsyncStorage en hook, propagar cambios via AppNotificationsBootstrap → [`prompts/bloque-1/02c_correccion_banner_toggle.md`](prompts/bloque-1/02c_correccion_banner_toggle.md)
- **03** · RLS Storage memories: política DELETE para organizador y auditoría de políticas existentes → [`prompts/bloque-1/03_rls_memories_organizer.sql.md`](prompts/bloque-1/03_rls_memories_organizer.sql.md)
- **03b** · Corrección RLS tabla memories y botón eliminar organizador en MemoryViewerScreen → [`prompts/bloque-1/03b_correccion_rls_memories_viewer.md`](prompts/bloque-1/03b_correccion_rls_memories_viewer.md)
- **03c** · Fix confirmDelete en MemoryViewerScreen: pasar meetupId e isOrganizer a deleteMemory → [`prompts/bloque-1/03c_fix_confirm_delete_viewer.md`](prompts/bloque-1/03c_fix_confirm_delete_viewer.md)
- **04** · Hard delete de cuenta: Edge Function delete-account con service_role y reemplazo de stub en authService → [`prompts/bloque-1/04_hard_delete_cuenta.md`](prompts/bloque-1/04_hard_delete_cuenta.md)
- **04b** · Corrección hard delete: limpieza avatar y portadas en Storage, anonimización impostor_games con migración 011 → [`prompts/bloque-1/04b_correccion_hard_delete.md`](prompts/bloque-1/04b_correccion_hard_delete.md)
- **04c** · Fix transferencia organizador: actualizar role en meetup_participants al transferir created_by → [`prompts/bloque-1/04c_fix_transferencia_role.md`](prompts/bloque-1/04c_fix_transferencia_role.md)
- **04d** · Fix WARNING portadas meetup-covers: reemplazar query schema storage por consulta a meetups.cover_url → [`prompts/bloque-1/04d_fix_warning_portadas.md`](prompts/bloque-1/04d_fix_warning_portadas.md)

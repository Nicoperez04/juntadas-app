# Conversación Bloque 2 — Reseñas post-juntada

**Herramienta:** Cursor Agent  
**Rama:** feature/bloque-2-resumen-post-juntada

## Resumen

### Lo que se implementó

- Migración `007_meetup_reviews.sql`: columna `reviews_enabled` en meetups, tabla `meetup_reviews`, trigger `updated_at`, función `is_meetup_participant`, políticas RLS (SELECT/INSERT/UPDATE/DELETE)
- Tipo `Meetup` con `reviews_enabled?: boolean` y mapeo en `mapMeetupRow`
- `meetupService.finishMeetup`: ahora recibe `reviewsEnabled: boolean` y retorna `{ data: null, error }`
- Módulo `src/features/reviews/`: types, reviewService, useReviews (TanStack Query v5), reviewSchemas (Zod v4)
- Modal de finalizar juntada movido a `MeetupOrganizerActions` con Switch de reseñas, toast ✓ y haptic
- `ReviewFormScreen`: estrellas interactivas, comentario multilínea, crear/editar/eliminar reseña
- `ReviewsSection` integrado en `MeetupDetailScreen` (solo finished + reviews_enabled)
- Ruta `Routes.ReviewForm` registrada en MainNavigator
- `usePendingReviews` + `PendingReviewCard` en home con AsyncStorage (`review_dismissed_{meetupId}`)
- Badge de estrella en historial cuando `reviews_enabled = true`
- Documentación ia/entrega-2/ actualizada

### Decisiones tomadas

- Modal de finalizar centralizado en `MeetupOrganizerActions` (mismo patrón que transferencia de organizador), eliminando duplicado en `MeetupDetailScreen`
- Función SQL `is_meetup_participant` para RLS SELECT: incluye ex-participantes (left_at no null) además de miembros activos
- Badge en historial basado solo en `reviews_enabled` (sin cargar reseñas), priorizando la restricción de no cargar datos extra sobre el criterio "al menos una reseña"
- `finishMeetup` retorna `data: null` según especificación del bloque; hooks invalidan queries para refrescar UI
- Toast en ReviewFormScreen con delay de 900ms antes de `goBack()` para que sea visible antes del desmontaje
- Schema Zod v4 usa `{ message: '...' }` en lugar de `required_error`

### Problemas encontrados y resueltos

- Modal de finalizar estaba en `MeetupDetailScreen` pero el prompt pedía modificar `MeetupOrganizerActions` — resuelto moviendo la lógica completa al componente de acciones del organizador
- Error TS en reviewSchemas con Zod v4 (`required_error` no existe) — corregido a `message`
- Error TS en ReviewFormScreen (`parsed.error.errors` vs `issues`) — corregido a `issues`

### Deuda técnica documentada

- `usePendingReviews` hace N+1 queries (getUserReview por juntada candidata); aceptable para MVP, optimizable con query batch
- Badge de historial no distingue juntadas con 0 reseñas vs con reseñas (limitación por no cargar conteo)
- Reactivar juntada (status active → finished) no está implementado en la app; RLS ya contempla el caso de negocio
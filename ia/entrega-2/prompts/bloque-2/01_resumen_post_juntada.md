# Bloque 2 — Reseñas post-juntada

> Prompt completo de implementación del Bloque 2 (Entrega 2).
> Ver conversación exportada en `conversaciones/bloque-2/cursor-bloque-2-completo.md`.

## Contexto general

Continuamos con la Entrega 2 (E2) del proyecto Juntadas.
Los Bloques 0 y 1 están completos y mergeados a entrega-2.
La rama actual de trabajo es `feature/bloque-2-resumen-post-juntada`.

## Modelo de negocio

- Al finalizar una juntada, el organizador elige si habilita reseñas o no
- Si habilita: todos los participantes pueden dejar una reseña individual
- Cada reseña tiene: rating (1-5 estrellas), comment (texto libre, opcional)
- Un participante puede editar o eliminar su propia reseña
- Nadie puede tocar la reseña de otro
- Una vez habilitadas las reseñas, no se pueden deshabilitar
- El organizador puede reseñar como cualquier participante
- Si la juntada se reactiva, las reseñas se conservan pero no se pueden agregar nuevas hasta que se vuelva a finalizar con reviews habilitadas

## Tareas

1. Migración `007_meetup_reviews.sql` (reviews_enabled + meetup_reviews + RLS)
2. Actualizar tipos y `finishMeetup` en meetupService
3. Módulo `src/features/reviews/` (types, service, hooks, schemas)
4. Modal de finalizar con toggle de reseñas en MeetupOrganizerActions
5. Pantalla ReviewFormScreen (crear/editar reseña)
6. ReviewsSection en detalle de juntada
7. Navegación: Routes.ReviewForm + MainNavigator
8. PendingReviewCard + usePendingReviews en home
9. Indicador de reseñas en historial
10. Documentación ia/entrega-2/

## Reglas generales

- No instalar dependencias adicionales
- No tocar android/ ni ios/
- No hacer commits
- Comentarios en español
- Sin TypeScript any
- Seguir tokens de `src/shared/constants/theme.ts`

# Índice de temas consultados con IA — Entrega 2

Estructura espejo de `ia/entrega-1/indice_ia.md`. Cada bloque de E2 registra
sus prompts en `prompts/bloque-N/` y sus conversaciones exportadas en
`conversaciones/bloque-N/`.

## Cursor

### Bloque 0 — Refactor base y setup E2 (09/06/2026)

- **01** · Integración TanStack Query v5 (QueryClientProvider, useMeetups, useParticipants) → [`conversaciones/bloque-0/cursor-bloque-0-completo.md`](conversaciones/bloque-0/cursor-bloque-0-completo.md) · [`prompts/bloque-0/01_refactor_base.md`](prompts/bloque-0/01_refactor_base.md)
- **02** · Hook useCurrentUser y eliminación de supabase.auth directo en pantallas → [`conversaciones/bloque-0/cursor-bloque-0-completo.md`](conversaciones/bloque-0/cursor-bloque-0-completo.md) · [`prompts/bloque-0/01_refactor_base.md`](prompts/bloque-0/01_refactor_base.md)
- **03** · Centralización de tipado de navegación en navigation/types.ts → [`conversaciones/bloque-0/cursor-bloque-0-completo.md`](conversaciones/bloque-0/cursor-bloque-0-completo.md) · [`prompts/bloque-0/01_refactor_base.md`](prompts/bloque-0/01_refactor_base.md)
- **04** · Refactor MeetupDetailScreen: subcomponentes y useMeetupDetail → [`conversaciones/bloque-0/cursor-bloque-0-completo.md`](conversaciones/bloque-0/cursor-bloque-0-completo.md) · [`prompts/bloque-0/01_refactor_base.md`](prompts/bloque-0/01_refactor_base.md)
- **05** · Guard de onboarding para usuarios con username autogenerado → [`conversaciones/bloque-0/cursor-bloque-0-completo.md`](conversaciones/bloque-0/cursor-bloque-0-completo.md) · [`prompts/bloque-0/01_refactor_base.md`](prompts/bloque-0/01_refactor_base.md)
- **06** · Setup estructura ia/entrega-2/ → [`conversaciones/bloque-0/cursor-bloque-0-completo.md`](conversaciones/bloque-0/cursor-bloque-0-completo.md) · [`prompts/bloque-0/01_refactor_base.md`](prompts/bloque-0/01_refactor_base.md)
- **Documentación** · Cierre del Bloque 0 → [`prompts/bloque-0/02_documentar_bloque-0.md`](prompts/bloque-0/02_documentar_bloque-0.md)

### Bloque 1 — Mejoras de Juntada (09/06/2026)

- **01** · Migración cover_url, bucket meetup-covers y métodos de servicio → [`conversaciones/bloque-1/cursor-bloque-1-completo.md`](conversaciones/bloque-1/cursor-bloque-1-completo.md) · [`prompts/bloque-1/01_mejoras_juntada.md`](prompts/bloque-1/01_mejoras_juntada.md)
- **02** · Portada en crear/editar, detalle y home (preview 16:9, thumbnail) → [`conversaciones/bloque-1/cursor-bloque-1-completo.md`](conversaciones/bloque-1/cursor-bloque-1-completo.md) · [`prompts/bloque-1/01_mejoras_juntada.md`](prompts/bloque-1/01_mejoras_juntada.md)
- **03** · MeetupShareButton (copiar código + WhatsApp) → [`conversaciones/bloque-1/cursor-bloque-1-completo.md`](conversaciones/bloque-1/cursor-bloque-1-completo.md) · [`prompts/bloque-1/01_mejoras_juntada.md`](prompts/bloque-1/01_mejoras_juntada.md)
- **04** · Transferencia de organizador en MeetupOrganizerActions → [`conversaciones/bloque-1/cursor-bloque-1-completo.md`](conversaciones/bloque-1/cursor-bloque-1-completo.md) · [`prompts/bloque-1/01_mejoras_juntada.md`](prompts/bloque-1/01_mejoras_juntada.md)
- **05** · Correctivo: parpadeo modal, feedback de éxito, share nativo, update_expired_meetups → [`conversaciones/bloque-1/cursor-bloque-1-completo.md`](conversaciones/bloque-1/cursor-bloque-1-completo.md) · [`prompts/bloque-1/02_correctivo_mejoras_juntada.md`](prompts/bloque-1/02_correctivo_mejoras_juntada.md)
- **06** · Correctivo: descartar finalización automática + historial en empty state → [`conversaciones/bloque-1/cursor-bloque-1-completo.md`](conversaciones/bloque-1/cursor-bloque-1-completo.md) · [`prompts/bloque-1/03_correctivo_expired_meetups.md`](prompts/bloque-1/03_correctivo_expired_meetups.md)
- **07** · Foto de portada de juntada (Storage, upload, preview, thumbnail en home) → [`conversaciones/bloque-1/cursor-bloque-1-completo.md`](conversaciones/bloque-1/cursor-bloque-1-completo.md) · [`prompts/bloque-1/01_mejoras_juntada.md`](prompts/bloque-1/01_mejoras_juntada.md)
- **08** · Compartir juntada por WhatsApp, copiar código y share nativo → [`conversaciones/bloque-1/cursor-bloque-1-completo.md`](conversaciones/bloque-1/cursor-bloque-1-completo.md) · [`prompts/bloque-1/01_mejoras_juntada.md`](prompts/bloque-1/01_mejoras_juntada.md) · [`prompts/bloque-1/02_correctivo_mejoras_juntada.md`](prompts/bloque-1/02_correctivo_mejoras_juntada.md)
- **09** · Transferencia de organizador con modal de pasos → [`conversaciones/bloque-1/cursor-bloque-1-completo.md`](conversaciones/bloque-1/cursor-bloque-1-completo.md) · [`prompts/bloque-1/01_mejoras_juntada.md`](prompts/bloque-1/01_mejoras_juntada.md)
- **10** · Fix parpadeo modal transferencia y feedback de éxito con haptics → [`conversaciones/bloque-1/cursor-bloque-1-completo.md`](conversaciones/bloque-1/cursor-bloque-1-completo.md) · [`prompts/bloque-1/02_correctivo_mejoras_juntada.md`](prompts/bloque-1/02_correctivo_mejoras_juntada.md)
- **11** · Decisión: finalización automática de juntadas descartada (manual only) → [`conversaciones/bloque-1/cursor-bloque-1-completo.md`](conversaciones/bloque-1/cursor-bloque-1-completo.md) · [`prompts/bloque-1/03_correctivo_expired_meetups.md`](prompts/bloque-1/03_correctivo_expired_meetups.md)
- **12** · Fix bug UX: Ver historial en empty state del home → [`conversaciones/bloque-1/cursor-bloque-1-completo.md`](conversaciones/bloque-1/cursor-bloque-1-completo.md) · [`prompts/bloque-1/03_correctivo_expired_meetups.md`](prompts/bloque-1/03_correctivo_expired_meetups.md)
- **Documentación** · Cierre del Bloque 1 → [`prompts/bloque-1/04_documentar_bloque-1.md`](prompts/bloque-1/04_documentar_bloque-1.md)

### Bloque 2 — Reseñas post-juntada (09/06/2026)

- **13** · Migración meetup_reviews y campo reviews_enabled → [`conversaciones/bloque-2/cursor-bloque-2-completo.md`](conversaciones/bloque-2/cursor-bloque-2-completo.md) · [`prompts/bloque-2/01_resumen_post_juntada.md`](prompts/bloque-2/01_resumen_post_juntada.md)
- **14** · Módulo reviews: service, hook, schemas → [`conversaciones/bloque-2/cursor-bloque-2-completo.md`](conversaciones/bloque-2/cursor-bloque-2-completo.md) · [`prompts/bloque-2/01_resumen_post_juntada.md`](prompts/bloque-2/01_resumen_post_juntada.md)
- **15** · Modal de finalizar juntada con toggle de reseñas → [`conversaciones/bloque-2/cursor-bloque-2-completo.md`](conversaciones/bloque-2/cursor-bloque-2-completo.md) · [`prompts/bloque-2/01_resumen_post_juntada.md`](prompts/bloque-2/01_resumen_post_juntada.md)
- **16** · Pantalla ReviewFormScreen (crear/editar reseña) → [`conversaciones/bloque-2/cursor-bloque-2-completo.md`](conversaciones/bloque-2/cursor-bloque-2-completo.md) · [`prompts/bloque-2/01_resumen_post_juntada.md`](prompts/bloque-2/01_resumen_post_juntada.md)
- **17** · Componente ReviewsSection en detalle de juntada → [`conversaciones/bloque-2/cursor-bloque-2-completo.md`](conversaciones/bloque-2/cursor-bloque-2-completo.md) · [`prompts/bloque-2/01_resumen_post_juntada.md`](prompts/bloque-2/01_resumen_post_juntada.md)
- **18** · Card de reseña pendiente en home (PendingReviewCard) → [`conversaciones/bloque-2/cursor-bloque-2-completo.md`](conversaciones/bloque-2/cursor-bloque-2-completo.md) · [`prompts/bloque-2/01_resumen_post_juntada.md`](prompts/bloque-2/01_resumen_post_juntada.md)
- **19** · Indicador de reseñas en historial → [`conversaciones/bloque-2/cursor-bloque-2-completo.md`](conversaciones/bloque-2/cursor-bloque-2-completo.md) · [`prompts/bloque-2/01_resumen_post_juntada.md`](prompts/bloque-2/01_resumen_post_juntada.md)

## Skills

- Skills instaladas (base heredada de E1): [`skills_instaladas.md`](skills_instaladas.md)

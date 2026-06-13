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

### Bloque 3 — Historial mejorado (10/06/2026)

- **20** · Instalación @gorhom/bottom-sheet + setup Reanimated y GestureHandler → [`conversaciones/bloque-3/cursor-bloque-3-completo.md`](conversaciones/bloque-3/cursor-bloque-3-completo.md) · [`prompts/bloque-3/01_historial_mejorado.md`](prompts/bloque-3/01_historial_mejorado.md)
- **21** · Migración meetup_hidden para ocultar juntadas individuales → [`conversaciones/bloque-3/cursor-bloque-3-completo.md`](conversaciones/bloque-3/cursor-bloque-3-completo.md) · [`prompts/bloque-3/01_historial_mejorado.md`](prompts/bloque-3/01_historial_mejorado.md)
- **22** · getAllUserMeetups, hideMeetup, deleteMeetupForAll, reactivateMeetup → [`conversaciones/bloque-3/cursor-bloque-3-completo.md`](conversaciones/bloque-3/cursor-bloque-3-completo.md) · [`prompts/bloque-3/01_historial_mejorado.md`](prompts/bloque-3/01_historial_mejorado.md)
- **23** · Rediseño MeetupHistoryScreen: búsqueda, filtros, chips, swipe actions → [`conversaciones/bloque-3/cursor-bloque-3-completo.md`](conversaciones/bloque-3/cursor-bloque-3-completo.md) · [`prompts/bloque-3/01_historial_mejorado.md`](prompts/bloque-3/01_historial_mejorado.md)
- **24** · Acciones ocultar y eliminar para todos desde historial → [`conversaciones/bloque-3/cursor-bloque-3-completo.md`](conversaciones/bloque-3/cursor-bloque-3-completo.md) · [`prompts/bloque-3/01_historial_mejorado.md`](prompts/bloque-3/01_historial_mejorado.md)
- **25** · Reactivar juntada finalizada desde MeetupOrganizerActions → [`conversaciones/bloque-3/cursor-bloque-3-completo.md`](conversaciones/bloque-3/cursor-bloque-3-completo.md) · [`prompts/bloque-3/01_historial_mejorado.md`](prompts/bloque-3/01_historial_mejorado.md)
- **26** · Corrección diseño historial: buscador, bottom sheet, selección múltiple y animaciones → [`conversaciones/bloque-3/cursor-bloque-3-completo.md`](conversaciones/bloque-3/cursor-bloque-3-completo.md) · [`prompts/bloque-3/02_correctivo_diseno_historial.md`](prompts/bloque-3/02_correctivo_diseno_historial.md)
- **27** · Documentación y cierre del Bloque 3 → [`conversaciones/bloque-3/cursor-bloque-3-completo.md`](conversaciones/bloque-3/cursor-bloque-3-completo.md) · [`prompts/bloque-3/03_documentar_bloque-3.md`](prompts/bloque-3/03_documentar_bloque-3.md)

### Bloque 4 — Herramientas de juegos (11/06/2026)

- **28** · TimerScreen: temporizador con cuenta regresiva y cronómetro → [`conversaciones/bloque-4/cursor-bloque-4-completo.md`](conversaciones/bloque-4/cursor-bloque-4-completo.md) · [`prompts/bloque-4/01_herramientas.md`](prompts/bloque-4/01_herramientas.md)
- **29** · TeamRandomizerScreen: equipos aleatorios con configuración flexible → [`conversaciones/bloque-4/cursor-bloque-4-completo.md`](conversaciones/bloque-4/cursor-bloque-4-completo.md) · [`prompts/bloque-4/01_herramientas.md`](prompts/bloque-4/01_herramientas.md)
- **30** · Navegación: rutas Timer y TeamRandomizer → [`conversaciones/bloque-4/cursor-bloque-4-completo.md`](conversaciones/bloque-4/cursor-bloque-4-completo.md) · [`prompts/bloque-4/01_herramientas.md`](prompts/bloque-4/01_herramientas.md)
- **31** · Migración GamesScreen de features/impostor a features/games → [`conversaciones/bloque-4/cursor-bloque-4-completo.md`](conversaciones/bloque-4/cursor-bloque-4-completo.md) · [`prompts/bloque-4/02_rediseno_pantalla_juegos.md`](prompts/bloque-4/02_rediseno_pantalla_juegos.md)
- **32** · Rediseño GamesScreen: grid 2 col, cards animadas, secciones Juegos/Herramientas → [`conversaciones/bloque-4/cursor-bloque-4-completo.md`](conversaciones/bloque-4/cursor-bloque-4-completo.md) · [`prompts/bloque-4/02_rediseno_pantalla_juegos.md`](prompts/bloque-4/02_rediseno_pantalla_juegos.md)
- **33** · Dataset whoAmIData.ts: 6 categorías + todas mezcladas → [`conversaciones/bloque-4/cursor-bloque-4-completo.md`](conversaciones/bloque-4/cursor-bloque-4-completo.md) · [`prompts/bloque-4/03_que_soy.md`](prompts/bloque-4/03_que_soy.md)
- **34** · WhoAmISetupScreen: selección de categoría → [`conversaciones/bloque-4/cursor-bloque-4-completo.md`](conversaciones/bloque-4/cursor-bloque-4-completo.md) · [`prompts/bloque-4/03_que_soy.md`](prompts/bloque-4/03_que_soy.md)
- **35** · WhoAmIGameScreen: juego en landscape con animación de cartas → [`conversaciones/bloque-4/cursor-bloque-4-completo.md`](conversaciones/bloque-4/cursor-bloque-4-completo.md) · [`prompts/bloque-4/03_que_soy.md`](prompts/bloque-4/03_que_soy.md)
- **36** · Navegación: rutas WhoAmISetup y WhoAmIGame → [`conversaciones/bloque-4/cursor-bloque-4-completo.md`](conversaciones/bloque-4/cursor-bloque-4-completo.md) · [`prompts/bloque-4/03_que_soy.md`](prompts/bloque-4/03_que_soy.md)
- **37** · Dataset groupQuestionsData.ts: 100 preguntas en 5 categorías temáticas → [`conversaciones/bloque-4/cursor-bloque-4-completo.md`](conversaciones/bloque-4/cursor-bloque-4-completo.md) · [`prompts/bloque-4/04_preguntas_grupo.md`](prompts/bloque-4/04_preguntas_grupo.md)
- **38** · GroupQuestionsScreen: juego de preguntas con animación lateral → [`conversaciones/bloque-4/cursor-bloque-4-completo.md`](conversaciones/bloque-4/cursor-bloque-4-completo.md) · [`prompts/bloque-4/04_preguntas_grupo.md`](prompts/bloque-4/04_preguntas_grupo.md)
- **39** · Navegación: ruta GroupQuestions → [`conversaciones/bloque-4/cursor-bloque-4-completo.md`](conversaciones/bloque-4/cursor-bloque-4-completo.md) · [`prompts/bloque-4/04_preguntas_grupo.md`](prompts/bloque-4/04_preguntas_grupo.md)
- **40** · Correctivo cronómetro: milisegundos solo en modo cronómetro → [`conversaciones/bloque-4/cursor-bloque-4-completo.md`](conversaciones/bloque-4/cursor-bloque-4-completo.md) · [`prompts/bloque-4/02_correctivo_cronometro_ms.md`](prompts/bloque-4/02_correctivo_cronometro_ms.md)
- **41** · Correctivo equipos: input numérico y validación de división → [`conversaciones/bloque-4/cursor-bloque-4-completo.md`](conversaciones/bloque-4/cursor-bloque-4-completo.md) · [`prompts/bloque-4/03_correctivo_equipos_division.md`](prompts/bloque-4/03_correctivo_equipos_division.md)
- **42** · Correctivo equipos: scroll de participantes desde el tercero → [`conversaciones/bloque-4/cursor-bloque-4-completo.md`](conversaciones/bloque-4/cursor-bloque-4-completo.md) · [`prompts/bloque-4/04_correctivo_equipos_scroll.md`](prompts/bloque-4/04_correctivo_equipos_scroll.md)
- **43** · ScorerSetupScreen: configuración de jugadores y puntaje objetivo → [`conversaciones/bloque-4/cursor-bloque-4-completo.md`](conversaciones/bloque-4/cursor-bloque-4-completo.md) · [`prompts/bloque-4/05_anotador_generico.md`](prompts/bloque-4/05_anotador_generico.md)
- **44** · ScorerGameScreen: anotador con edición inline, mid-game y objetivo → [`conversaciones/bloque-4/cursor-bloque-4-completo.md`](conversaciones/bloque-4/cursor-bloque-4-completo.md) · [`prompts/bloque-4/05_anotador_generico.md`](prompts/bloque-4/05_anotador_generico.md)
- **45** · Navegación: rutas ScorerSetup y ScorerGame → [`conversaciones/bloque-4/cursor-bloque-4-completo.md`](conversaciones/bloque-4/cursor-bloque-4-completo.md) · [`prompts/bloque-4/05_anotador_generico.md`](prompts/bloque-4/05_anotador_generico.md)
- **46** · Corrección: juegos desde juntada con prellenado de participantes en TeamRandomizer y ScorerSetup → [`conversaciones/bloque-4/cursor-bloque-4-completo.md`](conversaciones/bloque-4/cursor-bloque-4-completo.md) · [`prompts/bloque-4/06_correctivo_juegos_desde_juntada.md`](prompts/bloque-4/06_correctivo_juegos_desde_juntada.md)
- **47** · Documentación y cierre del Bloque 4 → [`conversaciones/bloque-4/cursor-bloque-4-completo.md`](conversaciones/bloque-4/cursor-bloque-4-completo.md) · [`prompts/bloque-4/07_documentar_bloque-4.md`](prompts/bloque-4/07_documentar_bloque-4.md)

### Bloque 5 — Notificaciones y EAS Build (11/06/2026)

- **48** · EAS Build setup: eas.json, android.package, perfil preview, APK E2 → [`conversaciones/bloque-5/cursor-bloque-5-completo.md`](conversaciones/bloque-5/cursor-bloque-5-completo.md) · [`prompts/bloque-5/01_eas_build_setup.md`](prompts/bloque-5/01_eas_build_setup.md)
- **49** · Migración 009_notifications: tabla notifications, enum notification_type, push_token en profiles, RLS → [`conversaciones/bloque-5/cursor-bloque-5-completo.md`](conversaciones/bloque-5/cursor-bloque-5-completo.md) · [`prompts/bloque-5/02_backend_notificaciones.md`](prompts/bloque-5/02_backend_notificaciones.md)
- **50** · Edge Function send-push-notification (Deno): persistencia in-app + Expo Push API → [`conversaciones/bloque-5/cursor-bloque-5-completo.md`](conversaciones/bloque-5/cursor-bloque-5-completo.md) · [`prompts/bloque-5/02_backend_notificaciones.md`](prompts/bloque-5/02_backend_notificaciones.md)
- **51** · expo-notifications + expo-device: instalación, plugin en app.json, permisos Android → [`conversaciones/bloque-5/cursor-bloque-5-completo.md`](conversaciones/bloque-5/cursor-bloque-5-completo.md) · [`prompts/bloque-5/02_backend_notificaciones.md`](prompts/bloque-5/02_backend_notificaciones.md)
- **52** · notificationService (registerPushToken, sendNotification, schedule/cancelReminder) y useNotifications hook → [`conversaciones/bloque-5/cursor-bloque-5-completo.md`](conversaciones/bloque-5/cursor-bloque-5-completo.md) · [`prompts/bloque-5/02_backend_notificaciones.md`](prompts/bloque-5/02_backend_notificaciones.md)
- **53** · Registro de push token en App.tsx (onAuthStateChange) y eventos integrados: joined, transferred, review_enabled, reminder → [`conversaciones/bloque-5/cursor-bloque-5-completo.md`](conversaciones/bloque-5/cursor-bloque-5-completo.md) · [`prompts/bloque-5/02_backend_notificaciones.md`](prompts/bloque-5/02_backend_notificaciones.md)
- **54** · Fix: expo-notifications compatible con Expo Go (guard isExpoGo en registerPushToken y setNotificationHandler) → [`conversaciones/bloque-5/cursor-bloque-5-completo.md`](conversaciones/bloque-5/cursor-bloque-5-completo.md) · [`prompts/bloque-5/03_fix_expo_go_notifications.md`](prompts/bloque-5/03_fix_expo_go_notifications.md)
- **55** · useRealtimeNotifications + notificationStore Zustand → [`conversaciones/bloque-5/cursor-bloque-5-completo.md`](conversaciones/bloque-5/cursor-bloque-5-completo.md) · [`prompts/bloque-5/04_frontend_notificaciones.md`](prompts/bloque-5/04_frontend_notificaciones.md)
- **56** · NotificationBanner: banner flotante animado → [`conversaciones/bloque-5/cursor-bloque-5-completo.md`](conversaciones/bloque-5/cursor-bloque-5-completo.md) · [`prompts/bloque-5/04_frontend_notificaciones.md`](prompts/bloque-5/04_frontend_notificaciones.md)
- **57** · Badge de notificaciones en campana del home → [`conversaciones/bloque-5/cursor-bloque-5-completo.md`](conversaciones/bloque-5/cursor-bloque-5-completo.md) · [`prompts/bloque-5/04_frontend_notificaciones.md`](prompts/bloque-5/04_frontend_notificaciones.md)
- **58** · NotificationPanel: panel con lista y swipe → [`conversaciones/bloque-5/cursor-bloque-5-completo.md`](conversaciones/bloque-5/cursor-bloque-5-completo.md) · [`prompts/bloque-5/04_frontend_notificaciones.md`](prompts/bloque-5/04_frontend_notificaciones.md)
- **59** · Toggle de notificaciones en perfil → [`conversaciones/bloque-5/cursor-bloque-5-completo.md`](conversaciones/bloque-5/cursor-bloque-5-completo.md) · [`prompts/bloque-5/04_frontend_notificaciones.md`](prompts/bloque-5/04_frontend_notificaciones.md)
- **60** · Documentación y cierre del Bloque 5 → [`conversaciones/bloque-5/cursor-bloque-5-completo.md`](conversaciones/bloque-5/cursor-bloque-5-completo.md) · [`prompts/bloque-5/05_documentar_bloque-5.md`](prompts/bloque-5/05_documentar_bloque-5.md)

### Bloque 6 — Perfil mejorado (13/06/2026)

- **61** · Deep links: scheme rondaapp, intentFilters, redirectTo en resetPasswordForEmail → [`prompts/bloque-6/01_perfil_mejorado.md`](prompts/bloque-6/01_perfil_mejorado.md)
- **62** · ResetPasswordScreen: nueva contraseña via deep link → [`prompts/bloque-6/01_perfil_mejorado.md`](prompts/bloque-6/01_perfil_mejorado.md)
- **63** · Handler PASSWORD_RECOVERY en AppNavigator → [`prompts/bloque-6/01_perfil_mejorado.md`](prompts/bloque-6/01_perfil_mejorado.md)
- **64** · ChangePasswordScreen: cambio de contraseña logueado → [`prompts/bloque-6/01_perfil_mejorado.md`](prompts/bloque-6/01_perfil_mejorado.md)
- **65** · Eliminar cuenta desde perfil → [`prompts/bloque-6/01_perfil_mejorado.md`](prompts/bloque-6/01_perfil_mejorado.md)

## Skills

- Skills instaladas (base heredada de E1): [`skills_instaladas.md`](skills_instaladas.md)

# Índice de temas consultados con IA — Entrega 1

## Claude / Claude Code CLI

01 - Contextualización del proyecto y revisión de documentos técnicos
02 - Análisis y revisión del diseño en Figma (mockups y wireframes)
03 - Planificación general del flujo de trabajo y fases de desarrollo
04 - Estructura del repositorio GitHub y convenciones de commits
05 - Inicialización del proyecto Expo con template blank-typescript
06 - Instalación y alineación de dependencias SDK 55
07 - Análisis y diseño del modelo de datos en Supabase
08 - Creación de tablas, enums, triggers, índices y políticas RLS
09 - Configuración del cliente de Supabase y variables de entorno
10 - Esqueleto de navegación con React Navigation
11 - Resolución de conflicto entre Expo Router y React Navigation
12 - Configuración de Cursor Rules para el proyecto
13 - Instalación de agent skills para React Native, Expo, Supabase y diseño móvil (ver `skills_instaladas.md`)
14 - Bloque Debugging con Claude Code CLI: fixes B1, B3, B4, B5, B9 y B10 → [`conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`](conversaciones/bloque-debugging/claude-bloque-debugging-completo.md)

## Cursor

### Sesiones de prueba (sin numeración)

- Diagnóstico Expo Router y renombrado a src/navigation → [`conversaciones/expo-router-navigation.md`](conversaciones/expo-router-navigation.md) · [`prompts/expo-router-navigation.md`](prompts/expo-router-navigation.md)
- Instalación de agent skills → [`conversaciones/instalacion-skills.md`](conversaciones/instalacion-skills.md) · [`prompts/instalacion-skills.md`](prompts/instalacion-skills.md)
- Exportación de conversaciones con SpecStory → [`conversaciones/exportacion-conversaciones.md`](conversaciones/exportacion-conversaciones.md) · [`prompts/exportacion-conversaciones.md`](prompts/exportacion-conversaciones.md)
- Cursor Rules, migración Supabase e índice IA → [`conversaciones/cursor-rules-migracion-indice.md`](conversaciones/cursor-rules-migracion-indice.md) · [`prompts/cursor-rules-migracion-indice.md`](prompts/cursor-rules-migracion-indice.md)

### Bloque 1 — Autenticación (23/05/2026)

- **01** · Implementación del módulo de auth (tipos, schemas, servicio, hook, componentes y pantallas) → [`conversaciones/bloque-1/cursor-bloque-1-completo.md`](conversaciones/bloque-1/cursor-bloque-1-completo.md) · [`prompts/bloque-1/cursor-01-auth-implementacion.md`](prompts/bloque-1/cursor-01-auth-implementacion.md)
- **02** · Revisión, comentarios profesionales y sistema de diseño (theme.ts) → [`prompts/bloque-1/cursor-02-auth-revision-comentarios.md`](prompts/bloque-1/cursor-02-auth-revision-comentarios.md)
- **03** · Documentación y cierre del Bloque 1 → [`prompts/bloque-1/cursor-03-documentar-bloque-1.md`](prompts/bloque-1/cursor-03-documentar-bloque-1.md)

### Bloque 2 — Juntadas (23/05/2026)

- **13** · Implementación del módulo de juntadas (meetups) → [`conversaciones/bloque-2/cursor-bloque-2-chat-1.md`](conversaciones/bloque-2/cursor-bloque-2-chat-1.md) · [`prompts/bloque-2/cursor-01-meetups-implementacion.md`](prompts/bloque-2/cursor-01-meetups-implementacion.md)
- **14** · Fix de RLS circular en meetup_participants → [`conversaciones/bloque-2/cursor-bloque-2-chat-1.md`](conversaciones/bloque-2/cursor-bloque-2-chat-1.md)
- **15** · Fix de formato de fecha para PostgreSQL → [`conversaciones/bloque-2/cursor-bloque-2-chat-1.md`](conversaciones/bloque-2/cursor-bloque-2-chat-1.md) · [`prompts/bloque-2/cursor-02-meetups-fixes-previos-test.md`](prompts/bloque-2/cursor-02-meetups-fixes-previos-test.md)
- **16** · Implementación de selectores nativos de fecha y hora → [`conversaciones/bloque-2/cursor-bloque-2-chat-2.md`](conversaciones/bloque-2/cursor-bloque-2-chat-2.md) · [`prompts/bloque-2/cursor-03-datetime-picker.md`](prompts/bloque-2/cursor-03-datetime-picker.md) · [`prompts/bloque-2/cursor-04-datetime-picker-fix.md`](prompts/bloque-2/cursor-04-datetime-picker-fix.md)
- **17** · Fix de refresh de lista al volver al home → [`conversaciones/bloque-2/cursor-bloque-2-chat-1.md`](conversaciones/bloque-2/cursor-bloque-2-chat-1.md) · [`prompts/bloque-2/cursor-05-meetups-refresh.md`](prompts/bloque-2/cursor-05-meetups-refresh.md)
- **Documentación** · Cierre del Bloque 2 → [`prompts/bloque-2/cursor-06-documentar-bloque-2.md`](prompts/bloque-2/cursor-06-documentar-bloque-2.md)

### Bloque 3 — Participantes y acciones (23–24/05/2026)

- **18** · Implementación del módulo de participantes → [`conversaciones/bloque-3/cursor-bloque-3-completo.md`](conversaciones/bloque-3/cursor-bloque-3-completo.md) · [`prompts/bloque-3/cursor-01-participantes-implementacion.md`](prompts/bloque-3/cursor-01-participantes-implementacion.md)
- **19** · Fix de RLS circular en meetup_participants → [`conversaciones/bloque-3/cursor-bloque-3-completo.md`](conversaciones/bloque-3/cursor-bloque-3-completo.md) · [`prompts/bloque-3/cursor-02-fixes-bloque-3.md`](prompts/bloque-3/cursor-02-fixes-bloque-3.md)
- **20** · Fix UX: Toast centrado, modal asistencia, nombres de participantes → [`conversaciones/bloque-3/cursor-bloque-3-completo.md`](conversaciones/bloque-3/cursor-bloque-3-completo.md) · [`prompts/bloque-3/cursor-03-ux-fixes.md`](prompts/bloque-3/cursor-03-ux-fixes.md)
- **21** · Revisión completa del Bloque 3 → [`conversaciones/bloque-3/cursor-bloque-3-completo.md`](conversaciones/bloque-3/cursor-bloque-3-completo.md) · [`prompts/bloque-3/cursor-04-revision-bloque-3.md`](prompts/bloque-3/cursor-04-revision-bloque-3.md)
- **22** · Fixes finales: juntadas finalizadas bloqueadas para edición → [`conversaciones/bloque-3/cursor-bloque-3-completo.md`](conversaciones/bloque-3/cursor-bloque-3-completo.md) · [`prompts/bloque-3/cursor-05-fixes-finales-bloque-3.md`](prompts/bloque-3/cursor-05-fixes-finales-bloque-3.md)
- **Documentación** · Cierre del Bloque 3 → [`prompts/bloque-3/cursor-06-documentar-bloque-3.md`](prompts/bloque-3/cursor-06-documentar-bloque-3.md)

### Bloque 4 — Juego Impostor

- **23** · Implementación del juego Impostor (GamesScreen, ImpostorStartScreen, ImpostorRoleScreen) → [`conversaciones/bloque-4/cursor-bloque-4-completo.md`](conversaciones/bloque-4/cursor-bloque-4-completo.md) · [`prompts/bloque-4/cursor-01-impostor-implementacion.md`](prompts/bloque-4/cursor-01-impostor-implementacion.md)
- **24** · Rediseño y correcciones del Impostor (palabra aleatoria, diseño integrado, standalone) → [`conversaciones/bloque-4/cursor-bloque-4-completo.md`](conversaciones/bloque-4/cursor-bloque-4-completo.md) · [`prompts/bloque-4/cursor-03-impostor-redesign.md`](prompts/bloque-4/cursor-03-impostor-redesign.md)
- **25** · Guía de onboarding para el equipo (ONBOARDING.md) → [`conversaciones/bloque-4/cursor-bloque-4-completo.md`](conversaciones/bloque-4/cursor-bloque-4-completo.md)

### Bloque 6 — Perfil de usuario (24/05/2026)

- **26** · Implementación del perfil de usuario (ProfileScreen, avatar, estadísticas, logout) → [`conversaciones/bloque-6/cursor-bloque-6-completo.md`](conversaciones/bloque-6/cursor-bloque-6-completo.md) · [`prompts/bloque-6/cursor-01-perfil-implementacion.md`](prompts/bloque-6/cursor-01-perfil-implementacion.md)
- **Documentación** · Cierre del Bloque 6 → [`conversaciones/bloque-6/cursor-bloque-6-completo.md`](conversaciones/bloque-6/cursor-bloque-6-completo.md) · [`prompts/bloque-6/cursor-02-documentar-bloque-6.md`](prompts/bloque-6/cursor-02-documentar-bloque-6.md)

### Bloque 7 — Marca (26/05/2026)

- **32** · Reemplazo de icono por logo oficial (`logo-nobg.png`) → [`conversaciones/bloque-7/cursor-bloque-7-completo.md`](conversaciones/bloque-7/cursor-bloque-7-completo.md) · [`prompts/bloque-7/cursor-01-logo-app.md`](prompts/bloque-7/cursor-01-logo-app.md)
- **33** · Logo en heading de home y cambio de nombre a Ronda App → [`conversaciones/bloque-7/cursor-bloque-7-completo.md`](conversaciones/bloque-7/cursor-bloque-7-completo.md) · [`prompts/bloque-7/cursor-02-home-logo-app-name.md`](prompts/bloque-7/cursor-02-home-logo-app-name.md)

### Fixes participantes y UX — Cursor (25/05/2026)

- **27** · Ajustes de participantes, footer y toast de asistencia → [`conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`](conversaciones/bloque-debugging/claude-bloque-debugging-completo.md) · [`prompts/bloque-debugging/cursor-02-participant-list-avatar.md`](prompts/bloque-debugging/cursor-02-participant-list-avatar.md)
- **28** · Fixes participantes: abandonar desde detalle, volver a unirse, historial restringido → [`conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`](conversaciones/bloque-debugging/claude-bloque-debugging-completo.md) · [`prompts/bloque-debugging/cursor-07-fixes-participantes.md`](prompts/bloque-debugging/cursor-07-fixes-participantes.md)
- **Documentación** · Fixes participantes y UX → [`prompts/bloque-debugging/cursor-08-documentar-fixes.md`](prompts/bloque-debugging/cursor-08-documentar-fixes.md)

### Bloque 5 — Recuerdos / Galería de fotos

- **29** · Implementación del módulo de recuerdos (galería, viewer, subida múltiple, eliminación) → [`conversaciones/bloque-5/cursor-bloque-5-completo.md`](conversaciones/bloque-5/cursor-bloque-5-completo.md) · [`prompts/bloque-5/cursor-01-recuerdos-implementacion.md`](prompts/bloque-5/cursor-01-recuerdos-implementacion.md)
- **30** · Fixes recuerdos: refresh al eliminar desde viewer, tooltip de primera visita y modal de ayuda → [`conversaciones/bloque-5/cursor-bloque-5-completo.md`](conversaciones/bloque-5/cursor-bloque-5-completo.md) · [`prompts/bloque-5/cursor-02-memories-fixes.md`](prompts/bloque-5/cursor-02-memories-fixes.md)
- **31** · Skill propia: `photo-gallery-patterns.mdc` → [`conversaciones/bloque-5/cursor-bloque-5-completo.md`](conversaciones/bloque-5/cursor-bloque-5-completo.md) · documentada en [`skills_instaladas.md`](skills_instaladas.md)
- **Documentación** · Cierre del Bloque 5 → [`prompts/bloque-5/cursor-03-documentar-bloque-5.md`](prompts/bloque-5/cursor-03-documentar-bloque-5.md)

### Bloque Debugging — Fixes y pulido UX (Claude Code CLI) (25/05/2026)

- **B1** · Footer tab bar faltante en pantallas principales (CreateMeetup, JoinMeetup, Profile, MeetupDetail, History) → [`conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`](conversaciones/bloque-debugging/claude-bloque-debugging-completo.md) · [`prompts/bloque-debugging/claude-01-B1-footer.md`](prompts/bloque-debugging/claude-01-B1-footer.md)
- **B3** · Bug impostor: restauración no deseada de jugadores al vaciar la lista → [`conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`](conversaciones/bloque-debugging/claude-bloque-debugging-completo.md) · [`prompts/bloque-debugging/claude-02-B3-impostor.md`](prompts/bloque-debugging/claude-02-B3-impostor.md)
- **B4** · Modal de asistencia no se cierra después de guardar (Toast superpuesto sobre sheet abierto) → [`conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`](conversaciones/bloque-debugging/claude-bloque-debugging-completo.md) · [`prompts/bloque-debugging/claude-03-B4-asistencia.md`](prompts/bloque-debugging/claude-03-B4-asistencia.md)
- **B5** · Avatar del header no muestra foto de perfil y no navega al perfil → [`conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`](conversaciones/bloque-debugging/claude-bloque-debugging-completo.md) · [`prompts/bloque-debugging/claude-04-B5-perfil.md`](prompts/bloque-debugging/claude-04-B5-perfil.md)
- **B9** · Cursor del input de código aparece al extremo derecho — input OTP con 6 cajas individuales → [`conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`](conversaciones/bloque-debugging/claude-bloque-debugging-completo.md)
- **B10** · Popup de foto de perfil reemplazado por modal custom con diseño de la app → [`conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`](conversaciones/bloque-debugging/claude-bloque-debugging-completo.md) · [`prompts/bloque-debugging/claude-05-B10-avatar-modal.md`](prompts/bloque-debugging/claude-05-B10-avatar-modal.md)
- **cursor-02** · Fix avatar en ParticipantListScreen (`profile.avatarUrl`) → [`prompts/bloque-debugging/cursor-02-participant-list-avatar.md`](prompts/bloque-debugging/cursor-02-participant-list-avatar.md)
- **cursor-07** · Abandonar juntada, volver a unirse e historial restringido → [`prompts/bloque-debugging/cursor-07-fixes-participantes.md`](prompts/bloque-debugging/cursor-07-fixes-participantes.md)
- **cursor-09** · Botón finalizar juntada en detalle → [`conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`](conversaciones/bloque-debugging/claude-bloque-debugging-completo.md) · [`prompts/bloque-debugging/cursor-09-finalizar-juntada.md`](prompts/bloque-debugging/cursor-09-finalizar-juntada.md)
- **cursor-10** · Color warning para finalizar juntada → [`conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`](conversaciones/bloque-debugging/claude-bloque-debugging-completo.md) · [`prompts/bloque-debugging/cursor-10-finalizar-warning.md`](prompts/bloque-debugging/cursor-10-finalizar-warning.md)
- **cursor-11** · Congelar asistencia en juntadas finalizadas o canceladas → [`conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`](conversaciones/bloque-debugging/claude-bloque-debugging-completo.md) · [`prompts/bloque-debugging/cursor-11-congelar-asistencia.md`](prompts/bloque-debugging/cursor-11-congelar-asistencia.md)
- **cursor-12** · Auditoría y corrección de índice, estadísticas globales y documentación IA → [`conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`](conversaciones/bloque-debugging/claude-bloque-debugging-completo.md) · [`prompts/bloque-debugging/cursor-12-auditoria-indice-statistics.md`](prompts/bloque-debugging/cursor-12-auditoria-indice-statistics.md)
- **cursor-13** · Scroll inferior en inicio de Impostor para acceder al botón de partida → [`conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`](conversaciones/bloque-debugging/claude-bloque-debugging-completo.md) · [`prompts/bloque-debugging/cursor-13-impostor-scroll-start.md`](prompts/bloque-debugging/cursor-13-impostor-scroll-start.md)
- **cursor-14** · Logo en bienvenida, nombre Ronda App y slug de Expo → [`conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`](conversaciones/bloque-debugging/claude-bloque-debugging-completo.md) · [`prompts/bloque-debugging/cursor-14-welcome-logo-app-name.md`](prompts/bloque-debugging/cursor-14-welcome-logo-app-name.md)
- **cursor-15** · Jugadores manuales desaparecen al tocar Nueva ronda en Impostor → [`conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`](conversaciones/bloque-debugging/claude-bloque-debugging-completo.md) · [`prompts/bloque-debugging/cursor-15-impostor-jugadores-nueva-ronda.md`](prompts/bloque-debugging/cursor-15-impostor-jugadores-nueva-ronda.md)
- **cursor-16** · Botones cortados en fin de ronda de Impostor (scroll + footer fijo) → [`conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`](conversaciones/bloque-debugging/claude-bloque-debugging-completo.md) · [`prompts/bloque-debugging/cursor-16-impostor-fin-ronda-scroll.md`](prompts/bloque-debugging/cursor-16-impostor-fin-ronda-scroll.md)

### Cierre de Entrega 1 (26/05/2026)

- **32** · Fix: botón finalizar juntada solo visible cuando la juntada ya comenzó → [`conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`](conversaciones/bloque-debugging/claude-bloque-debugging-completo.md) · [`prompts/bloque-debugging/cursor-09-fix-finalizar-juntada.md`](prompts/bloque-debugging/cursor-09-fix-finalizar-juntada.md)
- **33** · Fixes finales Impostor (jugadores manuales, scroll fin de ronda) → [`conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`](conversaciones/bloque-debugging/claude-bloque-debugging-completo.md) · [`prompts/bloque-debugging/cursor-15-impostor-jugadores-nueva-ronda.md`](prompts/bloque-debugging/cursor-15-impostor-jugadores-nueva-ronda.md) · [`prompts/bloque-debugging/cursor-16-impostor-fin-ronda-scroll.md`](prompts/bloque-debugging/cursor-16-impostor-fin-ronda-scroll.md)
- **34** · Configuración de logo, ícono y splash screen → [`conversaciones/bloque-7/cursor-bloque-7-completo.md`](conversaciones/bloque-7/cursor-bloque-7-completo.md) · [`prompts/bloque-debugging/cursor-14-welcome-logo-app-name.md`](prompts/bloque-debugging/cursor-14-welcome-logo-app-name.md)
- **35** · Cierre de Entrega 1 y documentación final → [`resumen_uso_ia.md`](resumen_uso_ia.md) · [`prompts/bloque-debugging/cursor-10-documentar-cierre-e1.md`](prompts/bloque-debugging/cursor-10-documentar-cierre-e1.md) · [`../../docs/BACKLOG_E2_E3.md`](../../docs/BACKLOG_E2_E3.md)

---

## Cómo mantener actualizado

### Bloques 1–6 y debugging (conversaciones completas desde Cursor y Claude)

Regenerar prompts + respuestas finales completas desde los agent transcripts:

```bash
node juntadas-app/ia/entrega-1/scripts/build-block-conversations.mjs
```

El script lee los JSONL en `.cursor/projects/.../agent-transcripts/` y actualiza:

- `conversaciones/bloque-1/cursor-bloque-1-completo.md`
- `conversaciones/bloque-2/cursor-bloque-2-chat-1.md`
- `conversaciones/bloque-2/cursor-bloque-2-chat-2.md`
- `conversaciones/bloque-3/cursor-bloque-3-completo.md`
- `conversaciones/bloque-4/cursor-bloque-4-completo.md`
- `conversaciones/bloque-5/cursor-bloque-5-completo.md`
- `conversaciones/bloque-6/cursor-bloque-6-completo.md` *(pendiente de agregar al script)*
- `conversaciones/bloque-7/cursor-bloque-7-completo.md` *(documentación manual de marca)*

Cada sesión incluye el **prompt completo** (archivo guardado + mensaje enviado en chat) y la **respuesta final completa** del agente (sin tool calls).

### Sesiones de prueba (SpecStory — opcional)

1. SpecStory guarda el export crudo (con timestamp) en `.specstory/history/`.
2. Para sesiones **numeradas** (desde el próximo chat):
   ```bash
   node juntadas-app/ia/entrega-1/scripts/organize-ia-exports.mjs --add-numbered mi-slug "Título descriptivo" 2026-05-24_...md
   node juntadas-app/ia/entrega-1/scripts/organize-ia-exports.mjs
   ```
3. Para sesiones de prueba, agregar entrada en `export-mapping.json` → sección `trial` (sin número).
4. El script genera versiones **limpias**: prompt + respuesta final + archivos modificados (sin tool calls ni proceso intermedio).
5. Actualizar este índice con los links correspondientes.

# Índice de temas consultados con IA — Entrega 1

## Claude (claude.ai)

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

### Bloque Debugging — Fixes y pulido UX (Claude Code CLI) (25/05/2026)

- **B1** · Footer tab bar faltante en pantallas principales (CreateMeetup, JoinMeetup, Profile, MeetupDetail, History) → [`conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`](conversaciones/bloque-debugging/claude-bloque-debugging-completo.md) · [`prompts/bloque-debugging/claude-01-B1-footer.md`](prompts/bloque-debugging/claude-01-B1-footer.md)
- **B3** · Bug impostor: restauración no deseada de jugadores al vaciar la lista → [`conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`](conversaciones/bloque-debugging/claude-bloque-debugging-completo.md) · [`prompts/bloque-debugging/claude-02-B3-impostor.md`](prompts/bloque-debugging/claude-02-B3-impostor.md)
- **B4** · Modal de asistencia no se cierra después de guardar (Toast superpuesto sobre sheet abierto) → [`conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`](conversaciones/bloque-debugging/claude-bloque-debugging-completo.md) · [`prompts/bloque-debugging/claude-03-B4-asistencia.md`](prompts/bloque-debugging/claude-03-B4-asistencia.md)
- **B5** · Avatar del header no muestra foto de perfil y no navega al perfil → [`conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`](conversaciones/bloque-debugging/claude-bloque-debugging-completo.md) · [`prompts/bloque-debugging/claude-04-B5-avatar-header.md`](prompts/bloque-debugging/claude-04-B5-avatar-header.md)
- **B9** · Cursor del input de código aparece al extremo derecho — input OTP con 6 cajas individuales → [`conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`](conversaciones/bloque-debugging/claude-bloque-debugging-completo.md)
- **B10** · Popup de foto de perfil reemplazado por modal custom con diseño de la app → [`conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`](conversaciones/bloque-debugging/claude-bloque-debugging-completo.md) · [`prompts/bloque-debugging/claude-05-B10-avatar-modal.md`](prompts/bloque-debugging/claude-05-B10-avatar-modal.md)
- **cursor-01** · Fixes UX: footer parpadeante, avatares en MeetupDetailScreen y toast de asistencia → [`conversaciones/2026-05-25_21-19-18Z-ux-fixes-for-footer,-avatars,-and-attendance-toast.md`](conversaciones/2026-05-25_21-19-18Z-ux-fixes-for-footer,-avatars,-and-attendance-toast.md)
- **cursor-02** · Fix avatar en ParticipantListScreen (`profile.avatarUrl`) → [`prompts/bloque-debugging/cursor-02-participant-list-avatar.md`](prompts/bloque-debugging/cursor-02-participant-list-avatar.md)
- **cursor-07** · Abandonar juntada, volver a unirse e historial restringido → [`prompts/bloque-debugging/cursor-07-fixes-participantes.md`](prompts/bloque-debugging/cursor-07-fixes-participantes.md)

---

## Cómo mantener actualizado

### Bloques 1–6 (conversaciones completas desde Cursor)

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
- `conversaciones/bloque-6/cursor-bloque-6-completo.md` *(pendiente de agregar al script)*

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

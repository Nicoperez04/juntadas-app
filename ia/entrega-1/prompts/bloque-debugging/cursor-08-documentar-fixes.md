# Documentación cursor-08 — Fixes de participantes y UX

## Prompt

Documentación — Fixes de participantes y UX

Actualizá `ia/entrega-1/conversaciones/bloque-debugging/claude-bloque-debugging-completo.md` agregando al final una nueva sección:

```markdown
## Sesión adicional — Fixes participantes y UX (Nico)

### Lo que se corrigió
- Avatar de participantes en MeetupDetailScreen (leía participant.avatarUrl en lugar de participant.profile.avatarUrl)
- Avatar en ParticipantListScreen con el mismo fix
- Footer sin parpadeo: React.memo en AppTabBar + animation: 'none' en MainNavigator
- Toast de asistencia duplicado: Promise.all en handleAttendanceClose
- Botón "Abandonar juntada" agregado en MeetupDetailScreen para participantes
- joinMeetup actualizado para permitir volver a unirse si left_at IS NOT NULL
- Historial: badge "Abandonada" + acceso restringido en detalle si el usuario abandonó
```

Actualizá `ia/entrega-1/indice_ia.md` agregando:

- **27** · Fixes UX: avatar participantes, footer, toast asistencia
- **28** · Fixes participantes: abandonar desde detalle, volver a unirse, historial restringido

No tocar código. No hacer commits.

## Archivos modificados

- `ia/entrega-1/conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`
- `ia/entrega-1/indice_ia.md`
- `ia/entrega-1/prompts/bloque-debugging/cursor-08-documentar-fixes.md` (este archivo)

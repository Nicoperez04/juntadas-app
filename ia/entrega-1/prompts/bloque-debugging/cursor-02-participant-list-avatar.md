# Fix cursor-02 — Avatar en ParticipantListScreen

## Contexto

Seguimiento del fix de avatares en `MeetupDetailScreen.tsx` (sesión cursor-01). El tipo `MeetupParticipant` guarda la URL en `participant.profile.avatarUrl`, no en `participant.avatarUrl`.

## Prompt

En `mobile/src/features/participants/screens/ParticipantListScreen.tsx`, corregí el acceso al avatar del participante. Actualmente lee `participant.avatarUrl` pero el tipo `MeetupParticipant` guarda la URL en `participant.profile.avatarUrl`.

Aplicá el mismo patrón que quedó en `MeetupDetailScreen.tsx`:

```typescript
const avatarUrl = participant.profile.avatarUrl;
{avatarUrl ? (
  <Image source={{ uri: avatarUrl }} style={styles.participantAvatar} />
) : (
  <View style={[styles.participantAvatar, { backgroundColor: avatarColor }]}>
    <Text style={styles.participantAvatarText}>{initials}</Text>
  </View>
)}
```

No tocar nada más. No hacer commits.

## Archivos modificados

- `mobile/src/features/participants/screens/ParticipantListScreen.tsx`

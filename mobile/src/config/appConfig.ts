export const appConfig = {
    app: {
      name: 'JuntadasApp',
      version: '1.0.0',
    },
    meetups: {
      joinCodeLength: 6,
      maxParticipants: 12,
    },
    impostor: {
      minPlayers: 3,
      maxPlayers: 12,
    },
  } as const;
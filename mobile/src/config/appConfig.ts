/**
 * Constantes de negocio de la app.
 *
 * Solo configuración funcional (nombre, límites, reglas de juego).
 * Los tokens de diseño (colores, spacing, radius, tipografía) viven
 * exclusivamente en src/shared/constants/theme.ts — fuente única de verdad.
 */
export const appConfig = {
  app: {
    name: 'Ronda App',
    version: '1.0.0',
  },
  meetups: {
    /** Longitud del código alfanumérico para unirse a una juntada */
    joinCodeLength: 6,
    /** Máximo de participantes permitidos por juntada */
    maxParticipants: 12,
  },
  impostor: {
    /** Mínimo de jugadores para iniciar una partida */
    minPlayers: 3,
    /** Máximo de jugadores por partida */
    maxPlayers: 12,
  },
} as const;

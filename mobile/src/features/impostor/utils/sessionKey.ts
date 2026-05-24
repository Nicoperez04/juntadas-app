/**
 * Clave de sesión local para partidas sin juntada asociada.
 *
 * Cuando el juego se inicia desde el tab bar (GamesScreen), no hay meetupId;
 * usamos una clave fija para indexar el store de Zustand.
 */
export const STANDALONE_SESSION_KEY = 'standalone';

/**
 * Resuelve la clave de sesión a partir de un meetupId opcional.
 *
 * @param meetupId - UUID de juntada o undefined en modo standalone
 */
export const getSessionKey = (meetupId?: string): string =>
  meetupId ?? STANDALONE_SESSION_KEY;

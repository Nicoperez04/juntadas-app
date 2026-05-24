/**
 * Utilidades visuales para avatares de jugadores en el flujo Impostor.
 */
import { theme } from '@/shared/constants/theme';

/** Paleta determinística para avatares con iniciales */
const AVATAR_PALETTE = [
  theme.colors.primary,
  theme.colors.secondary,
  theme.colors.success,
  theme.colors.warning,
  theme.colors.error,
];

/**
 * Índice de color estable a partir de un identificador de jugador.
 */
export const getAvatarColorIndex = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % AVATAR_PALETTE.length;
};

/** Color de fondo del avatar según id o nombre */
export const getAvatarColor = (str: string): string =>
  AVATAR_PALETTE[getAvatarColorIndex(str)];

/**
 * Extrae hasta dos iniciales de un nombre para el avatar circular.
 */
export const getInitials = (name: string): string => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Genera un id local único para jugadores agregados manualmente.
 */
export const createLocalPlayerId = (): string =>
  `player-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

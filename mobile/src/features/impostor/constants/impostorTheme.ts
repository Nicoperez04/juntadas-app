/**
 * Tokens visuales exclusivos del juego Impostor.
 *
 * Complementan theme.ts con colores de inmersión que no aplican al resto
 * de la app: hero oscuro en cards y fondo de revelación de roles.
 */
import { theme } from '@/shared/constants/theme';

export const impostorColors = {
  /** Violeta profundo — protagonista en cards del juego */
  heroDark: '#3B0764',
  /** Violeta medio — capa superior del gradiente simulado */
  heroMid: theme.colors.primary,
  /** Fondo inmersivo exclusivo de ImpostorRoleScreen */
  revealBackground: '#0F0F1A',
} as const;

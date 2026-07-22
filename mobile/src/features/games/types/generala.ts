/**
 * Tipos de datos para el Anotador de Generala.
 */

export type GeneralaCategory =
  | 'balas'
  | 'tontos'
  | 'trenes'
  | 'cuadras'
  | 'quinas'
  | 'senas'
  | 'escalera'
  | 'full'
  | 'poker'
  | 'generala'
  | 'doble_generala';

export interface PlayerScoreSheet {
  playerName: string;
  isFromApp?: boolean;
  userId?: string;
  scores: Record<GeneralaCategory, number | null>; // null significa no jugado/no anotado, -1 significa tachado (0 pts)
  isServido: Record<GeneralaCategory, boolean>;
}

export interface GeneralaState {
  players: PlayerScoreSheet[];
  activePlayerIndex: number;
  isFinished: boolean;
  winnerName: string | null;
}

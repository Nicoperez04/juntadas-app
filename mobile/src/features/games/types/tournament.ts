/**
 * Tipos de datos para el Generador de Torneos (Playoffs).
 */

export interface TournamentMatch {
  id: string;
  round: number; // Ronda (1: Cuartos/Octavos, 2: Semis, 3: Final...)
  homePlayer: string;
  awayPlayer: string;
  winner: string | null; // null si no se ha jugado, o 'BYE'
  nextMatchId: string | null; // ID del partido de la siguiente ronda a donde avanza el ganador
  nextMatchSlot: 'home' | 'away' | null; // A qué ranura avanza el ganador
}

export interface TournamentRound {
  roundNumber: number;
  name: string; // "Cuartos de final", "Semifinal", "Final", etc.
  matches: TournamentMatch[];
}

export interface TournamentState {
  rounds: TournamentRound[];
  winnerName: string | null;
}

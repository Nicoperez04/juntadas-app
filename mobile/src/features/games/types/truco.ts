/**
 * Definicion de tipos para la configuracion y estado del anotador de Truco.
 */

export interface TrucoConfig {
  teamAName: string;
  teamBName: string;
  targetPoints: 15 | 30;
  meetupId?: string;
}

export interface TrucoState {
  scoreA: number;
  scoreB: number;
  isFinished: boolean;
  winnerName: string | null;
}

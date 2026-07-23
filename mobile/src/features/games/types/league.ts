/**
 * Tipos de datos para el Generador de Ligas.
 */

export interface LeagueMatch {
  id: string;
  round: number; // Número de fecha (1, 2, 3...)
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null; // null si no se jugó
  awayScore: number | null; // null si no se jugó
  isFreeDay: boolean; // Indica si es fecha libre (cuando hay impares)
}

export interface TeamStats {
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

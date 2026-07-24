export type GameType =
  | 'truco'
  | 'generala'
  | 'league'
  | 'tournament'
  | 'scorer'
  | 'impostor';

export type JsonRecord = Record<string, unknown>;

export interface GameResultParticipant {
  name: string;
  userId?: string | null;
  teamName?: string;
  score?: number;
  metadata?: JsonRecord;
}

export interface GameResult {
  id: string;
  meetupId: string;
  createdBy: string | null;
  gameType: GameType;
  winnerName: string;
  winnerUserId: string | null;
  participants: GameResultParticipant[];
  scoreSummary: JsonRecord;
  metadata: JsonRecord;
  createdAt: string;
}

export interface CreateGameResultInput {
  meetupId: string;
  gameType: GameType;
  winnerName: string;
  winnerUserId?: string | null;
  participants: GameResultParticipant[];
  scoreSummary: JsonRecord;
  metadata?: JsonRecord;
}

export interface WinnerRankingItem {
  winnerName: string;
  wins: number;
  gameTypes: GameType[];
}

export interface GameTypeDistributionItem {
  gameType: GameType;
  count: number;
}

export interface FrequentWinner {
  winnerName: string;
  wins: number;
}

export interface MeetupGameStats {
  totalResults: number;
  distinctGameTypes: number;
  mostFrequentWinner: FrequentWinner | null;
  winnerRanking: WinnerRankingItem[];
  gameTypeDistribution: GameTypeDistributionItem[];
  results: GameResult[];
}

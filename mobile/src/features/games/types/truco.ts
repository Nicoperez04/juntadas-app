/**
2:  * Definición de tipos para la configuración y estado del anotador de Truco.
3:  */
4: 
5: export interface TrucoConfig {
6:   teamAName: string;
7:   teamBName: string;
8:   targetPoints: 15 | 30;
9:   meetupId?: string;
10: }
11: 
12: export interface TrucoState {
13:   scoreA: number;
14:   scoreB: number;
15:   isFinished: boolean;
16:   winnerName: string | null;
17: }

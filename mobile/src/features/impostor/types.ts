/**
 * Tipos del feature Impostor.
 *
 * GameSession vive solo en memoria local durante la partida presencial.
 * ImpostorGame representa el registro histórico persistido en Supabase.
 */

/** Jugador de una sesión local — puede ser participante de la app o invitado manual */
export interface Player {
  /** Identificador local único generado al armar la partida */
  id: string;
  /** Nombre visible durante el juego */
  name: string;
  /** true si proviene de un participante confirmado de la juntada */
  isFromApp: boolean;
  /** UUID del perfil en Supabase; solo presente cuando isFromApp es true */
  userId?: string;
}

/** Fases del flujo presencial en un solo dispositivo */
export type GamePhase = 'setup' | 'revealing' | 'playing';

/** Modo de selección aleatoria de palabra */
export type WordSelectionMode = 'all_categories' | 'specific_category';

/** Estado completo de una partida en curso — no se persiste en Supabase */
export interface GameSession {
  players: Player[];
  /** Clave interna de categoría de la palabra actual */
  topic: string;
  /** Palabra que conocen todos excepto el impostor */
  normalPrompt: string;
  /** Pista opcional para el impostor; vacía si el organizador no agregó ninguna */
  impostorPrompt: string;
  /** Modo con el que se eligió la palabra de esta ronda */
  wordMode: WordSelectionMode;
  /** Si la categoría puede mostrarse al grupo durante el juego */
  showCategoryToGroup: boolean;
  /** Si el impostor recibe una pista auto-generada en su rol */
  includeImpostorHint: boolean;
  /** Palabras ya usadas en la sesión — evita repetición en nuevas rondas */
  usedWords: string[];
  /** Índice en players[] del jugador impostor */
  impostorIndex: number;
  /** Índice del jugador que está viendo su rol en este momento */
  currentPlayerIndex: number;
  phase: GamePhase;
}

/** Estado persistido de una partida en la base de datos */
export type GameStatus = 'created' | 'active' | 'finished';

/** Registro histórico de partida jugada — solo para historial futuro */
export interface ImpostorGame {
  id: string;
  meetupId: string;
  createdBy: string;
  topic: string;
  normalPrompt: string;
  impostorPrompt: string;
  /** UUID del impostor si era participante de la app; null si era invitado manual */
  impostorUserId: string | null;
  status: GameStatus;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

/** Datos mínimos para crear un registro histórico al iniciar la partida */
export interface SaveGameRecordData {
  topic: string;
  normalPrompt: string;
  impostorPrompt: string;
  impostorUserId: string | null;
}

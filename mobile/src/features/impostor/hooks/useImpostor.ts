/**
 * Store global del juego Impostor.
 *
 * Zustand comparte GameSession entre pantallas del flujo sin persistir
 * el estado del juego en Supabase.
 */
import { create } from 'zustand';
import {
  pickWordForMode,
  generateImpostorHint,
  type WordPickMode,
} from '../data/wordBank';
import type { GameSession, Player, WordSelectionMode } from '../types';
import { getSessionKey } from '../utils/sessionKey';

interface ImpostorStoreState {
  sessions: Record<string, GameSession | null>;
  setSession: (sessionKey: string, session: GameSession | null) => void;
  clearSession: (sessionKey: string) => void;
}

export const useImpostorStore = create<ImpostorStoreState>((set) => ({
  sessions: {},
  setSession: (sessionKey, session) =>
    set((state) => ({
      sessions: { ...state.sessions, [sessionKey]: session },
    })),
  clearSession: (sessionKey) =>
    set((state) => ({
      sessions: { ...state.sessions, [sessionKey]: null },
    })),
}));

/** Índice aleatorio del impostor entre los jugadores */
const pickRandomImpostorIndex = (playerCount: number): number =>
  Math.floor(Math.random() * playerCount);

/**
 * Hook principal del juego Impostor.
 *
 * @param meetupId - UUID opcional de juntada; undefined en modo standalone
 */
export const useImpostor = (meetupId?: string) => {
  const sessionKey = getSessionKey(meetupId);
  const session = useImpostorStore((s) => s.sessions[sessionKey] ?? null);
  const setSession = useImpostorStore((s) => s.setSession);
  const clearSession = useImpostorStore((s) => s.clearSession);

  /**
   * Configura una partida nueva o ronda con palabra ya elegida aleatoriamente.
   */
  const setupGame = (
    players: Player[],
    word: string,
    category: string,
    wordMode: WordSelectionMode,
    includeImpostorHint: boolean,
    priorUsedWords: string[] = [],
  ): GameSession | null => {
    if (players.length === 0) return null;

    const trimmedWord = word.trim();
    const showCategory = wordMode === 'specific_category';
    const usedWords = priorUsedWords.includes(trimmedWord)
      ? priorUsedWords
      : [...priorUsedWords, trimmedWord];

    const impostorPrompt = includeImpostorHint
      ? generateImpostorHint(trimmedWord, category, showCategory)
      : '';

    const newSession: GameSession = {
      players,
      topic: category,
      normalPrompt: trimmedWord,
      impostorPrompt,
      wordMode,
      showCategoryToGroup: showCategory,
      includeImpostorHint,
      usedWords,
      impostorIndex: pickRandomImpostorIndex(players.length),
      currentPlayerIndex: 0,
      phase: 'revealing',
    };

    setSession(sessionKey, newSession);
    return newSession;
  };

  /** Avanza al siguiente jugador o pasa a fase playing */
  const nextPlayer = (): void => {
    if (!session) return;

    const isLastPlayer =
      session.currentPlayerIndex >= session.players.length - 1;

    if (isLastPlayer) {
      setSession(sessionKey, { ...session, phase: 'playing' });
      return;
    }

    setSession(sessionKey, {
      ...session,
      currentPlayerIndex: session.currentPlayerIndex + 1,
    });
  };

  /**
   * Genera nueva palabra evitando las del historial y reinicia la ronda.
   *
   * @param categoryOverride - Categoría fija si el modo es specific_category
   */
  const resetGameWithNewWord = (
    categoryOverride?: string,
  ): GameSession | null => {
    if (!session) return null;

    const mode: WordPickMode = session.wordMode;
    const category =
      mode === 'specific_category'
        ? categoryOverride ?? session.topic
        : null;

    const pick = pickWordForMode(mode, category, session.usedWords);

    const usedWords = session.usedWords.includes(pick.word)
      ? session.usedWords
      : [...session.usedWords, pick.word];

    const updated: GameSession = {
      ...session,
      topic: pick.category,
      normalPrompt: pick.word,
      impostorPrompt: session.includeImpostorHint
        ? generateImpostorHint(
            pick.word,
            pick.category,
            session.showCategoryToGroup,
          )
        : '',
      usedWords,
      impostorIndex: pickRandomImpostorIndex(session.players.length),
      currentPlayerIndex: 0,
      phase: 'revealing',
    };

    setSession(sessionKey, updated);
    return updated;
  };

  const currentPlayer = session?.players[session.currentPlayerIndex];

  const currentIsImpostor = session
    ? session.currentPlayerIndex === session.impostorIndex
    : false;

  /** Cantidad de jugadores que ya completaron su turno de revelación */
  const revealedCount = session?.currentPlayerIndex ?? 0;

  return {
    session,
    sessionKey,
    setupGame,
    nextPlayer,
    resetGameWithNewWord,
    clearSession: () => clearSession(sessionKey),
    currentPlayer,
    currentIsImpostor,
    revealedCount,
  };
};

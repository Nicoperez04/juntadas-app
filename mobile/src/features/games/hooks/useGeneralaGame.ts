import { useCallback, useState } from 'react';
import type { GeneralaCategory, GeneralaState, PlayerScoreSheet } from '../types/generala';
import { triggerSelectionHaptic } from '@/shared/utils/haptics';

// Puntuaciones base de los juegos mayores
export const BASE_SCORES: Record<GeneralaCategory, number> = {
  balas: 1,
  tontos: 2,
  trenes: 3,
  cuadras: 4,
  quinas: 5,
  senas: 6,
  escalera: 20,
  full: 30,
  poker: 40,
  generala: 50,
  doble_generala: 100,
};

// Calcula el puntaje total de un jugador
export const calculateTotalScore = (sheet: PlayerScoreSheet): number => {
  return (Object.keys(sheet.scores) as GeneralaCategory[]).reduce((total, cat) => {
    const val = sheet.scores[cat];
    if (val === null || val === -1) return total;
    return total + val;
  }, 0);
};

export const useGeneralaGame = (initialPlayers: string[]) => {
  const [state, setState] = useState<GeneralaState>(() => {
    const players: PlayerScoreSheet[] = initialPlayers.map((name) => ({
      playerName: name,
      scores: {
        balas: null,
        tontos: null,
        trenes: null,
        cuadras: null,
        quinas: null,
        senas: null,
        escalera: null,
        full: null,
        poker: null,
        generala: null,
        doble_generala: null,
      },
      isServido: {
        balas: false,
        tontos: false,
        trenes: false,
        cuadras: false,
        quinas: false,
        senas: false,
        escalera: false,
        full: false,
        poker: false,
        generala: false,
        doble_generala: false,
      },
    }));

    return {
      players,
      activePlayerIndex: 0,
      isFinished: false,
      winnerName: null,
    };
  });

  const setCategoryValue = useCallback(
    (playerIndex: number, category: GeneralaCategory, value: number | null, isServido: boolean) => {
      void triggerSelectionHaptic();
      setState((prev) => {
        const nextPlayers = prev.players.map((p, idx) => {
          if (idx !== playerIndex) return p;
          return {
            ...p,
            scores: { ...p.scores, [category]: value },
            isServido: { ...p.isServido, [category]: isServido },
          };
        });

        // Victoria inmediata si se anota una Generala Servida
        const isGeneralaServida = category === 'generala' && value === 50 && isServido;

        // Verificar si todos los jugadores terminaron todos sus casilleros
        const allFinished = isGeneralaServida || nextPlayers.every((p) =>
          (Object.keys(p.scores) as GeneralaCategory[]).every((cat) => p.scores[cat] !== null)
        );

        let winnerName = null;
        if (isGeneralaServida) {
          winnerName = prev.players[playerIndex].playerName;
        } else if (allFinished) {
          let maxScore = -1;
          nextPlayers.forEach((p) => {
            const tot = calculateTotalScore(p);
            if (tot > maxScore) {
              maxScore = tot;
              winnerName = p.playerName;
            }
          });
        }

        return {
          ...prev,
          players: nextPlayers,
          isFinished: allFinished,
          winnerName,
        };
      });
    },
    []
  );

  const selectPlayer = useCallback((idx: number) => {
    void triggerSelectionHaptic();
    setState((prev) => ({ ...prev, activePlayerIndex: idx }));
  }, []);

  const resetGame = useCallback(() => {
    void triggerSelectionHaptic();
    setState((prev) => {
      const reseted = prev.players.map((p) => ({
        ...p,
        scores: (Object.keys(p.scores) as GeneralaCategory[]).reduce(
          (acc, key) => ({ ...acc, [key]: null }),
          {} as Record<GeneralaCategory, null>
        ),
        isServido: (Object.keys(p.isServido) as GeneralaCategory[]).reduce(
          (acc, key) => ({ ...acc, [key]: false }),
          {} as Record<GeneralaCategory, boolean>
        ),
      }));

      return {
        players: reseted,
        activePlayerIndex: 0,
        isFinished: false,
        winnerName: null,
      };
    });
  }, []);

  return {
    state,
    setCategoryValue,
    selectPlayer,
    resetGame,
  };
};

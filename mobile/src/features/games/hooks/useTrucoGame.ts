import { useCallback, useState } from 'react';
import type { TrucoConfig, TrucoState } from '../types/truco';
import { triggerSelectionHaptic } from '@/shared/utils/haptics';

export const useTrucoGame = (config: TrucoConfig) => {
  const [state, setState] = useState<TrucoState>({
    scoreA: 0,
    scoreB: 0,
    isFinished: false,
    winnerName: null,
  });

  const incrementScoreA = useCallback(() => {
    setState((prev) => {
      if (prev.isFinished) return prev;
      const newScore = Math.min(prev.scoreA + 1, config.targetPoints);
      const finished = newScore === config.targetPoints;
      void triggerSelectionHaptic();
      return {
        ...prev,
        scoreA: newScore,
        isFinished: finished,
        winnerName: finished ? config.teamAName : null,
      };
    });
  }, [config.targetPoints, config.teamAName]);

  const decrementScoreA = useCallback(() => {
    setState((prev) => {
      const newScore = Math.max(prev.scoreA - 1, 0);
      void triggerSelectionHaptic();
      return {
        ...prev,
        scoreA: newScore,
        isFinished: false,
        winnerName: null,
      };
    });
  }, []);

  const incrementScoreB = useCallback(() => {
    setState((prev) => {
      if (prev.isFinished) return prev;
      const newScore = Math.min(prev.scoreB + 1, config.targetPoints);
      const finished = newScore === config.targetPoints;
      void triggerSelectionHaptic();
      return {
        ...prev,
        scoreB: newScore,
        isFinished: finished,
        winnerName: finished ? config.teamBName : null,
      };
    });
  }, [config.targetPoints, config.teamBName]);

  const decrementScoreB = useCallback(() => {
    setState((prev) => {
      const newScore = Math.max(prev.scoreB - 1, 0);
      void triggerSelectionHaptic();
      return {
        ...prev,
        scoreB: newScore,
        isFinished: false,
        winnerName: null,
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    void triggerSelectionHaptic();
    setState({
      scoreA: 0,
      scoreB: 0,
      isFinished: false,
      winnerName: null,
    });
  }, []);

  return {
    state,
    incrementScoreA,
    decrementScoreA,
    incrementScoreB,
    decrementScoreB,
    resetGame,
  };
};

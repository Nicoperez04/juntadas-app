import { useCallback, useState } from 'react';
import type { TournamentMatch, TournamentRound, TournamentState } from '../types/tournament';
import { triggerSelectionHaptic } from '@/shared/utils/haptics';

/**
 * Genera el fixture completo de playoffs con Byes dinámicos.
 */
export const buildTournamentTree = (players: string[]): TournamentRound[] => {
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const n = shuffled.length;

  // Encontrar la potencia de 2 más cercana mayor o igual a n
  let power = 2;
  while (power < n) {
    power *= 2;
  }

  const numByes = power - n; // Cantidad de Byes requeridos

  // Rondas totales a jugar (log2(power))
  let tempPower = power;
  let numRounds = 0;
  while (tempPower > 1) {
    tempPower /= 2;
    numRounds++;
  }

  const roundsList: TournamentRound[] = [];

  // Crear la estructura vacía de las rondas de adelante hacia atrás
  // ej: Final (ronda N), Semis (ronda N-1)...
  let currentRoundMatchesCount = 1; // Final siempre tiene 1 partido
  for (let r = numRounds; r >= 1; r--) {
    let name = 'Final';
    if (r === numRounds - 1) name = 'Semifinal';
    else if (r === numRounds - 2) name = 'Cuartos de final';
    else if (r === numRounds - 3) name = 'Octavos de final';
    else name = `Ronda de ${currentRoundMatchesCount * 2}`;

    const roundMatches: TournamentMatch[] = [];
    for (let m = 0; m < currentRoundMatchesCount; m++) {
      roundMatches.push({
        id: `match-${r}-${m}`,
        round: r,
        homePlayer: '',
        awayPlayer: '',
        winner: null,
        nextMatchId: r < numRounds ? `match-${r + 1}-${Math.floor(m / 2)}` : null,
        nextMatchSlot: r < numRounds ? (m % 2 === 0 ? 'home' : 'away') : null,
      });
    }
    roundsList.unshift({
      roundNumber: r,
      name,
      matches: roundMatches,
    });
    currentRoundMatchesCount *= 2;
  }

  // Rellenar la primera ronda con los jugadores y los Byes
  const firstRound = roundsList[0];
  let playerIdx = 0;
  let byeCount = 0;

  for (let i = 0; i < firstRound.matches.length; i++) {
    const match = firstRound.matches[i];

    // Asignar jugador local
    match.homePlayer = shuffled[playerIdx++];

    // Decidir si el visitante es un Bye o un jugador
    if (byeCount < numByes) {
      match.awayPlayer = 'BYE';
      match.winner = match.homePlayer; // Pasa directo el local
      byeCount++;
    } else {
      match.awayPlayer = shuffled[playerIdx++];
    }
  }

  // Propagar los "Byes" automáticos a la ronda siguiente
  for (let i = 0; i < firstRound.matches.length; i++) {
    const match = firstRound.matches[i];
    if (match.winner && match.nextMatchId) {
      const nextId = match.nextMatchId;
      const slot = match.nextMatchSlot;

      // Buscar partido en la ronda 2
      const secondRound = roundsList[1];
      if (secondRound) {
        const nextMatch = secondRound.matches.find((m) => m.id === nextId);
        if (nextMatch) {
          if (slot === 'home') {
            nextMatch.homePlayer = match.winner;
          } else {
            nextMatch.awayPlayer = match.winner;
          }
        }
      }
    }
  }

  return roundsList;
};

export const useTournamentGame = (initialPlayers: string[]) => {
  const [state, setState] = useState<TournamentState>(() => {
    const rounds = buildTournamentTree(initialPlayers);
    return {
      rounds,
      winnerName: null,
    };
  });

  const reportWinner = useCallback((roundNumber: number, matchId: string, winnerName: string) => {
    void triggerSelectionHaptic();
    setState((prev) => {
      let finalWinner: string | null = null;
      let tournamentFinished = false;

      const updatedRounds = prev.rounds.map((round) => {
        if (round.roundNumber !== roundNumber) return round;

        return {
          ...round,
          matches: round.matches.map((m) => {
            if (m.id !== matchId) return m;

            // Si es la final, declaramos el campeón del torneo
            if (m.nextMatchId === null) {
              finalWinner = winnerName;
              tournamentFinished = true;
            }

            return {
              ...m,
              winner: winnerName,
            };
          }),
        };
      });

      // Si no es la final, propagamos al ganador al siguiente partido en la ronda posterior
      if (!tournamentFinished) {
        // Encontrar el partido modificado
        const modifiedMatch = updatedRounds
          .find((r) => r.roundNumber === roundNumber)
          ?.matches.find((m) => m.id === matchId);

        if (modifiedMatch && modifiedMatch.nextMatchId) {
          const nextRoundIdx = updatedRounds.findIndex((r) => r.roundNumber === roundNumber + 1);
          if (nextRoundIdx !== -1) {
            updatedRounds[nextRoundIdx] = {
              ...updatedRounds[nextRoundIdx],
              matches: updatedRounds[nextRoundIdx].matches.map((m) => {
                if (m.id !== modifiedMatch.nextMatchId) return m;
                if (modifiedMatch.nextMatchSlot === 'home') {
                  return { ...m, homePlayer: winnerName };
                } else {
                  return { ...m, awayPlayer: winnerName };
                }
              }),
            };
          }
        }
      }

      return {
        rounds: updatedRounds,
        winnerName: finalWinner ? finalWinner : prev.winnerName,
      };
    });
  }, []);

  const resetTournament = useCallback(() => {
    void triggerSelectionHaptic();
    setState({
      rounds: buildTournamentTree(initialPlayers),
      winnerName: null,
    });
  }, [initialPlayers]);

  return {
    state,
    reportWinner,
    resetTournament,
  };
};

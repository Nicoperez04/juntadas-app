import { useCallback, useState } from 'react';
import type { LeagueMatch, TeamStats } from '../types/league';
import { triggerSelectionHaptic } from '@/shared/utils/haptics';

/**
 * Genera el fixture Round Robin usando el Algoritmo de Rotación (Berger).
 */
export const generateFixture = (teams: string[]): LeagueMatch[] => {
  const list = [...teams];
  if (list.length % 2 !== 0) {
    list.push('Libre'); // Añadir un fantasma para equipos libres
  }

  const numTeams = list.length;
  const numRounds = numTeams - 1;
  const matchesPerRound = numTeams / 2;
  const matches: LeagueMatch[] = [];

  for (let round = 1; round <= numRounds; round++) {
    for (let matchIdx = 0; matchIdx < matchesPerRound; matchIdx++) {
      const homeIdx = (round - 1 + matchIdx) % (numTeams - 1);
      let awayIdx = (numTeams - 1 - matchIdx + round - 1) % (numTeams - 1);

      if (matchIdx === 0) {
        awayIdx = numTeams - 1;
      }

      const home = list[homeIdx];
      const away = list[awayIdx];

      const isFree = home === 'Libre' || away === 'Libre';

      matches.push({
        id: `match-${round}-${matchIdx}-${Date.now()}`,
        round,
        homeTeam: home === 'Libre' ? away : home,
        awayTeam: home === 'Libre' ? '' : away === 'Libre' ? '' : away,
        homeScore: null,
        awayScore: null,
        isFreeDay: isFree,
      });
    }
  }

  return matches;
};

/**
 * Genera y ordena la tabla de posiciones dinámicamente.
 */
export const calculateTable = (teams: string[], matches: LeagueMatch[]): TeamStats[] => {
  const statsMap: Record<string, TeamStats> = {};

  teams.forEach((t) => {
    statsMap[t] = {
      teamName: t,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    };
  });

  matches.forEach((m) => {
    if (m.isFreeDay || m.homeScore === null || m.awayScore === null) return;

    const home = statsMap[m.homeTeam];
    const away = statsMap[m.awayTeam];

    if (!home || !away) return;

    home.played += 1;
    away.played += 1;
    home.goalsFor += m.homeScore;
    home.goalsAgainst += m.awayScore;
    away.goalsFor += m.awayScore;
    away.goalsAgainst += m.homeScore;

    if (m.homeScore > m.awayScore) {
      home.won += 1;
      home.points += 3;
      away.lost += 1;
    } else if (m.homeScore < m.awayScore) {
      away.won += 1;
      away.points += 3;
      home.lost += 1;
    } else {
      home.drawn += 1;
      home.points += 1;
      away.drawn += 1;
      away.points += 1;
    }

    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;
  });

  // Ordenar según criterios: Puntos, Diferencia de Goles, Goles a favor, Alfabético
  return Object.values(statsMap).sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
    if (b.goalsFor !== a.goalsFor) {
      return b.goalsFor - a.goalsFor;
    }
    return a.teamName.localeCompare(b.teamName);
  });
};

export const useLeagueGame = (initialTeams: string[]) => {
  const [matches, setMatches] = useState<LeagueMatch[]>(() => generateFixture(initialTeams));

  const updateMatchResult = useCallback((matchId: string, homeScore: number | null, awayScore: number | null) => {
    void triggerSelectionHaptic();
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id !== matchId) return m;
        return {
          ...m,
          homeScore,
          awayScore,
        };
      })
    );
  }, []);

  const resetLeague = useCallback(() => {
    void triggerSelectionHaptic();
    setMatches(generateFixture(initialTeams));
  }, [initialTeams]);

  // Se calcula si todos los partidos válidos tienen un resultado asignado
  const isFinished = matches.every((m) => m.isFreeDay || (m.homeScore !== null && m.awayScore !== null));

  return {
    matches,
    updateMatchResult,
    resetLeague,
    isFinished,
  };
};

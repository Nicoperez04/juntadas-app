import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase/client';
import type {
  CreateGameResultInput,
  GameStats,
  GameResult,
  GameResultParticipant,
  GameType,
  GameTypeDistributionItem,
  GroupGameResult,
  GroupGameStats,
  JsonRecord,
  MeetupGameStats,
  WinnerRankingItem,
} from '../types';

interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

interface GameResultRow {
  id: string;
  meetup_id: string;
  created_by: string | null;
  game_type: string;
  winner_name: string;
  winner_user_id: string | null;
  participants: unknown;
  score_summary: unknown;
  metadata: unknown;
  created_at: string;
}

interface GroupGameResultRow extends GameResultRow {
  meetup_title: string;
}

interface MeetupGroupContextRow {
  title: string;
  group_id: string | null;
}

const LOCAL_RESULTS_KEY_PREFIX = '@juntadas:game_results:';
const LOCAL_GROUP_RESULTS_KEY_PREFIX = '@juntadas:group_game_results:';

const isMigrationMissingError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const record = error as Record<string, unknown>;
  const message = typeof record.message === 'string' ? record.message : '';
  const code = typeof record.code === 'string' ? record.code : '';

  return (
    code === '42P01' ||
    message.includes('game_results') ||
    message.includes('get_group_game_results') ||
    message.includes('schema cache')
  );
};

const getErrorMessage = (error: unknown): string => {
  if (typeof error !== 'object' || error === null) {
    return 'No se pudo guardar el resultado';
  }

  const record = error as Record<string, unknown>;
  const message = typeof record.message === 'string' ? record.message : '';
  const code = typeof record.code === 'string' ? record.code : '';

  if (isMigrationMissingError(error)) {
    return 'Falta aplicar la migracion de estadisticas en Supabase';
  }

  if (
    code === '42501' ||
    message.includes('row-level security') ||
    message.includes('violates row-level security')
  ) {
    return 'No tenes permisos para guardar resultados en esta juntada';
  }

  if (message.trim().length > 0) {
    return message;
  }

  return 'No se pudo guardar el resultado';
};

const getLocalResultsKey = (meetupId: string): string =>
  `${LOCAL_RESULTS_KEY_PREFIX}${meetupId}`;

const getLocalGroupResultsKey = (groupId: string): string =>
  `${LOCAL_GROUP_RESULTS_KEY_PREFIX}${groupId}`;

const getLocalResults = async (meetupId: string): Promise<GameResult[]> => {
  const raw = await AsyncStorage.getItem(getLocalResultsKey(meetupId));
  if (!raw) {
    return [];
  }

  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter((item): item is GameResult => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      return false;
    }
    const record = item as Record<string, unknown>;
    return (
      typeof record.id === 'string' &&
      typeof record.meetupId === 'string' &&
      typeof record.gameType === 'string' &&
      typeof record.winnerName === 'string' &&
      typeof record.createdAt === 'string'
    );
  });
};

const getLocalGroupResults = async (
  groupId: string,
): Promise<GroupGameResult[]> => {
  const raw = await AsyncStorage.getItem(getLocalGroupResultsKey(groupId));
  if (!raw) {
    return [];
  }

  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter((item): item is GroupGameResult => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      return false;
    }
    const record = item as Record<string, unknown>;
    return (
      typeof record.id === 'string' &&
      typeof record.meetupId === 'string' &&
      typeof record.meetupTitle === 'string' &&
      typeof record.gameType === 'string' &&
      typeof record.winnerName === 'string' &&
      typeof record.createdAt === 'string'
    );
  });
};

const saveLocalResult = async (result: GameResult): Promise<void> => {
  const currentResults = await getLocalResults(result.meetupId);
  const nextResults = [result, ...currentResults];
  await AsyncStorage.setItem(
    getLocalResultsKey(result.meetupId),
    JSON.stringify(nextResults),
  );
};

const saveLocalGroupResult = async (
  groupId: string,
  result: GroupGameResult,
): Promise<void> => {
  const currentResults = await getLocalGroupResults(groupId);
  const nextResults = [
    result,
    ...currentResults.filter((current) => current.id !== result.id),
  ];
  await AsyncStorage.setItem(
    getLocalGroupResultsKey(groupId),
    JSON.stringify(nextResults),
  );
};

const createLocalResult = (
  userId: string,
  input: CreateGameResultInput,
): GameResult => ({
  id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  meetupId: input.meetupId,
  createdBy: userId,
  gameType: input.gameType,
  winnerName: input.winnerName,
  winnerUserId: input.winnerUserId ?? null,
  participants: input.participants,
  scoreSummary: input.scoreSummary,
  metadata: {
    ...(input.metadata ?? {}),
    localFallback: true,
  },
  createdAt: new Date().toISOString(),
});

const getMeetupGroupContext = async (
  meetupId: string,
): Promise<{ groupId: string; meetupTitle: string } | null> => {
  const { data, error } = await supabase
    .from('meetups')
    .select('title, group_id')
    .eq('id', meetupId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as MeetupGroupContextRow;
  if (!row.group_id) {
    return null;
  }

  return {
    groupId: row.group_id,
    meetupTitle: row.title,
  };
};

const mirrorResultToLocalGroupStats = async (
  result: GameResult,
): Promise<void> => {
  try {
    const groupContext = await getMeetupGroupContext(result.meetupId);
    if (!groupContext) {
      return;
    }

    await saveLocalGroupResult(groupContext.groupId, {
      ...result,
      meetupTitle: groupContext.meetupTitle,
    });
  } catch {
    // El fallback local no debe romper el guardado real del resultado.
  }
};

const isGameType = (value: string): value is GameType =>
  ['truco', 'generala', 'league', 'tournament', 'scorer', 'impostor'].includes(
    value,
  );

const toJsonRecord = (value: unknown): JsonRecord => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }
  return value as JsonRecord;
};

const isParticipant = (value: unknown): value is GameResultParticipant => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.name === 'string';
};

const toParticipants = (value: unknown): GameResultParticipant[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isParticipant);
};

const mapGameResultRow = (row: GameResultRow): GameResult => ({
  id: row.id,
  meetupId: row.meetup_id,
  createdBy: row.created_by,
  gameType: isGameType(row.game_type) ? row.game_type : 'scorer',
  winnerName: row.winner_name,
  winnerUserId: row.winner_user_id,
  participants: toParticipants(row.participants),
  scoreSummary: toJsonRecord(row.score_summary),
  metadata: toJsonRecord(row.metadata),
  createdAt: row.created_at,
});

const mapGroupGameResultRow = (row: GroupGameResultRow): GroupGameResult => ({
  ...mapGameResultRow(row),
  meetupTitle: row.meetup_title,
});

const normalizeWinnerName = (value: string): string =>
  value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-AR');

const buildStats = <T extends GameResult>(results: T[]): GameStats<T> => {
  const winnerStats = new Map<
    string,
    { displayName: string; wins: number; gameTypes: Set<GameType> }
  >();
  const gameTypeCounts = new Map<GameType, number>();

  results.forEach((result) => {
    const winnerKey = normalizeWinnerName(result.winnerName);
    const currentWinner = winnerStats.get(winnerKey) ?? {
      displayName: result.winnerName.trim(),
      wins: 0,
      gameTypes: new Set<GameType>(),
    };
    currentWinner.wins += 1;
    currentWinner.gameTypes.add(result.gameType);
    winnerStats.set(winnerKey, currentWinner);

    gameTypeCounts.set(
      result.gameType,
      (gameTypeCounts.get(result.gameType) ?? 0) + 1,
    );
  });

  const winnerRanking: WinnerRankingItem[] = Array.from(winnerStats.entries())
    .map(([, stats]) => ({
      winnerName: stats.displayName,
      wins: stats.wins,
      gameTypes: Array.from(stats.gameTypes),
    }))
    .sort((a, b) => b.wins - a.wins || a.winnerName.localeCompare(b.winnerName));

  const gameTypeDistribution: GameTypeDistributionItem[] = Array.from(
    gameTypeCounts.entries(),
  )
    .map(([gameType, count]) => ({ gameType, count }))
    .sort((a, b) => b.count - a.count || a.gameType.localeCompare(b.gameType));

  const mostFrequentWinner = winnerRanking[0]
    ? {
        winnerName: winnerRanking[0].winnerName,
        wins: winnerRanking[0].wins,
      }
    : null;

  return {
    totalResults: results.length,
    distinctGameTypes: gameTypeDistribution.length,
    mostFrequentWinner,
    winnerRanking,
    gameTypeDistribution,
    results,
  };
};

export const gameResultService = {
  async createResult(
    userId: string,
    input: CreateGameResultInput,
  ): Promise<ServiceResult<GameResult>> {
    try {
      const { data, error } = await supabase
        .from('game_results')
        .insert({
          meetup_id: input.meetupId,
          created_by: userId,
          game_type: input.gameType,
          winner_name: input.winnerName,
          winner_user_id: input.winnerUserId ?? null,
          participants: input.participants,
          score_summary: input.scoreSummary,
          metadata: input.metadata ?? {},
        })
        .select()
        .single();

      if (error) throw error;
      const result = mapGameResultRow(data as unknown as GameResultRow);
      if (__DEV__) {
        await mirrorResultToLocalGroupStats(result);
      }
      return { data: result, error: null };
    } catch (error) {
      if (__DEV__ && isMigrationMissingError(error)) {
        const localResult = createLocalResult(userId, input);
        await saveLocalResult(localResult);
        await mirrorResultToLocalGroupStats(localResult);
        return { data: localResult, error: null };
      }

      return { data: null, error: getErrorMessage(error) };
    }
  },

  async getResultsByMeetup(
    meetupId: string,
  ): Promise<ServiceResult<GameResult[]>> {
    try {
      const { data, error } = await supabase
        .from('game_results')
        .select('*')
        .eq('meetup_id', meetupId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = (data ?? []) as unknown as GameResultRow[];
      return { data: rows.map(mapGameResultRow), error: null };
    } catch (error) {
      if (__DEV__ && isMigrationMissingError(error)) {
        return { data: await getLocalResults(meetupId), error: null };
      }

      return { data: null, error: 'No se pudieron obtener los resultados' };
    }
  },

  async getStatsByMeetup(
    meetupId: string,
  ): Promise<ServiceResult<MeetupGameStats>> {
    const { data, error } = await gameResultService.getResultsByMeetup(meetupId);

    if (error || !data) {
      return {
        data: null,
        error: error ?? 'No se pudieron calcular las estadisticas',
      };
    }

    return { data: buildStats(data), error: null };
  },

  async getResultsByGroup(
    groupId: string,
  ): Promise<ServiceResult<GroupGameResult[]>> {
    try {
      const { data, error } = await supabase.rpc('get_group_game_results', {
        p_group_id: groupId,
      });

      if (error) throw error;

      const rows = (data ?? []) as unknown as GroupGameResultRow[];
      return { data: rows.map(mapGroupGameResultRow), error: null };
    } catch (error) {
      if (__DEV__ && isMigrationMissingError(error)) {
        return { data: await getLocalGroupResults(groupId), error: null };
      }

      if (isMigrationMissingError(error)) {
        return {
          data: null,
          error: 'Falta aplicar la migracion de estadisticas de grupos en Supabase',
        };
      }

      return {
        data: null,
        error: 'No se pudieron obtener los resultados del grupo',
      };
    }
  },

  async getStatsByGroup(
    groupId: string,
  ): Promise<ServiceResult<GroupGameStats>> {
    const { data, error } = await gameResultService.getResultsByGroup(groupId);

    if (error || !data) {
      return {
        data: null,
        error: error ?? 'No se pudieron calcular las estadisticas del grupo',
      };
    }

    return { data: buildStats(data), error: null };
  },
};

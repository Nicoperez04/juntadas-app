import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '@/shared/constants/theme';
import type { GameResult, GameType, JsonRecord } from '../types';

export const GAME_LABELS: Record<GameType, string> = {
  truco: 'Truco',
  generala: 'Generala',
  league: 'Liga',
  tournament: 'Torneo',
  scorer: 'Anotador',
  impostor: 'Impostor',
};

const formatDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible';
  }

  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatPrimitive = (value: unknown): string | null => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
};

const formatScoreSummary = (summary: JsonRecord): string => {
  const preferred = ['finalScore', 'marcador', 'champion', 'campeon'];

  for (const key of preferred) {
    const value = formatPrimitive(summary[key]);
    if (value) return value;
  }

  const entries = Object.entries(summary)
    .map(([key, value]) => {
      const formatted = formatPrimitive(value);
      return formatted ? `${key}: ${formatted}` : null;
    })
    .filter((value): value is string => value !== null);

  return entries.length > 0 ? entries.slice(0, 3).join(' - ') : 'Sin resumen';
};

interface GameResultCardProps {
  result: GameResult;
  contextLabel?: string;
}

export const GameResultCard = ({ result, contextLabel }: GameResultCardProps) => (
  <View style={styles.resultCard}>
    <View style={styles.resultHeader}>
      <View style={styles.gameChip}>
        <Text style={styles.gameChipText}>{GAME_LABELS[result.gameType]}</Text>
      </View>
      <Text style={styles.resultDate}>{formatDateTime(result.createdAt)}</Text>
    </View>

    <Text style={styles.resultWinner}>Ganador: {result.winnerName}</Text>
    {contextLabel ? <Text style={styles.resultContext}>{contextLabel}</Text> : null}
    <Text style={styles.resultSummary}>
      {formatScoreSummary(result.scoreSummary)}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  resultCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  gameChip: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight,
  },
  gameChipText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
  resultDate: {
    flex: 1,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  resultWinner: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  resultContext: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
  resultSummary: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
});

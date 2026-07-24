import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { AppButton } from '@/shared/components/AppButton';
import { theme } from '@/shared/constants/theme';
import { Routes } from '@/navigation/routes';
import type { MainStackParamList } from '@/navigation/types';
import { GameResultCard, GAME_LABELS } from '../components/GameResultCard';
import { useGameResults } from '../hooks/useGameResults';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'MeetupStats'>;
type RouteProps = RouteProp<MainStackParamList, 'MeetupStats'>;

export const MeetupStatsScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { meetupId, meetupTitle, isActive = false } = route.params;

  const { stats, isLoading, error, refresh } = useGameResults(meetupId);
  const hasResults = (stats?.totalResults ?? 0) > 0;
  const recentResults = stats?.results.slice(0, 3) ?? [];
  const hasMoreResults = (stats?.results.length ?? 0) > recentResults.length;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={theme.colors.textPrimary}
          />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Estadisticas</Text>
          {meetupTitle ? (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {meetupTitle}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={() => void refresh()}
          accessibilityRole="button"
          accessibilityLabel="Actualizar"
        >
          <MaterialCommunityIcons
            name="refresh"
            size={22}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {isLoading && !stats ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={styles.stateText}>Cargando estadisticas...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={40}
            color={theme.colors.error}
          />
          <Text style={styles.stateTitle}>No se pudieron cargar</Text>
          <Text style={styles.stateText}>{error}</Text>
          <AppButton label="Reintentar" onPress={() => void refresh()} />
        </View>
      ) : !hasResults ? (
        <View style={styles.centerState}>
          <MaterialCommunityIcons
            name="chart-box-outline"
            size={44}
            color={theme.colors.primary}
          />
          <Text style={styles.stateTitle}>Todavia no hay resultados</Text>
          <Text style={styles.stateText}>
            Los resultados apareceran cuando se guarde una partida desde esta
            juntada.
          </Text>
          {isActive ? (
            <AppButton
              label="Ir a Juegos"
              onPress={() => navigation.navigate(Routes.Games, { meetupId })}
            />
          ) : null}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{stats?.totalResults ?? 0}</Text>
              <Text style={styles.summaryLabel}>Partidas</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>
                {stats?.distinctGameTypes ?? 0}
              </Text>
              <Text style={styles.summaryLabel}>Juegos</Text>
            </View>
            <View style={styles.summaryCardWide}>
              <Text style={styles.summaryValue} numberOfLines={1}>
                {stats?.mostFrequentWinner?.winnerName ?? '-'}
              </Text>
              <Text style={styles.summaryLabel}>Mas ganador</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ranking de ganadores</Text>
            {stats?.winnerRanking.map((winner) => (
              <View key={winner.winnerName} style={styles.rankingRow}>
                <View style={styles.rankingInfo}>
                  <Text style={styles.rankingName}>{winner.winnerName}</Text>
                  <Text style={styles.rankingGames}>
                    {winner.gameTypes.map((game) => GAME_LABELS[game]).join(', ')}
                  </Text>
                </View>
                <View style={styles.countChip}>
                  <Text style={styles.countChipText}>{winner.wins}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Distribucion por juego</Text>
            <View style={styles.distributionGrid}>
              {stats?.gameTypeDistribution.map((item) => (
                <View key={item.gameType} style={styles.distributionChip}>
                  <Text style={styles.distributionLabel}>
                    {GAME_LABELS[item.gameType]}
                  </Text>
                  <Text style={styles.distributionCount}>{item.count}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resultados registrados</Text>
            {recentResults.map((result) => (
              <GameResultCard key={result.id} result={result} />
            ))}
            {hasMoreResults ? (
              <AppButton
                label="Ver historial completo"
                variant="ghost"
                onPress={() =>
                  navigation.navigate(Routes.MeetupResultsHistory, {
                    meetupId,
                    meetupTitle,
                  })
                }
              />
            ) : null}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerText: {
    flex: 1,
    marginHorizontal: theme.spacing.md,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  scroll: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  stateTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  stateText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  summaryCard: {
    flex: 1,
    minWidth: 120,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },
  summaryCardWide: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },
  summaryValue: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  summaryLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  rankingInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  rankingName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  rankingGames: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  countChip: {
    minWidth: 34,
    height: 28,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countChipText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  distributionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  distributionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  distributionLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textPrimary,
  },
  distributionCount: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
});

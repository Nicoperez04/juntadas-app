import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { theme } from '@/shared/constants/theme';
import { Routes } from '@/navigation/routes';
import type { MainStackParamList } from '@/navigation/types';
import type { LeagueMatch } from '../types/league';
import { useLeagueGame, calculateTable } from '../hooks/useLeagueGame';
import { AppButton } from '@/shared/components/AppButton';
import { SuccessAnimation } from '@/shared/components/SuccessAnimation';
import { ErrorAnimation } from '@/shared/components/ErrorAnimation';
import { triggerSelectionHaptic } from '@/shared/utils/haptics';
import { useGameResults } from '@/features/gameResults/hooks/useGameResults';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'LeagueGame'>;
type RouteProps = RouteProp<MainStackParamList, 'LeagueGame'>;

type TabId = 'fixture' | 'table';

export const LeagueGameScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { teams, meetupId } = route.params;

  const { matches, updateMatchResult, resetLeague, isFinished } = useLeagueGame(teams);

  const [activeTab, setActiveTab] = useState<TabId>('fixture');
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [editingMatch, setEditingMatch] = useState<LeagueMatch | null>(null);

  // Puntaje temporal en el modal de edición
  const [homeScoreInput, setHomeScoreInput] = useState('');
  const [awayScoreInput, setAwayScoreInput] = useState('');

  const [showExitModal, setShowExitModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { createResult, isCreating } = useGameResults(meetupId);

  const rounds = useMemo(() => {
    const list = matches.map((m) => m.round);
    return Array.from(new Set(list)).sort((a, b) => a - b);
  }, [matches]);

  const activeRoundMatches = useMemo(() => {
    return matches.filter((m) => m.round === selectedRound);
  }, [matches, selectedRound]);

  const tableStats = useMemo(() => {
    return calculateTable(teams, matches);
  }, [teams, matches]);

  const handleEditMatch = (match: LeagueMatch) => {
    if (match.isFreeDay) return;
    void triggerSelectionHaptic();
    setEditingMatch(match);
    setHomeScoreInput(match.homeScore !== null ? String(match.homeScore) : '');
    setAwayScoreInput(match.awayScore !== null ? String(match.awayScore) : '');
  };

  const handleSaveResult = () => {
    if (!editingMatch) return;
    const homeVal = homeScoreInput.trim() !== '' ? parseInt(homeScoreInput, 10) : null;
    const awayVal = awayScoreInput.trim() !== '' ? parseInt(awayScoreInput, 10) : null;

    // Si introduce uno, el otro no puede ser nulo
    if ((homeVal !== null && awayVal === null) || (homeVal === null && awayVal !== null)) {
      return;
    }

    updateMatchResult(editingMatch.id, homeVal, awayVal);
    setEditingMatch(null);
  };

  const handleFinish = async () => {
    void triggerSelectionHaptic();
    if (!meetupId) {
      navigation.goBack();
      return;
    }

    const champion = tableStats[0]?.teamName;
    if (!champion) {
      setErrorMessage('No se pudo determinar el campeon');
      setShowError(true);
      return;
    }

    const result = await createResult({
      meetupId,
      gameType: 'league',
      winnerName: champion,
      participants: tableStats.map((team) => ({
        name: team.teamName,
        score: team.points,
        metadata: {
          played: team.played,
          won: team.won,
          drawn: team.drawn,
          lost: team.lost,
          goalDifference: team.goalDifference,
        },
      })),
      scoreSummary: {
        finalScore: `Campeon: ${champion}`,
        champion,
        table: tableStats,
      },
      metadata: {
        matches: matches
          .filter((match) => !match.isFreeDay)
          .map((match) => ({
            round: match.round,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            homeScore: match.homeScore,
            awayScore: match.awayScore,
          })),
      },
    });

    if (result.error) {
      setErrorMessage(result.error);
      setShowError(true);
      return;
    }

    setShowSuccess(true);
  };

  const navigateAfterSavedResult = () => {
    if (!meetupId) {
      navigation.goBack();
      return;
    }

    navigation.reset({
      index: 1,
      routes: [
        { name: Routes.MeetupHome },
        { name: Routes.MeetupDetail, params: { meetupId } },
      ],
    });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setShowExitModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Salir"
        >
          <MaterialCommunityIcons name="close" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Torneo de Liga</Text>
        <TouchableOpacity
          onPress={() => setShowResetModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Reiniciar"
        >
          <MaterialCommunityIcons name="refresh" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'fixture' && styles.tabButtonActive]}
          onPress={() => {
            void triggerSelectionHaptic();
            setActiveTab('fixture');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'fixture' && styles.tabTextActive]}>Partidos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'table' && styles.tabButtonActive]}
          onPress={() => {
            void triggerSelectionHaptic();
            setActiveTab('table');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'table' && styles.tabTextActive]}>Posiciones</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'fixture' ? (
        <>
          {/* Selector de Fecha */}
          <View style={styles.roundSelector}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roundsScroll}>
              {rounds.map((r) => (
                <TouchableOpacity
                  key={`round-tab-${r}`}
                  style={[styles.roundBtn, selectedRound === r && styles.roundBtnActive]}
                  onPress={() => {
                    void triggerSelectionHaptic();
                    setSelectedRound(r);
                  }}
                >
                  <Text style={[styles.roundBtnText, selectedRound === r && styles.roundBtnTextActive]}>
                    Fecha {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Enfrentamientos de la Fecha {selectedRound}</Text>
              <View style={styles.matchList}>
                {activeRoundMatches.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={styles.matchRow}
                    onPress={() => handleEditMatch(m)}
                    disabled={m.isFreeDay}
                  >
                    {m.isFreeDay ? (
                      <Text style={styles.freeDayText}>Libre: {m.homeTeam}</Text>
                    ) : (
                      <View style={styles.matchTeamsRow}>
                        <Text style={[styles.matchTeamName, { textAlign: 'right' }]} numberOfLines={1}>
                          {m.homeTeam}
                        </Text>
                        <View style={styles.scoreBox}>
                          <Text style={styles.scoreValue}>
                            {m.homeScore !== null ? m.homeScore : '-'}
                          </Text>
                          <Text style={styles.scoreDivider}>vs</Text>
                          <Text style={styles.scoreValue}>
                            {m.awayScore !== null ? m.awayScore : '-'}
                          </Text>
                        </View>
                        <Text style={[styles.matchTeamName, { textAlign: 'left' }]} numberOfLines={1}>
                          {m.awayTeam}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </>
      ) : (
        /* Tabla de posiciones */
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={[styles.card, { paddingHorizontal: 0 }]}>
            <Text style={styles.cardTitle}>Tabla de Posiciones</Text>

            {/* Encabezados de tabla */}
            <View style={styles.tableHeader}>
              <Text style={[styles.colHeader, { flex: 4 }]}>Equipo</Text>
              <Text style={styles.colHeader}>PTS</Text>
              <Text style={styles.colHeader}>PJ</Text>
              <Text style={styles.colHeader}>DG</Text>
              <Text style={styles.colHeader}>GF</Text>
            </View>

            {/* Filas */}
            {tableStats.map((team, idx) => (
              <View key={team.teamName} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                <Text style={[styles.colValueName, { flex: 4 }]} numberOfLines={1}>
                  {idx + 1}. {team.teamName}
                </Text>
                <Text style={[styles.colValue, styles.boldText]}>{team.points}</Text>
                <Text style={styles.colValue}>{team.played}</Text>
                <Text style={styles.colValue}>{team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}</Text>
                <Text style={styles.colValue}>{team.goalsFor}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Footer / Finalizar */}
      {isFinished && (
        <View style={styles.winnerBanner}>
          <Text style={styles.winnerTitle}>¡Torneo Finalizado!</Text>
          <Text style={styles.winnerSubtitle}>Campeón: {tableStats[0]?.teamName}</Text>
          <AppButton
            label={meetupId ? 'Guardar resultado y salir' : 'Finalizar y Salir'}
            onPress={() => void handleFinish()}
            isLoading={isCreating}
            disabled={isCreating}
          />
        </View>
      )}

      {/* Modal de edición de marcador */}
      <Modal visible={editingMatch !== null} transparent animationType="fade">
        {editingMatch && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Cargar Resultado</Text>
              <Text style={styles.modalSubtitle}>Fecha {editingMatch.round}</Text>

              <View style={styles.modalScoreEditRow}>
                <View style={styles.modalTeamInputCol}>
                  <Text style={styles.modalTeamLabel} numberOfLines={1}>{editingMatch.homeTeam}</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="number-pad"
                    value={homeScoreInput}
                    onChangeText={setHomeScoreInput}
                    placeholder="0"
                  />
                </View>
                <Text style={styles.modalVs}>vs</Text>
                <View style={styles.modalTeamInputCol}>
                  <Text style={styles.modalTeamLabel} numberOfLines={1}>{editingMatch.awayTeam}</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="number-pad"
                    value={awayScoreInput}
                    onChangeText={setAwayScoreInput}
                    placeholder="0"
                  />
                </View>
              </View>

              <View style={styles.modalActions}>
                <AppButton label="Guardar" onPress={handleSaveResult} />
                <AppButton label="Cancelar" variant="ghost" onPress={() => setEditingMatch(null)} />
              </View>
            </View>
          </View>
        )}
      </Modal>

      {/* Modal de Salir */}
      <Modal visible={showExitModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>¿Salir del torneo?</Text>
            <Text style={styles.modalText}>Se perderá todo el progreso de la liga.</Text>
            <View style={styles.modalActions}>
              <AppButton label="Volver" variant="ghost" onPress={() => setShowExitModal(false)} />
              <AppButton
                label="Salir"
                onPress={() => {
                  setShowExitModal(false);
                  navigation.goBack();
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Reiniciar */}
      <Modal visible={showResetModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>¿Reiniciar torneo?</Text>
            <Text style={styles.modalText}>Todos los marcadores volverán a estar vacíos.</Text>
            <View style={styles.modalActions}>
              <AppButton label="Cancelar" variant="ghost" onPress={() => setShowResetModal(false)} />
              <AppButton
                label="Reiniciar"
                onPress={() => {
                  setShowResetModal(false);
                  resetLeague();
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <SuccessAnimation
        visible={showSuccess}
        message="Torneo registrado con éxito"
        onHide={() => {
          setShowSuccess(false);
          navigateAfterSavedResult();
        }}
      />
      <ErrorAnimation
        visible={showError}
        message={errorMessage}
        onHide={() => setShowError(false)}
      />
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
  },
  headerTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.primary,
  },
  roundSelector: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  roundsScroll: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  roundBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  roundBtnActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  roundBtnText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
  },
  roundBtnTextActive: {
    color: theme.colors.primary,
  },
  scroll: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    margin: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    ...theme.shadows.md,
  },
  cardTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  matchList: {
    gap: theme.spacing.sm,
  },
  matchRow: {
    backgroundColor: theme.colors.background,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginHorizontal: theme.spacing.md,
  },
  freeDayText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  matchTeamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchTeamName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    flex: 3,
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    gap: theme.spacing.xs,
    flex: 2,
    marginHorizontal: theme.spacing.sm,
  },
  scoreValue: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  scoreDivider: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textDisabled,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  colHeader: {
    flex: 1,
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  tableRowAlt: {
    backgroundColor: theme.colors.background,
  },
  colValueName: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
  },
  colValue: {
    flex: 1,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  boldText: {
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  winnerBanner: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  winnerTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.success,
    textAlign: 'center',
  },
  winnerSubtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
    gap: theme.spacing.md,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: -theme.spacing.sm,
  },
  modalText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  modalScoreEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    marginVertical: theme.spacing.md,
  },
  modalTeamInputCol: {
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.xs,
  },
  modalTeamLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    maxWidth: 100,
  },
  modalInput: {
    width: 64,
    height: 64,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    borderWidth: theme.components.inputBorderWidth,
    borderColor: theme.colors.border,
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  modalVs: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textDisabled,
    marginTop: theme.spacing.md,
  },
  modalActions: {
    gap: theme.spacing.sm,
  },
});

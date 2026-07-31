import React, { useMemo, useState } from 'react';
import {
  Modal,
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
import { theme } from '@/shared/constants/theme';
import { Routes } from '@/navigation/routes';
import type { MainStackParamList } from '@/navigation/types';
import type { TournamentMatch } from '../types/tournament';
import { useTournamentGame } from '../hooks/useTournamentGame';
import { AppButton } from '@/shared/components/AppButton';
import { SuccessAnimation } from '@/shared/components/SuccessAnimation';
import { ErrorAnimation } from '@/shared/components/ErrorAnimation';
import { triggerSelectionHaptic } from '@/shared/utils/haptics';
import { useGameResults } from '@/features/gameResults/hooks/useGameResults';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'TournamentGame'>;
type RouteProps = RouteProp<MainStackParamList, 'TournamentGame'>;

export const TournamentGameScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { players, meetupId } = route.params;

  const { state, reportWinner, resetTournament } = useTournamentGame(players);

  const [activeRoundNumber, setActiveRoundNumber] = useState<number>(1);
  const [selectedMatch, setSelectedMatch] = useState<TournamentMatch | null>(null);

  const [showExitModal, setShowExitModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { createResult, isCreating } = useGameResults(meetupId);

  const activeRound = useMemo(() => {
    return state.rounds.find((r) => r.roundNumber === activeRoundNumber);
  }, [state.rounds, activeRoundNumber]);

  const handleSelectWinner = (winnerName: string) => {
    if (!selectedMatch) return;
    reportWinner(activeRoundNumber, selectedMatch.id, winnerName);
    setSelectedMatch(null);
  };

  const handleFinish = async () => {
    void triggerSelectionHaptic();
    if (!meetupId) {
      navigation.goBack();
      return;
    }

    if (!state.winnerName) {
      setErrorMessage('No se pudo determinar el campeon');
      setShowError(true);
      return;
    }

    const result = await createResult({
      meetupId,
      gameType: 'tournament',
      winnerName: state.winnerName,
      participants: players.map((player) => ({ name: player })),
      scoreSummary: {
        finalScore: `Campeon: ${state.winnerName}`,
        champion: state.winnerName,
      },
      metadata: {
        rounds: state.rounds.map((round) => ({
          roundNumber: round.roundNumber,
          name: round.name,
          matches: round.matches.map((match) => ({
            round: match.round,
            homePlayer: match.homePlayer,
            awayPlayer: match.awayPlayer,
            winner: match.winner,
          })),
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
        <Text style={styles.headerTitle}>Cuadro de Playoffs</Text>
        <TouchableOpacity
          onPress={() => setShowResetModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Reiniciar"
        >
          <MaterialCommunityIcons name="refresh" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Rondas Tabs */}
      <View style={styles.roundsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roundsScroll}>
          {state.rounds.map((r) => {
            const isActive = r.roundNumber === activeRoundNumber;
            return (
              <TouchableOpacity
                key={`round-${r.roundNumber}`}
                style={[styles.roundBtn, isActive && styles.roundBtnActive]}
                onPress={() => {
                  void triggerSelectionHaptic();
                  setActiveRoundNumber(r.roundNumber);
                }}
              >
                <Text style={[styles.roundBtnText, isActive && styles.roundBtnTextActive]}>
                  {r.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{activeRound?.name}</Text>
          <View style={styles.matchList}>
            {activeRound?.matches.map((m) => {
              const hasWinner = m.winner !== null;
              const isLocked = !m.homePlayer || !m.awayPlayer || m.awayPlayer === 'BYE';

              return (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.matchRow,
                    hasWinner && styles.matchRowFinished,
                    isLocked && styles.matchRowLocked,
                  ]}
                  onPress={() => {
                    if (isLocked || hasWinner) return;
                    void triggerSelectionHaptic();
                    setSelectedMatch(m);
                  }}
                  disabled={isLocked || hasWinner}
                >
                  <View style={styles.matchCol}>
                    <View style={[styles.playerRow, m.winner === m.homePlayer && styles.playerRowWinner]}>
                      <Text style={[styles.playerName, m.winner === m.homePlayer && styles.playerNameWinner]}>
                        {m.homePlayer || 'A confirmar'}
                      </Text>
                      {m.winner === m.homePlayer && (
                        <MaterialCommunityIcons name="trophy" size={16} color={theme.colors.warning} />
                      )}
                    </View>
                    <View style={styles.vsRow}>
                      <Text style={styles.vsText}>vs</Text>
                    </View>
                    <View style={[styles.playerRow, m.winner === m.awayPlayer && styles.playerRowWinner]}>
                      <Text style={[styles.playerName, m.winner === m.awayPlayer && styles.playerNameWinner]}>
                        {m.awayPlayer === 'BYE' ? 'Pase Directo (Bye)' : m.awayPlayer || 'A confirmar'}
                      </Text>
                      {m.winner === m.awayPlayer && (
                        <MaterialCommunityIcons name="trophy" size={16} color={theme.colors.warning} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Footer / Finalizar */}
      {state.winnerName && (
        <View style={styles.winnerBanner}>
          <Text style={styles.winnerTitle}>¡CAMPEÓN DEL TORNEO!</Text>
          <Text style={styles.winnerSubtitle}>🏆 {state.winnerName} 🏆</Text>
          <AppButton
            label={meetupId ? 'Guardar resultado y salir' : 'Finalizar y Salir'}
            onPress={() => void handleFinish()}
            isLoading={isCreating}
            disabled={isCreating}
          />
        </View>
      )}

      {/* Modal para reportar ganador */}
      <Modal visible={selectedMatch !== null} transparent animationType="fade">
        {selectedMatch && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>¿Quién ganó la llave?</Text>
              <View style={styles.modalActions}>
                <AppButton label={selectedMatch.homePlayer} onPress={() => handleSelectWinner(selectedMatch.homePlayer)} />
                <AppButton label={selectedMatch.awayPlayer} onPress={() => handleSelectWinner(selectedMatch.awayPlayer)} />
                <AppButton label="Cancelar" variant="ghost" onPress={() => setSelectedMatch(null)} />
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
            <Text style={styles.modalText}>Se perderá todo el progreso del fixture.</Text>
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
            <Text style={styles.modalText}>El cuadro volverá a armarse y los resultados se borrarán.</Text>
            <View style={styles.modalActions}>
              <AppButton label="Cancelar" variant="ghost" onPress={() => setShowResetModal(false)} />
              <AppButton
                label="Reiniciar"
                onPress={() => {
                  setShowResetModal(false);
                  resetTournament();
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
  roundsContainer: {
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
    padding: theme.spacing.md,
    ...theme.shadows.md,
  },
  cardTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.xs,
  },
  matchList: {
    gap: theme.spacing.md,
  },
  matchRow: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  matchRowFinished: {
    borderColor: theme.colors.successLight,
  },
  matchRowLocked: {
    opacity: 0.6,
  },
  matchCol: {
    gap: theme.spacing.xs,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  playerRowWinner: {
    backgroundColor: theme.colors.successLight,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.sm,
  },
  playerName: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
  },
  playerNameWinner: {
    color: theme.colors.success,
    fontWeight: theme.typography.weights.bold,
  },
  vsRow: {
    alignItems: 'center',
  },
  vsText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textDisabled,
    fontStyle: 'italic',
  },
  winnerBanner: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  winnerTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.success,
    textAlign: 'center',
    letterSpacing: 2,
  },
  winnerSubtitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.success,
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
  modalText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  modalActions: {
    gap: theme.spacing.sm,
  },
});

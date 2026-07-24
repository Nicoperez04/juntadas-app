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
import type { GeneralaCategory } from '../types/generala';
import { useGeneralaGame, BASE_SCORES, calculateTotalScore } from '../hooks/useGeneralaGame';
import { AppButton } from '@/shared/components/AppButton';
import { SuccessAnimation } from '@/shared/components/SuccessAnimation';
import { ErrorAnimation } from '@/shared/components/ErrorAnimation';
import { triggerSelectionHaptic } from '@/shared/utils/haptics';
import { useGameResults } from '@/features/gameResults/hooks/useGameResults';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'GeneralaGame'>;
type RouteProps = RouteProp<MainStackParamList, 'GeneralaGame'>;

const CATEGORIES_DISPLAY: Record<GeneralaCategory, { name: string; isGameMayor: boolean }> = {
  balas: { name: '1', isGameMayor: false },
  tontos: { name: '2', isGameMayor: false },
  trenes: { name: '3', isGameMayor: false },
  cuadras: { name: '4', isGameMayor: false },
  quinas: { name: '5', isGameMayor: false },
  senas: { name: '6', isGameMayor: false },
  escalera: { name: 'Escalera', isGameMayor: true },
  full: { name: 'Full', isGameMayor: true },
  poker: { name: 'Póker', isGameMayor: true },
  generala: { name: 'Generala', isGameMayor: true },
  doble_generala: { name: 'Doble Generala', isGameMayor: true },
};

export const GeneralaGameScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { players, meetupId } = route.params;

  const { state, setCategoryValue, selectPlayer, resetGame } = useGeneralaGame(players);

  const activePlayer = state.players[state.activePlayerIndex];

  const [selectedCategory, setSelectedCategory] = useState<GeneralaCategory | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { createResult, isCreating } = useGameResults(meetupId);

  const handleSelectScore = (value: number | null, isServido: boolean) => {
    if (!selectedCategory) return;
    setCategoryValue(state.activePlayerIndex, selectedCategory, value, isServido);
    setSelectedCategory(null);
  };

  const handleFinish = async () => {
    void triggerSelectionHaptic();
    if (!meetupId) {
      navigation.goBack();
      return;
    }

    if (!state.winnerName) {
      setErrorMessage('No se pudo determinar el ganador');
      setShowError(true);
      return;
    }

    const totals = Object.fromEntries(
      state.players.map((player) => [
        player.playerName,
        calculateTotalScore(player),
      ]),
    );

    const result = await createResult({
      meetupId,
      gameType: 'generala',
      winnerName: state.winnerName,
      participants: state.players.map((player) => ({
        name: player.playerName,
        score: calculateTotalScore(player),
      })),
      scoreSummary: {
        finalScore: `${state.winnerName} ${totals[state.winnerName] ?? 0} pts`,
        totals,
      },
      metadata: {
        sheets: state.players.map((player) => ({
          playerName: player.playerName,
          total: calculateTotalScore(player),
          scores: player.scores,
          isServido: player.isServido,
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
        <Text style={styles.headerTitle}>Planilla de Generala</Text>
        <TouchableOpacity
          onPress={() => setShowResetModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Reiniciar"
        >
          <MaterialCommunityIcons name="refresh" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Tabs de Jugadores */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {state.players.map((p, idx) => {
            const isActive = idx === state.activePlayerIndex;
            return (
              <TouchableOpacity
                key={`tab-${idx}`}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => selectPlayer(idx)}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {p.playerName} ({calculateTotalScore(p)})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>Categorías para {activePlayer.playerName}</Text>
          <View style={styles.list}>
            {(Object.keys(CATEGORIES_DISPLAY) as GeneralaCategory[]).map((cat) => {
              const display = CATEGORIES_DISPLAY[cat];
              const score = activePlayer.scores[cat];
              const isServ = activePlayer.isServido[cat];

              return (
                <TouchableOpacity
                  key={cat}
                  style={styles.row}
                  onPress={() => {
                    void triggerSelectionHaptic();
                    setSelectedCategory(cat);
                  }}
                  disabled={state.isFinished}
                >
                  <Text style={styles.rowLabel}>{display.name}</Text>
                  <View style={styles.rowValueContainer}>
                    {score === null ? (
                      <Text style={styles.emptyScore}>Tocar para anotar</Text>
                    ) : score === -1 ? (
                      <View style={styles.tachedContainer}>
                        <Text style={styles.tachedText}>Tachado (0)</Text>
                      </View>
                    ) : (
                      <View style={styles.scoreBadge}>
                        <Text style={styles.scoreBadgeText}>
                          {score} {isServ ? 'Servido' : ''}
                        </Text>
                      </View>
                    )}
                    <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textDisabled} />
                  </View>
                </TouchableOpacity>
              );
            })}
            {/* Fila fija de Total */}
            <View style={[styles.row, styles.totalRow]}>
              <Text style={[styles.rowLabel, styles.totalRowLabel]}>TOTAL</Text>
              <Text style={styles.totalRowValue}>{calculateTotalScore(activePlayer)} pts</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer / Finalizar */}
      {state.isFinished && (
        <View style={styles.winnerBanner}>
          <Text style={styles.winnerTitle}>¡Ganador: {state.winnerName}!</Text>
          <AppButton
            label={meetupId ? 'Guardar resultado y salir' : 'Finalizar y Salir'}
            onPress={() => void handleFinish()}
            isLoading={isCreating}
            disabled={isCreating}
          />
        </View>
      )}

      {/* Modal de selección de puntos */}
      <Modal visible={selectedCategory !== null} transparent animationType="fade">
        {selectedCategory && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Anote para {CATEGORIES_DISPLAY[selectedCategory].name}</Text>
              <View style={styles.optionsGrid}>
                {/* Opciones de puntuación */}
                {!CATEGORIES_DISPLAY[selectedCategory].isGameMayor ? (
                  // Numéricos
                  [1, 2, 3, 4, 5].map((val) => {
                    const points = val * BASE_SCORES[selectedCategory];
                    return (
                      <TouchableOpacity
                        key={`pts-${val}`}
                        style={styles.pointsOption}
                        onPress={() => handleSelectScore(points, false)}
                      >
                        <Text style={styles.pointsOptionText}>{points} pts</Text>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  // Mayores (Armado / Servido)
                  <>
                    <TouchableOpacity
                      style={[styles.pointsOption, { flexBasis: '100%' }]}
                      onPress={() => handleSelectScore(BASE_SCORES[selectedCategory], false)}
                    >
                      <Text style={styles.pointsOptionText}>{BASE_SCORES[selectedCategory]} pts (Armado)</Text>
                    </TouchableOpacity>
                    {selectedCategory === 'generala' ? (
                      <TouchableOpacity
                        style={[styles.pointsOption, { flexBasis: '100%', borderColor: theme.colors.success, backgroundColor: theme.colors.successLight }]}
                        onPress={() => handleSelectScore(BASE_SCORES[selectedCategory], true)}
                      >
                        <Text style={[styles.pointsOptionText, { color: theme.colors.success }]}>Generala Servida (Gana la partida)</Text>
                      </TouchableOpacity>
                    ) : selectedCategory !== 'doble_generala' ? (
                      <TouchableOpacity
                        style={[styles.pointsOption, { flexBasis: '100%' }]}
                        onPress={() => handleSelectScore(BASE_SCORES[selectedCategory] + 5, true)}
                      >
                        <Text style={styles.pointsOptionText}>{BASE_SCORES[selectedCategory] + 5} pts (Servido)</Text>
                      </TouchableOpacity>
                    ) : null}
                  </>
                )}
                {/* Tachar */}
                <TouchableOpacity
                  style={[styles.pointsOption, styles.tacharOption]}
                  onPress={() => handleSelectScore(-1, false)}
                >
                  <Text style={[styles.pointsOptionText, { color: theme.colors.error }]}>Tachar casillero (0)</Text>
                </TouchableOpacity>
              </View>
              <AppButton label="Volver" variant="ghost" onPress={() => setSelectedCategory(null)} />
            </View>
          </View>
        )}
      </Modal>

      {/* Modal de Salir */}
      <Modal visible={showExitModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>¿Salir de la partida?</Text>
            <Text style={styles.modalText}>Se perderá el progreso actual de la planilla.</Text>
            <View style={styles.modalActions}>
              <AppButton label="Volver al juego" variant="ghost" onPress={() => setShowExitModal(false)} />
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
            <Text style={styles.modalTitle}>¿Reiniciar marcador?</Text>
            <Text style={styles.modalText}>Todas las planillas volverán a estar vacías.</Text>
            <View style={styles.modalActions}>
              <AppButton label="Cancelar" variant="ghost" onPress={() => setShowResetModal(false)} />
              <AppButton
                label="Reiniciar"
                onPress={() => {
                  setShowResetModal(false);
                  resetGame();
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <SuccessAnimation
        visible={showSuccess}
        message="Partida registrada con éxito"
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
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  tabsContainer: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
  },
  tabsScroll: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  tabButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
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
  cardHeaderTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.xs,
  },
  list: {
    gap: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  rowLabel: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textPrimary,
  },
  rowValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  emptyScore: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  tachedContainer: {
    backgroundColor: theme.colors.errorLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.radius.sm,
  },
  tachedText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.error,
  },
  scoreBadge: {
    backgroundColor: theme.colors.successLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.radius.sm,
  },
  scoreBadgeText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.success,
  },
  winnerBanner: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  winnerTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.success,
    textAlign: 'center',
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
    marginTop: theme.spacing.sm,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    marginVertical: theme.spacing.sm,
  },
  pointsOption: {
    flexBasis: '45%',
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tacharOption: {
    flexBasis: '100%',
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.errorLight,
  },
  pointsOptionText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: theme.colors.primary,
    borderBottomWidth: 0,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.md,
  },
  totalRowLabel: {
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  totalRowValue: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
});

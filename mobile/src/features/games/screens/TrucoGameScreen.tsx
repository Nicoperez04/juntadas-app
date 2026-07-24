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
import { useTrucoGame } from '../hooks/useTrucoGame';
import { TrucoFosforera } from '../components/TrucoFosforera';
import { AppButton } from '@/shared/components/AppButton';
import { SuccessAnimation } from '@/shared/components/SuccessAnimation';
import { ErrorAnimation } from '@/shared/components/ErrorAnimation';
import { triggerSelectionHaptic } from '@/shared/utils/haptics';
import { useGameResults } from '@/features/gameResults/hooks/useGameResults';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'TrucoGame'>;
type RouteProps = RouteProp<MainStackParamList, 'TrucoGame'>;

export const TrucoGameScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { teamAName, teamBName, targetPoints, meetupId } = route.params;

  const config = useMemo(
    () => ({
      teamAName,
      teamBName,
      targetPoints,
      meetupId,
    }),
    [teamAName, teamBName, targetPoints, meetupId]
  );

  const {
    state,
    incrementScoreA,
    decrementScoreA,
    incrementScoreB,
    decrementScoreB,
    resetGame,
  } = useTrucoGame(config);

  const [showExitModal, setShowExitModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { createResult, isCreating } = useGameResults(meetupId);

  // Divide los puntos para renderizarlos de a 5
  const getFosforitosArray = (score: number) => {
    const array = [];
    let remaining = score;
    while (remaining > 0) {
      array.push(Math.min(remaining, 5));
      remaining -= 5;
    }
    // Asegurar que muestre al menos una fosforera vacía si es 0
    if (array.length === 0) array.push(0);
    return array;
  };

  // Se divide en malas y buenas si es a 30
  const isA30 = targetPoints === 30;

  const renderFosforeraSection = (score: number) => {
    if (isA30) {
      const malas = Math.min(score, 15);
      const buenas = Math.max(score - 15, 0);

      return (
        <View style={styles.dividedContainer}>
          <View style={styles.subSection}>
            <Text style={styles.subSectionTitle}>Malas</Text>
            <View style={styles.fosforerasGrid}>
              {getFosforitosArray(malas).map((pts, i) => (
                <TrucoFosforera key={`malas-${i}`} points={pts} />
              ))}
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.subSection}>
            <Text style={styles.subSectionTitle}>Buenas</Text>
            <View style={styles.fosforerasGrid}>
              {getFosforitosArray(buenas).map((pts, i) => (
                <TrucoFosforera key={`buenas-${i}`} points={pts} />
              ))}
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.fosforerasGrid}>
        {getFosforitosArray(score).map((pts, i) => (
          <TrucoFosforera key={`single-${i}`} points={pts} />
        ))}
      </View>
    );
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

    const result = await createResult({
      meetupId,
      gameType: 'truco',
      winnerName: state.winnerName,
      participants: [
        { name: teamAName, score: state.scoreA },
        { name: teamBName, score: state.scoreB },
      ],
      scoreSummary: {
        finalScore: `${teamAName} ${state.scoreA} - ${state.scoreB} ${teamBName}`,
        teamAName,
        teamBName,
        scoreA: state.scoreA,
        scoreB: state.scoreB,
        targetPoints,
      },
      metadata: {
        targetPoints,
        mode: targetPoints === 30 ? 'malas_y_buenas' : 'simple',
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
        <Text style={styles.headerTitle}>Partida a {targetPoints}</Text>
        <TouchableOpacity
          onPress={() => setShowResetModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Reiniciar"
        >
          <MaterialCommunityIcons name="refresh" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.gameContainer}>
          {/* Fila Equipo A */}
          <View style={styles.teamCard}>
            <View style={styles.teamHeader}>
              <Text style={styles.teamName} numberOfLines={1}>
                {teamAName}
              </Text>
              <Text style={styles.scoreText}>{state.scoreA}</Text>
            </View>

            {renderFosforeraSection(state.scoreA)}

            <View style={styles.controls}>
              <TouchableOpacity
                style={[styles.controlBtn, styles.btnRestar]}
                onPress={decrementScoreA}
                disabled={state.isFinished}
              >
                <Text style={styles.controlBtnText}>-1</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlBtn, styles.btnSumar]}
                onPress={incrementScoreA}
                disabled={state.isFinished}
              >
                <Text style={[styles.controlBtnText, styles.textSumar]}>+1</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Fila Equipo B */}
          <View style={styles.teamCard}>
            <View style={styles.teamHeader}>
              <Text style={styles.teamName} numberOfLines={1}>
                {teamBName}
              </Text>
              <Text style={styles.scoreText}>{state.scoreB}</Text>
            </View>

            {renderFosforeraSection(state.scoreB)}

            <View style={styles.controls}>
              <TouchableOpacity
                style={[styles.controlBtn, styles.btnRestar]}
                onPress={decrementScoreB}
                disabled={state.isFinished}
              >
                <Text style={styles.controlBtnText}>-1</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlBtn, styles.btnSumar]}
                onPress={incrementScoreB}
                disabled={state.isFinished}
              >
                <Text style={[styles.controlBtnText, styles.textSumar]}>+1</Text>
              </TouchableOpacity>
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

      {/* Modal de Salir */}
      <Modal visible={showExitModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>¿Salir de la partida?</Text>
            <Text style={styles.modalText}>Se perderá el progreso actual del anotador.</Text>
            <View style={styles.modalActions}>
              <AppButton
                label="Volver al juego"
                variant="ghost"
                onPress={() => setShowExitModal(false)}
              />
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
            <Text style={styles.modalText}>Ambos marcadores volverán a 0.</Text>
            <View style={styles.modalActions}>
              <AppButton
                label="Cancelar"
                variant="ghost"
                onPress={() => setShowResetModal(false)}
              />
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
  scroll: {
    flexGrow: 1,
  },
  gameContainer: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  teamCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.md,
    gap: theme.spacing.sm,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.xs,
  },
  teamName: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  scoreText: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  fosforerasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    minHeight: 52,
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  controls: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  controlBtn: {
    flex: 1,
    height: 48,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRestar: {
    backgroundColor: theme.colors.background,
    borderWidth: theme.components.inputBorderWidth,
    borderColor: theme.colors.border,
  },
  btnSumar: {
    backgroundColor: theme.colors.primaryLight,
  },
  controlBtnText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
  },
  textSumar: {
    color: theme.colors.primary,
  },
  dividedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subSection: {
    flex: 1,
  },
  subSectionTitle: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textDisabled,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.xs,
  },
  divider: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
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
});

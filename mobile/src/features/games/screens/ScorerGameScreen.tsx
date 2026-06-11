/**
 * Pantalla de juego del Anotador genérico.
 *
 * Permite sumar/restar puntos, editar valores manualmente, agregar o quitar
 * jugadores mid-game y opcionalmente avisar cuando alguien alcanza el objetivo.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
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
import { AppButton } from '@/shared/components/AppButton';
import { Toast } from '@/shared/components/Toast';
import { triggerSelectionHaptic } from '@/shared/utils/haptics';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'ScorerGame'>;
type RouteProps = RouteProp<MainStackParamList, 'ScorerGame'>;

/** Tamaño mínimo de los botones +/- para facilitar el toque */
const SCORE_BUTTON_SIZE = 44;

/** Tipografía mínima del puntaje según spec */
const SCORE_FONT_SIZE = 28;

/** Duración de la animación de entrada/salida del banner de objetivo */
const BANNER_ANIM_MS = 320;

/** Tipos de modal activos en la pantalla */
type ActiveModal =
  | 'editScore'
  | 'addPlayer'
  | 'reset'
  | 'removePlayer'
  | 'exit'
  | null;

interface PlayerScoreRowProps {
  name: string;
  score: number;
  targetScore?: number;
  onDecrement: () => void;
  onIncrement: () => void;
  onEditScore: () => void;
  onRemove: () => void;
}

/**
 * Calcula el avance proporcional hacia el puntaje objetivo (0–1).
 * Solo considera valores positivos para la barra visual.
 */
const getTargetProgress = (score: number, targetScore: number): number => {
  if (targetScore <= 0) {
    return 0;
  }
  return Math.min(Math.max(score / targetScore, 0), 1);
};

/**
 * Fila de jugador con controles de puntaje estilo scoreboard.
 */
const PlayerScoreRow = ({
  name,
  score,
  targetScore,
  onDecrement,
  onIncrement,
  onEditScore,
  onRemove,
}: PlayerScoreRowProps) => {
  const progress = targetScore ? getTargetProgress(score, targetScore) : 0;

  return (
    <View style={styles.playerRow}>
      <View style={styles.playerInfo}>
        <Text style={styles.playerName} numberOfLines={1}>
          {name}
        </Text>
        {targetScore ? (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        ) : null}
      </View>

      <View style={styles.scoreControls}>
        <TouchableOpacity
          style={styles.scoreButton}
          onPress={onDecrement}
          accessibilityRole="button"
          accessibilityLabel={`Restar punto a ${name}`}
        >
          <MaterialCommunityIcons name="minus" size={24} color={theme.colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.scoreDisplay}
          onPress={onEditScore}
          accessibilityRole="button"
          accessibilityLabel={`Editar puntaje de ${name}, actualmente ${score}`}
        >
          <Text style={styles.scoreText}>{score}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.scoreButton}
          onPress={onIncrement}
          accessibilityRole="button"
          accessibilityLabel={`Sumar punto a ${name}`}
        >
          <MaterialCommunityIcons name="plus" size={24} color={theme.colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={`Eliminar a ${name}`}
        >
          <MaterialCommunityIcons name="close" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * Inicializa el mapa de puntajes en 0 para cada jugador recibido.
 */
const buildInitialScores = (playerNames: string[]): Record<string, number> =>
  Object.fromEntries(playerNames.map((name) => [name, 0]));

interface TargetBannerProps {
  playerName: string;
  message: string;
  isLose: boolean;
  onDismiss: () => void;
}

/**
 * Banner flotante centrado con animación de entrada (fade + scale + slide).
 * Al cerrar anima la salida antes de desmontarse.
 */
const TargetBanner = ({ playerName, message, isLose, onDismiss }: TargetBannerProps) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.88)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: BANNER_ANIM_MS,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 16,
        bounciness: 7,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: BANNER_ANIM_MS,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale, translateY]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: BANNER_ANIM_MS * 0.65,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.92,
        duration: BANNER_ANIM_MS * 0.65,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 12,
        duration: BANNER_ANIM_MS * 0.65,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  };

  return (
    <Animated.View
      style={[
        styles.bannerFloating,
        isLose ? styles.bannerLose : styles.bannerWin,
        { opacity, transform: [{ scale }, { translateY }] },
      ]}
      accessibilityRole="alert"
      accessibilityLabel={`${playerName}: ${message}`}
    >
      <Text style={styles.bannerFloatingText}>{message}</Text>
      <TouchableOpacity
        onPress={handleDismiss}
        style={styles.bannerCloseButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel="Cerrar aviso"
      >
        <MaterialCommunityIcons name="close" size={20} color={theme.colors.textPrimary} />
      </TouchableOpacity>
    </Animated.View>
  );
};

export const ScorerGameScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();

  const { players: initialPlayers, targetScore, targetType } = route.params;

  const [players, setPlayers] = useState<string[]>(initialPlayers);
  const [scores, setScores] = useState<Record<string, number>>(() =>
    buildInitialScores(initialPlayers),
  );
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [editScoreInput, setEditScoreInput] = useState('');
  const [editIsNegative, setEditIsNegative] = useState(false);
  const [newPlayerInput, setNewPlayerInput] = useState('');
  const [playerToRemove, setPlayerToRemove] = useState<string | null>(null);
  const [visibleBanners, setVisibleBanners] = useState<string[]>([]);
  const [triggeredPlayers, setTriggeredPlayers] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null,
  );
  const [isExiting, setIsExiting] = useState(false);

  /** Actualiza el puntaje de un jugador */
  const updateScore = useCallback((playerName: string, newScore: number) => {
    setScores((prev) => ({ ...prev, [playerName]: newScore }));
  }, []);

  /** Suma o resta un punto con feedback háptico */
  const adjustScore = useCallback(
    (playerName: string, delta: number) => {
      void triggerSelectionHaptic();
      setScores((prev) => ({
        ...prev,
        [playerName]: (prev[playerName] ?? 0) + delta,
      }));
    },
    [],
  );

  /** Detecta jugadores que alcanzan el objetivo y muestra banners no bloqueantes */
  useEffect(() => {
    if (!targetScore) {
      return;
    }

    players.forEach((player) => {
      const score = scores[player] ?? 0;
      const reached = score >= targetScore;

      if (reached && !triggeredPlayers.has(player)) {
        setTriggeredPlayers((prev) => new Set([...prev, player]));
        setVisibleBanners((prev) => (prev.includes(player) ? prev : [...prev, player]));
      }
    });
  }, [scores, targetScore, players, triggeredPlayers]);

  /** Intercepta la navegación hacia atrás para confirmar salida */
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (isExiting) {
        return;
      }

      event.preventDefault();
      setActiveModal('exit');
    });

    return unsubscribe;
  }, [navigation, isExiting]);

  const openEditModal = useCallback((playerName: string) => {
    void triggerSelectionHaptic();
    const currentScore = scores[playerName] ?? 0;
    setEditingPlayer(playerName);
    setEditIsNegative(currentScore < 0);
    setEditScoreInput(String(Math.abs(currentScore)));
    setActiveModal('editScore');
  }, [scores]);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setEditingPlayer(null);
    setEditScoreInput('');
    setEditIsNegative(false);
    setNewPlayerInput('');
    setPlayerToRemove(null);
  }, []);

  /** Guarda el puntaje editado manualmente (acepta negativos) */
  const handleSaveEditScore = useCallback(() => {
    if (!editingPlayer) {
      return;
    }

    const trimmed = editScoreInput.trim();
    if (!trimmed) {
      setToast({ message: 'Ingresá un número válido', type: 'error' });
      return;
    }

    const parsed = parseInt(trimmed, 10);
    if (Number.isNaN(parsed)) {
      setToast({ message: 'Ingresá un número válido', type: 'error' });
      return;
    }

    void triggerSelectionHaptic();
    updateScore(editingPlayer, editIsNegative ? -parsed : parsed);
    closeModal();
  }, [closeModal, editIsNegative, editScoreInput, editingPlayer, updateScore]);

  /** Solo dígitos — el signo negativo se controla con el toggle aparte */
  const handleEditScoreChange = (text: string) => {
    setEditScoreInput(text.replace(/[^0-9]/g, ''));
  };

  const toggleEditSign = () => {
    void triggerSelectionHaptic();
    setEditIsNegative((prev) => !prev);
  };

  /** Agrega un jugador mid-game con puntaje inicial 0 */
  const handleAddPlayer = useCallback(() => {
    const trimmed = newPlayerInput.trim();
    if (!trimmed) {
      return;
    }

    if (players.some((p) => p.toLowerCase() === trimmed.toLowerCase())) {
      setToast({ message: 'Ese nombre ya está en la lista', type: 'error' });
      return;
    }

    void triggerSelectionHaptic();
    setPlayers((prev) => [...prev, trimmed]);
    setScores((prev) => ({ ...prev, [trimmed]: 0 }));
    closeModal();
  }, [closeModal, newPlayerInput, players]);

  /** Resetea todos los puntajes a 0 */
  const handleResetScores = useCallback(() => {
    void triggerSelectionHaptic();
    setScores(buildInitialScores(players));
    setVisibleBanners([]);
    setTriggeredPlayers(new Set());
    closeModal();
  }, [closeModal, players]);

  /** Elimina un jugador del juego */
  const handleRemovePlayer = useCallback(() => {
    if (!playerToRemove) {
      return;
    }

    void triggerSelectionHaptic();
    const remaining = players.filter((p) => p !== playerToRemove);

    setPlayers(remaining);
    setScores((prev) => {
      const next = { ...prev };
      delete next[playerToRemove];
      return next;
    });
    setVisibleBanners((prev) => prev.filter((p) => p !== playerToRemove));
    setTriggeredPlayers((prev) => {
      const next = new Set(prev);
      next.delete(playerToRemove);
      return next;
    });

    closeModal();

    if (remaining.length < 2) {
      setToast({
        message: 'Quedan menos de 2 jugadores. Podés seguir anotando o agregar más.',
        type: 'success',
      });
    }
  }, [closeModal, playerToRemove, players]);

  /** Sale del juego y vuelve directamente a GamesScreen */
  const handleConfirmExit = useCallback(() => {
    setIsExiting(true);
    closeModal();
    navigation.reset({
      index: 0,
      routes: [{ name: Routes.Games }],
    });
  }, [closeModal, navigation]);

  const dismissBanner = useCallback((playerName: string) => {
    setVisibleBanners((prev) => prev.filter((p) => p !== playerName));
  }, []);

  const getBannerMessage = (playerName: string): string => {
    if (targetType === 'lose') {
      return `💀 ¡${playerName} perdió!`;
    }
    return `🏆 ¡${playerName} ganó!`;
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.topSafe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setActiveModal('exit')}
            accessibilityRole="button"
            accessibilityLabel="Salir del juego"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={theme.colors.textPrimary}
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Anotador</Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => {
                void triggerSelectionHaptic();
                setActiveModal('addPlayer');
              }}
              accessibilityRole="button"
              accessibilityLabel="Agregar jugador"
            >
              <MaterialCommunityIcons
                name="account-plus-outline"
                size={20}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => {
                void triggerSelectionHaptic();
                setActiveModal('reset');
              }}
              accessibilityRole="button"
              accessibilityLabel="Resetear puntajes"
            >
              <MaterialCommunityIcons
                name="refresh"
                size={20}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {players.map((name) => (
          <PlayerScoreRow
            key={name}
            name={name}
            score={scores[name] ?? 0}
            targetScore={targetScore}
            onDecrement={() => adjustScore(name, -1)}
            onIncrement={() => adjustScore(name, 1)}
            onEditScore={() => openEditModal(name)}
            onRemove={() => {
              void triggerSelectionHaptic();
              setPlayerToRemove(name);
              setActiveModal('removePlayer');
            }}
          />
        ))}
      </ScrollView>

      {/* Banners flotantes centrados — no bloquean la interacción con el juego */}
      {visibleBanners.length > 0 ? (
        <View style={styles.bannersOverlay} pointerEvents="box-none">
          {visibleBanners.map((playerName) => (
            <TargetBanner
              key={playerName}
              playerName={playerName}
              message={getBannerMessage(playerName)}
              isLose={targetType === 'lose'}
              onDismiss={() => dismissBanner(playerName)}
            />
          ))}
        </View>
      ) : null}

      {/* Modal: editar puntaje */}
      <Modal
        transparent
        animationType="fade"
        visible={activeModal === 'editScore'}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Editar puntaje</Text>
            <Text style={styles.modalSubtitle}>{editingPlayer}</Text>
            <View style={styles.scoreEditRow}>
              <TouchableOpacity
                style={[styles.signToggle, editIsNegative && styles.signToggleActive]}
                onPress={toggleEditSign}
                accessibilityRole="button"
                accessibilityLabel={editIsNegative ? 'Puntaje negativo' : 'Puntaje positivo'}
              >
                <Text
                  style={[
                    styles.signToggleText,
                    editIsNegative && styles.signToggleTextActive,
                  ]}
                >
                  {editIsNegative ? '−' : '+'}
                </Text>
              </TouchableOpacity>
              <TextInput
                style={styles.modalScoreInput}
                value={editScoreInput}
                onChangeText={handleEditScoreChange}
                keyboardType="number-pad"
                inputMode="numeric"
                autoFocus
                selectTextOnFocus
                maxLength={6}
              />
            </View>
            <View style={styles.modalActions}>
              <AppButton label="Cancelar" variant="ghost" onPress={closeModal} />
              <AppButton label="Guardar" onPress={handleSaveEditScore} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: agregar jugador */}
      <Modal
        transparent
        animationType="fade"
        visible={activeModal === 'addPlayer'}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Agregar jugador</Text>
            <TextInput
              style={styles.modalTextInput}
              value={newPlayerInput}
              onChangeText={setNewPlayerInput}
              placeholder="Nombre del jugador o equipo"
              placeholderTextColor={theme.colors.textDisabled}
              autoFocus
            />
            <View style={styles.modalActions}>
              <AppButton label="Cancelar" variant="ghost" onPress={closeModal} />
              <AppButton
                label="Agregar"
                onPress={handleAddPlayer}
                disabled={!newPlayerInput.trim()}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: resetear puntajes */}
      <Modal
        transparent
        animationType="fade"
        visible={activeModal === 'reset'}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Resetear puntajes</Text>
            <Text style={styles.modalSubtitle}>¿Resetear todos los puntajes a 0?</Text>
            <View style={styles.modalActions}>
              <AppButton label="Cancelar" variant="ghost" onPress={closeModal} />
              <AppButton label="Resetear" onPress={handleResetScores} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: eliminar jugador */}
      <Modal
        transparent
        animationType="fade"
        visible={activeModal === 'removePlayer'}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Eliminar jugador</Text>
            <Text style={styles.modalSubtitle}>
              ¿Eliminar a {playerToRemove} del juego?
            </Text>
            <View style={styles.modalActions}>
              <AppButton label="Cancelar" variant="ghost" onPress={closeModal} />
              <AppButton label="Eliminar" onPress={handleRemovePlayer} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: confirmar salida */}
      <Modal
        transparent
        animationType="fade"
        visible={activeModal === 'exit'}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Salir del juego</Text>
            <Text style={styles.modalSubtitle}>
              ¿Salir del juego? Se perderá el progreso.
            </Text>
            <View style={styles.modalActions}>
              <AppButton label="Cancelar" variant="ghost" onPress={closeModal} />
              <AppButton label="Salir" onPress={handleConfirmExit} />
            </View>
          </View>
        </View>
      </Modal>

      <Toast
        message={toast?.message ?? ''}
        type={toast?.type ?? 'success'}
        visible={toast !== null}
        onHide={() => setToast(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  topSafe: {
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryLight,
  },
  bannersOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
    zIndex: 10,
  },
  bannerFloating: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    ...theme.shadows.md,
  },
  bannerWin: {
    backgroundColor: theme.colors.successLight,
    borderWidth: theme.components.borderWidth,
    borderColor: theme.colors.success,
  },
  bannerLose: {
    backgroundColor: theme.colors.errorLight,
    borderWidth: theme.components.borderWidth,
    borderColor: theme.colors.error,
  },
  bannerFloatingText: {
    flex: 1,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginRight: theme.spacing.sm,
  },
  bannerCloseButton: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  playerRow: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: theme.components.borderWidth,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
    gap: theme.spacing.sm,
  },
  playerInfo: {
    gap: theme.spacing.xs,
  },
  playerName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  progressTrack: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
  },
  scoreControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  scoreButton: {
    width: SCORE_BUTTON_SIZE,
    height: SCORE_BUTTON_SIZE,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreDisplay: {
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  scoreText: {
    fontSize: SCORE_FONT_SIZE,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  removeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.xs,
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
  },
  scoreEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  signToggle: {
    width: 52,
    height: 72,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
    borderWidth: theme.components.inputBorderWidth,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signToggleActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  signToggleText: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.sizes.xxl + 4,
  },
  signToggleTextActive: {
    color: theme.colors.primary,
  },
  modalScoreInput: {
    flex: 1,
    height: 72,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    borderWidth: theme.components.inputBorderWidth,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    ...(Platform.OS === 'android' ? { includeFontPadding: false, textAlignVertical: 'center' as const } : {}),
  },
  modalTextInput: {
    height: theme.components.inputHeight,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    borderWidth: theme.components.inputBorderWidth,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textPrimary,
  },
  modalActions: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
});

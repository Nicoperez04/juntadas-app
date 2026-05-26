/**
 * Pantalla de configuración del juego Impostor.
 *
 * Soporta modo standalone (sin meetupId) o vinculado a una juntada activa.
 * La palabra siempre se elige aleatoriamente — el organizador nunca la ve antes
 * de iniciar la partida presencial.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { supabase } from '@/lib/supabase/client';
import { theme } from '@/shared/constants/theme';
import { appConfig } from '@/config/appConfig';
import { Routes } from '@/navigation/routes';
import { AppButton } from '@/shared/components/AppButton';
import { APP_TAB_BAR_OFFSET } from '@/shared/components/AppTabBar';
import { Toast } from '@/shared/components/Toast';
import { triggerSelectionHaptic } from '@/shared/utils/haptics';
import type { MainStackParamList } from '@/features/meetups/types';
import { ImpostorTabBar } from '../components/ImpostorTabBar';
import { impostorColors } from '../constants/impostorTheme';
import {
  CATEGORIES,
  getCategoryLabel,
  pickWordForMode,
} from '../data/wordBank';
import { useImpostor } from '../hooks/useImpostor';
import { impostorService } from '../services/impostorService';
import type { Player, WordSelectionMode } from '../types';
import {
  createLocalPlayerId,
  getAvatarColor,
  getInitials,
} from '../utils/playerAvatars';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'ImpostorStart'>;
type RoutePropType = RouteProp<MainStackParamList, 'ImpostorStart'>;

const HOW_TO_STEPS = [
  {
    step: '1',
    title: 'Configurá la partida',
    description: 'Elegí jugadores y cómo se sortea la palabra secreta.',
  },
  {
    step: '2',
    title: 'Pasá el teléfono',
    description: 'Cada jugador ve su rol en privado, uno por uno.',
  },
  {
    step: '3',
    title: 'Descubrí al impostor',
    description: 'Todos describen la palabra sin decirla. El impostor finge.',
  },
  {
    step: '4',
    title: 'Nueva ronda',
    description: 'Reiniciá con la misma lista y otra palabra aleatoria.',
  },
];

/** Array estable para evitar re-renders infinitos cuando no hay sesión previa */
const EMPTY_USED_WORDS: string[] = [];

export const ImpostorStartScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const meetupId = route.params?.meetupId;

  const { session, setupGame, updateSessionPlayers } = useImpostor(meetupId);

  const [showSetup, setShowSetup] = useState(false);
  const [showHowToModal, setShowHowToModal] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [wordMode, setWordMode] = useState<WordSelectionMode>('all_categories');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [hasWordSelected, setHasWordSelected] = useState(false);
  const [pendingWord, setPendingWord] = useState('');
  const [pendingCategory, setPendingCategory] = useState('');
  const [includeImpostorHint, setIncludeImpostorHint] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [playersManuallyCleared, setPlayersManuallyCleared] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  /** Historial de palabras — referencia estable si no hay sesión */
  const usedWordsPool = session?.usedWords ?? EMPTY_USED_WORDS;
  const usedWordsRef = useRef(usedWordsPool);
  usedWordsRef.current = usedWordsPool;

  /**
   * Sortea palabra según modo activo sin mostrarla al organizador.
   * Se invoca solo desde handlers explícitos para evitar loops de useEffect.
   */
  const pickPendingWord = useCallback(
    (mode: WordSelectionMode, category: string) => {
      const pick = pickWordForMode(
        mode,
        mode === 'specific_category' ? category : null,
        usedWordsRef.current,
      );
      setPendingWord(pick.word);
      setPendingCategory(pick.category);
      setHasWordSelected(true);
    },
    [],
  );

  /**
   * Al enfocar la pantalla: restaura jugadores de sesión activa (nueva ronda)
   * o carga participantes confirmados solo en la primera entrada al flujo.
   */
  useFocusEffect(
    useCallback(() => {
      const hasActiveSession =
        session?.phase === 'playing' || session?.phase === 'revealing';

      if (hasActiveSession) {
        if (!playersManuallyCleared) {
          setPlayers(session.players);
          setShowSetup(true);
          setWordMode(session.wordMode);
          setIncludeImpostorHint(session.includeImpostorHint);
          if (CATEGORIES.includes(session.topic)) {
            setSelectedCategory(session.topic);
          }
          pickPendingWord(session.wordMode, session.topic);
        }
        setIsLoadingPlayers(false);
        return;
      }

      if (!meetupId) {
        setIsLoadingPlayers(false);
        return;
      }

      const loadPlayers = async () => {
        setIsLoadingPlayers(true);
        const { data, error } = await impostorService.getParticipantsForGame(meetupId);

        if (error) {
          setToast({ message: error, type: 'error' });
        } else if (data) {
          setPlayers(data);
          setPlayersManuallyCleared(false);
        }

        setIsLoadingPlayers(false);
      };

      void loadPlayers();
    }, [
      meetupId,
      session,
      playersManuallyCleared,
      pickPendingWord,
    ]),
  );

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id ?? null);
    };
    void loadUser();
  }, []);

  const handleEnterSetup = useCallback(() => {
    void triggerSelectionHaptic();
    setShowSetup(true);
    pickPendingWord(wordMode, selectedCategory);
  }, [pickPendingWord, wordMode, selectedCategory]);

  const handleSelectAllCategories = useCallback(() => {
    void triggerSelectionHaptic();
    setWordMode('all_categories');
    pickPendingWord('all_categories', selectedCategory);
  }, [pickPendingWord, selectedCategory]);

  const handleSelectSpecificCategory = useCallback(() => {
    void triggerSelectionHaptic();
    setWordMode('specific_category');
    pickPendingWord('specific_category', selectedCategory);
  }, [pickPendingWord, selectedCategory]);

  const handleSelectCategory = useCallback(
    (cat: string) => {
      void triggerSelectionHaptic();
      setSelectedCategory(cat);
      pickPendingWord('specific_category', cat);
    },
    [pickPendingWord],
  );

  const handleRemovePlayer = useCallback((playerId: string) => {
    void triggerSelectionHaptic();
    setPlayers((prev) => {
      const next = prev.filter((p) => p.id !== playerId);
      if (next.length === 0) setPlayersManuallyCleared(true);
      updateSessionPlayers(next);
      return next;
    });
  }, [updateSessionPlayers]);

  const handleAddPlayer = useCallback(() => {
    const trimmed = newPlayerName.trim();
    if (!trimmed) return;

    const normalizedName = trimmed.toLowerCase();
    const isDuplicate = players.some(
      (player) => player.name.trim().toLowerCase() === normalizedName,
    );

    if (isDuplicate) {
      setToast({ message: 'Ya existe un jugador con ese nombre', type: 'error' });
      return;
    }

    void triggerSelectionHaptic();
    const nextPlayers: Player[] = [
      ...players,
      { id: createLocalPlayerId(), name: trimmed, isFromApp: false },
    ];
    setPlayers(nextPlayers);
    updateSessionPlayers(nextPlayers);
    setNewPlayerName('');
    setShowAddPlayer(false);
  }, [newPlayerName, players, updateSessionPlayers]);

  const handleReshuffleWord = useCallback(() => {
    void triggerSelectionHaptic();
    pickPendingWord(wordMode, selectedCategory);
  }, [pickPendingWord, wordMode, selectedCategory]);

  const handleStartGame = useCallback(async () => {
    if (players.length < appConfig.impostor.minPlayers) {
      setToast({
        message: `Necesitás al menos ${appConfig.impostor.minPlayers} jugadores`,
        type: 'error',
      });
      return;
    }

    if (!hasWordSelected || !pendingWord) {
      setToast({ message: 'Esperá a que se seleccione una palabra', type: 'error' });
      return;
    }

    setIsStarting(true);

    const newSession = setupGame(
      players,
      pendingWord,
      pendingCategory,
      wordMode,
      includeImpostorHint,
      usedWordsPool,
    );

    if (currentUserId && meetupId && newSession) {
      const impostorPlayer = newSession.players[newSession.impostorIndex];
      await impostorService.saveGameRecord(currentUserId, meetupId, {
        topic:
          wordMode === 'specific_category'
            ? getCategoryLabel(pendingCategory)
            : 'Todas las categorías',
        normalPrompt: pendingWord,
        impostorPrompt: newSession.impostorPrompt || 'Sin pista',
        impostorUserId: impostorPlayer.isFromApp
          ? impostorPlayer.userId ?? null
          : null,
      });
    }

    setIsStarting(false);
    navigation.navigate(Routes.ImpostorRole, { meetupId });
  }, [
    players,
    hasWordSelected,
    pendingWord,
    pendingCategory,
    wordMode,
    includeImpostorHint,
    usedWordsPool,
    setupGame,
    currentUserId,
    meetupId,
    navigation,
  ]);

  const renderIntro = () => (
    <View style={styles.introSection}>
      <View style={styles.heroCardOuter}>
        <View style={styles.heroCardGradientBase} />
        <View style={styles.heroCardGradientTop} />
        <View style={styles.heroCardInner}>
          <View style={styles.heroBadgeRow}>
            <View style={styles.popularBadge}>
              <Text style={styles.popularBadgeText}>POPULAR</Text>
            </View>
            <Ionicons name="sparkles" size={18} color={theme.colors.secondary} />
          </View>
          <Text style={styles.heroTitle}>Impostor</Text>
          <Text style={styles.heroDescription}>
            Un jugador no conoce la palabra secreta. Descubrilo mirando, preguntando
            y descubriendo quién improvisa.
          </Text>
          <TouchableOpacity
            style={styles.howToButton}
            onPress={() => setShowHowToModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="help-circle-outline" size={20} color={theme.colors.surface} />
            <Text style={styles.howToButtonText}>Cómo se juega</Text>
          </TouchableOpacity>
        </View>
      </View>

      <AppButton label="Jugar ahora" onPress={handleEnterSetup} />
    </View>
  );

  const renderWordSection = () => (
    <View style={styles.surfaceCard}>
      <Text style={styles.cardTitle}>Palabra secreta</Text>
      <Text style={styles.cardHint}>
        La palabra se elige sola — vos no la ves antes de empezar
      </Text>

      {/* Opción A — todas las categorías */}
      <TouchableOpacity
        style={[
          styles.modeOption,
          wordMode === 'all_categories' && styles.modeOptionActive,
        ]}
        onPress={handleSelectAllCategories}
        activeOpacity={0.8}
      >
        <Ionicons
          name={wordMode === 'all_categories' ? 'radio-button-on' : 'radio-button-off'}
          size={22}
          color={theme.colors.primary}
        />
        <View style={styles.modeOptionText}>
          <Text style={styles.modeOptionTitle}>Aleatorio — todas las categorías</Text>
          <Text style={styles.modeOptionSubtitle}>
            Misterio total: nadie sabe el tema hasta jugar
          </Text>
        </View>
      </TouchableOpacity>

      {/* Opción B — categoría específica */}
      <TouchableOpacity
        style={[
          styles.modeOption,
          wordMode === 'specific_category' && styles.modeOptionActive,
        ]}
        onPress={handleSelectSpecificCategory}
        activeOpacity={0.8}
      >
        <Ionicons
          name={wordMode === 'specific_category' ? 'radio-button-on' : 'radio-button-off'}
          size={22}
          color={theme.colors.primary}
        />
        <View style={styles.modeOptionText}>
          <Text style={styles.modeOptionTitle}>Categoría específica</Text>
          <Text style={styles.modeOptionSubtitle}>
            El grupo puede conocer el tema de la ronda
          </Text>
        </View>
      </TouchableOpacity>

      {wordMode === 'specific_category' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = cat === selectedCategory;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => handleSelectCategory(cat)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {getCategoryLabel(cat)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {hasWordSelected && (
        <View style={styles.wordSelectedRow}>
          <Ionicons name="checkmark-circle" size={22} color={theme.colors.success} />
          <Text style={styles.wordSelectedText}>Palabra seleccionada ✓</Text>
        </View>
      )}

      {wordMode === 'specific_category' && (
        <Text style={styles.categoryPublicLabel}>
          Tema público: {getCategoryLabel(selectedCategory)}
        </Text>
      )}

      <TouchableOpacity
        style={styles.reshuffleBtn}
        onPress={handleReshuffleWord}
        activeOpacity={0.8}
      >
        <Text style={styles.reshuffleBtnText}>🔀 Otra palabra</Text>
      </TouchableOpacity>

      <View style={styles.hintToggleBlock}>
        <Text style={styles.inputLabel}>Pista para el impostor</Text>
        <TouchableOpacity
          style={[
            styles.hintToggle,
            includeImpostorHint && styles.hintToggleActive,
          ]}
          onPress={() => {
            void triggerSelectionHaptic();
            setIncludeImpostorHint((prev) => !prev);
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name={includeImpostorHint ? 'checkbox' : 'square-outline'}
            size={22}
            color={includeImpostorHint ? theme.colors.primary : theme.colors.textSecondary}
          />
          <View style={styles.hintToggleText}>
            <Text style={styles.hintToggleTitle}>
              {includeImpostorHint ? 'Con pista automática' : 'Sin pista'}
            </Text>
            <Text style={styles.hintToggleSubtitle}>
              {includeImpostorHint
                ? 'El impostor recibirá una ayuda generada al ver su rol'
                : 'El impostor no recibe ninguna ayuda extra'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSetup = () => (
    <View style={styles.setupSection}>
      <View style={styles.surfaceCard}>
        <Text style={styles.cardTitle}>Jugadores</Text>
        <Text style={styles.cardHint}>
          Mínimo {appConfig.impostor.minPlayers}
          {meetupId ? ' · Sugeridos desde la juntada' : ' · Agregá jugadores manualmente'}
        </Text>

        {isLoadingPlayers ? (
          <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
        ) : (
          <View style={styles.playersList}>
            {players.map((player) => (
              <View key={player.id} style={styles.playerRow}>
                <View
                  style={[
                    styles.playerAvatar,
                    { backgroundColor: getAvatarColor(player.id) },
                  ]}
                >
                  <Text style={styles.playerAvatarText}>{getInitials(player.name)}</Text>
                </View>
                <Text style={styles.playerName}>{player.name}</Text>
                <TouchableOpacity
                  onPress={() => handleRemovePlayer(player.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={22} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {showAddPlayer ? (
          <View style={styles.addPlayerRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Nombre del jugador"
              placeholderTextColor={theme.colors.textDisabled}
              value={newPlayerName}
              onChangeText={setNewPlayerName}
              autoFocus
              onSubmitEditing={handleAddPlayer}
            />
            <TouchableOpacity style={styles.addConfirmBtn} onPress={handleAddPlayer}>
              <Ionicons name="checkmark" size={22} color={theme.colors.surface} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addPlayerBtn}
            onPress={() => setShowAddPlayer(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={22} color={theme.colors.primary} />
            <Text style={styles.addPlayerBtnText}>Agregar jugador</Text>
          </TouchableOpacity>
        )}
      </View>

      {renderWordSection()}

      <AppButton
        label="Iniciar partida"
        onPress={() => void handleStartGame()}
        isLoading={isStarting}
      />
    </View>
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.topSafe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Impostor</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!showSetup ? renderIntro() : renderSetup()}
        </ScrollView>
      </KeyboardAvoidingView>

      <ImpostorTabBar activeTabId="games" />

      <Modal
        visible={showHowToModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowHowToModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cómo se juega</Text>
              <TouchableOpacity onPress={() => setShowHowToModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>
            {HOW_TO_STEPS.map((item) => (
              <View key={item.step} style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{item.step}</Text>
                </View>
                <View style={styles.stepTextBlock}>
                  <Text style={styles.stepTitle}>{item.title}</Text>
                  <Text style={styles.stepDescription}>{item.description}</Text>
                </View>
              </View>
            ))}
            <AppButton label="Entendido" onPress={() => setShowHowToModal(false)} />
          </View>
        </View>
      </Modal>

      <Toast
        message={toast?.message ?? ''}
        type={toast?.type ?? 'error'}
        visible={!!toast}
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
  flex: { flex: 1 },
  topSafe: { backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  backBtn: { padding: theme.spacing.xs },
  headerTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  headerSpacer: { width: 32 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: APP_TAB_BAR_OFFSET + theme.spacing.xl,
    gap: theme.spacing.md,
  },
  introSection: { gap: theme.spacing.lg },
  heroCardOuter: {
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  heroCardGradientBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: impostorColors.heroDark,
  },
  heroCardGradientTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: impostorColors.heroMid,
    opacity: 0.4,
  },
  heroCardInner: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  popularBadge: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
  },
  popularBadgeText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.surface,
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.surface,
  },
  heroDescription: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.primaryLight,
    lineHeight: 22,
  },
  howToButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    alignSelf: 'flex-start',
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full,
    borderWidth: theme.components.borderWidth,
    borderColor: theme.colors.surface,
  },
  howToButtonText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.surface,
  },
  setupSection: { gap: theme.spacing.md },
  surfaceCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  cardTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  cardHint: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  loader: { marginVertical: theme.spacing.md },
  playersList: { gap: theme.spacing.sm },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: theme.components.borderWidth,
    borderBottomColor: theme.colors.border,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatarText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.surface,
  },
  playerName: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textPrimary,
  },
  addPlayerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: theme.components.borderWidth,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    marginTop: theme.spacing.sm,
  },
  addPlayerBtnText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
  addPlayerRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  addConfirmBtn: {
    width: theme.components.inputHeight,
    height: theme.components.inputHeight,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: theme.components.borderWidth,
    borderColor: theme.colors.border,
    marginTop: theme.spacing.sm,
  },
  modeOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  modeOptionText: { flex: 1 },
  modeOptionTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  modeOptionSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  chipsRow: {
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background,
    borderWidth: theme.components.borderWidth,
    borderColor: theme.colors.border,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
  },
  chipTextSelected: { color: theme.colors.surface },
  wordSelectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.successLight,
    borderRadius: theme.radius.md,
  },
  wordSelectedText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.success,
  },
  categoryPublicLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  reshuffleBtn: {
    alignSelf: 'flex-start',
    paddingVertical: theme.spacing.sm,
  },
  reshuffleBtnText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
  hintToggleBlock: { marginTop: theme.spacing.sm },
  hintToggle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: theme.components.borderWidth,
    borderColor: theme.colors.border,
    marginTop: theme.spacing.xs,
  },
  hintToggleActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  hintToggleText: { flex: 1 },
  hintToggleTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  hintToggleSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  textInput: {
    flex: 1,
    height: theme.components.inputHeight,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textPrimary,
    borderWidth: theme.components.borderWidth,
    borderColor: theme.colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  stepRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'flex-start',
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  stepTextBlock: { flex: 1 },
  stepTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  stepDescription: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});

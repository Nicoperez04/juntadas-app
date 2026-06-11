/**
 * Pantalla de configuración del Anotador genérico.
 *
 * Permite definir jugadores/equipos y opcionalmente un puntaje objetivo
 * antes de iniciar la partida de anotación.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '@/shared/constants/theme';
import { Routes } from '@/navigation/routes';
import type { MainStackParamList } from '@/navigation/types';
import { AppButton } from '@/shared/components/AppButton';
import { Toast } from '@/shared/components/Toast';
import { triggerSelectionHaptic } from '@/shared/utils/haptics';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'ScorerSetup'>;

/** Tipo de condición de victoria/derrota al alcanzar el puntaje límite */
type TargetType = 'win' | 'lose';

/** Altura de cada fila de jugador en la lista */
const PLAYER_ROW_HEIGHT = 48;

/** Duración del fade-in al agregar un jugador */
const PLAYER_FADE_MS = 280;

interface PlayerRowProps {
  name: string;
  onRemove: () => void;
}

/**
 * Fila de jugador con animación de entrada suave al montarse.
 */
const PlayerRow = ({ name, onRemove }: PlayerRowProps) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: PLAYER_FADE_MS,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  return (
    <Animated.View style={[styles.playerRow, { opacity }]}>
      <Text style={styles.playerName} numberOfLines={1}>
        {name}
      </Text>
      <TouchableOpacity
        onPress={onRemove}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={`Quitar a ${name}`}
      >
        <MaterialCommunityIcons
          name="close-circle"
          size={22}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

export const ScorerSetupScreen = () => {
  const navigation = useNavigation<NavProp>();

  const [players, setPlayers] = useState<string[]>([]);
  const [nameInput, setNameInput] = useState('');
  const [hasTargetScore, setHasTargetScore] = useState(false);
  const [targetScoreInput, setTargetScoreInput] = useState('');
  const [targetType, setTargetType] = useState<TargetType>('win');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null,
  );

  /** Agrega un jugador validando vacío y duplicados (case-insensitive) */
  const handleAddPlayer = useCallback(() => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      return;
    }

    if (players.some((p) => p.toLowerCase() === trimmed.toLowerCase())) {
      setToast({ message: 'Ese nombre ya está en la lista', type: 'error' });
      return;
    }

    void triggerSelectionHaptic();
    setPlayers((prev) => [...prev, trimmed]);
    setNameInput('');
  }, [nameInput, players]);

  /** Quita un jugador por índice */
  const handleRemovePlayer = useCallback((index: number) => {
    void triggerSelectionHaptic();
    setPlayers((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /** Valida el puntaje límite cuando el toggle está activo */
  const parsedTargetScore = hasTargetScore ? parseInt(targetScoreInput.trim(), 10) : undefined;
  const isTargetScoreValid =
    !hasTargetScore ||
    (!Number.isNaN(parsedTargetScore) && (parsedTargetScore ?? 0) > 0);

  const canStart = players.length >= 2 && isTargetScoreValid;

  /** Navega al juego pasando la configuración como parámetros de ruta */
  const handleStart = useCallback(() => {
    if (!canStart) {
      return;
    }

    void triggerSelectionHaptic();

    navigation.navigate(Routes.ScorerGame, {
      players,
      ...(hasTargetScore && parsedTargetScore
        ? { targetScore: parsedTargetScore, targetType }
        : {}),
    });
  }, [canStart, hasTargetScore, navigation, parsedTargetScore, players, targetType]);

  const handleGoBack = () => {
    void triggerSelectionHaptic();
    navigation.goBack();
  };

  /** Solo permite dígitos en el input de puntaje límite */
  const handleTargetScoreChange = (text: string) => {
    setTargetScoreInput(text.replace(/[^0-9]/g, ''));
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.topSafe} edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={theme.colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Anotador</Text>
          <Text style={styles.headerSubtitle}>Definí los jugadores o equipos</Text>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Jugadores ── */}
          <Text style={styles.sectionTitle}>Jugadores</Text>

          <View style={styles.addRow}>
            <TextInput
              style={styles.nameInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Nombre del jugador o equipo"
              placeholderTextColor={theme.colors.textDisabled}
              onSubmitEditing={handleAddPlayer}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.addButton, !nameInput.trim() && styles.addButtonDisabled]}
              onPress={handleAddPlayer}
              disabled={!nameInput.trim()}
            >
              <Text style={styles.addButtonText}>Agregar</Text>
            </TouchableOpacity>
          </View>

          {players.length > 0 ? (
            <View style={styles.playersListContainer}>
              <View style={styles.playersBadge}>
                <MaterialCommunityIcons
                  name="account-group"
                  size={13}
                  color={theme.colors.primary}
                />
                <Text style={styles.playersBadgeText}>
                  {players.length} jugador{players.length !== 1 ? 'es' : ''}
                </Text>
              </View>

              <ScrollView
                style={styles.playersListScroll}
                contentContainerStyle={styles.playersListContent}
                nestedScrollEnabled
                showsVerticalScrollIndicator
                keyboardShouldPersistTaps="handled"
              >
                {players.map((name, index) => (
                  <PlayerRow
                    key={`${name}-${index}`}
                    name={name}
                    onRemove={() => handleRemovePlayer(index)}
                  />
                ))}
              </ScrollView>
            </View>
          ) : (
            <Text style={styles.emptyHint}>Agregá al menos 2 jugadores para empezar</Text>
          )}

          {/* ── Puntaje objetivo (opcional) ── */}
          <View style={styles.targetSection}>
            <View style={styles.targetToggleRow}>
              <Text style={styles.targetToggleLabel}>¿Hay puntaje límite?</Text>
              <Switch
                value={hasTargetScore}
                onValueChange={setHasTargetScore}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primaryLight,
                }}
                thumbColor={hasTargetScore ? theme.colors.primary : theme.colors.surface}
              />
            </View>

            {hasTargetScore ? (
              <View style={styles.targetFields}>
                <Text style={styles.fieldLabel}>Puntaje límite</Text>
                <TextInput
                  style={[
                    styles.numericInput,
                    !isTargetScoreValid && targetScoreInput.length > 0 && styles.numericInputError,
                  ]}
                  value={targetScoreInput}
                  onChangeText={handleTargetScoreChange}
                  placeholder="Ej: 21"
                  placeholderTextColor={theme.colors.textDisabled}
                  keyboardType="number-pad"
                  maxLength={4}
                />

                <Text style={styles.fieldLabel}>Tipo de objetivo</Text>
                <View style={styles.typeToggle}>
                  <TouchableOpacity
                    style={[styles.typeTab, targetType === 'win' && styles.typeTabActive]}
                    onPress={() => setTargetType('win')}
                  >
                    <Text
                      style={[
                        styles.typeTabText,
                        targetType === 'win' && styles.typeTabTextActive,
                      ]}
                    >
                      Ganar al llegar a X
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeTab, targetType === 'lose' && styles.typeTabActive]}
                    onPress={() => setTargetType('lose')}
                  >
                    <Text
                      style={[
                        styles.typeTabText,
                        targetType === 'lose' && styles.typeTabTextActive,
                      ]}
                    >
                      Perder al llegar a X
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <AppButton label="Empezar" onPress={handleStart} disabled={!canStart} />
        </View>
      </KeyboardAvoidingView>

      <Toast
        message={toast?.message ?? ''}
        type={toast?.type ?? 'error'}
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
  headerRow: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
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
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    lineHeight: 20,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  addRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  nameInput: {
    flex: 1,
    height: theme.components.inputHeight,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: theme.components.inputBorderWidth,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textPrimary,
  },
  addButton: {
    height: theme.components.buttonHeight,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.surface,
  },
  playersListContainer: {
    marginTop: theme.spacing.md,
  },
  playersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
    marginBottom: theme.spacing.sm,
  },
  playersBadgeText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
  playersListScroll: {
    maxHeight: PLAYER_ROW_HEIGHT * 5 + theme.spacing.sm * 4,
    flexGrow: 0,
  },
  playersListContent: {
    gap: theme.spacing.sm,
  },
  playerRow: {
    minHeight: PLAYER_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: theme.components.borderWidth,
    borderColor: theme.colors.border,
  },
  playerName: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textPrimary,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  emptyHint: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: theme.spacing.sm,
  },
  targetSection: {
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    borderTopWidth: theme.components.borderWidth,
    borderTopColor: theme.colors.border,
  },
  targetToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  targetToggleLabel: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textPrimary,
    flex: 1,
    marginRight: theme.spacing.md,
  },
  targetFields: {
    gap: theme.spacing.md,
  },
  fieldLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
  },
  numericInput: {
    height: theme.components.inputHeight,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: theme.components.inputBorderWidth,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    width: 120,
    alignSelf: 'center',
  },
  numericInputError: {
    borderColor: theme.colors.error,
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xs,
    borderWidth: theme.components.borderWidth,
    borderColor: theme.colors.border,
  },
  typeTab: {
    flex: 1,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  typeTabActive: {
    backgroundColor: theme.colors.primary,
  },
  typeTabText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  typeTabTextActive: {
    color: theme.colors.surface,
    fontWeight: theme.typography.weights.semibold,
  },
  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: theme.components.borderWidth,
    borderTopColor: theme.colors.border,
  },
});

import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { theme } from '@/shared/constants/theme';
import { AppButton } from '@/shared/components/AppButton';
import { ErrorAnimation } from '@/shared/components/ErrorAnimation';
import { triggerSelectionHaptic } from '@/shared/utils/haptics';
import { impostorService } from '@/features/impostor/services/impostorService';

type NavProp = NativeStackNavigationProp<any, 'Raffle'>;
type RouteProps = RouteProp<any, 'Raffle'>;

export const RaffleScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const meetupId = route.params?.meetupId;

  const [options, setOptions] = useState<string[]>([]);
  const [optionInput, setOptionInput] = useState('');
  const [isRaffling, setIsRaffling] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [uniqueWinners, setUniqueWinners] = useState(false);

  // Lógica de animación
  const spinAnim = useRef(new Animated.Value(0)).current;
  const [animatedOptionName, setAnimatedOptionName] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!meetupId) return;

      const loadParticipants = async () => {
        const { data, error } = await impostorService.getParticipantsForGame(meetupId);
        if (error || !data) return;
        setOptions(data.map((p) => p.name));
      };

      void loadParticipants();
    }, [meetupId]),
  );

  const handleAddOption = () => {
    const trimmed = optionInput.trim();
    if (!trimmed) return;

    if (options.some((o) => o.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMessage('Esta opción ya está en la lista');
      setShowError(true);
      return;
    }

    void triggerSelectionHaptic();
    setOptions((prev) => [...prev, trimmed]);
    setOptionInput('');
  };

  const handleRemoveOption = (idx: number) => {
    void triggerSelectionHaptic();
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleLoadParticipants = async () => {
    if (!meetupId) return;
    void triggerSelectionHaptic();
    const { data, error } = await impostorService.getParticipantsForGame(meetupId);
    if (error || !data) {
      setErrorMessage(error ?? 'No se pudieron cargar los participantes');
      setShowError(true);
      return;
    }
    setOptions(data.map((p) => p.name));
  };

  const handleRaffle = () => {
    // Si excluimos repetidos, las opciones para sortear son las que no han ganado aún
    const availableOptions = uniqueWinners
      ? options.filter((opt) => !history.includes(opt))
      : options;

    if (availableOptions.length < 2) {
      setErrorMessage(
        uniqueWinners
          ? 'No quedan suficientes opciones sin repetir (mínimo 2)'
          : 'Debes agregar al menos 2 opciones para realizar el sorteo'
      );
      setShowError(true);
      return;
    }

    void triggerSelectionHaptic();
    setIsRaffling(true);
    setWinner(null);
    spinAnim.setValue(0);

    // Simular el suspenso de ruleta cambiando nombres
    let counter = 0;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * availableOptions.length);
      setAnimatedOptionName(availableOptions[randomIdx]);
      counter++;
    }, 80);

    // Duración de la animación: 1.6 segundos
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 1600,
      useNativeDriver: true,
    }).start(() => {
      clearInterval(interval);
      const finalWinnerIdx = Math.floor(Math.random() * availableOptions.length);
      const finalWinner = availableOptions[finalWinnerIdx];
      setWinner(finalWinner);
      setHistory((prev) => [finalWinner, ...prev]);
      setIsRaffling(false);
      void triggerSelectionHaptic();
    });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sorteador</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Zona de animación de la ruleta */}
          <View style={styles.raffleZone}>
            {isRaffling ? (
              <Animated.View
                style={[
                  styles.rouletteBox,
                  {
                    transform: [
                      {
                        scale: spinAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [1, 1.2, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.rouletteText}>{animatedOptionName}</Text>
              </Animated.View>
            ) : winner ? (
              <View style={styles.winnerBox}>
                <Text style={styles.winnerLabel}>¡GANADOR!</Text>
                <Text style={styles.winnerName}>{winner}</Text>
              </View>
            ) : (
              <View style={styles.idleBox}>
                <Text style={styles.idleText}>Completa las opciones y presiona Sortear</Text>
              </View>
            )}
          </View>

          {/* Setup de opciones */}
          <View style={styles.card}>
            <View style={styles.titleRow}>
              <Text style={styles.label}>Opciones a Sortear</Text>
              {meetupId && (
                <TouchableOpacity onPress={handleLoadParticipants}>
                  <Text style={styles.linkText}>Cargar participantes</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Excluir ganadores (sin repeticiones)</Text>
              <Switch
                value={uniqueWinners}
                onValueChange={(val) => {
                  void triggerSelectionHaptic();
                  setUniqueWinners(val);
                }}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={Platform.OS === 'android' ? theme.colors.surface : undefined}
              />
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={optionInput}
                onChangeText={setOptionInput}
                maxLength={30}
                placeholder="Escribe una opción"
                placeholderTextColor={theme.colors.textDisabled}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddOption}
                accessibilityRole="button"
                accessibilityLabel="Agregar opción"
              >
                <MaterialCommunityIcons name="plus" size={24} color={theme.colors.surface} />
              </TouchableOpacity>
            </View>

            {options.length === 0 ? (
              <Text style={styles.emptyText}>No hay opciones en la lista.</Text>
            ) : (
              <View style={styles.list}>
                {options.map((opt, idx) => (
                  <View key={`opt-${idx}`} style={styles.optionRow}>
                    <Text style={styles.optionName}>{opt}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveOption(idx)}
                      accessibilityRole="button"
                      accessibilityLabel={`Eliminar ${opt}`}
                    >
                      <MaterialCommunityIcons name="delete" size={20} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Historial */}
          {history.length > 0 && (
            <View style={[styles.card, { marginTop: theme.spacing.md }]}>
              <Text style={styles.label}>Ganadores Anteriores</Text>
              <View style={styles.historyList}>
                {history.map((h, i) => (
                  <View key={`hist-${i}`} style={styles.historyRow}>
                    <MaterialCommunityIcons name="trophy-outline" size={18} color={theme.colors.warning} />
                    <Text style={styles.historyName}>{h}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <AppButton
            label={isRaffling ? 'Sorteando...' : 'Sortear'}
            onPress={handleRaffle}
            isLoading={isRaffling}
          />
        </View>
      </KeyboardAvoidingView>

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
  keyboard: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  raffleZone: {
    height: 140,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
    padding: theme.spacing.md,
  },
  rouletteBox: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
  },
  rouletteText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  winnerBox: {
    alignItems: 'center',
  },
  winnerLabel: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.success,
    letterSpacing: 2,
    marginBottom: theme.spacing.xs,
  },
  winnerName: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  idleBox: {
    alignItems: 'center',
  },
  idleText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  linkText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  switchLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  inputRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  input: {
    flex: 1,
    height: theme.components.inputHeight,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    borderWidth: theme.components.inputBorderWidth,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textPrimary,
  },
  addButton: {
    width: theme.components.buttonHeight,
    height: theme.components.buttonHeight,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: theme.spacing.md,
  },
  list: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.sm,
  },
  optionName: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textPrimary,
  },
  historyList: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  historyName: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
  },
  footer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});

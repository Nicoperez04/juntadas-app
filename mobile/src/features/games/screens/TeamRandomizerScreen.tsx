/**
 * Pantalla de equipos aleatorios con flujo de dos pasos:
 * configuración de nombres y modo de división, luego resultado con opciones
 * de mezclar, copiar o volver a configurar.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '@/shared/constants/theme';
import { AppButton } from '@/shared/components/AppButton';
import { Toast } from '@/shared/components/Toast';
import { triggerSelectionHaptic, triggerSuccessHaptic } from '@/shared/utils/haptics';
import type { MainStackParamList } from '@/navigation/types';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'TeamRandomizer'>;

/**
 * Altura visible de la lista de participantes: exactamente 2 chips.
 * A partir del tercero la lista scrollea sin empujar el resto del formulario.
 */
const NAME_CHIP_HEIGHT = 46;
const NAMES_LIST_MAX_HEIGHT = NAME_CHIP_HEIGHT * 2 + theme.spacing.sm;

/** Paso actual del flujo interno */
type Step = 'config' | 'result';

/** Modo de división: por cantidad de equipos o por personas por equipo */
type DivisionMode = 'teamCount' | 'peoplePerTeam';

/** Equipo formado con nombre e integrantes */
interface Team {
  name: string;
  members: string[];
}

/**
 * Mezcla un array con el algoritmo Fisher-Yates.
 * Retorna una copia nueva para no mutar el original.
 */
const shuffleArray = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/**
 * Modo "cantidad de equipos": distribuye N personas en K equipos de forma
 * uniforme. Los sobrantes van al primer equipo de a uno.
 */
const distributeByTeamCount = (names: string[], numTeams: number): Team[] => {
  const shuffled = shuffleArray(names);
  const safeCount = Math.max(1, Math.min(numTeams, shuffled.length));
  const baseSize = Math.floor(shuffled.length / safeCount);
  const remainder = shuffled.length % safeCount;

  const teams: Team[] = [];
  let index = 0;

  for (let i = 0; i < safeCount; i += 1) {
    const size = baseSize + (i < remainder ? 1 : 0);
    teams.push({ name: `Equipo ${i + 1}`, members: shuffled.slice(index, index + size) });
    index += size;
  }

  return teams;
};

/**
 * Modo "personas por equipo": llena cada equipo con exactamente `perTeam`
 * personas. El último equipo lleva el sobrante si la división no es exacta.
 *
 * Ejemplo: 4 personas, 3 por equipo → Equipo 1: [A,B,C] · Equipo 2: [D]
 */
const distributeByPeoplePerTeam = (names: string[], perTeam: number): Team[] => {
  const shuffled = shuffleArray(names);
  const teams: Team[] = [];
  const safePerTeam = Math.max(1, perTeam);

  for (let i = 0; i < shuffled.length; i += safePerTeam) {
    teams.push({
      name: `Equipo ${teams.length + 1}`,
      members: shuffled.slice(i, i + safePerTeam),
    });
  }

  return teams;
};

/** Resultado de validar la configuración antes de formar equipos */
interface DivisionValidation {
  valid: boolean;
  error?: string;
  /** Valor numérico ya parseado (teams en teamCount, perTeam en peoplePerTeam) */
  effectiveValue?: number;
  /** Cantidad de equipos resultante — para mostrar preview */
  effectiveTeamCount?: number;
}

/**
 * Valida la configuración de división según participantes y modo.
 * Falla explícitamente cuando la configuración es incoherente con los datos.
 */
const validateAndResolveDivision = (
  mode: DivisionMode,
  rawValue: string,
  nameCount: number,
): DivisionValidation => {
  const trimmed = rawValue.trim();

  if (!trimmed) {
    return { valid: false, error: 'Ingresá un número' };
  }

  const value = parseInt(trimmed, 10);
  if (Number.isNaN(value) || value < 1) {
    return { valid: false, error: 'El valor debe ser al menos 1' };
  }

  if (mode === 'teamCount') {
    if (value > nameCount) {
      return {
        valid: false,
        error: `Con ${nameCount} participantes podés formar hasta ${nameCount} equipos`,
      };
    }
    return { valid: true, effectiveValue: value, effectiveTeamCount: value };
  }

  // Personas por equipo: calcula la cantidad de equipos resultante
  const teamCount = Math.ceil(nameCount / value);
  return { valid: true, effectiveValue: value, effectiveTeamCount: teamCount };
};

/** Texto descriptivo de la distribución esperada (para mostrar al usuario) */
const getDivisionPreviewText = (
  mode: DivisionMode,
  validation: DivisionValidation,
  nameCount: number,
): string => {
  if (!validation.valid || validation.effectiveTeamCount === undefined) {
    return validation.error ?? '';
  }

  const { effectiveTeamCount, effectiveValue } = validation;

  if (mode === 'teamCount') {
    const baseSize = Math.floor(nameCount / effectiveTeamCount);
    const remainder = nameCount % effectiveTeamCount;

    if (remainder === 0) {
      return `Se formarán ${effectiveTeamCount} equipos de ${baseSize} personas`;
    }

    return `Se formarán ${effectiveTeamCount} equipos (${remainder} de ${baseSize + 1} y ${effectiveTeamCount - remainder} de ${baseSize})`;
  }

  // Personas por equipo
  const lastTeamSize = nameCount % (effectiveValue ?? 1);

  if (lastTeamSize === 0) {
    return `Se formarán ${effectiveTeamCount} equipos de ${effectiveValue} personas`;
  }

  const fullTeams = effectiveTeamCount - 1;
  if (fullTeams === 0) {
    return `Se formará 1 equipo de ${nameCount} personas`;
  }

  return `Se formarán ${effectiveTeamCount} equipos (${fullTeams} de ${effectiveValue} y 1 de ${lastTeamSize})`;
};

/** Formatea los equipos en texto plano para el portapapeles */
const formatTeamsForClipboard = (teams: Team[]): string =>
  teams.map((t) => `${t.name}: ${t.members.join(', ')}`).join('\n');

export const TeamRandomizerScreen = () => {
  const navigation = useNavigation<NavProp>();

  const [step, setStep] = useState<Step>('config');
  const [names, setNames] = useState<string[]>([]);
  const [nameInput, setNameInput] = useState('');
  const [divisionMode, setDivisionMode] = useState<DivisionMode>('teamCount');
  const [divisionValue, setDivisionValue] = useState('2');
  const [teams, setTeams] = useState<Team[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  /**
   * Transición limpia entre pasos: fade out → aplica el nuevo estado en el
   * siguiente frame de animación para no trabarse → fade in.
   * El backgroundColor explícito en el Animated.View evita el flash gris.
   */
  const animateStepTransition = useCallback(
    (applyState: () => void) => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        // Diferimos el setState al siguiente frame para no interferir con el
        // hilo de animación nativo al arrancar la segunda mitad.
        requestAnimationFrame(() => {
          applyState();
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 220,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }).start();
        });
      });
    },
    [fadeAnim],
  );

  /** Agrega un nombre si no está vacío ni duplicado */
  const handleAddName = useCallback(() => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;

    if (names.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
      setToast({ message: 'Ese nombre ya está en la lista', type: 'error' });
      return;
    }

    void triggerSelectionHaptic();
    setNames((prev) => [...prev, trimmed]);
    setNameInput('');
  }, [nameInput, names]);

  /** Quita un nombre por índice */
  const handleRemoveName = useCallback((index: number) => {
    void triggerSelectionHaptic();
    setNames((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /** Calcula y forma los equipos según el modo y valor configurados */
  const buildTeams = useCallback(
    (currentNames: string[]): Team[] | null => {
      const validation = validateAndResolveDivision(
        divisionMode,
        divisionValue,
        currentNames.length,
      );

      if (!validation.valid || validation.effectiveValue === undefined) {
        setToast({ message: validation.error ?? 'Configuración inválida', type: 'error' });
        return null;
      }

      if (divisionMode === 'peoplePerTeam') {
        return distributeByPeoplePerTeam(currentNames, validation.effectiveValue);
      }

      return distributeByTeamCount(currentNames, validation.effectiveValue);
    },
    [divisionMode, divisionValue],
  );

  /** Avanza al paso de resultado */
  const handleFormTeams = useCallback(() => {
    if (names.length < 2) return;
    const formed = buildTeams(names);
    if (!formed) return;

    void triggerSelectionHaptic();
    animateStepTransition(() => {
      setTeams(formed);
      setStep('result');
    });
  }, [names, buildTeams, animateStepTransition]);

  /** Redistribuye aleatoriamente con la misma configuración */
  const handleRemix = useCallback(() => {
    const formed = buildTeams(names);
    if (!formed) return;

    void triggerSelectionHaptic();
    animateStepTransition(() => {
      setTeams(formed);
    });
  }, [names, buildTeams, animateStepTransition]);

  /** Copia el resultado al portapapeles */
  const handleCopyTeams = useCallback(async () => {
    await Clipboard.setStringAsync(formatTeamsForClipboard(teams));
    void triggerSuccessHaptic();
    setToast({ message: 'Equipos copiados', type: 'success' });
  }, [teams]);

  /** Vuelve al paso de configuración */
  const handleBackToConfig = useCallback(() => {
    void triggerSelectionHaptic();
    animateStepTransition(() => {
      setStep('config');
    });
  }, [animateStepTransition]);

  const divisionValidation =
    names.length >= 2
      ? validateAndResolveDivision(divisionMode, divisionValue, names.length)
      : { valid: false as const };

  const divisionPreviewText =
    names.length >= 2
      ? getDivisionPreviewText(divisionMode, divisionValidation, names.length)
      : '';

  const canFormTeams = names.length >= 2 && divisionValidation.valid;
  const showScrollHint = names.length > 2;

  useEffect(() => {
    fadeAnim.setValue(1);
  }, [fadeAnim]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Equipos aleatorios</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/*
         * backgroundColor explícito: evita que cuando opacity llega a 0 se
         * vea el fondo gris del layout subyacente.
         */}
        <Animated.View style={[styles.flex, styles.animatedContainer, { opacity: fadeAnim }]}>
          {step === 'config' ? (
            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.configContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* ── Participantes ── */}
              <Text style={styles.sectionTitle}>Participantes</Text>

              <View style={styles.addNameRow}>
                <TextInput
                  style={styles.nameInput}
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="Nombre del participante"
                  placeholderTextColor={theme.colors.textDisabled}
                  onSubmitEditing={handleAddName}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={[styles.addButton, !nameInput.trim() && styles.addButtonDisabled]}
                  onPress={handleAddName}
                  disabled={!nameInput.trim()}
                >
                  <Text style={styles.addButtonText}>Agregar</Text>
                </TouchableOpacity>
              </View>

              {names.length > 0 ? (
                <View>
                  {/* Badge con el conteo — siempre visible, indica scroll cuando hay 3+ */}
                  <View style={styles.namesHeader}>
                    <View style={styles.namesBadge}>
                      <Ionicons name="people" size={13} color={theme.colors.primary} />
                      <Text style={styles.namesBadgeText}>
                        {names.length} participante{names.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    {showScrollHint ? (
                      <Text style={styles.scrollHint}>deslizá para ver todos</Text>
                    ) : null}
                  </View>

                  {/* Lista con altura fija y scrollbar siempre visible */}
                  <ScrollView
                    style={styles.namesListScroll}
                    contentContainerStyle={styles.namesListContent}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                    scrollIndicatorInsets={{ right: 2 }}
                    persistentScrollbar
                    keyboardShouldPersistTaps="handled"
                  >
                    {names.map((name, index) => (
                      <View key={`${name}-${index}`} style={styles.nameChip}>
                        <Text style={styles.nameChipText} numberOfLines={1}>
                          {name}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveName(index)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons
                            name="close-circle"
                            size={22}
                            color={theme.colors.textSecondary}
                          />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ) : (
                <Text style={styles.emptyHint}>Agregá al menos 2 nombres para formar equipos</Text>
              )}

              {/* ── Modo de división ── */}
              <Text style={styles.sectionTitle}>Modo de división</Text>
              <View style={styles.modeToggle}>
                <TouchableOpacity
                  style={[styles.modeTab, divisionMode === 'teamCount' && styles.modeTabActive]}
                  onPress={() => setDivisionMode('teamCount')}
                >
                  <Text
                    style={[
                      styles.modeTabText,
                      divisionMode === 'teamCount' && styles.modeTabTextActive,
                    ]}
                  >
                    Cantidad de equipos
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modeTab,
                    divisionMode === 'peoplePerTeam' && styles.modeTabActive,
                  ]}
                  onPress={() => setDivisionMode('peoplePerTeam')}
                >
                  <Text
                    style={[
                      styles.modeTabText,
                      divisionMode === 'peoplePerTeam' && styles.modeTabTextActive,
                    ]}
                  >
                    Personas por equipo
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.valueLabel}>
                {divisionMode === 'teamCount'
                  ? '¿Cuántos equipos?'
                  : '¿Cuántas personas por equipo?'}
              </Text>
              <TextInput
                style={[
                  styles.numericInput,
                  !divisionValidation.valid &&
                    names.length >= 2 &&
                    divisionValue.length > 0 &&
                    styles.numericInputError,
                ]}
                value={divisionValue}
                onChangeText={(text) => setDivisionValue(text.replace(/\D/g, ''))}
                placeholder="2"
                placeholderTextColor={theme.colors.textDisabled}
                keyboardType="number-pad"
                maxLength={3}
              />

              {names.length >= 2 && divisionPreviewText ? (
                <Text
                  style={[
                    styles.previewText,
                    !divisionValidation.valid && styles.previewTextError,
                  ]}
                >
                  {divisionPreviewText}
                </Text>
              ) : null}

              <AppButton
                label="Formar equipos"
                onPress={handleFormTeams}
                disabled={!canFormTeams}
              />
            </ScrollView>
          ) : (
            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.resultContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.resultTitle}>Equipos formados</Text>

              {teams.map((team) => (
                <View key={team.name} style={styles.teamCard}>
                  <Text style={styles.teamCardTitle}>{team.name}</Text>
                  {team.members.map((member) => (
                    <View key={`${team.name}-${member}`} style={styles.memberRow}>
                      <View style={styles.memberDot} />
                      <Text style={styles.memberName}>{member}</Text>
                    </View>
                  ))}
                </View>
              ))}

              <View style={styles.resultActions}>
                <AppButton label="Mezclar de nuevo" onPress={handleRemix} />
                <AppButton
                  label="Copiar equipos"
                  variant="ghost"
                  onPress={() => void handleCopyTeams()}
                />
                <AppButton
                  label="Volver a configurar"
                  variant="ghost"
                  onPress={handleBackToConfig}
                />
              </View>
            </ScrollView>
          )}
        </Animated.View>
      </KeyboardAvoidingView>

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
  safeArea: {
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  /**
   * Fondo explícito para que al llegar a opacity 0 el Animated.View no deje
   * ver el fondo gris de los contenedores subyacentes.
   */
  animatedContainer: {
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  configContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.sm,
  },
  addNameRow: {
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
  namesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  namesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
  },
  namesBadgeText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
  scrollHint: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textDisabled,
  },
  namesListScroll: {
    maxHeight: NAMES_LIST_MAX_HEIGHT,
    flexGrow: 0,
  },
  namesListContent: {
    gap: theme.spacing.sm,
  },
  nameChip: {
    minHeight: NAME_CHIP_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    borderWidth: theme.components.borderWidth,
    borderColor: theme.colors.border,
  },
  nameChipText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textPrimary,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  emptyHint: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xs,
    borderWidth: theme.components.borderWidth,
    borderColor: theme.colors.border,
  },
  modeTab: {
    flex: 1,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: theme.colors.primary,
  },
  modeTabText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  modeTabTextActive: {
    color: theme.colors.surface,
    fontWeight: theme.typography.weights.semibold,
  },
  valueLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textPrimary,
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
    width: 100,
    alignSelf: 'center',
  },
  numericInputError: {
    borderColor: theme.colors.error,
  },
  previewText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  previewTextError: {
    color: theme.colors.error,
  },
  resultContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  resultTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  teamCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: theme.components.borderWidth,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
    gap: theme.spacing.sm,
  },
  teamCardTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  memberDot: {
    width: 6,
    height: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.secondary,
  },
  memberName: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textPrimary,
  },
  resultActions: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
});

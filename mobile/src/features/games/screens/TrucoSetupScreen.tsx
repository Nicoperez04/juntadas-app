import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
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
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { theme } from '@/shared/constants/theme';
import { Routes } from '@/navigation/routes';
import type { MainStackParamList } from '@/navigation/types';
import { AppButton } from '@/shared/components/AppButton';
import { ErrorAnimation } from '@/shared/components/ErrorAnimation';
import { triggerSelectionHaptic } from '@/shared/utils/haptics';
import { impostorService } from '@/features/impostor/services/impostorService';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'TrucoSetup'>;
type RouteProps = RouteProp<MainStackParamList, 'TrucoSetup'>;

export const TrucoSetupScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const meetupId = route.params?.meetupId;

  const [teamA, setTeamA] = useState('Nosotros');
  const [teamB, setTeamB] = useState('Ellos');
  const [targetPoints, setTargetPoints] = useState<15 | 30>(30);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!meetupId) return;

      const loadDefaultNames = async () => {
        const { data, error } = await impostorService.getParticipantsForGame(meetupId);
        if (error || !data || data.length === 0) return;

        // Si hay participantes confirmados, sugerimos nombres con el creador y otro participante
        if (data.length >= 2) {
          setTeamA(data[0].name);
          setTeamB(data[1].name);
        }
      };

      void loadDefaultNames();
    }, [meetupId]),
  );

  const handleStart = () => {
    const cleanA = teamA.trim();
    const cleanB = teamB.trim();

    if (!cleanA || !cleanB) {
      setErrorMessage('Los nombres de los equipos no pueden estar vacíos');
      setShowError(true);
      return;
    }

    if (cleanA.toLowerCase() === cleanB.toLowerCase()) {
      setErrorMessage('Los equipos no pueden llamarse igual');
      setShowError(true);
      return;
    }

    void triggerSelectionHaptic();
    navigation.navigate(Routes.TrucoGame, {
      teamAName: cleanA,
      teamBName: cleanB,
      targetPoints,
      meetupId,
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
          <Text style={styles.headerTitle}>Configuración de Truco</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.label}>Equipo / Pareja / Jugador 1</Text>
            <TextInput
              style={styles.input}
              value={teamA}
              onChangeText={setTeamA}
              maxLength={20}
              placeholder="Ej: Nosotros"
              placeholderTextColor={theme.colors.textDisabled}
            />

            <Text style={styles.label}>Equipo / Pareja / Jugador 2</Text>
            <TextInput
              style={styles.input}
              value={teamB}
              onChangeText={setTeamB}
              maxLength={20}
              placeholder="Ej: Ellos"
              placeholderTextColor={theme.colors.textDisabled}
            />

            <Text style={styles.label}>¿A cuántos puntos jugamos?</Text>
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  targetPoints === 15 && styles.optionButtonActive,
                ]}
                onPress={() => {
                  void triggerSelectionHaptic();
                  setTargetPoints(15);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    targetPoints === 15 && styles.optionTextActive,
                  ]}
                >
                  15 Puntos
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  targetPoints === 30 && styles.optionButtonActive,
                ]}
                onPress={() => {
                  void triggerSelectionHaptic();
                  setTargetPoints(30);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    targetPoints === 30 && styles.optionTextActive,
                  ]}
                >
                  30 Puntos
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <AppButton label="Empezar Partida" onPress={handleStart} />
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
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
    gap: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xs,
  },
  input: {
    height: theme.components.inputHeight,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    borderWidth: theme.components.inputBorderWidth,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textPrimary,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  optionButton: {
    flex: 1,
    height: theme.components.buttonHeight,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
    borderWidth: theme.components.inputBorderWidth,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  optionText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
  },
  optionTextActive: {
    color: theme.colors.primary,
  },
  footer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});

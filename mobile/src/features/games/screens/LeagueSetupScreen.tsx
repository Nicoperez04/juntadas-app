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

type NavProp = NativeStackNavigationProp<MainStackParamList, 'LeagueSetup'>;
type RouteProps = RouteProp<MainStackParamList, 'LeagueSetup'>;

export const LeagueSetupScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const meetupId = route.params?.meetupId;

  const [teams, setTeams] = useState<string[]>([]);
  const [teamInput, setTeamInput] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!meetupId) return;

      const loadParticipants = async () => {
        const { data, error } = await impostorService.getParticipantsForGame(meetupId);
        if (error || !data) return;
        setTeams(data.map((p) => p.name));
      };

      void loadParticipants();
    }, [meetupId]),
  );

  const handleAddTeam = () => {
    const trimmed = teamInput.trim();
    if (!trimmed) return;

    if (teams.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMessage('Este participante/equipo ya está en la lista');
      setShowError(true);
      return;
    }

    void triggerSelectionHaptic();
    setTeams((prev) => [...prev, trimmed]);
    setTeamInput('');
  };

  const handleRemoveTeam = (idx: number) => {
    void triggerSelectionHaptic();
    setTeams((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleStart = () => {
    if (teams.length < 3) {
      setErrorMessage('Debes agregar al menos 3 participantes/equipos para armar la liga');
      setShowError(true);
      return;
    }

    void triggerSelectionHaptic();
    navigation.navigate(Routes.LeagueGame, {
      teams,
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
          <Text style={styles.headerTitle}>Nuevo Generador de Ligas</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.label}>Nuevo Participante / Equipo</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={teamInput}
                onChangeText={setTeamInput}
                maxLength={20}
                placeholder="Nombre del participante"
                placeholderTextColor={theme.colors.textDisabled}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddTeam}
                accessibilityRole="button"
                accessibilityLabel="Agregar"
              >
                <MaterialCommunityIcons name="plus" size={24} color={theme.colors.surface} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { marginTop: theme.spacing.md }]}>Lista de Participantes</Text>
            {teams.length === 0 ? (
              <Text style={styles.emptyText}>No hay participantes agregados.</Text>
            ) : (
              <View style={styles.list}>
                {teams.map((name, idx) => (
                  <View key={`team-${idx}`} style={styles.teamRow}>
                    <Text style={styles.teamName}>{name}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveTeam(idx)}
                      accessibilityRole="button"
                      accessibilityLabel={`Eliminar a ${name}`}
                    >
                      <MaterialCommunityIcons name="delete" size={20} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <AppButton label="Generar Fixture" onPress={handleStart} />
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
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
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
    marginTop: theme.spacing.xs,
  },
  list: {
    marginTop: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.sm,
  },
  teamName: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textPrimary,
  },
  footer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});

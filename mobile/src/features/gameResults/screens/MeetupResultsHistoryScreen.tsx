import React from 'react';
import {
  ActivityIndicator,
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
import { AppButton } from '@/shared/components/AppButton';
import { theme } from '@/shared/constants/theme';
import type { MainStackParamList } from '@/navigation/types';
import { GameResultCard } from '../components/GameResultCard';
import { useGameResults } from '../hooks/useGameResults';

type NavProp = NativeStackNavigationProp<
  MainStackParamList,
  'MeetupResultsHistory'
>;
type RouteProps = RouteProp<MainStackParamList, 'MeetupResultsHistory'>;

export const MeetupResultsHistoryScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { meetupId, meetupTitle } = route.params;

  const { stats, isLoading, error, refresh } = useGameResults(meetupId);
  const results = stats?.results ?? [];

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={theme.colors.textPrimary}
          />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Historial de resultados</Text>
          {meetupTitle ? (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {meetupTitle}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={() => void refresh()}
          accessibilityRole="button"
          accessibilityLabel="Actualizar"
        >
          <MaterialCommunityIcons
            name="refresh"
            size={22}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {isLoading && !stats ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={styles.stateText}>Cargando resultados...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={40}
            color={theme.colors.error}
          />
          <Text style={styles.stateTitle}>No se pudieron cargar</Text>
          <Text style={styles.stateText}>{error}</Text>
          <AppButton label="Reintentar" onPress={() => void refresh()} />
        </View>
      ) : results.length === 0 ? (
        <View style={styles.centerState}>
          <MaterialCommunityIcons
            name="clipboard-text-clock-outline"
            size={44}
            color={theme.colors.primary}
          />
          <Text style={styles.stateTitle}>Todavia no hay resultados</Text>
          <Text style={styles.stateText}>
            Los resultados guardados desde los juegos apareceran aca.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {results.map((result) => (
            <GameResultCard key={result.id} result={result} />
          ))}
        </ScrollView>
      )}
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
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerText: {
    flex: 1,
    marginHorizontal: theme.spacing.md,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  scroll: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  stateTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  stateText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

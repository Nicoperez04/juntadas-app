/**
 * Pantalla hub de juegos — accesible desde el tab bar sin meetupId.
 *
 * Presenta Impostor como juego disponible y anticipa futuros títulos
 * con una card deshabilitada de "próximamente".
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '@/shared/constants/theme';
import { Routes } from '@/navigation/routes';
import { AppButton } from '@/shared/components/AppButton';
import { triggerSelectionHaptic } from '@/shared/utils/haptics';
import type { MainStackParamList } from '@/navigation/types';
import { ImpostorTabBar } from '../components/ImpostorTabBar';
import { impostorColors } from '../constants/impostorTheme';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'Games'>;

export const GamesScreen = () => {
  const navigation = useNavigation<NavProp>();

  const handlePlayImpostor = () => {
    void triggerSelectionHaptic();
    navigation.navigate(Routes.ImpostorStart, {});
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.topSafe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Juegos</Text>
          <Text style={styles.headerSubtitle}>
            Elegí un juego para jugar con amigos
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card protagonista — Impostor con gradiente violeta simulado */}
        <View style={styles.heroWrapper}>
          <View style={styles.heroGradientBase} />
          <View style={styles.heroGradientOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.heroTopRow}>
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>POPULAR</Text>
              </View>
              <Ionicons name="sparkles" size={20} color={theme.colors.secondary} />
            </View>

            <View style={styles.heroIconCircle}>
              <Ionicons name="eye-off" size={36} color={theme.colors.surface} />
            </View>

            <Text style={styles.heroTitle}>Impostor</Text>
            <Text style={styles.heroDescription}>
              Un jugador no conoce la palabra secreta. Pasá el teléfono, revelá roles
              en privado y descubrí quién está improvisando.
            </Text>

            <AppButton label="Jugar ahora" onPress={handlePlayImpostor} />
          </View>
        </View>

        {/* Sección próximamente */}
        <Text style={styles.sectionTitle}>Más juegos próximamente</Text>

        <View style={styles.comingSoonCard}>
          <View style={styles.comingSoonIcon}>
            <Ionicons
              name="lock-closed-outline"
              size={28}
              color={theme.colors.textDisabled}
            />
          </View>
          <View style={styles.comingSoonTextBlock}>
            <Text style={styles.comingSoonTitle}>Nuevos juegos en camino</Text>
            <Text style={styles.comingSoonSubtitle}>
              Estamos preparando más diversión para tus juntadas
            </Text>
          </View>
        </View>
      </ScrollView>

      <ImpostorTabBar activeTabId="games" />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topSafe: {
    backgroundColor: theme.colors.background,
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
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  heroWrapper: {
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    minHeight: 320,
    ...theme.shadows.md,
  },
  heroGradientBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: impostorColors.heroDark,
  },
  heroGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: impostorColors.heroMid,
    opacity: 0.45,
  },
  heroContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  heroTopRow: {
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
  heroIconCircle: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: theme.spacing.sm,
  },
  heroTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.surface,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primaryLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  comingSoonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    opacity: 0.65,
    borderWidth: theme.components.borderWidth,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  comingSoonIcon: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonTextBlock: {
    flex: 1,
  },
  comingSoonTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
  },
  comingSoonSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textDisabled,
    marginTop: theme.spacing.xs,
  },
});

/**
 * Pantalla placeholder genérica para secciones de grupo todavía no
 * implementadas ("Juntadas" y "Multimedia" del detalle de grupo).
 *
 * No existía un patrón de pantalla "próximamente" en el proyecto — el más
 * cercano es el badge "Próximamente" de GamesScreen para cards no
 * disponibles, cuyo copy se reutiliza acá para mantener el mismo tono.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { theme } from '@/shared/constants/theme';
import { AppTabBar } from '@/shared/components/AppTabBar';
import type { MainStackParamList } from '@/navigation/types';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'GroupPlaceholder'>;
type RoutePropType = RouteProp<MainStackParamList, 'GroupPlaceholder'>;

const SECTION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Juntadas: 'game-controller-outline',
  Multimedia: 'camera-outline',
};

export const GroupPlaceholderScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { section } = route.params;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{section}</Text>
          <View style={styles.headerPlaceholder} />
        </View>
      </SafeAreaView>

      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <Ionicons
            name={SECTION_ICONS[section] ?? 'time-outline'}
            size={56}
            color={theme.colors.primary}
          />
        </View>
        <Text style={styles.title}>Próximamente</Text>
        <Text style={styles.subtitle}>
          Esta sección estará disponible próximamente.
        </Text>
      </View>

      <AppTabBar activeTab="home" />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    minWidth: 48,
    minHeight: 48,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  headerPlaceholder: {
    width: 48,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

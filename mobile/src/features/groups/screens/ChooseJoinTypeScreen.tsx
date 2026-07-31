/**
 * Pantalla intermedia del tab "Unirse": elegir si el usuario quiere unirse
 * a una juntada o a un grupo, antes de llegar a JoinMeetupScreen o
 * JoinGroupScreen. Reemplaza el destino directo que tenía el tab "Unirse"
 * (antes iba directo a JoinMeetup); JoinMeetupScreen no se modifica.
 *
 * Sin botón de "volver": es un destino raíz del tab bar, igual que
 * MeetupHomeScreen para el tab "Inicio".
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '@/shared/constants/theme';
import { Routes } from '@/navigation/routes';
import { AppTabBar } from '@/shared/components/AppTabBar';
import type { MainStackParamList } from '@/navigation/types';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'ChooseJoinType'>;

export const ChooseJoinTypeScreen = () => {
  const navigation = useNavigation<NavProp>();

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Unirse</Text>
        </View>
      </SafeAreaView>

      <View style={styles.content}>
        <View style={styles.illustrationCircle}>
          <Ionicons name="enter" size={40} color={theme.colors.primary} />
        </View>
        <Text style={styles.title}>¿A qué te querés unir?</Text>
        <Text style={styles.subtitle}>Elegí una opción para continuar</Text>

        <Pressable
          style={({ pressed }) => [
            styles.optionCard,
            styles.optionCardMeetup,
            pressed && styles.optionCardPressed,
          ]}
          onPress={() => navigation.navigate(Routes.JoinMeetup)}
        >
          <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
          <Text style={[styles.optionText, { color: theme.colors.primary }]}>
            Unirse a una Juntada
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.optionCard,
            styles.optionCardGroup,
            pressed && styles.optionCardPressed,
          ]}
          onPress={() => navigation.navigate(Routes.JoinGroup)}
        >
          <Ionicons name="person-add-outline" size={24} color={theme.colors.info} />
          <Text style={[styles.optionText, { color: theme.colors.info }]}>
            Unirse a un Grupo
          </Text>
        </Pressable>
      </View>

      <AppTabBar activeTab="join" />
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  illustrationCircle: {
    width: 80,
    height: 80,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  optionCard: {
    width: '100%',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  optionCardMeetup: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: '#EDE9FE',
  },
  optionCardGroup: {
    backgroundColor: theme.colors.infoLight,
    borderColor: '#DBEAFE',
  },
  optionCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  optionText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
  },
});

/**
 * Listado de juntadas activas de un grupo.
 *
 * Reemplaza el placeholder "Próximamente" de la card "Juntadas" en
 * GroupDetailScreen (4.3) con el listado real (4.4b). Reusa MeetupCard
 * (extraído de MeetupHomeScreen a un componente compartido en este mismo
 * prompt) para mantener el mismo criterio visual que el listado de
 * juntadas propias.
 *
 * Solo muestra juntadas activas — ver groupService.getGroupMeetups para
 * el detalle de por qué (policy RLS existente, sin necesidad de RLS
 * nueva) y la limitación conocida y reportada (miembros que se unen al
 * grupo después de que una juntada terminó/fue cancelada no la ven acá).
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { theme } from '@/shared/constants/theme';
import { Routes } from '@/navigation/routes';
import { AppButton } from '@/shared/components/AppButton';
import { AppTabBar } from '@/shared/components/AppTabBar';
import { MeetupCard } from '@/features/meetups/components/MeetupCard';
import { MeetupCardSkeleton } from '@/features/meetups/components/MeetupCardSkeleton';
import { useGroupMeetups } from '../hooks/useGroupMeetups';
import type { MainStackParamList } from '@/navigation/types';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'GroupMeetups'>;
type RoutePropType = RouteProp<MainStackParamList, 'GroupMeetups'>;

export const GroupMeetupsScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { groupId, groupName } = route.params ?? {};

  const { meetups, isLoading, error, refresh } = useGroupMeetups(groupId);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const goToCreateMeetup = () =>
    navigation.navigate(Routes.CreateMeetup, { groupId, groupName });

  const showSkeleton = isLoading && meetups.length === 0;

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
          <Text style={styles.headerTitle}>Juntadas</Text>
          <View style={styles.headerPlaceholder} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={40} color={theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => void refresh()} activeOpacity={0.7}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : showSkeleton ? (
          <>
            <MeetupCardSkeleton />
            <MeetupCardSkeleton />
          </>
        ) : meetups.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrapper}>
              <Ionicons name="calendar-outline" size={48} color={theme.colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>
              Este grupo todavía no tiene juntadas
            </Text>
            <Text style={styles.emptySubtitle}>
              Creá la primera e invitá a todo el grupo automáticamente.
            </Text>
            <View style={styles.emptyButtonWrapper}>
              <AppButton label="+ Crear juntada" onPress={goToCreateMeetup} />
            </View>
          </View>
        ) : (
          meetups.map((meetup) => (
            <MeetupCard
              key={meetup.id}
              meetup={meetup}
              onPress={() =>
                navigation.navigate(Routes.MeetupDetail, { meetupId: meetup.id })
              }
            />
          ))
        )}
      </ScrollView>

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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  errorBox: {
    alignItems: 'center',
    paddingTop: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  errorText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  retryText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  emptyIconWrapper: {
    width: 88,
    height: 88,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  emptyTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  emptyButtonWrapper: {
    width: '100%',
    paddingHorizontal: theme.spacing.lg,
  },
});

/**
 * Pantalla "Mis grupos" — lista los grupos donde el usuario tiene
 * membresía activa, con acciones rápidas para crear o unirse a uno nuevo.
 *
 * Se llega acá desde la card "Tus grupos" en MeetupHomeScreen; el tab bar
 * inferior mantiene "Inicio" activo porque, a diferencia de juntadas,
 * grupos no tiene un tab propio en el bottom nav (así lo define el mockup
 * de Figma "Mis grupos").
 *
 * Las cards de grupo no son interactivas todavía: la pantalla de detalle
 * de grupo es del sub-bloque 4.3, fuera de este alcance.
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '@/shared/constants/theme';
import { Routes } from '@/navigation/routes';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { AppTabBar } from '@/shared/components/AppTabBar';
import { useGroups } from '../hooks/useGroups';
import { GroupCardSkeleton } from '../components/GroupCardSkeleton';
import type { GroupWithRole, GroupRole } from '../types';
import type { MainStackParamList } from '@/navigation/types';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'GroupHome'>;

/** Paleta de colores para los avatares de preview de miembros en las cards */
const AVATAR_PALETTE = [
  theme.colors.primary,
  theme.colors.secondary,
  '#0EA5E9',
  '#059669',
  '#D97706',
];

/**
 * Genera un índice de color determinístico a partir de un string,
 * misma lógica que MeetupHomeScreen para mantener coherencia visual.
 */
const getAvatarColorIndex = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % AVATAR_PALETTE.length;
};

const ROLE_LABELS: Record<GroupRole, string> = {
  admin: 'Admin',
  member: 'Miembro',
  guest: 'Invitado',
};

/** Props de la card de grupo individual */
interface GroupCardProps {
  group: GroupWithRole;
}

const GroupCard = ({ group }: GroupCardProps) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle} numberOfLines={1}>
        {group.name}
      </Text>
      <View
        style={[
          styles.roleBadge,
          group.userRole === 'admin' ? styles.badgeAdmin : styles.badgeMember,
        ]}
      >
        <Text
          style={[
            styles.roleBadgeText,
            group.userRole === 'admin' ? styles.badgeTextAdmin : styles.badgeTextMember,
          ]}
        >
          {ROLE_LABELS[group.userRole]}
        </Text>
      </View>
    </View>

    <View style={styles.cardInfoRow}>
      <Ionicons name="people-outline" size={14} color={theme.colors.textSecondary} />
      <Text style={styles.cardInfoText}>{group.memberCount} miembros</Text>
    </View>

    <View style={styles.cardInfoRow}>
      <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
      <Text style={styles.cardInfoText}>
        {group.activeMeetupCount} juntada{group.activeMeetupCount === 1 ? '' : 's'} activa
        {group.activeMeetupCount === 1 ? '' : 's'}
      </Text>
    </View>

    <View style={styles.cardFooter}>
      <View style={styles.avatarStack}>
        {group.memberPreview.map((member, i) => (
          <View
            key={member.userId}
            style={[
              styles.avatarSmall,
              {
                backgroundColor: AVATAR_PALETTE[getAvatarColorIndex(member.userId)],
                marginLeft: i > 0 ? -8 : 0,
              },
            ]}
          >
            <Text style={styles.avatarInitials}>{member.initials}</Text>
          </View>
        ))}
        {group.memberOverflow > 0 && (
          <View style={[styles.avatarSmall, styles.avatarOverflow, { marginLeft: -8 }]}>
            <Text style={styles.avatarOverflowText}>+{group.memberOverflow}</Text>
          </View>
        )}
      </View>

      <Text style={styles.countText}>{group.memberCount} personas</Text>
    </View>
  </View>
);

export const GroupHomeScreen = () => {
  const navigation = useNavigation<NavProp>();
  const queryClient = useQueryClient();
  const { userId } = useCurrentUser();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { groups, isLoading, error, refresh } = useGroups();

  const isInitialLoading = isLoading && groups.length === 0;
  const showSkeleton = isInitialLoading || isRefreshing;
  const skeletonCount = groups.length > 0 ? Math.min(groups.length, 2) : 2;

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['groups', userId] });
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, userId]);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrapper}>
        <Ionicons name="people-circle-outline" size={72} color={theme.colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>No tenés grupos aún</Text>
      <Text style={styles.emptySubtitle}>
        Creá un grupo o unite a uno con el código de un amigo
      </Text>
      <Pressable
        style={({ pressed }) => [styles.emptyButton, pressed && styles.emptyButtonPressed]}
        onPress={() => navigation.navigate(Routes.CreateGroup)}
      >
        <Ionicons name="add" size={18} color={theme.colors.surface} />
        <Text style={styles.emptyButtonText}>Crear mi primer grupo</Text>
      </Pressable>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={36} color={theme.colors.error} />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity onPress={refresh} activeOpacity={0.7}>
        <Text style={styles.retryText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.topSafe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mis grupos</Text>
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
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.quickActions}>
          <Pressable
            style={({ pressed }) => [styles.quickCard, pressed && styles.quickCardPressed]}
            onPress={() => navigation.navigate(Routes.CreateGroup)}
          >
            <View style={[styles.quickIconBox, { backgroundColor: theme.colors.primaryLight }]}>
              <Ionicons name="add-circle" size={28} color={theme.colors.primary} />
            </View>
            <Text style={styles.quickLabel}>Crear grupo</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.quickCard, pressed && styles.quickCardPressed]}
            onPress={() => navigation.navigate(Routes.JoinGroup)}
          >
            <View style={[styles.quickIconBox, { backgroundColor: theme.colors.infoLight }]}>
              <Ionicons name="person-add" size={28} color={theme.colors.info} />
            </View>
            <Text style={styles.quickLabel}>Unirse a un grupo</Text>
          </Pressable>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Tus grupos</Text>
          {groups.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{groups.length}</Text>
            </View>
          )}
        </View>

        {error ? (
          renderError()
        ) : showSkeleton ? (
          Array.from({ length: skeletonCount }, (_, index) => (
            <GroupCardSkeleton key={`group-skeleton-${index}`} />
          ))
        ) : groups.length === 0 ? (
          renderEmptyState()
        ) : (
          groups.map((group) => <GroupCard key={group.id} group={group} />)
        )}

        <View style={styles.scrollBottom} />
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
  topSafe: {
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
    minWidth: 40,
    minHeight: 40,
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
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 96,
  },
  scrollBottom: {
    height: theme.spacing.xxl,
  },
  quickActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  quickCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  quickCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  quickIconBox: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  quickLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  countBadge: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textSecondary,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textPrimary,
  },
  roleBadge: {
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
  },
  badgeAdmin: {
    backgroundColor: theme.colors.warningLight,
  },
  badgeMember: {
    backgroundColor: theme.colors.primaryLight,
  },
  roleBadgeText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
  },
  badgeTextAdmin: {
    color: '#92400E',
  },
  badgeTextMember: {
    color: theme.colors.primary,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  cardInfoText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.full,
    borderWidth: 2,
    borderColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 10,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.surface,
  },
  avatarOverflow: {
    backgroundColor: theme.colors.background,
  },
  avatarOverflowText: {
    fontSize: 9,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textSecondary,
  },
  countText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  emptyIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.xl,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  emptyButtonPressed: {
    opacity: 0.85,
  },
  emptyButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.surface,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.error,
    textAlign: 'center',
  },
  retryText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
});

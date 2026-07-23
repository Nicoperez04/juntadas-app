/**
 * Pantalla de listado completo de miembros de un grupo.
 *
 * Mismo criterio visual que ParticipantListScreen (avatar/iniciales, nombre,
 * username, badge), con dos diferencias del mockup de Figma
 * ("Mockup - Miembros del Grupo"):
 * - El menú "⋮" de cada fila se renderiza sin onPress funcional todavía
 *   (expulsar miembros es 4.4/4.5).
 * - El mockup mostraba dos chips distintos para el admin (rol + fecha) y
 *   uno solo para member; se unificó a un único chip de rol por fila para
 *   mantener consistencia (esa doble variante no aportaba información
 *   nueva y complicaba el layout sin necesidad).
 *
 * Sin acciones al final de la lista (compartir código, salir del grupo):
 * esas viven en GroupDetailScreen (pantalla padre). Mismo criterio que
 * ParticipantListScreen, que también es solo la lista sin acciones
 * adicionales.
 */
import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { theme } from '@/shared/constants/theme';
import { useGroupMembers } from '../hooks/useGroupMembers';
import type { GroupMember, GroupRole } from '../types';
import type { MainStackParamList } from '@/navigation/types';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'GroupMembers'>;
type RoutePropType = RouteProp<MainStackParamList, 'GroupMembers'>;

const AVATAR_PALETTE = [
  theme.colors.primary,
  theme.colors.secondary,
  '#0EA5E9',
  '#059669',
  theme.colors.warning,
  theme.colors.error,
];

const getAvatarColorIndex = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % AVATAR_PALETTE.length;
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const ROLE_CONFIG: Record<GroupRole, { label: string; bg: string; text: string }> = {
  admin: { label: 'Admin', bg: theme.colors.warningLight, text: '#92400E' },
  member: { label: 'Miembro', bg: theme.colors.primaryLight, text: theme.colors.primary },
  guest: { label: 'Invitado', bg: theme.colors.background, text: theme.colors.textSecondary },
};

const MemberRow = ({ member }: { member: GroupMember }) => {
  const config = ROLE_CONFIG[member.role];
  const avatarColor = AVATAR_PALETTE[getAvatarColorIndex(member.userId)];
  const initials = getInitials(member.profile.fullName || member.profile.username);

  return (
    <View style={styles.memberRow}>
      {member.profile.avatarUrl ? (
        <Image source={{ uri: member.profile.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      )}

      <View style={styles.memberInfo}>
        <Text style={styles.memberName} numberOfLines={1}>
          {member.profile.fullName || member.profile.username}
        </Text>
        <Text style={styles.memberUsername}>@{member.profile.username}</Text>
      </View>

      <View style={[styles.roleBadge, { backgroundColor: config.bg }]}>
        <Text style={[styles.roleBadgeText, { color: config.text }]}>{config.label}</Text>
      </View>

      {/* TODO 4.4/4.5: expulsar miembro — sin onPress funcional todavía */}
      <TouchableOpacity
        style={styles.menuBtn}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Opciones de ${member.profile.fullName || member.profile.username}`}
      >
        <Ionicons name="ellipsis-vertical" size={18} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

export const GroupMembersScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { groupId } = route.params;

  const { members, isLoading, error, refresh } = useGroupMembers(groupId);

  if (isLoading && members.length === 0) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Cargando miembros...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Miembros</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={36} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refresh} activeOpacity={0.7}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MemberRow member={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay miembros activos en este grupo</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
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
    width: 36,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.surface,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  memberUsername: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  roleBadgeText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
  },
  menuBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

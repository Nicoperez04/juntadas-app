/**
 * Pantalla de listado completo de miembros de un grupo.
 *
 * Mismo criterio visual que ParticipantListScreen (avatar/iniciales, nombre,
 * username, badge), con dos diferencias del mockup de Figma
 * ("Mockup - Miembros del Grupo"):
 * - El menú "⋮" de cada fila (4.5) abre un dropdown anclado al ícono con
 *   "Transferir administración" y "Expulsar del grupo" — solo visible si
 *   el usuario actual es Admin, y oculto en la propia fila del Admin.
 * - El mockup mostraba dos chips distintos para el admin (rol + fecha) y
 *   uno solo para member; se unificó a un único chip de rol por fila para
 *   mantener consistencia (esa doble variante no aportaba información
 *   nueva y complicaba el layout sin necesidad).
 *
 * Sin acciones al final de la lista (compartir código, salir del grupo):
 * esas viven en GroupDetailScreen (pantalla padre). Mismo criterio que
 * ParticipantListScreen, que también es solo la lista sin acciones
 * adicionales.
 *
 * Expulsar y transferir administración usan funciones SECURITY DEFINER
 * (018_group_admin_actions.sql) en vez del patrón de 3 UPDATEs
 * secuenciales sin transacción que usa meetupService.transferOrganizer —
 * ver esa migración para el detalle de por qué ese patrón no se replicó.
 */
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { theme } from '@/shared/constants/theme';
import { AppButton } from '@/shared/components/AppButton';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { useGroupMembers } from '../hooks/useGroupMembers';
import type { GroupMember, GroupRole } from '../types';
import type { MainStackParamList } from '@/navigation/types';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'GroupMembers'>;
type RoutePropType = RouteProp<MainStackParamList, 'GroupMembers'>;

/** Acción pendiente de confirmación sobre un miembro puntual */
type PendingAction = 'expel' | 'transfer';

/** Posición donde anclar el dropdown de acciones, medida desde el ícono "⋮" tocado */
interface MenuAnchor {
  member: GroupMember;
  y: number;
}

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

interface MemberRowProps {
  member: GroupMember;
  /** true si el usuario actual es Admin y esta fila no es la suya propia */
  canManage: boolean;
  onOpenMenu: (member: GroupMember, y: number) => void;
}

const MemberRow = ({ member, canManage, onOpenMenu }: MemberRowProps) => {
  const config = ROLE_CONFIG[member.role];
  const avatarColor = AVATAR_PALETTE[getAvatarColorIndex(member.userId)];
  const displayName = member.profile.fullName || member.profile.username;
  const initials = getInitials(displayName);
  const menuBtnRef = useRef<View>(null);

  const handleMenuPress = () => {
    menuBtnRef.current?.measureInWindow((_x, y, _width, height) => {
      onOpenMenu(member, y + height);
    });
  };

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
          {displayName}
        </Text>
        <Text style={styles.memberUsername}>@{member.profile.username}</Text>
      </View>

      <View style={[styles.roleBadge, { backgroundColor: config.bg }]}>
        <Text style={[styles.roleBadgeText, { color: config.text }]}>{config.label}</Text>
      </View>

      {canManage && (
        <TouchableOpacity
          ref={menuBtnRef}
          style={styles.menuBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Opciones de ${displayName}`}
          onPress={handleMenuPress}
        >
          <Ionicons name="ellipsis-vertical" size={18} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export const GroupMembersScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { groupId } = route.params;
  const { userId: currentUserId } = useCurrentUser();

  const {
    members,
    isLoading,
    error,
    refresh,
    expelMember,
    isExpelling,
    transferAdmin,
    isTransferring,
  } = useGroupMembers(groupId);

  const isAdmin = members.some(
    (m) => m.userId === currentUserId && m.role === 'admin',
  );

  const [menuAnchor, setMenuAnchor] = useState<MenuAnchor | null>(null);
  const [actionTarget, setActionTarget] = useState<GroupMember | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isActionLoading = isExpelling || isTransferring;

  const closeMenu = () => setMenuAnchor(null);

  const openConfirm = (action: PendingAction) => {
    if (!menuAnchor) return;
    setActionTarget(menuAnchor.member);
    setPendingAction(action);
    setMenuAnchor(null);
  };

  const closeConfirm = () => {
    if (isActionLoading) return;
    setActionTarget(null);
    setPendingAction(null);
    setActionError(null);
  };

  const confirmAction = async () => {
    if (!actionTarget || !pendingAction) return;
    setActionError(null);

    const result =
      pendingAction === 'expel'
        ? await expelMember(actionTarget.userId)
        : await transferAdmin(actionTarget.userId);

    if (result.error) {
      setActionError(result.error);
      return;
    }

    setActionTarget(null);
    setPendingAction(null);
  };

  if (isLoading && members.length === 0) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Cargando miembros...</Text>
      </SafeAreaView>
    );
  }

  const targetName = actionTarget
    ? actionTarget.profile.fullName || actionTarget.profile.username
    : '';

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
          renderItem={({ item }) => (
            <MemberRow
              member={item}
              canManage={isAdmin && item.userId !== currentUserId}
              onOpenMenu={(member, y) => setMenuAnchor({ member, y })}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay miembros activos en este grupo</Text>
            </View>
          }
        />
      )}

      {/* Dropdown de acciones, anclado al ícono "⋮" tocado */}
      <Modal transparent visible={!!menuAnchor} animationType="fade" onRequestClose={closeMenu}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu}>
          {menuAnchor && (
            <View style={[styles.dropdown, { top: menuAnchor.y }]}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => openConfirm('transfer')}
                activeOpacity={0.7}
              >
                <Ionicons name="swap-horizontal-outline" size={18} color={theme.colors.textPrimary} />
                <Text style={styles.dropdownItemText}>Transferir administración</Text>
              </TouchableOpacity>
              <View style={styles.dropdownDivider} />
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => openConfirm('expel')}
                activeOpacity={0.7}
              >
                <Ionicons name="person-remove-outline" size={18} color={theme.colors.error} />
                <Text style={[styles.dropdownItemText, { color: theme.colors.error }]}>
                  Expulsar del grupo
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </Modal>

      {/* Modal de confirmación, compartido entre expulsar y transferir */}
      <Modal
        transparent
        animationType="fade"
        visible={!!actionTarget}
        onRequestClose={closeConfirm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View
              style={
                pendingAction === 'expel' ? styles.modalIconBoxDanger : styles.modalIconBoxWarning
              }
            >
              <Ionicons
                name={pendingAction === 'expel' ? 'person-remove-outline' : 'swap-horizontal-outline'}
                size={32}
                color={pendingAction === 'expel' ? theme.colors.error : theme.colors.warning}
              />
            </View>
            <Text style={styles.modalTitle}>
              {pendingAction === 'expel' ? 'Expulsar del grupo' : 'Transferir administración'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {pendingAction === 'expel'
                ? `¿Estás seguro de que querés expulsar a ${targetName} del grupo?`
                : `¿Estás seguro de que querés transferir la administración a ${targetName}? Vos vas a pasar a ser miembro.`}
            </Text>
            {actionError && <Text style={styles.actionErrorText}>{actionError}</Text>}
            <View style={styles.modalActions}>
              <AppButton
                label="No, volver"
                variant="ghost"
                onPress={closeConfirm}
                disabled={isActionLoading}
              />
              <TouchableOpacity
                style={[
                  pendingAction === 'expel' ? styles.modalDestructiveBtn : styles.modalWarningBtn,
                  isActionLoading && styles.modalDestructiveBtnDisabled,
                ]}
                onPress={() => void confirmAction()}
                disabled={isActionLoading}
                activeOpacity={0.8}
              >
                {isActionLoading ? (
                  <ActivityIndicator color={theme.colors.surface} />
                ) : (
                  <Text style={styles.modalDestructiveBtnText}>
                    {pendingAction === 'expel' ? 'Sí, expulsar' : 'Sí, transferir'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  dropdown: {
    position: 'absolute',
    right: theme.spacing.lg,
    minWidth: 230,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.xs,
    ...theme.shadows.md,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  dropdownItemText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textPrimary,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  modalIconBoxWarning: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  modalIconBoxDanger: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  actionErrorText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  modalActions: {
    width: '100%',
    gap: theme.spacing.sm,
  },
  modalWarningBtn: {
    height: theme.components.buttonHeight,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  modalDestructiveBtn: {
    height: theme.components.buttonHeight,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  modalDestructiveBtnDisabled: {
    opacity: 0.6,
  },
  modalDestructiveBtnText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.surface,
  },
});

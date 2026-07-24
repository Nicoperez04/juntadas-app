/**
 * Pantalla de detalle de un grupo — orquestadora.
 *
 * Mismo criterio que MeetupDetailScreen: la pantalla coordina navegación,
 * modales de confirmación y toasts; useGroupDetail/useGroupMembers traen
 * los datos. Reutiliza el mismo set de estilos de modal de confirmación
 * que MeetupDetailScreen (modalOverlay/modalCard/modalIconBox/...).
 *
 * Sin botón "Editar" (no hay EditGroupScreen en este sub-bloque) ni
 * "Transferir administración" (explícitamente fuera de alcance — 4.5).
 * "Eliminar grupo" solo se muestra si el usuario es admin; la policy
 * groups_delete ya lo exige del lado del servidor, esto es solo UX.
 *
 * Si el admin toca "Salir del grupo", leave_group() (014_groups.sql)
 * lanza la excepción "El admin debe transferir su rol antes de salir del
 * grupo" — es un comportamiento esperado (transferir administración es
 * 4.5, todavía no existe en la UI), así que ese mensaje específico se
 * muestra tal cual en el toast de error, sin genérico que lo tape.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Modal,
  Image,
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
import { ErrorAnimation } from '@/shared/components/ErrorAnimation';
import { SuccessAnimation } from '@/shared/components/SuccessAnimation';
import { MeetupShareButton } from '@/features/meetups/components/MeetupShareButton';
import { useGroupDetail } from '../hooks/useGroupDetail';
import { useGroupMembers } from '../hooks/useGroupMembers';
import type { GroupRole } from '../types';
import type { MainStackParamList } from '@/navigation/types';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'GroupDetail'>;
type RoutePropType = RouteProp<MainStackParamList, 'GroupDetail'>;

const ROLE_LABELS: Record<GroupRole, string> = {
  admin: 'Admin',
  member: 'Miembro',
  guest: 'Invitado',
};

const AVATAR_PALETTE = [
  theme.colors.primary,
  theme.colors.secondary,
  '#0EA5E9',
  '#059669',
  theme.colors.warning,
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

/**
 * Formatea una fecha ISO a DD/MM/YYYY para "Creado el ...".
 */
const formatCreatedDate = (isoDate: string): string => {
  const d = new Date(isoDate);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
};

export const GroupDetailScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { groupId } = route.params;

  const {
    group,
    isLoading,
    error,
    isNotMember,
    isAdmin,
    deleteGroup,
    isDeleting,
    leaveGroup,
    isLeaving,
    reload,
  } = useGroupDetail(groupId);
  // Si ya sabemos que el usuario no es miembro activo, no hace falta pedir
  // la lista de miembros: RLS la devolvería vacía de todos modos.
  const { members } = useGroupMembers(groupId, { enabled: !isNotMember });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  /**
   * Distingue el toast de éxito de "grupo eliminado" (que navega afuera)
   * del toast de éxito de MeetupShareButton (copiar código / compartir),
   * que reutiliza el mismo SuccessAnimation pero debe quedarse en pantalla.
   */
  const [shouldNavigateAfterToast, setShouldNavigateAfterToast] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await reload();
    setIsRefreshing(false);
  };

  const confirmLeave = async () => {
    const result = await leaveGroup();
    setShowLeaveModal(false);

    if (result.error) {
      // Mensaje específico del admin (ver docstring del archivo) o
      // cualquier otro error del RPC se muestra tal cual, sin genérico.
      setErrorMessage(result.error);
      setShowError(true);
      return;
    }

    navigation.navigate(Routes.GroupHome);
  };

  const confirmDelete = async () => {
    const result = await deleteGroup();
    setShowDeleteModal(false);

    if (result.error) {
      setErrorMessage(result.error);
      setShowError(true);
      return;
    }

    setSuccessMessage('✓ Grupo eliminado');
    setShouldNavigateAfterToast(true);
    setShowSuccess(true);
  };

  if (isLoading && !group) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Cargando grupo...</Text>
      </SafeAreaView>
    );
  }

  // Estado propio para "ya no sos miembro" — distinto del error genérico:
  // no tiene sentido ofrecer "Reintentar" (va a volver a fallar igual),
  // ni mostrar counts/botones de un grupo al que ya no se tiene acceso.
  if (isNotMember) {
    return (
      <SafeAreaView style={styles.errorFullScreen} edges={['top', 'bottom']}>
        <Ionicons name="exit-outline" size={48} color={theme.colors.textSecondary} />
        <Text style={styles.errorFullText}>Ya no formás parte de este grupo</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate(Routes.GroupHome)}
          activeOpacity={0.7}
        >
          <Text style={styles.retryText}>Volver a Inicio</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (error || !group) {
    return (
      <SafeAreaView style={styles.errorFullScreen} edges={['top', 'bottom']}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
        <Text style={styles.errorFullText}>{error ?? 'No se pudo cargar el grupo'}</Text>
        <TouchableOpacity onPress={() => void reload()} activeOpacity={0.7}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const previewMembers = members.slice(0, 2);

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
          <Text style={styles.headerTitle}>Detalle</Text>
          <View
            style={[
              styles.roleBadge,
              isAdmin ? styles.badgeAdmin : styles.badgeMember,
            ]}
          >
            <Text
              style={[styles.roleBadgeText, isAdmin ? styles.badgeTextAdmin : styles.badgeTextMember]}
            >
              {ROLE_LABELS[group.userRole]}
            </Text>
          </View>
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
        {/* Card principal: nombre, badge de rol, datos del grupo */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeaderRow}>
            <Text style={styles.groupName} numberOfLines={1}>
              {group.name}
            </Text>
          </View>

          {group.description && (
            <Text style={styles.groupDescription}>{group.description}</Text>
          )}

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="calendar-outline" size={18} color={theme.colors.textSecondary} />
            </View>
            <Text style={styles.infoText}>Creado el {formatCreatedDate(group.createdAt)}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="people-outline" size={18} color={theme.colors.textSecondary} />
            </View>
            <Text style={styles.infoText}>{group.memberCount} miembros</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="calendar" size={18} color={theme.colors.textSecondary} />
            </View>
            <Text style={styles.infoText}>
              {group.activeMeetupCount} juntada{group.activeMeetupCount === 1 ? '' : 's'} activa
              {group.activeMeetupCount === 1 ? '' : 's'}
            </Text>
          </View>

          <View style={styles.myRoleRow}>
            <Ionicons name="time-outline" size={16} color={theme.colors.warning} />
            <Text style={styles.myRoleText}>Mi rol: {ROLE_LABELS[group.userRole]}</Text>
          </View>
        </View>

        {/* Sección "Juntadas" — navega al listado real de juntadas del grupo */}
        <View style={styles.sectionsRow}>
          <Pressable
            style={({ pressed }) => [
              styles.sectionCard,
              styles.sectionCardMeetups,
              pressed && styles.sectionCardPressed,
            ]}
            onPress={() =>
              navigation.navigate(Routes.GroupMeetups, {
                groupId,
                groupName: group.name,
              })
            }
          >
            <Ionicons name="calendar-outline" size={22} color={theme.colors.primary} />
            <Text style={[styles.sectionCardText, { color: theme.colors.primary }]}>
              Juntadas
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.sectionCard,
              styles.sectionCardStats,
              pressed && styles.sectionCardPressed,
            ]}
            onPress={() =>
              navigation.navigate(Routes.GroupStats, {
                groupId,
                groupName: group.name,
              })
            }
          >
            <Ionicons name="stats-chart" size={22} color={theme.colors.warning} />
            <Text style={[styles.sectionCardText, { color: theme.colors.warning }]}>
              Estadisticas
            </Text>
          </Pressable>
        </View>

        {/* Crear una juntada para este grupo — invita a todos los miembros activos */}
        <View style={styles.createMeetupWrapper}>
          <AppButton
            label="+ Crear juntada"
            onPress={() =>
              navigation.navigate(Routes.CreateMeetup, {
                groupId,
                groupName: group.name,
              })
            }
          />
        </View>

        {/* Preview de miembros */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Miembros ({group.memberCount})</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate(Routes.GroupMembers, {
                  groupId,
                  groupName: group.name,
                  joinCode: group.joinCode,
                })
              }
              activeOpacity={0.7}
            >
              <Text style={styles.seeAllText}>Ver miembros</Text>
            </TouchableOpacity>
          </View>

          {previewMembers.map((member) => {
            const avatarColor = AVATAR_PALETTE[getAvatarColorIndex(member.userId)];
            const initials = getInitials(member.profile.fullName || member.profile.username);
            return (
              <View key={member.id} style={styles.previewMemberRow}>
                {member.profile.avatarUrl ? (
                  <Image source={{ uri: member.profile.avatarUrl }} style={styles.previewAvatar} />
                ) : (
                  <View style={[styles.previewAvatar, { backgroundColor: avatarColor }]}>
                    <Text style={styles.previewAvatarText}>{initials}</Text>
                  </View>
                )}
                <View style={styles.previewMemberInfo}>
                  <Text style={styles.previewMemberName} numberOfLines={1}>
                    {member.profile.fullName || member.profile.username}
                  </Text>
                  <Text style={styles.previewMemberUsername}>@{member.profile.username}</Text>
                </View>
                <View
                  style={[
                    styles.previewRoleBadge,
                    member.role === 'admin' ? styles.badgeAdmin : styles.badgeMember,
                  ]}
                >
                  <Text
                    style={[
                      styles.previewRoleBadgeText,
                      member.role === 'admin' ? styles.badgeTextAdmin : styles.badgeTextMember,
                    ]}
                  >
                    {ROLE_LABELS[member.role]}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Compartir grupo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compartir grupo</Text>
          <View style={styles.shareCard}>
            <Text style={styles.shareLabel}>Código de acceso</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{group.joinCode}</Text>
            </View>
            <Text style={styles.shareHint}>
              Compartí este código para invitar gente al grupo
            </Text>
            <View style={styles.shareButtonWrapper}>
              <MeetupShareButton
                meetupTitle={group.name}
                joinCode={group.joinCode}
                onFeedback={(message, type) => {
                  if (type === 'success') {
                    setSuccessMessage(message);
                    setShowSuccess(true);
                    return;
                  }
                  setErrorMessage(message);
                  setShowError(true);
                }}
              />
            </View>
          </View>
        </View>

        {/* Zona de acciones: salir / eliminar */}
        <View style={styles.destructiveSection}>
          <TouchableOpacity
            style={[styles.leaveBtn, isLeaving && styles.destructiveBtnDisabled]}
            onPress={() => setShowLeaveModal(true)}
            disabled={isLeaving}
            activeOpacity={0.8}
          >
            {isLeaving ? (
              <ActivityIndicator color={theme.colors.warning} />
            ) : (
              <>
                <Ionicons name="exit-outline" size={20} color={theme.colors.warning} />
                <Text style={styles.leaveBtnText}>Salir del grupo</Text>
              </>
            )}
          </TouchableOpacity>

          {isAdmin && (
            <TouchableOpacity
              style={[styles.destructiveBtn, isDeleting && styles.destructiveBtnDisabled]}
              onPress={() => setShowDeleteModal(true)}
              disabled={isDeleting}
              activeOpacity={0.8}
            >
              {isDeleting ? (
                <ActivityIndicator color={theme.colors.error} />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                  <Text style={styles.destructiveBtnText}>Eliminar grupo</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Modal de confirmación para salir del grupo */}
      <Modal
        transparent
        animationType="fade"
        visible={showLeaveModal}
        onRequestClose={() => !isLeaving && setShowLeaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBoxWarning}>
              <Ionicons name="exit-outline" size={32} color={theme.colors.warning} />
            </View>
            <Text style={styles.modalTitle}>Salir del grupo</Text>
            <Text style={styles.modalSubtitle}>
              ¿Estás seguro? Podés volver a unirte con el código si cambiás de opinión.
            </Text>
            <View style={styles.modalActions}>
              <AppButton
                label="No, volver"
                variant="ghost"
                onPress={() => setShowLeaveModal(false)}
                disabled={isLeaving}
              />
              <TouchableOpacity
                style={[styles.modalWarningBtn, isLeaving && styles.modalDestructiveBtnDisabled]}
                onPress={() => void confirmLeave()}
                disabled={isLeaving}
                activeOpacity={0.8}
              >
                {isLeaving ? (
                  <ActivityIndicator color={theme.colors.surface} />
                ) : (
                  <Text style={styles.modalDestructiveBtnText}>Sí, salir</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmación para eliminar el grupo */}
      <Modal
        transparent
        animationType="fade"
        visible={showDeleteModal}
        onRequestClose={() => !isDeleting && setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBoxDanger}>
              <Ionicons name="warning" size={32} color={theme.colors.error} />
            </View>
            <Text style={styles.modalTitle}>Eliminar grupo</Text>
            <Text style={styles.modalSubtitle}>
              Esta acción no se puede deshacer. Se eliminará para todos los miembros.
            </Text>
            <View style={styles.modalActions}>
              <AppButton
                label="No, volver"
                variant="ghost"
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              />
              <TouchableOpacity
                style={[styles.modalDestructiveBtn, isDeleting && styles.modalDestructiveBtnDisabled]}
                onPress={() => void confirmDelete()}
                disabled={isDeleting}
                activeOpacity={0.8}
              >
                {isDeleting ? (
                  <ActivityIndicator color={theme.colors.surface} />
                ) : (
                  <Text style={styles.modalDestructiveBtnText}>Sí, eliminar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AppTabBar activeTab="home" />

      <SuccessAnimation
        visible={showSuccess}
        message={successMessage}
        onHide={() => {
          setShowSuccess(false);
          if (shouldNavigateAfterToast) {
            setShouldNavigateAfterToast(false);
            navigation.navigate(Routes.GroupHome);
          }
        }}
      />

      <ErrorAnimation
        visible={showError}
        message={errorMessage}
        onHide={() => setShowError(false)}
      />
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
  loadingContainer: {
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
  errorFullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  errorFullText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.error,
    textAlign: 'center',
  },
  retryText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
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
  roleBadge: {
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: 4,
  },
  roleBadgeText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
  },
  badgeAdmin: {
    backgroundColor: theme.colors.warningLight,
  },
  badgeMember: {
    backgroundColor: theme.colors.primaryLight,
  },
  badgeTextAdmin: {
    color: '#92400E',
  },
  badgeTextMember: {
    color: theme.colors.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  infoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  groupName: {
    flex: 1,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  groupDescription: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  infoIconBox: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textPrimary,
  },
  myRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background,
  },
  myRoleText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.warning,
  },
  sectionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  sectionCard: {
    flex: 1,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  sectionCardMeetups: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: '#EDE9FE',
  },
  sectionCardStats: {
    backgroundColor: theme.colors.warningLight,
    borderColor: '#FEF3C7',
  },
  sectionCardPressed: {
    opacity: 0.85,
  },
  sectionCardText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  seeAllText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.primary,
  },
  previewMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.md,
  },
  previewAvatar: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewAvatarText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.surface,
  },
  previewMemberInfo: {
    flex: 1,
  },
  previewMemberName: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textPrimary,
  },
  previewMemberUsername: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
  previewRoleBadge: {
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
  },
  previewRoleBadgeText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
  },
  createMeetupWrapper: {
    marginBottom: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  shareCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  shareLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.md,
  },
  codeBox: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  codeText: {
    fontSize: 28,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    letterSpacing: 8,
  },
  shareHint: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  shareButtonWrapper: {
    width: '100%',
  },
  destructiveSection: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.warningLight,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.warning,
  },
  leaveBtnText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.warning,
  },
  destructiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.errorLight,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  destructiveBtnDisabled: {
    opacity: 0.6,
  },
  destructiveBtnText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.error,
  },
  bottomSpace: {
    height: theme.spacing.xl,
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

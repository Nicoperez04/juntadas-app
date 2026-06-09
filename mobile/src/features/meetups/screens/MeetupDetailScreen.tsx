/**
 * Pantalla de detalle de una juntada — orquestadora.
 *
 * La lógica de datos (meetup, participantes, rol del usuario, acciones)
 * vive en useMeetupDetail; las secciones visuales principales viven en
 * MeetupDetailHeader, MeetupParticipantsSummary y MeetupOrganizerActions.
 *
 * Esta pantalla solo coordina: navegación, modales de confirmación,
 * el modal de asistencia, el toast de feedback y la sección de compartir.
 */
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  ActivityIndicator,
  Pressable,
  Modal,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { theme } from '@/shared/constants/theme';
import { Routes } from '@/navigation/routes';
import { AppButton } from '@/shared/components/AppButton';
import { AppTabBar } from '@/shared/components/AppTabBar';
import { Toast } from '@/shared/components/Toast';
import { ModifyAttendanceScreen } from '@/features/participants/screens/ModifyAttendanceScreen';
import { getParticipantDisplayName } from '@/features/participants/utils/participantDisplay';
import { useMeetupDetail } from '../hooks/useMeetupDetail';
import { MeetupDetailHeader } from '../components/MeetupDetailHeader';
import { MeetupParticipantsSummary } from '../components/MeetupParticipantsSummary';
import { MeetupOrganizerActions } from '../components/MeetupOrganizerActions';
import type { MeetupParticipant, AttendanceStatus } from '../types';
import type { MainStackParamList } from '@/navigation/types';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'MeetupDetail'>;
type RoutePropType = RouteProp<MainStackParamList, 'MeetupDetail'>;

/** Target del modal de asistencia en detalle de juntada */
type AttendanceModalTarget =
  | { mode: 'self' }
  | { mode: 'organizer'; participant: MeetupParticipant };

/** Card de acción principal (Jugar / Recuerdos) */
interface ActionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}

const ActionCard = ({ icon, label, color, onPress }: ActionCardProps) => (
  <Pressable
    style={({ pressed }) => [
      styles.actionCard,
      pressed && styles.actionCardPressed,
    ]}
    onPress={onPress}
  >
    <View style={[styles.actionIconBox, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={28} color={color} />
    </View>
    <Text style={[styles.actionLabel, { color }]}>{label}</Text>
  </Pressable>
);

export const MeetupDetailScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { meetupId } = route.params;

  const {
    meetup,
    participants,
    confirmedCount,
    isLoading,
    isLoadingParticipants,
    error,
    currentUserParticipant,
    userRole,
    hasAbandoned,
    isOrganizer,
    isParticipant,
    isActive,
    isCancelled,
    isFinished,
    canFinish,
    cancel,
    finish,
    leave,
    updateAttendance,
    updateParticipantAttendance,
    reload,
    refreshAll,
  } = useMeetupDetail(meetupId);

  // Estados de UI: visibilidad de modales y operaciones en curso
  const [attendanceModalTarget, setAttendanceModalTarget] =
    useState<AttendanceModalTarget | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  /**
   * Transporta el mensaje de Toast entre onSave y onClose del modal de
   * asistencia. Se usa ref en lugar de estado para no generar re-renders
   * intermedios durante la animación de cierre del bottom sheet.
   */
  const pendingToastRef = useRef<string | null>(null);

  /**
   * Cierra el modal de asistencia y recarga datos en paralelo para evitar
   * re-renders intermedios por llamadas secuenciales.
   */
  const handleAttendanceClose = useCallback(async () => {
    setAttendanceModalTarget(null);
    await refreshAll();
    if (pendingToastRef.current) {
      setToast({ message: pendingToastRef.current, type: 'success' });
      pendingToastRef.current = null;
    }
  }, [refreshAll]);

  /**
   * Comparte el código de la juntada usando la API nativa Share.
   * Permite al usuario enviarlo por el canal que prefiera (WhatsApp, etc.).
   */
  const handleShare = async () => {
    if (!meetup) return;
    try {
      await Share.share({
        message: `¡Unite a mi juntada "${meetup.title}"! Usá el código: ${meetup.joinCode}`,
        title: 'Compartir juntada',
      });
    } catch {
      // Error ignorado — el usuario puede haber cancelado el share sheet
    }
  };

  /**
   * Copia el código al clipboard y muestra un toast de confirmación
   * en lugar de cambiar el ícono del botón.
   */
  const handleCopy = async () => {
    if (!meetup) return;
    await Clipboard.setStringAsync(meetup.joinCode);
    setToast({ message: '✓ Código copiado', type: 'success' });
  };

  if (isLoading || (isLoadingParticipants && participants.length === 0)) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Cargando juntada...</Text>
      </SafeAreaView>
    );
  }

  if (error || !meetup) {
    return (
      <SafeAreaView style={styles.errorFullScreen} edges={['top', 'bottom']}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={theme.colors.error}
        />
        <Text style={styles.errorFullText}>
          {error ?? 'No se pudo cargar la juntada'}
        </Text>
        <TouchableOpacity onPress={() => void reload()} activeOpacity={0.7}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const roleLabel = isOrganizer ? 'Organizador' : 'Invitado';
  const currentAttendance: AttendanceStatus =
    currentUserParticipant?.attendanceStatus ?? 'pending';

  const modalCurrentStatus =
    attendanceModalTarget?.mode === 'organizer'
      ? attendanceModalTarget.participant.attendanceStatus
      : currentAttendance;

  const modalParticipantName =
    attendanceModalTarget?.mode === 'organizer'
      ? getParticipantDisplayName(attendanceModalTarget.participant)
      : undefined;

  /**
   * Ejecuta la cancelación de la juntada tras confirmación en el modal.
   */
  const confirmCancelMeetup = async () => {
    setIsCancelling(true);
    const result = await cancel();
    setIsCancelling(false);
    setShowCancelModal(false);

    if (result.error) {
      setToast({ message: result.error, type: 'error' });
      return;
    }

    setToast({ message: 'Juntada cancelada', type: 'success' });
  };

  /**
   * Ejecuta la finalización de la juntada tras confirmación en el modal.
   */
  const confirmFinishMeetup = async () => {
    setIsFinishing(true);
    const result = await finish();
    setIsFinishing(false);
    setShowFinishModal(false);

    if (result.error) {
      setToast({ message: result.error, type: 'error' });
      return;
    }

    setToast({ message: 'Juntada finalizada', type: 'success' });
  };

  /**
   * Confirma el abandono de la juntada como participante invitado.
   */
  const confirmLeaveMeetup = async () => {
    setIsLeaving(true);
    const result = await leave();
    setIsLeaving(false);
    setShowLeaveModal(false);

    if (result.error) {
      setToast({ message: result.error, type: 'error' });
      return;
    }

    navigation.navigate(Routes.MeetupHome);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Barra superior de navegación con acción de editar (organizador) */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={theme.colors.textPrimary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalle</Text>
          {isOrganizer ? (
            <TouchableOpacity
              onPress={() =>
                !isCancelled &&
                !isFinished &&
                navigation.navigate(Routes.EditMeetup, { meetupId })
              }
              style={[
                styles.editBtn,
                (isCancelled || isFinished) && styles.editBtnDisabled,
              ]}
              activeOpacity={isCancelled || isFinished ? 1 : 0.7}
              disabled={isCancelled || isFinished}
            >
              <Ionicons
                name="create-outline"
                size={20}
                color={
                  isCancelled || isFinished
                    ? theme.colors.textDisabled
                    : theme.colors.primary
                }
              />
              <Text
                style={[
                  styles.editBtnText,
                  (isCancelled || isFinished) && styles.editBtnTextDisabled,
                ]}
              >
                Editar
              </Text>
            </TouchableOpacity>
          ) : (
            <View
              style={[
                styles.roleBadge,
                isOrganizer ? styles.badgeOrganizer : styles.badgeParticipant,
              ]}
            >
              <Text
                style={[
                  styles.roleBadgeText,
                  isOrganizer
                    ? styles.badgeTextOrganizer
                    : styles.badgeTextParticipant,
                ]}
              >
                {roleLabel}
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banners de estado + card principal con los datos de la juntada */}
        <MeetupDetailHeader
          meetup={meetup}
          hasAbandoned={hasAbandoned}
          participantCount={participants.length}
          confirmedCount={confirmedCount}
        />

        {/* Botones de acción: Jugar y Recuerdos — ocultos si abandonó */}
        {!isCancelled && !hasAbandoned && (
          <View style={styles.actionsRow}>
            {isActive && (
              <ActionCard
                icon="game-controller"
                label="Jugar"
                color={theme.colors.primary}
                onPress={() =>
                  navigation.navigate(Routes.ImpostorStart, { meetupId })
                }
              />
            )}
            <ActionCard
              icon="images"
              label="Recuerdos"
              color={theme.colors.secondary}
              onPress={() =>
                navigation.navigate(Routes.MemoriesGallery, {
                  meetupId,
                  isActive:
                    meetup.status === 'active' || meetup.status === 'finished',
                })
              }
            />
          </View>
        )}

        {/* Sección de participantes — oculta si el usuario abandonó */}
        {!hasAbandoned && (
          <MeetupParticipantsSummary
            participants={participants}
            isOrganizer={isOrganizer}
            isActive={isActive}
            isParticipant={isParticipant}
            onSeeAll={() =>
              navigation.navigate(Routes.ParticipantList, { meetupId })
            }
            onEditParticipant={(participant) =>
              setAttendanceModalTarget({ mode: 'organizer', participant })
            }
            onModifyOwnAttendance={() =>
              setAttendanceModalTarget({ mode: 'self' })
            }
          />
        )}

        {/* Volver a unirse — solo si abandonó y la juntada sigue activa */}
        {hasAbandoned && isActive && (
          <View style={styles.rejoinSection}>
            <AppButton
              label="Volver a unirme"
              onPress={() => navigation.navigate(Routes.JoinMeetup)}
            />
          </View>
        )}

        {/* Sección de compartir — solo en juntadas activas */}
        {isActive && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Compartir juntada</Text>
            <View style={styles.shareCard}>
              <Text style={styles.shareLabel}>Código de acceso</Text>
              {/* El código se muestra con letter-spacing ampliado para simular monospace */}
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{meetup.joinCode}</Text>
              </View>
              <Text style={styles.shareHint}>
                Compartí este código para que otros puedan unirse
              </Text>
              <View style={styles.shareButtons}>
                <Pressable
                  style={({ pressed }) => [
                    styles.shareBtn,
                    styles.shareBtnCopy,
                    pressed && styles.shareBtnPressed,
                  ]}
                  onPress={handleCopy}
                >
                  <Ionicons
                    name="copy-outline"
                    size={18}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.shareBtnText}>Copiar</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.shareBtn,
                    styles.shareBtnShare,
                    pressed && styles.shareBtnPressed,
                  ]}
                  onPress={handleShare}
                >
                  <Ionicons
                    name="share-social-outline"
                    size={18}
                    color={theme.colors.surface}
                  />
                  <Text style={[styles.shareBtnText, styles.shareBtnTextWhite]}>
                    Compartir
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* Acciones del organizador: finalizar y cancelar */}
        <MeetupOrganizerActions
          canFinish={canFinish}
          canCancel={isOrganizer && isActive}
          isFinishing={isFinishing}
          isCancelling={isCancelling}
          onFinishPress={() => setShowFinishModal(true)}
          onCancelPress={() => setShowCancelModal(true)}
        />

        {/* Abandonar juntada — solo participantes activos en juntadas activas */}
        {userRole === 'participant' && isActive && !hasAbandoned && (
          <View style={styles.leaveSection}>
            <TouchableOpacity
              style={[styles.leaveBtn, isLeaving && styles.leaveBtnDisabled]}
              onPress={() => setShowLeaveModal(true)}
              disabled={isLeaving}
              activeOpacity={0.8}
            >
              {isLeaving ? (
                <ActivityIndicator color={theme.colors.error} />
              ) : (
                <>
                  <Ionicons
                    name="exit-outline"
                    size={20}
                    color={theme.colors.error}
                  />
                  <Text style={styles.leaveBtnText}>Abandonar juntada</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>

      <ModifyAttendanceScreen
        visible={attendanceModalTarget !== null}
        currentStatus={modalCurrentStatus}
        participantName={modalParticipantName}
        onClose={() => {
          void handleAttendanceClose();
        }}
        onSave={async (status) => {
          if (attendanceModalTarget?.mode === 'organizer') {
            const result = await updateParticipantAttendance(
              attendanceModalTarget.participant.userId,
              status,
            );
            if (result.error) throw new Error(result.error);
            pendingToastRef.current = '✓ Asistencia actualizada';
            return;
          }

          const result = await updateAttendance(status);
          if (result.error) throw new Error(result.error);
          pendingToastRef.current = '✓ Asistencia actualizada';
        }}
      />

      {/* Modal de confirmación para finalizar juntada */}
      <Modal
        transparent
        animationType="fade"
        visible={showFinishModal}
        onRequestClose={() => !isFinishing && setShowFinishModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <Ionicons
                name="checkmark-circle-outline"
                size={32}
                color={theme.colors.warning}
              />
            </View>
            <Text style={styles.modalTitle}>Finalizar juntada</Text>
            <Text style={styles.modalSubtitle}>
              La juntada pasará al historial y ya no se podrán editar sus datos
              ni modificar acciones de organización.
            </Text>
            <View style={styles.modalActions}>
              <AppButton
                label="No, volver"
                variant="ghost"
                onPress={() => setShowFinishModal(false)}
                disabled={isFinishing}
              />
              <TouchableOpacity
                style={[
                  styles.modalWarningBtn,
                  isFinishing && styles.modalDestructiveBtnDisabled,
                ]}
                onPress={confirmFinishMeetup}
                disabled={isFinishing}
                activeOpacity={0.8}
              >
                {isFinishing ? (
                  <ActivityIndicator color={theme.colors.surface} />
                ) : (
                  <Text style={styles.modalWarningBtnText}>Sí, finalizar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmación para cancelar juntada */}
      <Modal
        transparent
        animationType="fade"
        visible={showCancelModal}
        onRequestClose={() => !isCancelling && setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <Ionicons name="warning" size={32} color={theme.colors.error} />
            </View>
            <Text style={styles.modalTitle}>Cancelar juntada</Text>
            <Text style={styles.modalSubtitle}>
              Esta acción no se puede deshacer. Todos los participantes perderán
              acceso a la juntada.
            </Text>
            <View style={styles.modalActions}>
              <AppButton
                label="No, volver"
                variant="ghost"
                onPress={() => setShowCancelModal(false)}
                disabled={isCancelling}
              />
              <TouchableOpacity
                style={[
                  styles.modalDestructiveBtn,
                  isCancelling && styles.modalDestructiveBtnDisabled,
                ]}
                onPress={confirmCancelMeetup}
                disabled={isCancelling}
                activeOpacity={0.8}
              >
                {isCancelling ? (
                  <ActivityIndicator color={theme.colors.surface} />
                ) : (
                  <Text style={styles.modalDestructiveBtnText}>
                    Sí, cancelar
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmación para abandonar juntada */}
      <Modal
        transparent
        animationType="fade"
        visible={showLeaveModal}
        onRequestClose={() => !isLeaving && setShowLeaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <Ionicons
                name="exit-outline"
                size={32}
                color={theme.colors.error}
              />
            </View>
            <Text style={styles.modalTitle}>Abandonar juntada</Text>
            <Text style={styles.modalSubtitle}>
              ¿Estás seguro? Podés volver a unirte con el código si cambiás de
              opinión.
            </Text>
            <View style={styles.modalActions}>
              <AppButton
                label="No, volver"
                variant="ghost"
                onPress={() => setShowLeaveModal(false)}
                disabled={isLeaving}
              />
              <TouchableOpacity
                style={[
                  styles.modalDestructiveBtn,
                  isLeaving && styles.modalDestructiveBtnDisabled,
                ]}
                onPress={confirmLeaveMeetup}
                disabled={isLeaving}
                activeOpacity={0.8}
              >
                {isLeaving ? (
                  <ActivityIndicator color={theme.colors.surface} />
                ) : (
                  <Text style={styles.modalDestructiveBtnText}>
                    Sí, abandonar
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AppTabBar activeTab="home" />

      <Toast
        message={toast?.message ?? ''}
        type={toast?.type ?? 'success'}
        visible={!!toast}
        onHide={() => setToast(null)}
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
    width: 36,
    height: 36,
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
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: 6,
  },
  editBtnText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
  editBtnDisabled: {
    opacity: 0.5,
    backgroundColor: theme.colors.background,
  },
  editBtnTextDisabled: {
    color: theme.colors.textDisabled,
  },
  roleBadge: {
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: 4,
  },
  badgeOrganizer: {
    backgroundColor: '#FEF3C7',
  },
  badgeParticipant: {
    backgroundColor: theme.colors.primaryLight,
  },
  roleBadgeText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
  },
  badgeTextOrganizer: {
    color: '#92400E',
  },
  badgeTextParticipant: {
    color: theme.colors.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    gap: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  actionCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  actionIconBox: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
  },
  section: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  rejoinSection: {
    marginBottom: theme.spacing.md,
  },
  leaveSection: {
    marginBottom: theme.spacing.md,
  },
  leaveBtn: {
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
  leaveBtnDisabled: {
    opacity: 0.6,
  },
  leaveBtnText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.error,
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
    /* Letter-spacing ampliado para simular tipografía monospace */
  },
  shareHint: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  shareButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    width: '100%',
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
  },
  shareBtnCopy: {
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  shareBtnShare: {
    backgroundColor: theme.colors.primary,
  },
  shareBtnPressed: {
    opacity: 0.8,
  },
  shareBtnText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
  shareBtnTextWhite: {
    color: theme.colors.surface,
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
  modalIconBox: {
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
  modalDestructiveBtn: {
    height: theme.components.buttonHeight,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  modalWarningBtn: {
    height: theme.components.buttonHeight,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.warning,
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
  modalWarningBtnText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.surface,
  },
  bottomSpace: {
    height: theme.spacing.xl,
  },
});

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
  ActivityIndicator,
  Pressable,
  Modal,
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
import { Toast } from '@/shared/components/Toast';
import { ModifyAttendanceScreen } from '@/features/participants/screens/ModifyAttendanceScreen';
import { getParticipantDisplayName } from '@/features/participants/utils/participantDisplay';
import { useMeetupDetail } from '../hooks/useMeetupDetail';
import {
  useHideMeetup,
  useDeleteMeetupForAll,
} from '../hooks/useMeetups';
import { triggerSuccessHaptic } from '@/shared/utils/haptics';
import { MeetupDetailHeader } from '../components/MeetupDetailHeader';
import { MeetupParticipantsSummary } from '../components/MeetupParticipantsSummary';
import { MeetupOrganizerActions } from '../components/MeetupOrganizerActions';
import { MeetupShareButton } from '../components/MeetupShareButton';
import { ReviewsSection } from '@/features/reviews/components/ReviewsSection';
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
    currentUserId,
    cancel,
    leave,
    updateAttendance,
    updateParticipantAttendance,
    reload,
    refreshAll,
  } = useMeetupDetail(meetupId);

  // Estados de UI: visibilidad de modales y operaciones en curso
  const [attendanceModalTarget, setAttendanceModalTarget] =
    useState<AttendanceModalTarget | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [pendingHistoryAction, setPendingHistoryAction] = useState<
    'hide' | 'delete' | null
  >(null);
  /** Navega al historial tras mostrar el toast de ocultar/eliminar */
  const [shouldNavigateBackAfterToast, setShouldNavigateBackAfterToast] =
    useState(false);

  const hideMutation = useHideMeetup();
  const deleteMutation = useDeleteMeetupForAll();

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

  const isHistoryActionLoading =
    hideMutation.isPending || deleteMutation.isPending;

  /**
   * Confirma ocultar o eliminar la juntada desde el detalle.
   * Reutiliza la misma lógica del historial (swipe) para mantener consistencia.
   */
  const confirmHistoryAction = async () => {
    if (!pendingHistoryAction) return;

    if (pendingHistoryAction === 'hide') {
      const result = await hideMutation.mutateAsync(meetupId);
      setPendingHistoryAction(null);

      if (result.error) {
        setToast({ message: result.error, type: 'error' });
        return;
      }

      void triggerSuccessHaptic();
      setToast({
        message: '✓ Juntada ocultada de tu historial',
        type: 'success',
      });
      setShouldNavigateBackAfterToast(true);
      return;
    }

    const result = await deleteMutation.mutateAsync(meetupId);
    setPendingHistoryAction(null);

    if (result.error) {
      setToast({ message: result.error, type: 'error' });
      return;
    }

    void triggerSuccessHaptic();
    setToast({ message: '✓ Juntada eliminada', type: 'success' });
    setShouldNavigateBackAfterToast(true);
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

        {/* Reseñas — solo en juntadas finalizadas con reseñas habilitadas */}
        {isFinished && meetup.reviews_enabled && currentUserId && (
          <ReviewsSection
            meetupId={meetupId}
            currentUserId={currentUserId}
            reviewsEnabled={meetup.reviews_enabled ?? false}
            meetupStatus={meetup.status}
            onAddReview={() =>
              navigation.navigate(Routes.ReviewForm, {
                meetupId,
                meetupTitle: meetup.title,
              })
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
              {/* Botón con bottom sheet: copiar código o compartir por WhatsApp.
                  Visible para todos los miembros (organizador y participantes). */}
              <View style={styles.shareButtonWrapper}>
                <MeetupShareButton
                  meetupTitle={meetup.title}
                  joinCode={meetup.joinCode}
                  onFeedback={(message, type) => setToast({ message, type })}
                />
              </View>
            </View>
          </View>
        )}

        {/* Acciones del organizador: finalizar y cancelar */}
        <MeetupOrganizerActions
          canFinish={canFinish}
          canCancel={isOrganizer && isActive}
          isCancelling={isCancelling}
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

        {/* Zona destructiva — visible en juntadas finalizadas o canceladas */}
        {(isFinished || isCancelled) && (
          <View style={styles.destructiveSection}>
            <Text style={styles.destructiveSectionTitle}>
              Acciones del historial
            </Text>
            <Text style={styles.destructiveSectionHint}>
              {isOrganizer
                ? 'Podés eliminar la juntada para todos los participantes'
                : 'Podés ocultar esta juntada solo de tu historial'}
            </Text>
            {isOrganizer ? (
              <TouchableOpacity
                style={[
                  styles.destructiveBtn,
                  isHistoryActionLoading && styles.destructiveBtnDisabled,
                ]}
                onPress={() => setPendingHistoryAction('delete')}
                disabled={isHistoryActionLoading}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={theme.colors.error}
                />
                <Text style={styles.destructiveBtnText}>
                  Eliminar juntada para todos
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.destructiveBtn,
                  isHistoryActionLoading && styles.destructiveBtnDisabled,
                ]}
                onPress={() => setPendingHistoryAction('hide')}
                disabled={isHistoryActionLoading}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="eye-off-outline"
                  size={20}
                  color={theme.colors.error}
                />
                <Text style={styles.destructiveBtnText}>
                  Ocultar de mi historial
                </Text>
              </TouchableOpacity>
            )}
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

      {/* Modal de confirmación para ocultar o eliminar del historial */}
      <Modal
        transparent
        animationType="fade"
        visible={pendingHistoryAction !== null}
        onRequestClose={() =>
          !isHistoryActionLoading && setPendingHistoryAction(null)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View
              style={[
                styles.modalIconBox,
                pendingHistoryAction === 'delete' &&
                  styles.modalIconBoxDanger,
              ]}
            >
              <Ionicons
                name={
                  pendingHistoryAction === 'delete'
                    ? 'trash-outline'
                    : 'eye-off-outline'
                }
                size={32}
                color={
                  pendingHistoryAction === 'delete'
                    ? theme.colors.error
                    : theme.colors.primary
                }
              />
            </View>

            {pendingHistoryAction === 'hide' ? (
              <>
                <Text style={styles.modalTitle}>
                  ¿Querés ocultar esta juntada de tu historial?
                </Text>
                <Text style={styles.modalSubtitle}>
                  Solo desaparecerá para vos.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>
                  ¿Eliminar esta juntada para todos los participantes?
                </Text>
                <Text style={styles.modalSubtitle}>
                  Esta acción no se puede deshacer.
                </Text>
              </>
            )}

            <View style={styles.modalActions}>
              <AppButton
                label="Cancelar"
                variant="ghost"
                onPress={() => setPendingHistoryAction(null)}
                disabled={isHistoryActionLoading}
              />
              <TouchableOpacity
                style={[
                  styles.modalDestructiveBtn,
                  isHistoryActionLoading && styles.modalDestructiveBtnDisabled,
                ]}
                onPress={() => void confirmHistoryAction()}
                disabled={isHistoryActionLoading}
                activeOpacity={0.8}
              >
                {isHistoryActionLoading ? (
                  <ActivityIndicator color={theme.colors.surface} />
                ) : (
                  <Text style={styles.modalDestructiveBtnText}>
                    {pendingHistoryAction === 'hide'
                      ? 'Sí, ocultar'
                      : 'Sí, eliminar'}
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
        onHide={() => {
          setToast(null);
          if (shouldNavigateBackAfterToast) {
            setShouldNavigateBackAfterToast(false);
            navigation.goBack();
          }
        }}
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
  destructiveSection: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  destructiveSectionTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  destructiveSectionHint: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: theme.spacing.xs,
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
  modalIconBoxDanger: {
    backgroundColor: theme.colors.errorLight,
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
  shareButtonWrapper: {
    width: '100%',
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

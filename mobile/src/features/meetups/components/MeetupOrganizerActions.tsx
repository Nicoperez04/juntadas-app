/**
 * Botones de acción del organizador en el detalle de juntada.
 *
 * Agrupa "Transferir organización" (delegar el rol a otro participante),
 * "Finalizar juntada" (visible cuando la juntada ya comenzó) y
 * "Cancelar juntada" (visible mientras la juntada esté activa).
 *
 * Finalizar y cancelar solo disparan los callbacks de apertura de modal;
 * la confirmación y la ejecución quedan en la pantalla orquestadora.
 * La transferencia de organización, en cambio, es autosuficiente: lee el
 * meetupId de la ruta (este componente solo se renderiza dentro del detalle)
 * y resuelve datos y mutación con los hooks cacheados de TanStack Query,
 * para no modificar el contrato de props con la pantalla.
 */
import React, { useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Image,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { theme } from '@/shared/constants/theme';
import { AppButton } from '@/shared/components/AppButton';
import { Toast } from '@/shared/components/Toast';
import { triggerSuccessHaptic } from '@/shared/utils/haptics';
import { useReviews } from '@/features/reviews/hooks/useReviews';
import { useMeetupDetail } from '../hooks/useMeetupDetail';
import { useTransferOrganizer, useReactivateMeetup } from '../hooks/useMeetups';
import type { MeetupParticipant } from '../types';
import type { MainStackParamList } from '@/navigation/types';

type DetailRouteProp = RouteProp<MainStackParamList, 'MeetupDetail'>;

/** Paso visible dentro del modal único de transferencia de organización */
type TransferModalStep = 'closed' | 'list' | 'confirm';

/** Props de las acciones del organizador */
interface MeetupOrganizerActionsProps {
  /** true cuando la juntada ya comenzó y puede finalizarse */
  canFinish: boolean;
  /** true cuando la juntada está activa y puede cancelarse */
  canCancel: boolean;
  /** true mientras la cancelación está en curso — deshabilita el botón */
  isCancelling: boolean;
  /** Abre el modal de confirmación de cancelación */
  onCancelPress: () => void;
}

/**
 * Extrae las iniciales de un nombre completo (máximo 2 caracteres)
 * para el avatar placeholder cuando el participante no tiene foto.
 *
 * @param name - Nombre completo del participante
 * @returns Iniciales en mayúsculas o '?' si el nombre está vacío
 */
const getInitials = (name: string): string => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const MeetupOrganizerActions = ({
  canFinish,
  canCancel,
  isCancelling,
  onCancelPress,
}: MeetupOrganizerActionsProps) => {
  // El componente vive únicamente dentro de MeetupDetailScreen, por lo que
  // la ruta actual siempre trae el meetupId del detalle.
  const route = useRoute<DetailRouteProp>();
  const { meetupId } = route.params;

  // Datos cacheados del detalle: no disparan fetches duplicados porque
  // comparten las query keys con la pantalla.
  const { participants, currentUserId, isOrganizer, isActive, isFinished, meetup, finish } =
    useMeetupDetail(meetupId);
  const transferMutation = useTransferOrganizer();
  const reactivateMutation = useReactivateMeetup();
  const reviewsQuery = useReviews(meetupId);

  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [reviewsEnabled, setReviewsEnabled] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);

  // Un solo modal con pasos internos evita el doble parpadeo de dos Modal
  // montados que alternaban visible al abrir o al elegir un participante.
  const [transferModalStep, setTransferModalStep] =
    useState<TransferModalStep>('closed');
  const [transferTarget, setTransferTarget] =
    useState<MeetupParticipant | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  /**
   * Diferimos el toast de éxito hasta que el modal termine de cerrarse,
   * igual que en MeetupDetailScreen con el modal de asistencia.
   */
  const pendingToastRef = useRef<string | null>(null);

  /** Candidatos a organizador: participantes activos excluyendo al actual */
  const transferCandidates = participants.filter(
    (p) => p.userId !== currentUserId,
  );

  /**
   * Cierra el modal de transferencia y muestra el toast pendiente, si existe.
   * Se invoca al cerrar manualmente o tras una transferencia exitosa.
   */
  const closeTransferModal = () => {
    setTransferModalStep('closed');
    setTransferTarget(null);

    if (pendingToastRef.current) {
      setToast({ message: pendingToastRef.current, type: 'success' });
      pendingToastRef.current = null;
    }
  };

  const confirmTransfer = async () => {
    if (!transferTarget) return;

    const result = await transferMutation.mutateAsync({
      meetupId,
      newOrganizerUserId: transferTarget.userId,
    });

    if (result.error) {
      closeTransferModal();
      setToast({ message: result.error, type: 'error' });
      return;
    }

    pendingToastRef.current = '✓ Organización transferida';
    void triggerSuccessHaptic();
    closeTransferModal();
  };

  /**
   * Cierra el modal de finalización y resetea el toggle de reseñas.
   * Muestra el toast pendiente si la operación fue exitosa.
   */
  const closeFinishModal = () => {
    setShowFinishModal(false);
    setReviewsEnabled(false);

    if (pendingToastRef.current) {
      setToast({ message: pendingToastRef.current, type: 'success' });
      pendingToastRef.current = null;
    }
  };

  /**
   * Ejecuta la finalización con la opción de reseñas elegida por el organizador.
   */
  const confirmFinishMeetup = async () => {
    setIsFinishing(true);
    const result = await finish(reviewsEnabled);
    setIsFinishing(false);

    if (result.error) {
      setShowFinishModal(false);
      setReviewsEnabled(false);
      setToast({ message: result.error, type: 'error' });
      return;
    }

    pendingToastRef.current = '✓ Juntada finalizada';
    void triggerSuccessHaptic();
    closeFinishModal();
  };

  /**
   * Cierra el modal de reactivación y muestra el toast pendiente si la
   * operación fue exitosa.
   */
  const closeReactivateModal = () => {
    setShowReactivateModal(false);

    if (pendingToastRef.current) {
      setToast({ message: pendingToastRef.current, type: 'success' });
      pendingToastRef.current = null;
    }
  };

  /**
   * Reactiva una juntada finalizada volviéndola a status active.
   * Las reseñas existentes se conservan en la base de datos.
   */
  const confirmReactivateMeetup = async () => {
    setIsReactivating(true);
    const result = await reactivateMutation.mutateAsync(meetupId);
    setIsReactivating(false);

    if (result.error) {
      setShowReactivateModal(false);
      setToast({ message: result.error, type: 'error' });
      return;
    }

    pendingToastRef.current = '✓ Juntada reactivada';
    void triggerSuccessHaptic();
    closeReactivateModal();
  };

  /** true si hay reseñas que mostrar advertencia al reactivar */
  const hasExistingReviews =
    !!meetup?.reviews_enabled && (reviewsQuery.data?.length ?? 0) > 0;

  const isTransferring = transferMutation.isPending;
  const isTransferModalOpen = transferModalStep !== 'closed';

  return (
    <>
      {/* Transferir organización — solo el organizador en juntadas activas */}
      {isOrganizer && isActive && (
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.transferBtn}
            onPress={() => setTransferModalStep('list')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Transferir organización de la juntada"
          >
            <Ionicons
              name="swap-horizontal-outline"
              size={18}
              color={theme.colors.primary}
            />
            <Text style={styles.transferBtnText}>Transferir organización</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Finalizar juntada — solo cuando la juntada ya comenzó */}
      {canFinish && (
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.finishBtn, isFinishing && styles.btnDisabled]}
            onPress={() => setShowFinishModal(true)}
            disabled={isFinishing}
            activeOpacity={0.8}
          >
            {isFinishing ? (
              <ActivityIndicator color={theme.colors.warning} />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color={theme.colors.warning}
                />
                <Text style={styles.finishBtnText}>Finalizar juntada</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Reactivar juntada — solo organizador en juntadas finalizadas */}
      {isOrganizer && isFinished && (
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.reactivateBtn, isReactivating && styles.btnDisabled]}
            onPress={() => setShowReactivateModal(true)}
            disabled={isReactivating}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Reactivar juntada finalizada"
          >
            {isReactivating ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <>
                <Ionicons
                  name="refresh-outline"
                  size={18}
                  color={theme.colors.primary}
                />
                <Text style={styles.reactivateBtnText}>Reactivar juntada</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Cancelar juntada — solo en juntadas activas */}
      {canCancel && (
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.cancelBtn, isCancelling && styles.btnDisabled]}
            onPress={onCancelPress}
            disabled={isCancelling}
            activeOpacity={0.8}
          >
            {isCancelling ? (
              <ActivityIndicator color={theme.colors.error} />
            ) : (
              <>
                <Ionicons
                  name="close-circle-outline"
                  size={18}
                  color={theme.colors.error}
                />
                <Text style={styles.cancelBtnText}>Cancelar juntada</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Modal único: lista de candidatos o confirmación según el paso activo */}
      <Modal
        transparent
        animationType="fade"
        visible={isTransferModalOpen}
        onRequestClose={() => {
          if (isTransferring) return;
          closeTransferModal();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {transferModalStep === 'list' ? (
              <>
                <Text style={styles.modalTitle}>Transferir organización</Text>
                <Text style={styles.modalSubtitle}>
                  Elegí al participante que pasará a ser el organizador de la
                  juntada.
                </Text>

                {transferCandidates.length === 0 ? (
                  <Text style={styles.emptyCandidatesText}>
                    No hay otros participantes activos para transferir la
                    organización.
                  </Text>
                ) : (
                  <ScrollView
                    style={styles.candidatesList}
                    showsVerticalScrollIndicator={false}
                  >
                    {transferCandidates.map((participant) => (
                      <TouchableOpacity
                        key={participant.id}
                        style={styles.candidateRow}
                        onPress={() => {
                          setTransferTarget(participant);
                          setTransferModalStep('confirm');
                        }}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`Transferir organización a ${participant.profile.fullName}`}
                      >
                        {participant.profile.avatarUrl ? (
                          <Image
                            source={{ uri: participant.profile.avatarUrl }}
                            style={styles.candidateAvatar}
                          />
                        ) : (
                          <View
                            style={[
                              styles.candidateAvatar,
                              styles.candidateAvatarPlaceholder,
                            ]}
                          >
                            <Text style={styles.candidateAvatarInitials}>
                              {getInitials(participant.profile.fullName)}
                            </Text>
                          </View>
                        )}
                        <View style={styles.candidateInfo}>
                          <Text style={styles.candidateName} numberOfLines={1}>
                            {participant.profile.fullName}
                          </Text>
                          <Text
                            style={styles.candidateUsername}
                            numberOfLines={1}
                          >
                            @{participant.profile.username}
                          </Text>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={theme.colors.textDisabled}
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                <AppButton
                  label="Cerrar"
                  variant="ghost"
                  onPress={closeTransferModal}
                />
              </>
            ) : (
              <>
                <View style={styles.modalIconBox}>
                  <Ionicons
                    name="swap-horizontal"
                    size={32}
                    color={theme.colors.primary}
                  />
                </View>
                <Text style={styles.modalTitle}>
                  ¿Transferir la organización a{' '}
                  {transferTarget?.profile.fullName}?
                </Text>
                <Text style={styles.modalSubtitle}>
                  Ya no podrás administrar esta juntada.
                </Text>
                <View style={styles.modalActions}>
                  <AppButton
                    label="No, volver"
                    variant="ghost"
                    onPress={() => setTransferModalStep('list')}
                    disabled={isTransferring}
                  />
                  <TouchableOpacity
                    style={[
                      styles.modalConfirmBtn,
                      isTransferring && styles.btnDisabled,
                    ]}
                    onPress={() => void confirmTransfer()}
                    disabled={isTransferring}
                    activeOpacity={0.8}
                  >
                    {isTransferring ? (
                      <ActivityIndicator color={theme.colors.surface} />
                    ) : (
                      <Text style={styles.modalConfirmBtnText}>
                        Sí, transferir
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de confirmación para finalizar juntada con toggle de reseñas */}
      <Modal
        transparent
        animationType="fade"
        visible={showFinishModal}
        onRequestClose={() => !isFinishing && closeFinishModal()}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIconBox, styles.finishModalIconBox]}>
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

            <View style={styles.reviewsToggleRow}>
              <Text style={styles.reviewsToggleLabel}>
                ¿Querés que los participantes puedan dejar una reseña de esta
                juntada?
              </Text>
              <Switch
                value={reviewsEnabled}
                onValueChange={setReviewsEnabled}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primaryLight,
                }}
                thumbColor={
                  reviewsEnabled ? theme.colors.primary : theme.colors.surface
                }
                disabled={isFinishing}
              />
            </View>

            <View style={styles.modalActions}>
              <AppButton
                label="No, volver"
                variant="ghost"
                onPress={closeFinishModal}
                disabled={isFinishing}
              />
              <TouchableOpacity
                style={[
                  styles.modalWarningBtn,
                  isFinishing && styles.btnDisabled,
                ]}
                onPress={() => void confirmFinishMeetup()}
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

      {/* Modal de confirmación para reactivar juntada finalizada */}
      <Modal
        transparent
        animationType="fade"
        visible={showReactivateModal}
        onRequestClose={() => !isReactivating && closeReactivateModal()}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <Ionicons
                name="refresh-outline"
                size={32}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.modalTitle}>
              ¿Reactivar esta juntada? Volverá a aparecer como activa.
            </Text>
            {hasExistingReviews && (
              <Text style={styles.reactivateWarning}>
                Esta juntada tiene reseñas. Al reactivarla se conservan, pero no
                se podrán agregar nuevas hasta que la finalices de nuevo.
              </Text>
            )}
            <View style={styles.modalActions}>
              <AppButton
                label="No, volver"
                variant="ghost"
                onPress={closeReactivateModal}
                disabled={isReactivating}
              />
              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  isReactivating && styles.btnDisabled,
                ]}
                onPress={() => void confirmReactivateMeetup()}
                disabled={isReactivating}
                activeOpacity={0.8}
              >
                {isReactivating ? (
                  <ActivityIndicator color={theme.colors.surface} />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Sí, reactivar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast
        message={toast?.message ?? ''}
        type={toast?.type ?? 'success'}
        visible={!!toast}
        onHide={() => setToast(null)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  actionSection: {
    marginBottom: theme.spacing.md,
  },
  transferBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  transferBtnText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
  reactivateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  reactivateBtnText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
  finishBtn: {
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
  finishBtnText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.warning,
  },
  cancelBtn: {
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
  cancelBtnText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.error,
  },
  btnDisabled: {
    opacity: 0.6,
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
    backgroundColor: theme.colors.primaryLight,
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
  modalConfirmBtn: {
    height: theme.components.buttonHeight,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  modalConfirmBtnText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.surface,
  },
  candidatesList: {
    width: '100%',
    maxHeight: 320,
    marginBottom: theme.spacing.md,
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  candidateAvatar: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
  },
  candidateAvatarPlaceholder: {
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  candidateAvatarInitials: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  candidateInfo: {
    flex: 1,
  },
  candidateName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  candidateUsername: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  emptyCandidatesText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  finishModalIconBox: {
    backgroundColor: theme.colors.warningLight,
  },
  reviewsToggleRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  reviewsToggleLabel: {
    flex: 1,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textPrimary,
    lineHeight: 20,
  },
  reactivateWarning: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.warning,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.warningLight,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
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
  modalWarningBtnText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.surface,
  },
});

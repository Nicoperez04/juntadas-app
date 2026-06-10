/**
 * Pantalla para crear o editar la reseña del usuario sobre una juntada.
 *
 * Si el usuario ya tiene reseña, precarga rating y comentario para edición.
 * Permite eliminar la reseña propia con confirmación previa.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { theme } from '@/shared/constants/theme';
import { AppButton } from '@/shared/components/AppButton';
import { Toast } from '@/shared/components/Toast';
import { triggerSuccessHaptic } from '@/shared/utils/haptics';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import {
  useUserReview,
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
} from '../hooks/useReviews';
import { createReviewSchema } from '../schemas/reviewSchemas';
import type { MainStackParamList } from '@/navigation/types';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'ReviewForm'>;
type RoutePropType = RouteProp<MainStackParamList, 'ReviewForm'>;

/** Cantidad máxima de caracteres del comentario */
const MAX_COMMENT_LENGTH = 500;

/** Tamaño mínimo de cada estrella interactiva (36dp) */
const STAR_SIZE = 40;

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
}

/**
 * Selector de rating con 5 estrellas tocables.
 *
 * @param value - Rating actual (1-5; 0 si no hay selección)
 * @param onChange - Callback al elegir una estrella
 */
const StarRating = ({ value, onChange }: StarRatingProps) => (
  <View style={styles.starsRow}>
    {[1, 2, 3, 4, 5].map((star) => (
      <TouchableOpacity
        key={star}
        onPress={() => onChange(star)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${star} estrella${star > 1 ? 's' : ''}`}
      >
        <Ionicons
          name={star <= value ? 'star' : 'star-outline'}
          size={STAR_SIZE}
          color={star <= value ? theme.colors.warning : theme.colors.textDisabled}
        />
      </TouchableOpacity>
    ))}
  </View>
);

export const ReviewFormScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { meetupId, meetupTitle } = route.params;
  const { userId } = useCurrentUser();

  const userReviewQuery = useUserReview(meetupId, userId);
  const createMutation = useCreateReview(meetupId);
  const updateMutation = useUpdateReview(meetupId);
  const deleteMutation = useDeleteReview(meetupId);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const existingReview = userReviewQuery.data;
  const isEditing = !!existingReview;
  const isSaving =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  // Precarga datos si el usuario ya tiene reseña
  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment ?? '');
    }
  }, [existingReview]);

  /**
   * Valida y guarda la reseña (crear o actualizar según corresponda).
   */
  const handleSave = async () => {
    setErrorMessage(null);

    const parsed = createReviewSchema.safeParse({
      rating,
      comment: comment.trim() || undefined,
    });

    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }

    if (isEditing && existingReview) {
      const result = await updateMutation.mutateAsync({
        reviewId: existingReview.id,
        input: parsed.data,
      });

      if (result.error) {
        setErrorMessage(result.error);
        return;
      }
    } else {
      const result = await createMutation.mutateAsync(parsed.data);

      if (result.error) {
        setErrorMessage(result.error);
        return;
      }
    }

    void triggerSuccessHaptic();
    setToast({ message: '✓ Reseña guardada', type: 'success' });
    setTimeout(() => navigation.goBack(), 900);
  };

  /**
   * Elimina la reseña propia tras confirmación en el modal.
   */
  const handleDelete = async () => {
    if (!existingReview) return;

    const result = await deleteMutation.mutateAsync(existingReview.id);
    setShowDeleteModal(false);

    if (result.error) {
      setErrorMessage(result.error);
      return;
    }

    void triggerSuccessHaptic();
    setToast({ message: '✓ Reseña eliminada', type: 'success' });
    setTimeout(() => navigation.goBack(), 900);
  };

  if (userReviewQuery.isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
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
          <Text style={styles.headerTitle}>Tu reseña</Text>
          <View style={styles.headerPlaceholder} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.meetupSubtitle} numberOfLines={2}>
          {meetupTitle}
        </Text>

        <Text style={styles.fieldLabel}>¿Cómo estuvo la juntada?</Text>
        <StarRating value={rating} onChange={setRating} />

        <Text style={styles.fieldLabel}>Comentario (opcional)</Text>
        <TextInput
          style={styles.commentInput}
          value={comment}
          onChangeText={(text) =>
            setComment(text.slice(0, MAX_COMMENT_LENGTH))
          }
          placeholder="Contanos qué te pareció..."
          placeholderTextColor={theme.colors.textDisabled}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={MAX_COMMENT_LENGTH}
        />
        <Text style={styles.charCounter}>
          {comment.length}/{MAX_COMMENT_LENGTH}
        </Text>

        {errorMessage && (
          <Text style={styles.errorText}>{errorMessage}</Text>
        )}

        <View style={styles.actions}>
          <AppButton
            label="Guardar reseña"
            onPress={() => void handleSave()}
            isLoading={isSaving}
            disabled={rating === 0}
          />

          {isEditing && (
            <AppButton
              label="Eliminar reseña"
              variant="ghost"
              onPress={() => setShowDeleteModal(true)}
              disabled={isSaving}
            />
          )}
        </View>
      </ScrollView>

      <Modal
        transparent
        animationType="fade"
        visible={showDeleteModal}
        onRequestClose={() => !deleteMutation.isPending && setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <Ionicons name="trash-outline" size={32} color={theme.colors.error} />
            </View>
            <Text style={styles.modalTitle}>Eliminar reseña</Text>
            <Text style={styles.modalSubtitle}>
              ¿Estás seguro? Esta acción no se puede deshacer.
            </Text>
            <View style={styles.modalActions}>
              <AppButton
                label="No, volver"
                variant="ghost"
                onPress={() => setShowDeleteModal(false)}
                disabled={deleteMutation.isPending}
              />
              <TouchableOpacity
                style={[
                  styles.modalDestructiveBtn,
                  deleteMutation.isPending && styles.btnDisabled,
                ]}
                onPress={() => void handleDelete()}
                disabled={deleteMutation.isPending}
                activeOpacity={0.8}
              >
                {deleteMutation.isPending ? (
                  <ActivityIndicator color={theme.colors.surface} />
                ) : (
                  <Text style={styles.modalDestructiveBtnText}>
                    Sí, eliminar
                  </Text>
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
  headerPlaceholder: {
    width: 36,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  meetupSubtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  fieldLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  commentInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: theme.components.inputBorderWidth,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textPrimary,
    minHeight: 120,
  },
  charCounter: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.error,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  actions: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
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
  modalDestructiveBtnText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.surface,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});

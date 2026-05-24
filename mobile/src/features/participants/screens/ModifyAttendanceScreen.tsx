/**
 * Modal bottom sheet para modificar el estado de asistencia.
 *
 * Soporta edición propia o del organizador sobre otro participante.
 * Incluye gestos de arrastre, hápticos, accesibilidad y animaciones unificadas.
 */
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  Dimensions,
  PanResponder,
  AccessibilityInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/shared/constants/theme';
import { AppButton } from '@/shared/components/AppButton';
import {
  triggerSelectionHaptic,
  triggerSuccessHaptic,
} from '@/shared/utils/haptics';
import type { AttendanceStatus } from '../types';

/** Definición visual de cada opción de asistencia con íconos de Ionicons */
interface AttendanceOption {
  status: AttendanceStatus;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  color: string;
  bgColor: string;
}

const ATTENDANCE_OPTIONS: AttendanceOption[] = [
  {
    status: 'confirmed',
    icon: 'checkmark-circle',
    label: 'Confirmado',
    description: 'Voy a asistir a la juntada',
    color: theme.colors.success,
    bgColor: theme.colors.successLight,
  },
  {
    status: 'pending',
    icon: 'time',
    label: 'Pendiente',
    description: 'Todavía no lo tengo claro',
    color: theme.colors.warning,
    bgColor: '#FEF3C7',
  },
  {
    status: 'declined',
    icon: 'close-circle',
    label: 'Decliné',
    description: 'No voy a poder asistir',
    color: theme.colors.error,
    bgColor: theme.colors.errorLight,
  },
];

interface ModifyAttendanceProps {
  visible: boolean;
  currentStatus: AttendanceStatus;
  /** Se invoca al confirmar con Guardar; puede ser async */
  onSave: (status: AttendanceStatus) => void | Promise<void>;
  onClose: () => void;
  /** Nombre del participante cuando el organizador edita a otro */
  participantName?: string;
}

/** Duración de la animación del overlay */
const OVERLAY_ANIMATION_MS = 220;

/** Duración del slide del bottom sheet */
const SHEET_ANIMATION_MS = 280;

/** Desplazamiento inicial del sheet fuera de pantalla */
const SHEET_OFFSET = Dimensions.get('window').height * 0.45;

/** Distancia mínima de arrastre hacia abajo para cerrar el sheet */
const DRAG_DISMISS_THRESHOLD = 80;

export const ModifyAttendanceScreen = ({
  visible,
  currentStatus,
  onSave,
  onClose,
  participantName,
}: ModifyAttendanceProps) => {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SHEET_OFFSET)).current;
  const dragOffsetY = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus>(currentStatus);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const isClosingRef = useRef(false);
  const prevVisibleRef = useRef(false);
  const isSavingRef = useRef(false);

  const isOrganizerMode = !!participantName;

  const sheetTransform = useMemo(
    () =>
      Animated.add(
        sheetTranslateY,
        dragOffsetY,
      ),
    [sheetTranslateY, dragOffsetY],
  );

  /**
   * Anima overlay y sheet en paralelo para transiciones limpias sin doble fade.
   */
  const runAnimation = useCallback(
    (overlayTo: number, sheetTo: number) =>
      new Promise<void>((resolve) => {
        Animated.parallel([
          Animated.timing(overlayOpacity, {
            toValue: overlayTo,
            duration: OVERLAY_ANIMATION_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(sheetTranslateY, {
            toValue: sheetTo,
            duration: SHEET_ANIMATION_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start(({ finished }) => {
          if (finished) resolve();
        });
      }),
    [overlayOpacity, sheetTranslateY],
  );

  /**
   * Restaura el sheet a su posición tras un arrastre insuficiente para cerrar.
   */
  const resetDrag = useCallback(() => {
    Animated.spring(dragOffsetY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 220,
    }).start();
  }, [dragOffsetY]);

  /**
   * Cierra con animación y recién entonces notifica al padre vía onClose.
   */
  const closeModal = useCallback(async () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    dragOffsetY.setValue(0);

    await runAnimation(0, SHEET_OFFSET);
    setModalVisible(false);
    isClosingRef.current = false;
    onClose();
  }, [dragOffsetY, onClose, runAnimation]);

  /**
   * PanResponder limitado al handle para drag-to-dismiss sin interferir con scroll.
   */
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !isSavingRef.current,
        onMoveShouldSetPanResponder: (_, gesture) =>
          !isSavingRef.current && gesture.dy > 4,
        onPanResponderMove: (_, gesture) => {
          if (gesture.dy > 0) {
            dragOffsetY.setValue(gesture.dy);
          }
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > DRAG_DISMISS_THRESHOLD) {
            void closeModal();
            return;
          }
          resetDrag();
        },
        onPanResponderTerminate: () => {
          resetDrag();
        },
      }),
    [closeModal, dragOffsetY, resetDrag],
  );

  /**
   * Abre el modal solo en la transición visible false → true.
   */
  useEffect(() => {
    const justOpened = visible && !prevVisibleRef.current;
    prevVisibleRef.current = visible;

    if (!justOpened) return;

    setSelectedStatus(currentStatus);
    setSaveError(null);
    setIsSaving(false);
    isSavingRef.current = false;
    isClosingRef.current = false;
    dragOffsetY.setValue(0);
    setModalVisible(true);
    overlayOpacity.setValue(0);
    sheetTranslateY.setValue(SHEET_OFFSET);
    void runAnimation(1, 0);
  }, [
    visible,
    currentStatus,
    dragOffsetY,
    overlayOpacity,
    runAnimation,
    sheetTranslateY,
  ]);

  useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  /**
   * Selección local con feedback háptico; el guardado ocurre al confirmar.
   */
  const handleSelectOption = (status: AttendanceStatus) => {
    if (isSaving || status === selectedStatus) return;
    setSelectedStatus(status);
    void triggerSelectionHaptic();
  };

  /**
   * Persiste la selección local y cierra solo si el guardado fue exitoso.
   */
  const handleSave = async () => {
    if (isSaving || selectedStatus === currentStatus) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      await onSave(selectedStatus);
      await triggerSuccessHaptic();
      await closeModal();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo guardar la asistencia — intentá de nuevo';
      setSaveError(message);
      AccessibilityInfo.announceForAccessibility(message);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = selectedStatus !== currentStatus;
  const modalTitle = isOrganizerMode
    ? `Asistencia de ${participantName}`
    : 'Modificar asistencia';
  const modalSubtitle = isOrganizerMode
    ? 'Modificá el estado de asistencia de este participante'
    : 'Elegí cómo querés que figure tu asistencia';

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={() => void closeModal()}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Animated.View
          style={[styles.overlay, { opacity: overlayOpacity }]}
          pointerEvents="none"
        />

        <Pressable
          style={styles.dismissArea}
          onPress={() => !isSaving && void closeModal()}
          accessibilityLabel="Cerrar modal"
        />

        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: sheetTransform }] },
          ]}
        >
          <View {...panResponder.panHandlers} style={styles.handleArea}>
            <View style={styles.handle} accessibilityLabel="Arrastrá para cerrar" />
          </View>

          <Text style={styles.title}>{modalTitle}</Text>
          <Text style={styles.subtitle}>{modalSubtitle}</Text>

          <View
            accessibilityRole="radiogroup"
            accessibilityLabel="Estado de asistencia"
          >
            {ATTENDANCE_OPTIONS.map((option) => {
              const isSelected = option.status === selectedStatus;

              return (
                <TouchableOpacity
                  key={option.status}
                  style={[
                    styles.optionRow,
                    isSelected && styles.optionRowSelected,
                  ]}
                  onPress={() => handleSelectOption(option.status)}
                  activeOpacity={0.7}
                  disabled={isSaving}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${option.label}. ${option.description}`}
                >
                  <View
                    style={[
                      styles.optionIconBox,
                      { backgroundColor: option.bgColor },
                    ]}
                  >
                    <Ionicons
                      name={option.icon}
                      size={24}
                      color={option.color}
                    />
                  </View>

                  <View style={styles.optionText}>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    <Text style={styles.optionDescription}>
                      {option.description}
                    </Text>
                  </View>

                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={theme.colors.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {saveError && (
            <View style={styles.errorBanner} accessibilityRole="alert">
              <Ionicons
                name="alert-circle-outline"
                size={16}
                color={theme.colors.error}
              />
              <Text style={styles.errorText}>{saveError}</Text>
            </View>
          )}

          <View style={styles.footerActions}>
            <View style={styles.footerButton}>
              <AppButton
                label="Cancelar"
                variant="ghost"
                onPress={() => void closeModal()}
                disabled={isSaving}
              />
            </View>
            <View style={styles.footerButton}>
              <AppButton
                label="Guardar"
                onPress={() => void handleSave()}
                isLoading={isSaving}
                disabled={!hasChanges || isSaving}
              />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  dismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
  },
  handleArea: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.full,
  },
  title: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.md,
  },
  optionRowSelected: {
    backgroundColor: theme.colors.primaryLight,
  },
  optionIconBox: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  optionDescription: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.errorLight,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.error,
  },
  footerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  footerButton: {
    flex: 1,
  },
});

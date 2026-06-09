/**
 * Botones de acción del organizador en el detalle de juntada.
 *
 * Agrupa "Finalizar juntada" (visible cuando la juntada ya comenzó) y
 * "Cancelar juntada" (visible mientras la juntada esté activa). Los botones
 * solo disparan los callbacks de apertura de modal; la confirmación y la
 * ejecución de la acción quedan en la pantalla orquestadora.
 */
import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/shared/constants/theme';

/** Props de las acciones del organizador */
interface MeetupOrganizerActionsProps {
  /** true cuando la juntada ya comenzó y puede finalizarse */
  canFinish: boolean;
  /** true cuando la juntada está activa y puede cancelarse */
  canCancel: boolean;
  /** true mientras la finalización está en curso — deshabilita el botón */
  isFinishing: boolean;
  /** true mientras la cancelación está en curso — deshabilita el botón */
  isCancelling: boolean;
  /** Abre el modal de confirmación de finalización */
  onFinishPress: () => void;
  /** Abre el modal de confirmación de cancelación */
  onCancelPress: () => void;
}

export const MeetupOrganizerActions = ({
  canFinish,
  canCancel,
  isFinishing,
  isCancelling,
  onFinishPress,
  onCancelPress,
}: MeetupOrganizerActionsProps) => {
  return (
    <>
      {/* Finalizar juntada — solo cuando la juntada ya comenzó */}
      {canFinish && (
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.finishBtn, isFinishing && styles.btnDisabled]}
            onPress={onFinishPress}
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
    </>
  );
};

const styles = StyleSheet.create({
  actionSection: {
    marginBottom: theme.spacing.md,
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
});

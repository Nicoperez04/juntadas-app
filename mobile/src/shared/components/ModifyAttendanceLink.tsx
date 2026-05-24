/**
 * Link compacto para abrir el modal de modificación de asistencia.
 *
 * Diseño liviano centrado con ícono, reutilizado en detalle y listado
 * de participantes para mantener consistencia visual.
 */
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/shared/constants/theme';

interface ModifyAttendanceLinkProps {
  label?: string;
  onPress: () => void;
  /** Alineación horizontal del link dentro del contenedor padre */
  align?: 'center' | 'stretch';
  /** Si false, omite el margen superior (útil dentro de footers con padding) */
  showTopMargin?: boolean;
}

export const ModifyAttendanceLink = ({
  label = 'Modificar mi asistencia',
  onPress,
  align = 'center',
  showTopMargin = true,
}: ModifyAttendanceLinkProps) => (
  <TouchableOpacity
    style={[
      styles.button,
      align === 'center' ? styles.alignCenter : styles.alignStretch,
      !showTopMargin && styles.noTopMargin,
    ]}
    onPress={onPress}
    activeOpacity={0.7}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
    <Text style={styles.label}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  alignCenter: {
    alignSelf: 'center',
  },
  alignStretch: {
    alignSelf: 'stretch',
  },
  noTopMargin: {
    marginTop: 0,
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
});

/**
 * Botón base reutilizable de la aplicación.
 *
 * Soporta dos variantes visuales:
 * - `primary`: fondo violeta sólido, para la acción principal de cada pantalla.
 * - `ghost`: fondo transparente con borde violeta, para acciones secundarias.
 *
 * Cuando `isLoading` es true, reemplaza el label por un spinner para dar
 * feedback inmediato sin que el usuario necesite ver un cambio de pantalla.
 * El botón también se deshabilita automáticamente durante la carga para
 * prevenir envíos duplicados.
 */
import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
} from 'react-native';
import { theme } from '@/shared/constants/theme';

interface AppButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  label: string;
  onPress: () => void;
  /** Muestra un spinner y bloquea nuevas pulsaciones mientras sea true */
  isLoading?: boolean;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
}

export const AppButton = ({
  label,
  onPress,
  isLoading = false,
  variant = 'primary',
  disabled = false,
  ...rest
}: AppButtonProps) => {
  const isPrimary = variant === 'primary';
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        isPrimary ? styles.primary : styles.ghost,
        isDisabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator color={isPrimary ? theme.colors.surface : theme.colors.primary} />
      ) : (
        <Text style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelGhost]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: theme.components.buttonHeight,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: theme.components.inputBorderWidth,
    borderColor: theme.colors.primary,
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
  },
  labelPrimary: {
    color: theme.colors.surface,
  },
  labelGhost: {
    color: theme.colors.primary,
  },
});

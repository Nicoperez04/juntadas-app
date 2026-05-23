/**
 * Input de texto base reutilizable de la aplicación.
 *
 * Unifica el aspecto visual de todos los campos de texto:
 * mismo alto, mismo radio, mismo borde. Soporta:
 * - Ícono izquierdo opcional para dar contexto visual al campo.
 * - Modo contraseña con toggle de visibilidad (eye/eye-off).
 * - Mensaje de error en rojo debajo del input con feedback visual en el borde.
 *
 * El borde cambia a rojo cuando `error` está presente para dar feedback
 * sin depender de que el usuario lea el texto de error.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/shared/constants/theme';

interface AppInputProps extends TextInputProps {
  /** Label visible sobre el campo — siempre requerido para accesibilidad */
  label: string;
  placeholder?: string;
  /** Ícono a mostrar a la izquierda del campo de texto */
  leftIcon?: React.ReactNode;
  /** Mensaje de error a mostrar debajo del input; también activa el borde rojo */
  error?: string;
  secureTextEntry?: boolean;
}

export const AppInput = ({
  label,
  placeholder,
  leftIcon,
  error,
  secureTextEntry = false,
  ...rest
}: AppInputProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  // Solo oculta el texto si el campo es de contraseña Y el usuario no activó la visibilidad
  const isSecure = secureTextEntry && !isPasswordVisible;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, error ? styles.inputError : styles.inputNormal]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textDisabled}
          secureTextEntry={isSecure}
          autoCapitalize="none"
          {...rest}
        />
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={() => setIsPasswordVisible((prev) => !prev)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm - 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: theme.components.inputHeight,
    borderRadius: theme.radius.md,
    borderWidth: theme.components.inputBorderWidth,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
  },
  inputNormal: {
    borderColor: theme.colors.border,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  leftIcon: {
    marginRight: theme.spacing.sm + 2,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textPrimary,
    paddingVertical: 0,
  },
  rightIcon: {
    paddingLeft: theme.spacing.sm,
  },
  errorText: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.error,
  },
});

/**
 * Pantalla de nueva contraseña tras abrir el deep link del email de recuperación.
 *
 * El usuario llega acá cuando Supabase dispara PASSWORD_RECOVERY en onAuthStateChange
 * o cuando la app procesa rondaapp://reset-password con tokens de sesión.
 * Tras guardar, AppNavigator detecta USER_UPDATED y vuelve al flujo principal.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '@/shared/components/AppButton';
import { AppInput } from '@/shared/components/AppInput';
import { Toast } from '@/shared/components/Toast';
import { theme } from '@/shared/constants/theme';
import { triggerSuccessHaptic } from '@/shared/utils/haptics';
import { resetPasswordSchema } from '../schemas/authSchemas';
import { authService } from '../services/authService';
import { ResetPasswordFormData } from '../types';

export const ResetPasswordScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null,
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  /**
   * Persiste la nueva contraseña en Supabase Auth.
   * AppNavigator reacciona al evento USER_UPDATED y muestra el home automáticamente.
   */
  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    const result = await authService.updatePassword(data.password);

    setIsLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    void triggerSuccessHaptic();
    setToast({ message: '✓ Contraseña actualizada correctamente', type: 'success' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Nueva contraseña</Text>
            <Text style={styles.subtitle}>Ingresá tu nueva contraseña</Text>
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Nueva contraseña"
                  placeholder="Mínimo 6 caracteres"
                  secureTextEntry
                  autoComplete="new-password"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.password?.message}
                  leftIcon={
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={theme.colors.textSecondary}
                    />
                  }
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Confirmar contraseña"
                  placeholder="Repetí tu contraseña"
                  secureTextEntry
                  autoComplete="new-password"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.confirmPassword?.message}
                  leftIcon={
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={theme.colors.textSecondary}
                    />
                  }
                />
              )}
            />

            {error && (
              <View style={styles.globalError}>
                <Ionicons name="alert-circle-outline" size={16} color={theme.colors.error} />
                <Text style={styles.globalErrorText}>{error}</Text>
              </View>
            )}

            <AppButton
              label="Guardar contraseña"
              onPress={handleSubmit(onSubmit)}
              isLoading={isLoading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Toast
        message={toast?.message ?? ''}
        type={toast?.type ?? 'success'}
        visible={!!toast}
        onHide={() => setToast(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    flexGrow: 1,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    lineHeight: 42,
  },
  subtitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.regular,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  form: {
    flex: 1,
  },
  globalError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.errorLight,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.sm + 6,
    paddingVertical: theme.spacing.sm + 4,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  globalErrorText: {
    flex: 1,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.error,
    fontWeight: theme.typography.weights.medium,
  },
});

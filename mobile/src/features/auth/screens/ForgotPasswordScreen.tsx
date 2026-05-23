/**
 * Pantalla de recuperación de contraseña.
 *
 * Tiene dos estados visuales mutuamente excluyentes:
 * - Formulario con input de email y botón de envío.
 * - Pantalla de confirmación una vez que el email fue enviado exitosamente.
 *
 * El cambio de estado se hace con `emailSent` (local) en lugar de navegación
 * para que el usuario pueda volver atrás con el botón del sistema sin perder
 * el contexto de que ya se envió el email.
 *
 * La verificación del resultado usa el valor de retorno de `resetPassword`
 * (no el estado `error` del hook) para evitar el race condition entre
 * el setState y la lectura de la variable de closure.
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '@/shared/components/AppButton';
import { AppInput } from '@/shared/components/AppInput';
import { theme } from '@/shared/constants/theme';
import { forgotPasswordSchema } from '../schemas/authSchemas';
import { useAuth } from '../hooks/useAuth';
import { ForgotPasswordFormData } from '../types';

type NavProp = NativeStackNavigationProp<Record<string, undefined>>;

export const ForgotPasswordScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { resetPassword, isLoading, error } = useAuth();
  const [emailSent, setEmailSent] = useState(false);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    // Se usa el resultado directo en lugar de `error` del hook para evitar
    // leer el estado antes de que React procese el re-render
    const result = await resetPassword(data.email);
    if (!result.error) {
      setEmailSent(true);
    }
  };

  // Estado de confirmación — reemplaza el formulario completo
  if (emailSent) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <View style={styles.successIconWrapper}>
            <Ionicons name="mail-open-outline" size={48} color={theme.colors.primary} />
          </View>
          <Text style={styles.successTitle}>¡Email enviado!</Text>
          <Text style={styles.successMessage}>
            Revisá tu bandeja de entrada en{'\n'}
            <Text style={styles.successEmail}>{getValues('email')}</Text>
            {'\n'}y seguí las instrucciones para recuperar tu contraseña.
          </Text>
          <TouchableOpacity
            style={styles.backToLoginBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backToLoginText}>Volver al inicio de sesión</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
          {/* Botón volver — estructura idéntica a LoginScreen y RegisterScreen */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
            <Text style={styles.subtitle}>
              Ingresá tu email y te enviamos las instrucciones para crear una nueva contraseña.
            </Text>
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Email"
                  placeholder="tu@email.com"
                  keyboardType="email-address"
                  autoComplete="email"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.email?.message}
                  leftIcon={<Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} />}
                />
              )}
            />

            {/* Error de servidor — ej: rate limit de Supabase */}
            {error && (
              <View style={styles.globalError}>
                <Ionicons name="alert-circle-outline" size={16} color={theme.colors.error} />
                <Text style={styles.globalErrorText}>{error}</Text>
              </View>
            )}

            <AppButton
              label="Enviar instrucciones"
              onPress={handleSubmit(onSubmit)}
              isLoading={isLoading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    flexGrow: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
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
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  successIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  successTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  successEmail: {
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  backToLoginBtn: {
    paddingVertical: theme.spacing.sm + 6,
    paddingHorizontal: theme.spacing.xl,
  },
  backToLoginText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
});

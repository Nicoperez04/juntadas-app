/**
 * Pantalla de registro de cuenta nueva.
 *
 * Recolecta nombre completo, email y contraseña. El username se completa
 * en un paso posterior (CompleteProfileScreen) para no sobrecargar
 * el onboarding inicial.
 *
 * Al pie se muestran los términos y condiciones como requerimiento legal;
 * el usuario acepta implícitamente al registrarse (patrón común en mobile).
 */
import React from 'react';
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
import { registerSchema } from '../schemas/authSchemas';
import { useAuth } from '../hooks/useAuth';
import { RegisterFormData } from '../types';
import { Routes } from '@/navigation/routes';

type NavProp = NativeStackNavigationProp<Record<string, undefined>>;

export const RegisterScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { register, isLoading, error } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  const onSubmit = async (data: RegisterFormData) => {
    await register(data);
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
          {/* Botón volver — estructura idéntica a LoginScreen */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Creá tu cuenta</Text>
            <Text style={styles.subtitle}>Completá tus datos para empezar</Text>
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Nombre completo"
                  placeholder="Tu nombre y apellido"
                  autoComplete="name"
                  autoCapitalize="words"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.fullName?.message}
                  leftIcon={<Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} />}
                />
              )}
            />

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

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Contraseña"
                  placeholder="Mínimo 6 caracteres"
                  secureTextEntry
                  autoComplete="new-password"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.password?.message}
                  leftIcon={<Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} />}
                />
              )}
            />

            {/* Error de servidor — ej: email ya registrado */}
            {error && (
              <View style={styles.globalError}>
                <Ionicons name="alert-circle-outline" size={16} color={theme.colors.error} />
                <Text style={styles.globalErrorText}>{error}</Text>
              </View>
            )}

            <AppButton
              label="Continuar"
              onPress={handleSubmit(onSubmit)}
              isLoading={isLoading}
            />
          </View>

          {/* Footer de navegación — mismo patrón que LoginScreen */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tenés cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate(Routes.Login)}>
              <Text style={styles.footerLink}>Iniciar sesión</Text>
            </TouchableOpacity>
          </View>

          {/* Aviso legal — aceptación implícita al registrarse */}
          <Text style={styles.terms}>
            Al crear una cuenta aceptás nuestros{' '}
            <Text style={styles.termsLink}>Términos y Condiciones</Text>
            {' '}y la{' '}
            <Text style={styles.termsLink}>Política de Privacidad</Text>.
          </Text>
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
  },
  subtitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.regular,
    color: theme.colors.textSecondary,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  footerText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  footerLink: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
  terms: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textDisabled,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: theme.spacing.sm,
  },
  termsLink: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.medium,
  },
});

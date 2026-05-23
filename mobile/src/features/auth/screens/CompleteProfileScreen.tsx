/**
 * Pantalla de completar perfil — paso post-registro.
 *
 * El usuario llega aquí desde MainNavigator una vez autenticado pero antes
 * de acceder a las funcionalidades principales. No tiene botón de volver
 * porque es un paso obligatorio del onboarding.
 *
 * El campo de username valida en tiempo real (mode: 'onChange') para dar
 * feedback inmediato sobre el formato aceptado, sin esperar el submit.
 * Las reglas de validación se muestran visualmente como checklist
 * para reducir la fricción y el error del usuario.
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '@/shared/components/AppButton';
import { AppInput } from '@/shared/components/AppInput';
import { AppLogo } from '@/shared/components/AppLogo';
import { theme } from '@/shared/constants/theme';
import { completeProfileSchema } from '../schemas/authSchemas';
import { useAuth } from '../hooks/useAuth';
import { CompleteProfileFormData } from '../types';

/** Props del ítem de regla individual del checklist de validación */
interface RuleItemProps {
  text: string;
  /** true cuando el valor actual del username satisface esta regla */
  met: boolean;
}

/**
 * Ítem de checklist que indica si una regla de formato del username se cumple.
 * Cambia de ícono y color según el estado para guiar al usuario antes del submit.
 */
const RuleItem = ({ text, met }: RuleItemProps) => (
  <View style={ruleStyles.row}>
    <Ionicons
      name={met ? 'checkmark-circle' : 'ellipse-outline'}
      size={14}
      color={met ? theme.colors.success : theme.colors.textDisabled}
    />
    <Text style={[ruleStyles.text, met ? ruleStyles.textMet : ruleStyles.textPending]}>
      {text}
    </Text>
  </View>
);

const ruleStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm - 2,
    marginBottom: theme.spacing.xs,
  },
  text: {
    fontSize: theme.typography.sizes.xs,
  },
  textMet: {
    color: theme.colors.success,
  },
  textPending: {
    color: theme.colors.textDisabled,
  },
});

export const CompleteProfileScreen = () => {
  const { completeProfile, isLoading, error } = useAuth();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CompleteProfileFormData>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: { username: '' },
    // Validar en cada keystroke para que el checklist se actualice en tiempo real
    mode: 'onChange',
  });

  const username = watch('username');

  const onSubmit = async (data: CompleteProfileFormData) => {
    await completeProfile(data);
  };

  // El username es válido cuando pasa todas las reglas de Zod sin errores
  const isUsernameValid =
    username.length >= 3 && !errors.username && /^[a-z0-9_]+$/.test(username);

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
          {/* Logo como ancla visual de marca en un paso sin header de navegación */}
          <View style={styles.logoSection}>
            <AppLogo />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Completá tu perfil</Text>
            <Text style={styles.subtitle}>
              Elegí un nombre de usuario único con el que te van a identificar en la app.
            </Text>
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Nombre de usuario"
                  placeholder="ej: juan_perez"
                  autoCapitalize="none"
                  autoCorrect={false}
                  // Forzar minúsculas antes de actualizar el formulario para
                  // que el usuario no pueda ingresar mayúsculas accidentalmente
                  onChangeText={(text) => onChange(text.toLowerCase())}
                  onBlur={onBlur}
                  value={value}
                  error={errors.username?.message}
                  leftIcon={<Ionicons name="at-outline" size={20} color={theme.colors.textSecondary} />}
                />
              )}
            />

            {/* Feedback positivo en tiempo real una vez que el username es válido */}
            {username.length > 0 && !errors.username && (
              <View style={styles.validFeedback}>
                <Ionicons
                  name={isUsernameValid ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={isUsernameValid ? theme.colors.success : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.validFeedbackText,
                    isUsernameValid ? styles.validText : styles.neutralText,
                  ]}
                >
                  {isUsernameValid ? '@' + username + ' está disponible' : 'Verificando...'}
                </Text>
              </View>
            )}

            {/* Checklist de reglas — guía al usuario hacia el formato correcto */}
            <View style={styles.rules}>
              <Text style={styles.rulesTitle}>El usuario debe:</Text>
              <RuleItem
                text="Tener entre 3 y 20 caracteres"
                met={username.length >= 3 && username.length <= 20}
              />
              <RuleItem
                text="Solo letras minúsculas, números y _"
                met={/^[a-z0-9_]+$/.test(username) && username.length > 0}
              />
            </View>

            {/* Error de servidor — ej: username duplicado en la base de datos */}
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
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xl,
    flexGrow: 1,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
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
    lineHeight: 24,
  },
  form: {
    flex: 1,
  },
  validFeedback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm - 2,
    marginTop: -(theme.spacing.sm),
    marginBottom: theme.spacing.sm,
  },
  validFeedbackText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
  },
  validText: {
    color: theme.colors.success,
  },
  neutralText: {
    color: theme.colors.textSecondary,
  },
  rules: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md + 4,
    ...theme.shadows.sm,
  },
  rulesTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
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

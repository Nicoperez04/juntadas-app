/**
 * Pantalla para unirse a una juntada existente mediante código.
 *
 * El input de código convierte automáticamente a mayúsculas y limita
 * la entrada a 6 caracteres. La tipografía monospace le da identidad
 * visual al campo de código, diferenciándolo de un input común.
 *
 * Los mensajes de error son específicos según el tipo de fallo:
 * código inexistente, juntada cancelada, o usuario ya participante.
 * Al unirse exitosamente navega al detalle de la juntada.
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '@/shared/constants/theme';
import { Routes } from '@/navigation/routes';
import { AppButton } from '@/shared/components/AppButton';
import { AppTabBar } from '@/shared/components/AppTabBar';
import { useMeetups } from '../hooks/useMeetups';
import { joinMeetupSchema } from '../schemas/meetupSchemas';
import type { JoinMeetupFormData } from '../types';
import type { MainStackParamList } from '@/navigation/types';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'JoinMeetup'>;

export const JoinMeetupScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { joinMeetup } = useMeetups();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  /** Animación de shake para el campo de código cuando hay error */
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<JoinMeetupFormData>({
    resolver: zodResolver(joinMeetupSchema),
    mode: 'onChange',
    defaultValues: { joinCode: '' },
  });

  const codeValue = watch('joinCode');

  /**
   * Dispara la animación de shake horizontal para indicar error visual.
   * Se usa cuando el servidor rechaza el código ingresado.
   */
  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 6,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -6,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onSubmit = async (data: JoinMeetupFormData) => {
    setSubmitError(null);
    const result = await joinMeetup(data.joinCode);
    if (result.error) {
      setSubmitError(result.error);
      triggerShake();
      return;
    }
    if (result.data) {
      navigation.replace(Routes.MeetupDetail, { meetupId: result.data.id });
    }
  };

  const hasError = !!submitError || !!errors.joinCode;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
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
        <Text style={styles.headerTitle}>Unirse a juntada</Text>
        <View style={styles.headerPlaceholder} />
      </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Ilustración decorativa */}
          <View style={styles.illustrationWrapper}>
            <View style={styles.illustrationCircle}>
              <Ionicons name="enter" size={56} color={theme.colors.primary} />
            </View>
            {/* Círculos decorativos de fondo */}
            <View style={[styles.decorCircle, styles.decorCircle1]} />
            <View style={[styles.decorCircle, styles.decorCircle2]} />
          </View>

          <Text style={styles.title}>Ingresá el código</Text>
          <Text style={styles.subtitle}>
            Pedile a quien organizó la juntada que te comparta el código de 6
            caracteres para que puedas unirte.
          </Text>

          {/* Campo de código estilo OTP */}
          <Controller
            control={control}
            name="joinCode"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.codeFieldWrapper}>
                {/* Input oculto que captura el teclado */}
                <TextInput
                  ref={inputRef}
                  style={styles.hiddenInput}
                  value={value}
                  onChangeText={(text) => {
                    const sanitized = text
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, '')
                      .slice(0, 6);
                    onChange(sanitized);
                    if (submitError) setSubmitError(null);
                  }}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => { onBlur(); setIsInputFocused(false); }}
                  autoCapitalize="characters"
                  maxLength={6}
                  autoCorrect={false}
                  keyboardType="default"
                  caretHidden
                />

                {/* Cajas visuales OTP */}
                <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                  <TouchableOpacity
                    onPress={() => inputRef.current?.focus()}
                    activeOpacity={1}
                    style={styles.otpRow}
                  >
                    {Array.from({ length: 6 }).map((_, i) => {
                      const char = value?.[i] ?? '';
                      const isActive = isInputFocused && i === (value?.length ?? 0);
                      return (
                        <View
                          key={i}
                          style={[
                            styles.otpBox,
                            isActive && styles.otpBoxActive,
                            hasError && styles.otpBoxError,
                          ]}
                        >
                          {char ? (
                            <Text style={styles.otpChar}>{char}</Text>
                          ) : isActive ? (
                            <View style={styles.otpCursor} />
                          ) : null}
                        </View>
                      );
                    })}
                  </TouchableOpacity>
                </Animated.View>

                {/* Mensaje de error del schema */}
                {errors.joinCode?.message && (
                  <Text style={styles.fieldError}>
                    {errors.joinCode.message}
                  </Text>
                )}
              </View>
            )}
          />

          {/* Error devuelto por el servidor */}
          {submitError && (
            <View style={styles.errorBanner}>
              <Ionicons
                name="alert-circle"
                size={18}
                color={theme.colors.error}
              />
              <Text style={styles.errorBannerText}>{submitError}</Text>
            </View>
          )}

          {/* Botón de unirse */}
          <AppButton
            label="Unirse a la juntada"
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            disabled={codeValue?.length !== 6}
          />

          {/* Tip de acceso rápido */}
          <View style={styles.tipBox}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={theme.colors.primary}
            />
            <Text style={styles.tipText}>
              El código lo tiene quien organizó la juntada en la sección
              "Compartir juntada".
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AppTabBar activeTab="join" />
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
  flex: {
    flex: 1,
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
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
    alignItems: 'center',
  },
  illustrationWrapper: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    height: 140,
  },
  illustrationCircle: {
    width: 120,
    height: 120,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.secondaryLight,
  },
  decorCircle1: {
    width: 24,
    height: 24,
    top: 4,
    right: 4,
    opacity: 0.8,
  },
  decorCircle2: {
    width: 16,
    height: 16,
    bottom: 8,
    left: 8,
    opacity: 0.6,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  codeFieldWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  otpRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
  },
  otpBox: {
    width: 48,
    height: 60,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  otpBoxActive: {
    borderColor: theme.colors.primary,
  },
  otpBoxError: {
    borderColor: theme.colors.error,
  },
  otpChar: {
    fontSize: 24,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  otpCursor: {
    width: 2,
    height: 28,
    backgroundColor: theme.colors.primary,
    borderRadius: 1,
  },
  fieldError: {
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.error,
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.errorLight,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    width: '100%',
  },
  errorBannerText: {
    flex: 1,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.error,
    fontWeight: theme.typography.weights.medium,
    lineHeight: 20,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    width: '100%',
  },
  tipText: {
    flex: 1,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.primary,
    lineHeight: 18,
    fontWeight: theme.typography.weights.medium,
  },
});

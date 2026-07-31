/**
 * Pantalla para unirse a un grupo existente mediante código.
 *
 * Replica el patrón OTP de JoinMeetupScreen (input oculto + 6 cajas
 * visuales, shake de error), adaptado a grupos: código con prefijo 'G'
 * generado por groupService, y un bloque "¿Cómo funciona?" en vez del
 * tip simple, siguiendo el mockup de Figma "Unirse a Grupo".
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
import { useGroups } from '../hooks/useGroups';
import { joinGroupSchema } from '../schemas/groupSchemas';
import type { JoinGroupFormData } from '../types';
import type { MainStackParamList } from '@/navigation/types';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'JoinGroup'>;

/** Pasos del bloque "¿Cómo funciona?", igual contenido que el mockup de Figma */
const HOW_IT_WORKS_STEPS = [
  'El admin crea un grupo',
  'Recibís el código de invitación',
  'Ingresás el código y listo',
];

export const JoinGroupScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { joinGroup } = useGroups();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<JoinGroupFormData>({
    resolver: zodResolver(joinGroupSchema),
    mode: 'onChange',
    defaultValues: { joinCode: '' },
  });

  const codeValue = watch('joinCode');

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const onSubmit = async (data: JoinGroupFormData) => {
    setSubmitError(null);
    const result = await joinGroup(data.joinCode);
    if (result.error) {
      setSubmitError(result.error);
      triggerShake();
      return;
    }
    if (result.data) {
      navigation.replace(Routes.GroupHome);
    }
  };

  const hasError = !!submitError || !!errors.joinCode;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Unirse a grupo</Text>
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
          <View style={styles.illustrationWrapper}>
            <View style={styles.illustrationCircle}>
              <Ionicons name="people" size={48} color={theme.colors.primary} />
            </View>
          </View>

          <Text style={styles.title}>Ingresá el código</Text>
          <Text style={styles.subtitle}>
            Pedile al admin que te comparta el código del grupo
          </Text>

          <Controller
            control={control}
            name="joinCode"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.codeFieldWrapper}>
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

                {errors.joinCode?.message && (
                  <Text style={styles.fieldError}>{errors.joinCode.message}</Text>
                )}
              </View>
            )}
          />

          {submitError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={theme.colors.error} />
              <Text style={styles.errorBannerText}>{submitError}</Text>
            </View>
          )}

          <AppButton
            label="Unirse al Grupo"
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            disabled={codeValue?.length !== 6}
          />

          <View style={styles.howItWorksBox}>
            <Text style={styles.howItWorksTitle}>¿Cómo funciona?</Text>
            {HOW_IT_WORKS_STEPS.map((step, index) => (
              <View key={step} style={styles.howItWorksRow}>
                <View style={styles.howItWorksNumber}>
                  <Text style={styles.howItWorksNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.howItWorksText}>{step}</Text>
              </View>
            ))}
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
    minWidth: 48,
    minHeight: 48,
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
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationCircle: {
    width: 80,
    height: 80,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
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
  howItWorksBox: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    width: '100%',
  },
  howItWorksTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  howItWorksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  howItWorksNumber: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  howItWorksNumberText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.surface,
  },
  howItWorksText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textPrimary,
  },
});

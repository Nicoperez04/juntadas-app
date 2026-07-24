/**
 * Pantalla de creación de grupo.
 *
 * Formulario con React Hook Form + Zod, mismo patrón que CreateMeetupScreen.
 * A diferencia de juntadas, todavía no incluye selector de portada: el
 * mockup de Figma lo muestra, pero subirla requiere un bucket de Storage
 * dedicado para grupos que no forma parte de este sub-bloque (4.2) — queda
 * documentado como pendiente para un sub-bloque futuro.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
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
import { createGroupSchema } from '../schemas/groupSchemas';
import type { CreateGroupFormData } from '../types';
import type { MainStackParamList } from '@/navigation/types';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'CreateGroup'>;

interface FieldInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur: () => void;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  multiline?: boolean;
}

const FieldInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  onBlur,
  error,
  leftIcon,
  multiline = false,
}: FieldInputProps) => (
  <View style={fieldStyles.wrapper}>
    <Text style={fieldStyles.label}>{label}</Text>
    <View
      style={[
        fieldStyles.inputRow,
        multiline && fieldStyles.inputRowMultiline,
        error ? fieldStyles.inputError : fieldStyles.inputNormal,
      ]}
    >
      {leftIcon && (
        <Ionicons
          name={leftIcon}
          size={18}
          color={error ? theme.colors.error : theme.colors.textSecondary}
          style={fieldStyles.leftIcon}
        />
      )}
      <TextInput
        style={[fieldStyles.input, multiline && fieldStyles.inputMultiline]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textDisabled}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
    {error ? <Text style={fieldStyles.errorText}>{error}</Text> : null}
  </View>
);

export const CreateGroupScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { createGroup } = useGroups();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateGroupFormData>({
    resolver: zodResolver(createGroupSchema),
    mode: 'onChange',
    defaultValues: { name: '', description: '' },
  });

  const onSubmit = async (data: CreateGroupFormData) => {
    setSubmitError(null);
    const result = await createGroup(data);
    if (result.error) {
      setSubmitError(result.error);
      return;
    }
    if (result.data) {
      navigation.replace(Routes.GroupHome);
    }
  };

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
          <Text style={styles.headerTitle}>Nuevo grupo</Text>
          <View style={styles.headerPlaceholder} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.intro}>Completá los datos de tu grupo.</Text>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <FieldInput
                label="Nombre del grupo *"
                placeholder="Ej: Los de la facu"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
                leftIcon="text-outline"
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <FieldInput
                label="Descripción (opcional)"
                placeholder="¿De qué se trata el grupo?"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.description?.message}
                leftIcon="document-text-outline"
                multiline
              />
            )}
          />

          {submitError && (
            <View style={styles.submitError}>
              <Ionicons name="alert-circle-outline" size={16} color={theme.colors.error} />
              <Text style={styles.submitErrorText}>{submitError}</Text>
            </View>
          )}

          <AppButton
            label="Crear grupo"
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
          />

          <View style={styles.bottomSpace} />
        </ScrollView>
      </KeyboardAvoidingView>

      <AppTabBar activeTab="create" />
    </View>
  );
};

const fieldStyles = StyleSheet.create({
  wrapper: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.md,
    borderWidth: theme.components.inputBorderWidth,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    minHeight: theme.components.inputHeight,
  },
  inputRowMultiline: {
    alignItems: 'flex-start',
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    minHeight: 90,
  },
  inputNormal: {
    borderColor: theme.colors.border,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  leftIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textPrimary,
    paddingVertical: 0,
  },
  inputMultiline: {
    minHeight: 60,
  },
  errorText: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.error,
  },
});

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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  intro: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  submitError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.errorLight,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  submitErrorText: {
    flex: 1,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.error,
    fontWeight: theme.typography.weights.medium,
  },
  bottomSpace: {
    height: theme.spacing.xl,
  },
});

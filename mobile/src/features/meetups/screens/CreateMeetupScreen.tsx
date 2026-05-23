/**
 * Pantalla de creación de juntada.
 *
 * Formulario completo con React Hook Form + Zod para crear una nueva juntada.
 * Los campos de fecha y hora usan DateTimePicker nativo del sistema operativo
 * (TouchableOpacity + picker modal) para evitar el teclado numérico.
 *
 * Al crear exitosamente navega al detalle de la juntada creada.
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
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '@/shared/constants/theme';
import { Routes } from '@/navigation/routes';
import { AppButton } from '@/shared/components/AppButton';
import { useMeetups } from '../hooks/useMeetups';
import { createMeetupSchema } from '../schemas/meetupSchemas';
import type { CreateMeetupFormData, MainStackParamList } from '../types';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'CreateMeetup'>;

// ─── FieldInput (campos de texto genéricos) ──────────────────────────────────

/**
 * Input de formulario con label, borde de error y mensaje de validación.
 * Se usa para los campos de texto libre (título, descripción, ubicación, costo).
 */
interface FieldInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur: () => void;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  prefix?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
  multiline?: boolean;
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

const FieldInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  onBlur,
  error,
  leftIcon,
  prefix,
  keyboardType = 'default',
  multiline = false,
  maxLength,
  autoCapitalize = 'sentences',
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
      {prefix && <Text style={fieldStyles.prefix}>{prefix}</Text>}
      <TextInput
        style={[fieldStyles.input, multiline && fieldStyles.inputMultiline]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textDisabled}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
    {error ? <Text style={fieldStyles.errorText}>{error}</Text> : null}
  </View>
);

// ─── Pantalla principal ───────────────────────────────────────────────────────

export const CreateMeetupScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { createMeetup } = useMeetups();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateMeetupFormData>({
    resolver: zodResolver(createMeetupSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      estimatedCost: '',
    },
  });

  // Estado para controlar visibilidad del picker nativo — no usamos TextInput
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());

  /**
   * Se dispara al confirmar o cancelar el picker de fecha.
   * Cierra el diálogo y sincroniza el string DD/MM/YYYY con React Hook Form.
   */
  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      setValue('date', `${day}/${month}/${year}`, { shouldValidate: true });
    }
  };

  /**
   * Se dispara al confirmar o cancelar el picker de hora.
   * Cierra el diálogo y sincroniza el string HH:MM con React Hook Form.
   */
  const handleTimeChange = (event: DateTimePickerEvent, time?: Date) => {
    setShowTimePicker(false);
    if (time) {
      setSelectedTime(time);
      const hours = String(time.getHours()).padStart(2, '0');
      const minutes = String(time.getMinutes()).padStart(2, '0');
      setValue('time', `${hours}:${minutes}`, { shouldValidate: true });
    }
  };

  /**
   * Envía el formulario al servicio y navega al detalle si tiene éxito.
   * Los errores de creación se muestran en el banner inferior del formulario.
   */
  const onSubmit = async (data: CreateMeetupFormData) => {
    setSubmitError(null);
    const result = await createMeetup(data);
    if (result.error) {
      setSubmitError(result.error);
      return;
    }
    if (result.data) {
      navigation.replace(Routes.MeetupDetail, { meetupId: result.data.id });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva juntada</Text>
        <View style={styles.headerPlaceholder} />
      </View>

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
          <Text style={styles.intro}>
            Completá los datos de tu juntada. La fecha no puede ser anterior a hoy.
          </Text>

          {/* Campo: título */}
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <FieldInput
                label="Título *"
                placeholder="Ej: Cumpleaños de Lucho"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.title?.message}
                leftIcon="text-outline"
              />
            )}
          />

          {/* Campo: descripción (opcional) */}
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <FieldInput
                label="Descripción (opcional)"
                placeholder="¿De qué se trata la juntada?"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.description?.message}
                leftIcon="document-text-outline"
                multiline
              />
            )}
          />

          {/* Fila: fecha y hora — botones que abren pickers nativos, sin TextInput */}
          <View style={styles.row}>
            <View style={styles.rowHalf}>
              <Text style={fieldStyles.label}>{'Fecha *'}</Text>
              <TouchableOpacity
                style={[styles.dateButton, errors.date && styles.dateButtonError]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.dateButtonText,
                    !watch('date') && styles.dateButtonPlaceholder,
                  ]}
                >
                  {watch('date') || 'Seleccioná una fecha'}
                </Text>
              </TouchableOpacity>
              {errors.date && (
                <Text style={styles.errorText}>{errors.date.message}</Text>
              )}
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={handleDateChange}
                />
              )}
            </View>

            <View style={styles.rowHalf}>
              <Text style={fieldStyles.label}>{'Hora *'}</Text>
              <TouchableOpacity
                style={[styles.dateButton, errors.time && styles.dateButtonError]}
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.dateButtonText,
                    !watch('time') && styles.dateButtonPlaceholder,
                  ]}
                >
                  {watch('time') || 'Seleccioná una hora'}
                </Text>
              </TouchableOpacity>
              {errors.time && (
                <Text style={styles.errorText}>{errors.time.message}</Text>
              )}
              {showTimePicker && (
                <DateTimePicker
                  value={selectedTime}
                  mode="time"
                  display="default"
                  is24Hour={true}
                  onChange={handleTimeChange}
                />
              )}
            </View>
          </View>

          {/* Campo: ubicación */}
          <Controller
            control={control}
            name="location"
            render={({ field: { onChange, onBlur, value } }) => (
              <FieldInput
                label="Ubicación *"
                placeholder="Ej: Plaza San Martín, CABA"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.location?.message}
                leftIcon="location-outline"
              />
            )}
          />

          {/* Campo: costo estimado (opcional) */}
          <Controller
            control={control}
            name="estimatedCost"
            render={({ field: { onChange, onBlur, value } }) => (
              <FieldInput
                label="Costo estimado por persona (opcional)"
                placeholder="0"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.estimatedCost?.message}
                leftIcon="cash-outline"
                prefix="$"
                keyboardType="numeric"
                autoCapitalize="none"
              />
            )}
          />

          {/* Error global del submit */}
          {submitError && (
            <View style={styles.submitError}>
              <Ionicons name="alert-circle-outline" size={16} color={theme.colors.error} />
              <Text style={styles.submitErrorText}>{submitError}</Text>
            </View>
          )}

          <AppButton
            label="Crear juntada"
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
          />

          <View style={styles.bottomSpace} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Estilos ──────────────────────────────────────────────────────────────────

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
  prefix: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
    marginRight: 4,
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
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  intro: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  rowHalf: {
    flex: 1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: theme.components.inputHeight,
    borderWidth: theme.components.borderWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  dateButtonError: {
    borderColor: theme.colors.error,
  },
  dateButtonText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  dateButtonPlaceholder: {
    color: theme.colors.textDisabled,
  },
  errorText: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.error,
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

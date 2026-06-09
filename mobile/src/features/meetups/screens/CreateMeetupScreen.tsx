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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '@/shared/constants/theme';
import { Routes } from '@/navigation/routes';
import { AppButton } from '@/shared/components/AppButton';
import { AppTabBar } from '@/shared/components/AppTabBar';
import { Toast } from '@/shared/components/Toast';
import { triggerSuccessHaptic } from '@/shared/utils/haptics';
import { useMeetups, useUploadMeetupCover } from '../hooks/useMeetups';
import { createMeetupSchema } from '../schemas/meetupSchemas';
import type { CreateMeetupFormData } from '../types';
import type { MainStackParamList } from '@/navigation/types';

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

// ─── CoverPickerSection (portada opcional de la juntada) ─────────────────────

/**
 * Sección de selección de foto de portada (opcional).
 * Sin portada muestra un área punteada que abre la galería; con portada
 * muestra el preview con overlay y botones para cambiarla o quitarla.
 * Componente presentacional: la lógica de ImagePicker vive en la pantalla.
 */
interface CoverPickerSectionProps {
  /** URI de la imagen a previsualizar (local o remota); null si no hay portada */
  coverUri: string | null;
  /** Abre el selector de imagen de la galería */
  onPick: () => void;
  /** Quita la portada seleccionada */
  onRemove: () => void;
  /** Mensaje de error de permisos o selección; null si no hay error */
  error: string | null;
}

const CoverPickerSection = ({
  coverUri,
  onPick,
  onRemove,
  error,
}: CoverPickerSectionProps) => (
  <View style={coverStyles.wrapper}>
    {coverUri ? (
      <View style={coverStyles.previewBox}>
        <Image
          source={{ uri: coverUri }}
          style={coverStyles.previewImage}
          resizeMode="cover"
        />
        {/* Overlay semitransparente para dar contraste a los botones */}
        <View style={coverStyles.previewOverlay} />
        <View style={coverStyles.previewActions}>
          <TouchableOpacity
            style={coverStyles.previewActionBtn}
            onPress={onPick}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Cambiar foto de portada"
          >
            <Ionicons
              name="camera-outline"
              size={18}
              color={theme.colors.textPrimary}
            />
            <Text style={coverStyles.previewActionText}>Cambiar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={coverStyles.previewActionBtn}
            onPress={onRemove}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Quitar foto de portada"
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color={theme.colors.error}
            />
            <Text style={[coverStyles.previewActionText, coverStyles.previewActionTextDanger]}>
              Quitar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    ) : (
      <TouchableOpacity
        style={coverStyles.emptyBox}
        onPress={onPick}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Agregar foto de portada"
      >
        <Ionicons
          name="camera-outline"
          size={32}
          color={theme.colors.textSecondary}
        />
        <Text style={coverStyles.emptyText}>Agregar portada (opcional)</Text>
      </TouchableOpacity>
    )}
    {error ? <Text style={coverStyles.errorText}>{error}</Text> : null}
  </View>
);

/**
 * Abre la galería con las opciones acordadas para portadas
 * (solo imágenes, recorte 16:9, calidad 0.8) y retorna la URI elegida.
 *
 * @returns URI local de la imagen o null si se canceló o faltan permisos
 */
const pickCoverFromGallery = async (): Promise<
  { uri: string } | { permissionDenied: true } | null
> => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { permissionDenied: true };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    // El recorte con aspect solo aplica con allowsEditing en Android;
    // en iOS el usuario recorta libre pero la UI muestra siempre 16:9
    allowsEditing: true,
    aspect: [16, 9],
    quality: 0.8,
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  return { uri: result.assets[0].uri };
};

// ─── Pantalla principal ───────────────────────────────────────────────────────

export const CreateMeetupScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { createMeetup } = useMeetups();
  const uploadCoverMutation = useUploadMeetupCover();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Portada opcional: se elige antes de crear y se sube recién cuando
  // existe el meetupId. No forma parte del schema de Zod a propósito.
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [showCoverSuccessToast, setShowCoverSuccessToast] = useState(false);
  /** meetupId pendiente de navegación tras el toast de portada subida */
  const [pendingMeetupId, setPendingMeetupId] = useState<string | null>(null);

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
   * Abre la galería y guarda la URI elegida para el preview.
   * El error de permisos se muestra debajo del área de portada.
   */
  const handlePickCover = async () => {
    setCoverError(null);
    const result = await pickCoverFromGallery();
    if (result === null) return;
    if ('permissionDenied' in result) {
      setCoverError('Necesitamos acceso a tu galería para elegir la portada');
      return;
    }
    setCoverUri(result.uri);
  };

  /**
   * Envía el formulario al servicio y navega al detalle si tiene éxito.
   * Si hay portada seleccionada, se sube con el meetupId recién creado;
   * un fallo en la subida no bloquea la navegación porque la portada
   * es opcional y puede agregarse después desde la edición.
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
      if (coverUri) {
        const uploadResult = await uploadCoverMutation.mutateAsync({
          meetupId: result.data.id,
          fileUri: coverUri,
        });
        if (!uploadResult.error) {
          void triggerSuccessHaptic();
          setPendingMeetupId(result.data.id);
          setShowCoverSuccessToast(true);
          return;
        }
        // La portada es opcional: un fallo en la subida no bloquea la navegación
      }
      navigation.replace(Routes.MeetupDetail, { meetupId: result.data.id });
    }
  };

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
          <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva juntada</Text>
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
          <Text style={styles.intro}>
            Completá los datos de tu juntada. La fecha no puede ser anterior a hoy.
          </Text>

          {/* Portada opcional — se sube después de crear la juntada */}
          <CoverPickerSection
            coverUri={coverUri}
            onPick={() => void handlePickCover()}
            onRemove={() => setCoverUri(null)}
            error={coverError}
          />

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

      <AppTabBar activeTab="create" />

      <Toast
        message="✓ Portada agregada"
        type="success"
        visible={showCoverSuccessToast}
        onHide={() => {
          setShowCoverSuccessToast(false);
          if (pendingMeetupId) {
            navigation.replace(Routes.MeetupDetail, { meetupId: pendingMeetupId });
            setPendingMeetupId(null);
          }
        }}
      />
    </View>
  );
};

// ─── Estilos ──────────────────────────────────────────────────────────────────

const coverStyles = StyleSheet.create({
  wrapper: {
    marginBottom: theme.spacing.md,
  },
  emptyBox: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: theme.radius.lg,
    borderWidth: theme.components.inputBorderWidth,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
  },
  previewBox: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.border,
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  previewActions: {
    position: 'absolute',
    right: theme.spacing.sm,
    bottom: theme.spacing.sm,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  previewActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  previewActionText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  previewActionTextDanger: {
    color: theme.colors.error,
  },
  errorText: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.error,
  },
});

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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
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

/**
 * Pantalla de edición de juntada.
 *
 * Formulario pre-cargado con los datos actuales de la juntada.
 * Solo accesible para el organizador; redirige si la juntada está cancelada.
 * Al guardar exitosamente, vuelve al detalle de la juntada.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { theme } from '@/shared/constants/theme';
import { Routes } from '@/navigation/routes';
import { AppButton } from '@/shared/components/AppButton';
import { Toast } from '@/shared/components/Toast';
import { triggerSuccessHaptic } from '@/shared/utils/haptics';
import {
  useMeetups,
  useUploadMeetupCover,
  useRemoveMeetupCover,
} from '../hooks/useMeetups';
import { createMeetupSchema } from '../schemas/meetupSchemas';
import { formatDateForDisplay } from '../services/meetupService';
import type { CreateMeetupFormData } from '../types';
import type { MainStackParamList } from '@/navigation/types';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'EditMeetup'>;
type RoutePropType = RouteProp<MainStackParamList, 'EditMeetup'>;

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
// Mismo componente visual que en CreateMeetupScreen para mantener
// consistencia entre crear y editar (patrón existente de FieldInput).

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

/**
 * Extrae la ruta del archivo dentro del bucket a partir de la URL pública.
 * La URL pública tiene el formato .../object/public/meetup-covers/{path};
 * removeMeetupCover necesita ese {path} para borrar el archivo.
 *
 * @param coverUrl - URL pública almacenada en cover_url
 * @returns Ruta relativa dentro del bucket o null si el formato no coincide
 */
const getCoverFilePath = (coverUrl: string): string | null => {
  const marker = '/meetup-covers/';
  const index = coverUrl.indexOf(marker);
  if (index === -1) return null;
  return coverUrl.substring(index + marker.length);
};

/**
 * Convierte una fecha DD/MM/YYYY o YYYY-MM-DD a objeto Date.
 *
 * @param dateStr - Fecha como string
 * @returns Objeto Date parseado
 */
const parseDateString = (dateStr: string): Date => {
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Convierte una hora HH:MM a objeto Date con la hora seteada.
 *
 * @param timeStr - Hora como string
 * @returns Objeto Date con hora parseada
 */
const parseTimeString = (timeStr: string): Date => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

/**
 * Convierte HH:MM:SS a HH:MM para el formulario.
 * Supabase devuelve la hora con segundos pero el schema Zod espera HH:MM.
 *
 * @param time - Hora en formato HH:MM o HH:MM:SS
 * @returns Hora truncada a HH:MM
 */
const formatTimeForForm = (time: string): string => {
  if (!time) return '';
  return time.length > 5 ? time.substring(0, 5) : time;
};

export const EditMeetupScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { meetupId } = route.params;

  const { getMeetupById, editMeetup } = useMeetups();
  const uploadCoverMutation = useUploadMeetupCover();
  const removeCoverMutation = useRemoveMeetupCover();

  const [isLoadingMeetup, setIsLoadingMeetup] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successToastMessage, setSuccessToastMessage] =
    useState('✓ Juntada actualizada');

  // Estado de la portada: la URL actual viene de la DB; la URI nueva es
  // local hasta que se guarde; coverRemoved marca que el usuario la quitó.
  // No forma parte del schema de Zod a propósito.
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);
  const [newCoverUri, setNewCoverUri] = useState<string | null>(null);
  const [coverRemoved, setCoverRemoved] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
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

  /**
   * Carga los datos actuales de la juntada y pre-carga el formulario.
   * Redirige al detalle si la juntada está cancelada o no existe.
   */
  const loadMeetup = useCallback(async () => {
    setIsLoadingMeetup(true);
    setLoadError(null);

    const { data, error } = await getMeetupById(meetupId);

    if (error || !data) {
      setLoadError(error ?? 'No se pudo cargar la juntada');
      setIsLoadingMeetup(false);
      return;
    }

    if (data.status === 'cancelled' || data.status === 'finished') {
      navigation.replace(Routes.MeetupDetail, { meetupId });
      return;
    }

    const displayDate = formatDateForDisplay(data.date);
    const formTime = formatTimeForForm(data.time);

    reset({
      title: data.title,
      description: data.description ?? '',
      date: displayDate,
      time: formTime,
      location: data.location,
      estimatedCost:
        data.estimatedCost !== null ? String(data.estimatedCost) : '',
    });

    setSelectedDate(parseDateString(displayDate));
    setSelectedTime(parseTimeString(formTime));

    // Pre-cargar la portada actual y limpiar selecciones locales previas
    setExistingCoverUrl(data.cover_url ?? null);
    setNewCoverUri(null);
    setCoverRemoved(false);

    setIsLoadingMeetup(false);
  }, [meetupId, getMeetupById, navigation, reset]);

  useEffect(() => {
    loadMeetup();
  }, [loadMeetup]);

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
   * Elegir una foto nueva anula un "quitar" previo en la misma sesión.
   */
  const handlePickCover = async () => {
    setCoverError(null);
    const result = await pickCoverFromGallery();
    if (result === null) return;
    if ('permissionDenied' in result) {
      setCoverError('Necesitamos acceso a tu galería para elegir la portada');
      return;
    }
    setNewCoverUri(result.uri);
    setCoverRemoved(false);
  };

  /**
   * Quita la portada del preview. El borrado real en Storage/DB
   * se ejecuta recién al guardar los cambios.
   */
  const handleRemoveCover = () => {
    setNewCoverUri(null);
    setCoverRemoved(true);
  };

  // URI que se muestra en el preview: prioriza la foto nueva local,
  // luego la portada existente salvo que el usuario la haya quitado
  const displayCoverUri = newCoverUri ?? (coverRemoved ? null : existingCoverUrl);

  /**
   * Aplica los cambios de portada pendientes después de guardar el formulario.
   * Sube la foto nueva o elimina la actual según lo que haya hecho el usuario.
   *
   * @returns Mensaje de error si alguna operación falló; null si todo salió bien
   */
  const applyCoverChanges = async (): Promise<string | null> => {
    if (newCoverUri) {
      const result = await uploadCoverMutation.mutateAsync({
        meetupId,
        fileUri: newCoverUri,
      });
      return result.error;
    }

    if (coverRemoved && existingCoverUrl) {
      const filePath = getCoverFilePath(existingCoverUrl);
      if (!filePath) {
        return 'No se pudo determinar el archivo de portada a eliminar';
      }
      const result = await removeCoverMutation.mutateAsync({
        meetupId,
        filePath,
      });
      return result.error;
    }

    return null;
  };

  const onSubmit = async (data: CreateMeetupFormData) => {
    setSubmitError(null);
    const result = await editMeetup(meetupId, {
      title: data.title,
      description: data.description ?? '',
      date: data.date,
      time: data.time,
      location: data.location,
      estimatedCost: data.estimatedCost ?? '',
    });

    if (result.error) {
      setSubmitError(result.error);
      return;
    }

    // Los cambios de portada se aplican después del formulario; si fallan,
    // los datos ya quedaron guardados y el usuario puede reintentar la foto
    const coverChangeError = await applyCoverChanges();
    if (coverChangeError) {
      setSubmitError(coverChangeError);
      return;
    }

    // Mensaje de éxito según la operación de portada realizada, si hubo alguna
    let toastMessage = '✓ Juntada actualizada';
    if (newCoverUri) {
      toastMessage = '✓ Portada actualizada';
    } else if (coverRemoved && existingCoverUrl) {
      toastMessage = '✓ Portada eliminada';
    }

    void triggerSuccessHaptic();
    setSuccessToastMessage(toastMessage);
    setShowSuccessToast(true);
  };

  if (isLoadingMeetup) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Cargando juntada...</Text>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={theme.colors.error}
        />
        <Text style={styles.errorText}>{loadError}</Text>
        <TouchableOpacity onPress={loadMeetup} activeOpacity={0.7}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar juntada</Text>
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
            Modificá los datos de tu juntada. Los cambios se aplican de inmediato
            para todos los participantes.
          </Text>

          {/* Portada — muestra la actual, la nueva elegida o el área vacía */}
          <CoverPickerSection
            coverUri={displayCoverUri}
            onPick={() => void handlePickCover()}
            onRemove={handleRemoveCover}
            error={coverError}
          />

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
                <Text style={styles.errorTextInline}>{errors.date.message}</Text>
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
                <Text style={styles.errorTextInline}>{errors.time.message}</Text>
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

          {submitError && (
            <View style={styles.submitError}>
              <Ionicons name="alert-circle-outline" size={16} color={theme.colors.error} />
              <Text style={styles.submitErrorText}>{submitError}</Text>
            </View>
          )}

          <AppButton
            label="Guardar cambios"
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
          />

          <View style={styles.bottomSpace} />
        </ScrollView>
      </KeyboardAvoidingView>

      <Toast
        message={successToastMessage}
        type="success"
        visible={showSuccessToast}
        onHide={() => {
          setShowSuccessToast(false);
          navigation.goBack();
        }}
      />
    </SafeAreaView>
  );
};

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
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  loadingText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  errorText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.error,
    textAlign: 'center',
  },
  retryText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
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
  errorTextInline: {
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

/**
 * Pantalla de perfil del usuario autenticado.
 *
 * Muestra avatar, estadísticas de juntadas, datos de cuenta y acciones.
 * Soporta edición inline de nombre, username y foto sin navegar a otra pantalla.
 * Si el username es autogenerado (prefijo user_), muestra un banner de onboarding.
 *
 * Diseño alineado al mockup de Figma del proyecto y tokens de theme.ts.
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '@/shared/constants/theme';
import { AppInput } from '@/shared/components/AppInput';
import { AppButton } from '@/shared/components/AppButton';
import { Toast } from '@/shared/components/Toast';
import { AppTabBar, APP_TAB_BAR_OFFSET } from '@/shared/components/AppTabBar';
import { profileEditSchema } from '../schemas/authSchemas';
import { useAuth } from '../hooks/useAuth';
import { ProfileEditFormData } from '../types';

/** Tamaño del avatar principal según el mockup de Figma */
const AVATAR_SIZE = 80;

/** Paleta determinística para avatares sin foto — coherente con el resto de la app */
const AVATAR_PALETTE = [
  theme.colors.primary,
  theme.colors.secondary,
  theme.colors.success,
  theme.colors.warning,
  theme.colors.error,
];

/**
 * Índice de color estable a partir de un identificador de usuario.
 * Garantiza que el mismo usuario siempre vea el mismo color de fondo.
 */
const getAvatarColorIndex = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % AVATAR_PALETTE.length;
};

/**
 * Extrae hasta dos iniciales del nombre para mostrar en el avatar placeholder.
 */
const getInitials = (name: string): string => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/** Props del campo de solo lectura en modo vista */
interface ProfileFieldProps {
  label: string;
  value: string;
  /** Fondo atenuado para campos que nunca son editables (ej: email) */
  muted?: boolean;
}

/**
 * Campo informativo de solo lectura — usado para email y datos en modo vista.
 */
const ProfileField = ({ label, value, muted = false }: ProfileFieldProps) => (
  <View style={fieldStyles.wrapper}>
    <Text style={fieldStyles.label}>{label}</Text>
    <View style={[fieldStyles.valueBox, muted && fieldStyles.valueBoxMuted]}>
      <Text style={[fieldStyles.value, muted && fieldStyles.valueMuted]}>{value}</Text>
    </View>
  </View>
);

const fieldStyles = StyleSheet.create({
  wrapper: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm - 2,
  },
  valueBox: {
    minHeight: theme.components.inputHeight,
    borderRadius: theme.radius.md,
    borderWidth: theme.components.inputBorderWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'center',
  },
  valueBoxMuted: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
  },
  value: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textPrimary,
  },
  valueMuted: {
    color: theme.colors.textSecondary,
  },
});

/** Props de cada card de estadística */
interface StatCardProps {
  count: number;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
}

/**
 * Card compacta con ícono, número grande y etiqueta descriptiva debajo.
 */
const StatCard = ({ count, label, icon, iconColor, iconBg }: StatCardProps) => (
  <View style={statStyles.card}>
    <View style={[statStyles.iconBox, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={20} color={iconColor} />
    </View>
    <Text style={statStyles.count}>{count}</Text>
    <Text style={statStyles.label}>{label}</Text>
  </View>
);

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  count: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  label: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export const ProfileScreen = () => {
  const {
    profile,
    stats,
    isLoading,
    isLoadingProfile,
    loadProfile,
    updateProfile,
    uploadAvatar,
    logout,
  } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  /** Controla la visibilidad del modal de selección de fuente de foto */
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [usernameServerError, setUsernameServerError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null,
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileEditFormData>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: { fullName: '', username: '' },
    mode: 'onChange',
  });

  /** Recarga perfil y stats cada vez que la pantalla recibe foco */
  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  /** Sincroniza el formulario cuando llega el perfil del servidor */
  React.useEffect(() => {
    if (profile) {
      reset({
        fullName: profile.fullName,
        username: profile.username,
      });
    }
  }, [profile, reset]);

  const isProfileIncomplete = profile?.username.startsWith('user_') ?? false;

  /**
   * Activa el modo edición y limpia errores previos del servidor.
   * Usado desde el botón lápiz y desde el banner de perfil incompleto.
   */
  const enterEditMode = () => {
    setUsernameServerError(null);
    setIsEditing(true);
  };

  /**
   * Cancela la edición y restaura los valores originales del perfil cargado.
   */
  const cancelEditMode = () => {
    if (profile) {
      reset({
        fullName: profile.fullName,
        username: profile.username,
      });
    }
    setUsernameServerError(null);
    setIsEditing(false);
  };

  /**
   * Persiste nombre y username validados con Zod.
   * Muestra error inline si el username ya está en uso.
   */
  const onSaveProfile = async (data: ProfileEditFormData) => {
    setUsernameServerError(null);
    const result = await updateProfile(data);

    if (result.error) {
      if (result.error.includes('usuario ya está en uso')) {
        setUsernameServerError(result.error);
      } else {
        setToast({ message: result.error, type: 'error' });
      }
      return;
    }

    setIsEditing(false);
    setToast({ message: 'Perfil actualizado', type: 'success' });
  };

  /**
   * Abre la cámara o galería según la opción elegida por el usuario.
   * Solo disponible en modo edición.
   */
  const handlePickImage = async (source: 'camera' | 'gallery') => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setToast({
        message: 'Necesitamos permiso para acceder a tus fotos',
        type: 'error',
      });
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

    if (result.canceled || !result.assets[0]?.uri) return;

    const uploadResult = await uploadAvatar(result.assets[0].uri);
    if (uploadResult.error) {
      setToast({ message: uploadResult.error, type: 'error' });
      return;
    }

    setToast({ message: 'Foto actualizada', type: 'success' });
  };

  /** Abre el modal custom de selección de fuente de foto */
  const handleAvatarPress = () => {
    setShowAvatarModal(true);
  };

  /** Confirma y ejecuta el cierre de sesión */
  const confirmLogout = async () => {
    const result = await logout();
    setShowLogoutModal(false);
    if (result.error) {
      setToast({ message: result.error, type: 'error' });
    }
  };

  const avatarColor = AVATAR_PALETTE[getAvatarColorIndex(profile?.id ?? 'user')];
  const displayName = profile?.fullName?.trim() || 'Usuario';
  const initials = getInitials(displayName);

  const renderContent = () => {
    if (isLoadingProfile && !profile) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      );
    }

    if (!profile) {
      return (
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={36} color={theme.colors.error} />
          <Text style={styles.loadingText}>No se pudo cargar el perfil</Text>
          <TouchableOpacity onPress={() => void loadProfile()} activeOpacity={0.7}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
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
          {/* Banner de perfil incompleto — username autogenerado por el trigger de Supabase */}
          {isProfileIncomplete && !isEditing && (
            <View style={styles.incompleteBanner}>
              <View style={styles.incompleteBannerIcon}>
                <Ionicons name="warning-outline" size={20} color={theme.colors.warning} />
              </View>
              <View style={styles.incompleteBannerText}>
                <Text style={styles.incompleteBannerTitle}>Completá tu perfil</Text>
                <Text style={styles.incompleteBannerSubtitle}>
                  Agregá tu nombre y elegí un username
                </Text>
              </View>
              <TouchableOpacity
                style={styles.incompleteBannerBtn}
                onPress={enterEditMode}
                activeOpacity={0.8}
              >
                <Text style={styles.incompleteBannerBtnText}>Completar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Identidad — avatar y nombre en card elevada */}
          <View style={styles.identityCard}>
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={isEditing ? handleAvatarPress : undefined}
              activeOpacity={isEditing ? 0.8 : 1}
              disabled={!isEditing || isLoading}
            >
              <View style={styles.avatarRing}>
                {profile.avatarUrl ? (
                  <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: avatarColor }]}>
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  </View>
                )}
              </View>

              {isEditing && (
                <View style={styles.avatarOverlay}>
                  <View style={styles.avatarCameraBadge}>
                    <Ionicons name="camera" size={16} color={theme.colors.surface} />
                  </View>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.displayName}>{displayName}</Text>
            <Text style={styles.username}>@{profile.username}</Text>
          </View>

          {/* Estadísticas de juntadas */}
          <View style={styles.statsRow}>
            <StatCard
              count={stats.organizedCount}
              label="Juntadas organizadas"
              icon="calendar-outline"
              iconColor={theme.colors.primary}
              iconBg={theme.colors.primaryLight}
            />
            <StatCard
              count={stats.participantCount}
              label="Juntadas como invitado"
              icon="people-outline"
              iconColor={theme.colors.secondary}
              iconBg={theme.colors.secondaryLight}
            />
          </View>

          {/* Información de cuenta */}
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Información</Text>

            <ProfileField label="Email" value={profile.email} muted />

            {isEditing ? (
              <>
                <Controller
                  control={control}
                  name="fullName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <AppInput
                      label="Nombre completo"
                      placeholder="Tu nombre y apellido"
                      autoCapitalize="words"
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                      error={errors.fullName?.message}
                      leftIcon={
                        <Ionicons
                          name="person-outline"
                          size={20}
                          color={theme.colors.textSecondary}
                        />
                      }
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="username"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <AppInput
                      label="Username"
                      placeholder="ej: juan_perez"
                      autoCapitalize="none"
                      autoCorrect={false}
                      onChangeText={(text) => {
                        setUsernameServerError(null);
                        onChange(text.toLowerCase());
                      }}
                      onBlur={onBlur}
                      value={value}
                      error={errors.username?.message ?? usernameServerError ?? undefined}
                      leftIcon={
                        <Ionicons
                          name="at-outline"
                          size={20}
                          color={theme.colors.textSecondary}
                        />
                      }
                    />
                  )}
                />
              </>
            ) : (
              <>
                <ProfileField label="Nombre completo" value={profile.fullName} />
                <ProfileField label="Username" value={`@${profile.username}`} />
              </>
            )}
          </View>

          {/* Acciones de cuenta */}
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => setShowLogoutModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
              <Text style={styles.logoutBtnText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>

          {/* Espacio para scrollear por encima del tab bar absoluto */}
          <View style={styles.tabBarSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.topSafe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mi perfil</Text>

          {isEditing ? (
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={cancelEditMode}
                disabled={isLoading}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.headerActionCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit(onSaveProfile)}
                disabled={isLoading}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <Text style={styles.headerActionSave}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={enterEditMode}
              disabled={!profile || isLoadingProfile}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="pencil" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {renderContent()}

      <AppTabBar activeTab="profile" />

      {/* Modal de selección de fuente de foto de perfil */}
      <Modal
        transparent
        animationType="slide"
        visible={showAvatarModal}
        onRequestClose={() => setShowAvatarModal(false)}
        statusBarTranslucent
      >
        <View style={styles.avatarModalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setShowAvatarModal(false)}
          />
          <View style={styles.avatarModalSheet}>
            {/* Handle decorativo */}
            <View style={styles.avatarModalHandle} />

            <Text style={styles.avatarModalTitle}>Cambiar foto de perfil</Text>

            {/* Opción Cámara */}
            <TouchableOpacity
              style={styles.avatarModalOption}
              onPress={() => {
                setShowAvatarModal(false);
                void handlePickImage('camera');
              }}
              activeOpacity={0.7}
            >
              <View style={styles.avatarModalOptionIcon}>
                <Ionicons name="camera-outline" size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.avatarModalOptionLabel}>Cámara</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            {/* Opción Galería */}
            <TouchableOpacity
              style={styles.avatarModalOption}
              onPress={() => {
                setShowAvatarModal(false);
                void handlePickImage('gallery');
              }}
              activeOpacity={0.7}
            >
              <View style={styles.avatarModalOptionIcon}>
                <Ionicons name="images-outline" size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.avatarModalOptionLabel}>Galería de fotos</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            {/* Botón cancelar */}
            <TouchableOpacity
              style={styles.avatarModalCancel}
              onPress={() => setShowAvatarModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.avatarModalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmación de cierre de sesión */}
      <Modal
        transparent
        animationType="fade"
        visible={showLogoutModal}
        onRequestClose={() => !isLoading && setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <Ionicons name="log-out-outline" size={32} color={theme.colors.error} />
            </View>
            <Text style={styles.modalTitle}>¿Cerrar sesión?</Text>
            <Text style={styles.modalSubtitle}>
              Vas a salir de tu cuenta en este dispositivo.
            </Text>
            <View style={styles.modalActions}>
              <AppButton
                label="Cancelar"
                variant="ghost"
                onPress={() => setShowLogoutModal(false)}
                disabled={isLoading}
              />
              <TouchableOpacity
                style={[styles.modalDestructiveBtn, isLoading && styles.modalDestructiveBtnDisabled]}
                onPress={() => void confirmLogout()}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color={theme.colors.surface} />
                ) : (
                  <Text style={styles.modalDestructiveBtnText}>Sí, cerrar sesión</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast
        message={toast?.message ?? ''}
        type={toast?.type ?? 'success'}
        visible={!!toast}
        onHide={() => setToast(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topSafe: {
    backgroundColor: theme.colors.surface,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: theme.components.borderWidth,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  headerActionCancel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
  },
  headerActionSave: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  tabBarSpacer: {
    height: APP_TAB_BAR_OFFSET,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  loadingText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  retryText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
  incompleteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warningLight,
    borderRadius: theme.radius.lg,
    borderWidth: theme.components.borderWidth,
    borderColor: theme.colors.warning,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  incompleteBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incompleteBannerText: {
    flex: 1,
  },
  incompleteBannerTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  incompleteBannerSubtitle: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  incompleteBannerBtn: {
    backgroundColor: theme.colors.warning,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.sm + 4,
    paddingVertical: theme.spacing.sm,
  },
  incompleteBannerBtnText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.surface,
  },
  identityCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  avatarRing: {
    borderRadius: theme.radius.full,
    padding: 3,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: theme.radius.full,
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.surface,
  },
  avatarOverlay: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  avatarCameraBadge: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  displayName: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  username: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  actionsSection: {
    marginTop: theme.spacing.xs,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    height: theme.components.buttonHeight,
    borderRadius: theme.radius.lg,
    borderWidth: theme.components.inputBorderWidth,
    borderColor: theme.colors.error,
    backgroundColor: 'transparent',
  },
  logoutBtnText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  modalIconBox: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  modalActions: {
    width: '100%',
    gap: theme.spacing.sm,
  },
  modalDestructiveBtn: {
    height: theme.components.buttonHeight,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDestructiveBtnDisabled: {
    opacity: 0.6,
  },
  modalDestructiveBtnText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.surface,
  },
  avatarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  avatarModalSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
    ...theme.shadows.md,
  },
  avatarModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.full,
    alignSelf: 'center',
    marginVertical: theme.spacing.sm,
  },
  avatarModalTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  avatarModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatarModalOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarModalOptionLabel: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textPrimary,
  },
  avatarModalCancel: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  avatarModalCancelText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
  },
});

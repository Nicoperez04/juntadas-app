/**
 * Galería de recuerdos (fotos) de una juntada.
 *
 * Muestra un grid de 3 columnas con overlay del autor en cada foto.
 * Permite subir múltiples fotos si la juntada está activa o finalizada,
 * y eliminar las propias con long-press + confirmación.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Dimensions,
  Animated,
  Modal,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { theme } from '@/shared/constants/theme';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { Routes } from '@/navigation/routes';
import { ErrorAnimation } from '@/shared/components/ErrorAnimation';
import { SuccessAnimation } from '@/shared/components/SuccessAnimation';
import { AppButton } from '@/shared/components/AppButton';
import { meetupService } from '@/features/meetups/services/meetupService';
import type { MainStackParamList } from '@/navigation/types';
import { useMemories } from '../hooks/useMemories';
import { registerMemoryDeletedHandler } from '../utils/memoryGallerySync';
import type { Memory } from '../types';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'MemoriesGallery'>;
type RoutePropType = RouteProp<MainStackParamList, 'MemoriesGallery'>;

/** Configuración del grid de fotos */
const NUM_COLUMNS = 3;
const GRID_GAP = 2;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_SIZE =
  (SCREEN_WIDTH - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

/** Clave en AsyncStorage para no repetir el tip de eliminación */
const DELETE_TIP_STORAGE_KEY = 'memories_delete_tip_shown';

/** Duración visible del banner informativo de primera visita */
const DELETE_TIP_DURATION_MS = 3000;

/** Pasos del modal de ayuda — mismo patrón que "Cómo se juega" del Impostor */
const HELP_STEPS = [
  {
    step: '1',
    title: '📸 Subir fotos',
    description:
      'Tocá el botón + para subir fotos desde tu galería. Podés elegir varias a la vez.',
  },
  {
    step: '2',
    title: '🔍 Ver en detalle',
    description:
      'Tocá cualquier foto para verla en pantalla completa. Deslizá para navegar entre fotos.',
  },
  {
    step: '3',
    title: '🗑️ Eliminar fotos',
    description:
      'Mantené presionada una foto tuya para eliminarla, o usá el ícono de papelera en la vista de detalle.',
  },
] as const;

/** Paleta determinística para avatares con iniciales */
const AVATAR_PALETTE = [
  theme.colors.primary,
  theme.colors.secondary,
  '#0EA5E9',
  '#059669',
  theme.colors.warning,
  theme.colors.error,
];

/**
 * Formatea una fecha ISO o YYYY-MM-DD para mostrar en subtítulo.
 */
const formatDate = (dateStr: string): string => {
  if (dateStr.includes('/')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

const getAvatarColorIndex = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % AVATAR_PALETTE.length;
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/** Celda cuadrada del skeleton grid 3x3 */
const SkeletonCell = ({ index }: { index: number }) => {
  const opacity = useRef(new Animated.Value(0.4)).current;
  const isLastInRow = index % NUM_COLUMNS === NUM_COLUMNS - 1;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.gridCell,
        styles.skeletonCell,
        { opacity },
        !isLastInRow && styles.gridCellGapRight,
      ]}
    />
  );
};

interface MemoryGridItemProps {
  memory: Memory;
  index: number;
  /** true si el usuario puede eliminar esta foto (propia o organizador) */
  canDelete: boolean;
  isDeleteMode: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onDeletePress: () => void;
}

/** Celda individual del grid con overlay del autor */
const MemoryGridItem = ({
  memory,
  index,
  canDelete,
  isDeleteMode,
  onPress,
  onLongPress,
  onDeletePress,
}: MemoryGridItemProps) => {
  const isLastInRow = index % NUM_COLUMNS === NUM_COLUMNS - 1;
  const avatarColor = AVATAR_PALETTE[getAvatarColorIndex(memory.uploadedBy)];

  return (
    <Pressable
      style={[
        styles.gridCell,
        { width: CELL_SIZE, height: CELL_SIZE },
        !isLastInRow && styles.gridCellGapRight,
      ]}
      onPress={onPress}
      onLongPress={canDelete ? onLongPress : undefined}
      delayLongPress={400}
    >
      <Image source={{ uri: memory.fileUrl }} style={styles.gridImage} />

      <View style={styles.uploaderOverlay}>
        {memory.uploaderAvatarUrl ? (
          <Image
            source={{ uri: memory.uploaderAvatarUrl }}
            style={styles.uploaderAvatar}
          />
        ) : (
          <View
            style={[
              styles.uploaderAvatar,
              { backgroundColor: avatarColor },
            ]}
          >
            <Text style={styles.uploaderInitials}>
              {getInitials(memory.uploaderName)}
            </Text>
          </View>
        )}
        <Text style={styles.uploaderName} numberOfLines={1}>
          {memory.uploaderName.split(' ')[0]}
        </Text>
      </View>

      {canDelete && isDeleteMode && (
        <TouchableOpacity
          style={styles.deleteIconBtn}
          onPress={onDeletePress}
          activeOpacity={0.8}
          accessibilityLabel="Eliminar foto"
        >
          <Ionicons name="trash" size={16} color={theme.colors.surface} />
        </TouchableOpacity>
      )}
    </Pressable>
  );
};

export const MemoriesGalleryScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { meetupId, isActive } = route.params ?? {};

  // Usuario autenticado resuelto desde la caché compartida de sesión
  const { userId: currentUserId } = useCurrentUser();

  const [meetupTitle, setMeetupTitle] = useState('');
  const [meetupDate, setMeetupDate] = useState('');
  const [meetupTime, setMeetupTime] = useState('');
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleteModeId, setDeleteModeId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memoryToDelete, setMemoryToDelete] = useState<Memory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteTip, setShowDeleteTip] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [removedMemoryIds, setRemovedMemoryIds] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    memories,
    isLoading,
    isUploading,
    uploadProgress,
    error,
    uploadPhotosFromUris,
    deletePhoto,
    refresh,
  } = useMemories(meetupId, currentUserId, isOrganizer);

  /**
   * Lista visible en el grid: excluye fotos eliminadas desde el viewer
   * antes de que el hook recargue desde Supabase.
   */
  const displayMemories = useMemo(
    () => memories.filter((m) => !removedMemoryIds.includes(m.id)),
    [memories, removedMemoryIds],
  );

  /**
   * Sincroniza la galería cuando el viewer elimina una foto.
   * Equivalente a setMemories(prev => prev.filter(...)) del spec.
   */
  const handleMemoryDeleted = useCallback((memoryId: string) => {
    setRemovedMemoryIds((prev) =>
      prev.includes(memoryId) ? prev : [...prev, memoryId],
    );
  }, []);

  /**
   * Registra el handler para que el viewer notifique borrados sin pasar
   * funciones en route.params (evita warning de React Navigation).
   */
  useEffect(() => {
    return registerMemoryDeletedHandler(handleMemoryDeleted);
  }, [handleMemoryDeleted]);

  useEffect(() => {
    void meetupService.getMeetupById(meetupId).then(({ data }) => {
      if (data) {
        setMeetupTitle(data.title);
        setMeetupDate(formatDate(data.date));
        setMeetupTime(data.time);
        setIsOrganizer(
          !!currentUserId && data.createdBy === currentUserId,
        );
      }
    });
  }, [meetupId, currentUserId]);

  /**
   * Muestra el tip de eliminación solo la primera vez que hay fotos en la galería.
   */
  useEffect(() => {
    if (isLoading || memories.length === 0) return;

    const showTipIfFirstVisit = async () => {
      const hasSeenTip = await AsyncStorage.getItem(DELETE_TIP_STORAGE_KEY);
      if (!hasSeenTip) {
        setShowDeleteTip(true);
        await AsyncStorage.setItem(DELETE_TIP_STORAGE_KEY, 'true');
      }
    };

    void showTipIfFirstVisit();
  }, [isLoading, memories.length]);

  /** Oculta el banner informativo tras 3 segundos */
  useEffect(() => {
    if (!showDeleteTip) return;

    const timer = setTimeout(() => setShowDeleteTip(false), DELETE_TIP_DURATION_MS);
    return () => clearTimeout(timer);
  }, [showDeleteTip]);

  /**
   * Abre el selector de cámara o galería según la opción elegida.
   * Mismo patrón que la foto de perfil en ProfileScreen.
   */
  const handlePickAndUpload = useCallback(
    async (source: 'camera' | 'gallery') => {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setErrorMessage(
          source === 'camera'
            ? 'Necesitamos permiso para usar la cámara'
            : 'Necesitamos acceso a tu galería para subir fotos',
        );
        setShowError(true);
        return;
      }

      const pickerResult =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              quality: 0.8,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsMultipleSelection: true,
              quality: 0.8,
            });

      if (pickerResult.canceled || pickerResult.assets.length === 0) {
        return;
      }

      const imageUris = pickerResult.assets.map((asset) => asset.uri);
      const uploadResult = await uploadPhotosFromUris(imageUris);
      if (!uploadResult) return;

      if (uploadResult.outcome === 'success') {
        const count = uploadResult.uploadedCount;
        setSuccessMessage(
          `✓ ${count} foto${count > 1 ? 's' : ''} agregada${count > 1 ? 's' : ''}`,
        );
        setShowSuccess(true);
        return;
      }

      setErrorMessage(
        uploadResult.message ?? 'No se pudieron subir las fotos',
      );
      setShowError(true);
    },
    [uploadPhotosFromUris],
  );

  /** Muestra el modal de selección de fuente antes de subir fotos */
  const handleUploadPress = useCallback(() => {
    setShowUploadModal(true);
  }, []);

  /**
   * Activa el modo eliminar tras long-press con feedback háptico.
   */
  const handleLongPress = useCallback((memory: Memory) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDeleteModeId(memory.id);
  }, []);

  /**
   * Abre el modal de confirmación para eliminar una foto propia.
   */
  const handleDeletePress = useCallback((memory: Memory) => {
    setMemoryToDelete(memory);
    setShowDeleteModal(true);
  }, []);

  /**
   * Confirma y ejecuta la eliminación de la foto seleccionada.
   */
  const confirmDelete = async () => {
    if (!memoryToDelete) return;

    setIsDeleting(true);
    const success = await deletePhoto(memoryToDelete);
    setIsDeleting(false);
    setShowDeleteModal(false);
    setDeleteModeId(null);
    setMemoryToDelete(null);

    if (success) {
      setSuccessMessage('✓ Foto eliminada');
      setShowSuccess(true);
    }
  };

  const renderGridItem = ({ item, index }: { item: Memory; index: number }) => {
    const canDelete =
      item.uploadedBy === currentUserId || isOrganizer;

    return (
      <MemoryGridItem
        memory={item}
        index={index}
        canDelete={canDelete}
        isDeleteMode={deleteModeId === item.id}
        onPress={() => {
          if (deleteModeId === item.id) {
            setDeleteModeId(null);
            return;
          }
          navigation.navigate(Routes.MemoryViewer, {
            memories: displayMemories,
            initialIndex: index,
            meetupId,
            isOrganizer,
          });
        }}
        onLongPress={() => handleLongPress(item)}
        onDeletePress={() => handleDeletePress(item)}
      />
    );
  };

  const skeletonData = Array.from({ length: 9 }, (_, i) => i);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header con volver, título y acción de subir */}
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
        <Text style={styles.headerTitle}>Recuerdos</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowHelpModal(true)}
            style={styles.headerIconBtn}
            activeOpacity={0.7}
            accessibilityLabel="Ayuda sobre recuerdos"
          >
            <Ionicons
              name="help-circle-outline"
              size={24}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
          {isActive && (
            <TouchableOpacity
              onPress={handleUploadPress}
              style={styles.headerIconBtn}
              activeOpacity={0.7}
              disabled={isUploading}
              accessibilityLabel="Subir fotos"
            >
              <Ionicons name="add" size={26} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Subtítulo con nombre y fecha de la juntada */}
      {meetupTitle ? (
        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitleTitle} numberOfLines={1}>
            {meetupTitle}
          </Text>
          <Text style={styles.subtitleDate}>
            {meetupDate} · {meetupTime}
          </Text>
        </View>
      ) : null}

      {error && !isLoading ? (
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={36}
            color={theme.colors.error}
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refresh} activeOpacity={0.7}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading ? (
        <FlatList
          data={skeletonData}
          keyExtractor={(item) => `skeleton-${item}`}
          numColumns={NUM_COLUMNS}
          renderItem={({ item }) => <SkeletonCell index={item} />}
          columnWrapperStyle={styles.gridRow}
          scrollEnabled={false}
          contentContainerStyle={styles.gridContent}
        />
      ) : displayMemories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons
              name="camera-outline"
              size={40}
              color={theme.colors.primary}
            />
          </View>
          <Text style={styles.emptyTitle}>No hay recuerdos aún</Text>
          <Text style={styles.emptySubtitle}>
            Compartí fotos de esta juntada con los demás participantes
          </Text>
          {isActive && (
            <View style={styles.emptyButton}>
              <AppButton
                label="Subir la primera foto"
                onPress={handleUploadPress}
                isLoading={isUploading}
              />
            </View>
          )}
        </View>
      ) : (
        <View style={styles.gridWrapper}>
          <FlatList
            data={displayMemories}
            keyExtractor={(item) => item.id}
            numColumns={NUM_COLUMNS}
            renderItem={renderGridItem}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={() => setDeleteModeId(null)}
          />

          {/* Overlay de progreso durante subida múltiple */}
          {isUploading && (
            <View style={styles.uploadOverlay}>
              <ActivityIndicator size="large" color={theme.colors.surface} />
              <Text style={styles.uploadOverlayText}>
                {uploadProgress && uploadProgress.total > 1
                  ? `Subiendo ${uploadProgress.current} de ${uploadProgress.total}...`
                  : 'Subiendo foto...'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* FAB alternativo para subir fotos */}
      {isActive && displayMemories.length > 0 && !isLoading && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleUploadPress}
          activeOpacity={0.85}
          disabled={isUploading}
        >
          <Ionicons name="add" size={28} color={theme.colors.surface} />
        </TouchableOpacity>
      )}

      {/* Modal de selección de fuente para subir recuerdos */}
      <Modal
        transparent
        animationType="slide"
        visible={showUploadModal}
        onRequestClose={() => setShowUploadModal(false)}
        statusBarTranslucent
      >
        <View style={styles.uploadModalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setShowUploadModal(false)}
          />
          <View style={styles.uploadModalSheet}>
            <View style={styles.uploadModalHandle} />
            <Text style={styles.uploadModalTitle}>Subir recuerdo</Text>

            <TouchableOpacity
              style={styles.uploadModalOption}
              onPress={() => {
                setShowUploadModal(false);
                void handlePickAndUpload('camera');
              }}
              activeOpacity={0.7}
            >
              <View style={styles.uploadModalOptionIcon}>
                <Ionicons name="camera-outline" size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.uploadModalOptionLabel}>Tomar foto</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadModalOption}
              onPress={() => {
                setShowUploadModal(false);
                void handlePickAndUpload('gallery');
              }}
              activeOpacity={0.7}
            >
              <View style={styles.uploadModalOptionIcon}>
                <Ionicons name="images-outline" size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.uploadModalOptionLabel}>Elegir de galería</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadModalCancel}
              onPress={() => setShowUploadModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.uploadModalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmación de eliminación */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>¿Eliminar esta foto?</Text>
            <Text style={styles.modalMessage}>
              Esta acción no se puede deshacer.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setShowDeleteModal(false);
                  setMemoryToDelete(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDeleteBtn}
                onPress={() => void confirmDelete()}
                activeOpacity={0.7}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color={theme.colors.surface} />
                ) : (
                  <Text style={styles.modalDeleteText}>Eliminar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de ayuda — instrucciones de uso de la galería */}
      <Modal
        visible={showHelpModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowHelpModal(false)}
      >
        <View style={styles.helpModalOverlay}>
          <View style={styles.helpModalContent}>
            <View style={styles.helpModalHeader}>
              <Text style={styles.helpModalTitle}>Cómo usar Recuerdos</Text>
              <TouchableOpacity
                onPress={() => setShowHelpModal(false)}
                activeOpacity={0.7}
                style={styles.helpModalCloseBtn}
                accessibilityLabel="Cerrar ayuda"
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.textPrimary}
                />
              </TouchableOpacity>
            </View>
            {HELP_STEPS.map((item) => (
              <View key={item.step} style={styles.helpStepRow}>
                <View style={styles.helpStepBadge}>
                  <Text style={styles.helpStepBadgeText}>{item.step}</Text>
                </View>
                <View style={styles.helpStepTextBlock}>
                  <Text style={styles.helpStepTitle}>{item.title}</Text>
                  <Text style={styles.helpStepDescription}>
                    {item.description}
                  </Text>
                </View>
              </View>
            ))}
            <AppButton
              label="Entendido"
              onPress={() => setShowHelpModal(false)}
            />
          </View>
        </View>
      </Modal>

      {/* Banner informativo de primera visita sobre cómo eliminar fotos */}
      {showDeleteTip && displayMemories.length > 0 && (
        <View style={styles.deleteTipBanner}>
          <Text style={styles.deleteTipText}>
            💡 Mantené presionada una foto para eliminarla
          </Text>
        </View>
      )}

      <SuccessAnimation
        visible={showSuccess}
        message={successMessage}
        onHide={() => setShowSuccess(false)}
      />

      <ErrorAnimation
        visible={showError}
        message={errorMessage}
        onHide={() => setShowError(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  backBtn: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    minWidth: 80,
    justifyContent: 'flex-end',
  },
  headerIconBtn: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitleContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  subtitleTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  subtitleDate: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  gridWrapper: {
    flex: 1,
    position: 'relative',
  },
  gridContent: {
    paddingBottom: theme.spacing.xxl,
  },
  gridRow: {
    marginBottom: GRID_GAP,
  },
  gridCell: {
    overflow: 'hidden',
    backgroundColor: theme.colors.border,
  },
  gridCellGapRight: {
    marginRight: GRID_GAP,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  uploaderOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  uploaderAvatar: {
    width: 18,
    height: 18,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploaderInitials: {
    fontSize: 8,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.surface,
  },
  uploaderName: {
    flex: 1,
    fontSize: 10,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.surface,
  },
  deleteIconBtn: {
    position: 'absolute',
    top: theme.spacing.xs,
    right: theme.spacing.xs,
    width: 28,
    height: 28,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    backgroundColor: theme.colors.border,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  emptyButton: {
    width: '100%',
    maxWidth: 280,
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  uploadOverlayText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.surface,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  errorText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  retryText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  modalMessage: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: theme.radius.md,
    borderWidth: theme.components.borderWidth,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
  },
  modalDeleteBtn: {
    flex: 1,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDeleteText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.surface,
  },
  helpModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  helpModalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    ...theme.shadows.md,
  },
  helpModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helpModalCloseBtn: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpModalTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  helpStepRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'flex-start',
  },
  helpStepBadge: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpStepBadgeText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  helpStepTextBlock: {
    flex: 1,
  },
  helpStepTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  helpStepDescription: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  deleteTipBanner: {
    position: 'absolute',
    left: theme.spacing.md,
    right: theme.spacing.md,
    bottom: theme.spacing.lg,
    backgroundColor: theme.colors.textPrimary,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    ...theme.shadows.md,
  },
  deleteTipText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.surface,
    textAlign: 'center',
  },
  uploadModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  uploadModalSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
    ...theme.shadows.md,
  },
  uploadModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.full,
    alignSelf: 'center',
    marginVertical: theme.spacing.sm,
  },
  uploadModalTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  uploadModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  uploadModalOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadModalOptionLabel: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textPrimary,
  },
  uploadModalCancel: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  uploadModalCancelText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
  },
});

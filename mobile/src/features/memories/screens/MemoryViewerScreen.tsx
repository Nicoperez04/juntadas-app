/**
 * Vista ampliada de una foto de recuerdo (modal).
 *
 * Permite navegar horizontalmente entre fotos de la galería, cerrar con
 * swipe down o botón X, y eliminar fotos propias.
 */
import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  FlatList,
  Animated,
  PanResponder,
  Modal,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { theme } from '@/shared/constants/theme';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { Toast } from '@/shared/components/Toast';
import type { MainStackParamList } from '@/navigation/types';
import { memoriesService } from '../services/memoriesService';
import { notifyMemoryDeleted } from '../utils/memoryGallerySync';
import type { Memory } from '../types';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'MemoryViewer'>;
type RoutePropType = RouteProp<MainStackParamList, 'MemoryViewer'>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const SWIPE_DOWN_THRESHOLD = 120;

/** Paleta determinística para avatares con iniciales */
const AVATAR_PALETTE = [
  theme.colors.primary,
  theme.colors.secondary,
  '#0EA5E9',
  '#059669',
  theme.colors.warning,
  theme.colors.error,
];

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

/**
 * Formatea la fecha de creación de la foto para la barra inferior.
 */
const formatMemoryDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;

  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

interface PhotoSlideProps {
  memory: Memory;
  onDismiss: () => void;
}

/**
 * Slide individual con gesto de swipe down para cerrar el modal.
 * El PanResponder solo actúa cuando el desplazamiento vertical supera al horizontal.
 * Cada slide mantiene su propio Animated.Value para no interferir con el carrusel.
 */
const PhotoSlide = ({ memory, onDismiss }: PhotoSlideProps) => {
  const translateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dy) > Math.abs(gesture.dx) && gesture.dy > 8,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > SWIPE_DOWN_THRESHOLD) {
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(onDismiss);
          return;
        }

        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 6,
        }).start();
      },
    }),
  ).current;

  return (
    <Animated.View
      style={[styles.slide, { transform: [{ translateY }] }]}
      {...panResponder.panHandlers}
    >
      <Image
        source={{ uri: memory.fileUrl }}
        style={styles.fullImage}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

export const MemoryViewerScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { memories, initialIndex } = route.params;

  // Usuario autenticado resuelto desde la caché compartida de sesión
  const { userId: currentUserId } = useCurrentUser();

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localMemories, setLocalMemories] = useState(memories);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const flatListRef = useRef<FlatList<Memory>>(null);

  React.useEffect(() => {
    if (initialIndex > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: initialIndex,
          animated: false,
        });
      }, 0);
    }
  }, [initialIndex]);

  const currentMemory = localMemories[currentIndex];
  const isOwn = currentMemory?.uploadedBy === currentUserId;

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  /**
   * Sincroniza el índice actual al hacer swipe horizontal entre fotos.
   */
  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  /**
   * Elimina la foto actual y cierra el viewer si era la única restante.
   */
  const confirmDelete = async () => {
    if (!currentMemory || !currentUserId) return;

    setIsDeleting(true);
    const result = await memoriesService.deleteMemory(
      currentMemory.id,
      currentUserId,
      currentMemory.filePath,
    );
    setIsDeleting(false);
    setShowDeleteModal(false);

    if (result.error) {
      setToast({ message: result.error, type: 'error' });
      return;
    }

    setToast({ message: '✓ Foto eliminada', type: 'success' });

    // Notifica a la galería montada sin pasar callbacks por navigation state
    notifyMemoryDeleted(currentMemory.id);

    const updated = localMemories.filter((m) => m.id !== currentMemory.id);
    if (updated.length === 0) {
      setTimeout(handleClose, 600);
      return;
    }

    // Mantiene el índice en la foto anterior si se eliminó la última del carrusel
    const nextIndex = Math.min(currentIndex, updated.length - 1);
    setLocalMemories(updated);
    setCurrentIndex(nextIndex);
    flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
  };

  if (!currentMemory) {
    return (
      <View style={styles.fallback}>
        <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
          <Text style={styles.fallbackText}>Cerrar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const avatarColor = AVATAR_PALETTE[getAvatarColorIndex(currentMemory.uploadedBy)];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Barra superior: indicador de posición y botón cerrar */}
        <View style={styles.topBar}>
          <View style={styles.topBarSpacer} />
          <Text style={styles.positionIndicator}>
            {currentIndex + 1} / {localMemories.length}
          </Text>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={26} color={theme.colors.surface} />
          </TouchableOpacity>
        </View>

        {/* Carrusel horizontal entre fotos */}
        <FlatList
          ref={flatListRef}
          data={localMemories}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          renderItem={({ item }) => (
            <PhotoSlide memory={item} onDismiss={handleClose} />
          )}
        />

        {/* Barra inferior: autor, fecha y eliminar */}
        <View style={styles.bottomBar}>
          <View style={styles.authorRow}>
            {currentMemory.uploaderAvatarUrl ? (
              <Image
                source={{ uri: currentMemory.uploaderAvatarUrl }}
                style={styles.authorAvatar}
              />
            ) : (
              <View
                style={[
                  styles.authorAvatar,
                  { backgroundColor: avatarColor },
                ]}
              >
                <Text style={styles.authorInitials}>
                  {getInitials(currentMemory.uploaderName)}
                </Text>
              </View>
            )}
            <View style={styles.authorInfo}>
              <Text style={styles.authorName} numberOfLines={1}>
                {currentMemory.uploaderName}
              </Text>
              <Text style={styles.authorDate}>
                {formatMemoryDate(currentMemory.createdAt)}
              </Text>
            </View>
          </View>

          {isOwn && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => setShowDeleteModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={22} color={theme.colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

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
                onPress={() => setShowDeleteModal(false)}
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
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    zIndex: 2,
  },
  topBarSpacer: {
    width: 40,
  },
  positionIndicator: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.surface,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  authorRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInitials: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.surface,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.surface,
  },
  authorDate: {
    fontSize: theme.typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 2,
  },
  deleteBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: theme.colors.surface,
    fontSize: theme.typography.sizes.md,
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
});

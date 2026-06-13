/**
 * Panel deslizable de notificaciones del usuario.
 *
 * Muestra las últimas notificaciones con paginación local, swipe para
 * eliminar y acciones de marcar como leída individual o masiva.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/shared/constants/theme';
import {
  useDeleteNotification,
  useMarkAllAsRead,
  useMarkAsRead,
  useNotifications,
} from '../hooks/useNotifications';
import { NotificationType, type Notification } from '../types';

const PAGE_SIZE = 10;
const SWIPE_ACTION_WIDTH = 80;
const SWIPE_THRESHOLD = 50;

interface NotificationPanelProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

/** Props del ítem individual con swipe */
interface NotificationItemProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
  onDelete: (notificationId: string) => void;
}

/**
 * Devuelve el nombre del ícono MaterialCommunityIcons según el tipo de notificación.
 */
const getNotificationIcon = (
  type: NotificationType,
): keyof typeof MaterialCommunityIcons.glyphMap => {
  switch (type) {
    case NotificationType.Joined:
      return 'account-plus';
    case NotificationType.Transferred:
      return 'crown';
    case NotificationType.ReviewEnabled:
      return 'star';
    case NotificationType.Reminder:
      return 'clock';
    default:
      return 'bell-outline';
  }
};

/**
 * Formatea la fecha de creación en texto relativo para la UI del panel.
 */
const formatRelativeTime = (createdAt: string): string => {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMinutes < 60) {
    const minutes = Math.max(diffMinutes, 1);
    return `hace ${minutes} minuto${minutes === 1 ? '' : 's'}`;
  }

  if (diffHours < 24) {
    return `hace ${diffHours} hora${diffHours === 1 ? '' : 's'}`;
  }

  const day = String(created.getDate()).padStart(2, '0');
  const month = String(created.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
};

/**
 * Fila de notificación con swipe hacia la izquierda para revelar eliminar.
 */
const NotificationItem = ({ notification, onPress, onDelete }: NotificationItemProps) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpenRef = useRef(false);

  const closeSwipe = useCallback(() => {
    isOpenRef.current = false;
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
  }, [translateX]);

  const openSwipe = useCallback(() => {
    isOpenRef.current = true;
    Animated.spring(translateX, {
      toValue: -SWIPE_ACTION_WIDTH,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
  }, [translateX]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderMove: (_, gesture) => {
          const base = isOpenRef.current ? -SWIPE_ACTION_WIDTH : 0;
          const next = Math.min(0, Math.max(-SWIPE_ACTION_WIDTH, base + gesture.dx));
          translateX.setValue(next);
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx < -SWIPE_THRESHOLD) {
            openSwipe();
            return;
          }
          if (isOpenRef.current && gesture.dx > SWIPE_THRESHOLD) {
            closeSwipe();
            return;
          }
          if (isOpenRef.current) {
            openSwipe();
          } else {
            closeSwipe();
          }
        },
      }),
    [closeSwipe, openSwipe, translateX],
  );

  return (
    <View style={styles.swipeContainer}>
      <View style={styles.swipeActions}>
        <TouchableOpacity
          style={styles.deleteAction}
          onPress={() => onDelete(notification.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.deleteActionText}>Eliminar</Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[styles.itemWrapper, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <Pressable
          style={[styles.item, !notification.read && styles.itemUnread]}
          onPress={() => {
            closeSwipe();
            onPress(notification);
          }}
        >
          <View style={styles.itemIconBox}>
            <MaterialCommunityIcons
              name={getNotificationIcon(notification.type)}
              size={20}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.itemContent}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle} numberOfLines={1}>
                {notification.title}
              </Text>
              {!notification.read && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.itemBody} numberOfLines={2}>
              {notification.body}
            </Text>
            <Text style={styles.itemTime}>{formatRelativeTime(notification.createdAt)}</Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

export const NotificationPanel = ({ visible, onClose, userId }: NotificationPanelProps) => {
  const insets = useSafeAreaInsets();
  const { data: notifications = [], isLoading } = useNotifications(userId);
  const markAsReadMutation = useMarkAsRead(userId);
  const markAllAsReadMutation = useMarkAllAsRead(userId);
  const deleteNotificationMutation = useDeleteNotification(userId);

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const panelHeight = Dimensions.get('window').height * 0.72;

  const slideAnim = useRef(new Animated.Value(-panelHeight)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const visibleNotifications = useMemo(
    () => notifications.slice(0, visibleCount),
    [notifications, visibleCount],
  );

  const hasMore = notifications.length > visibleCount;

  useEffect(() => {
    if (visible) {
      setVisibleCount(PAGE_SIZE);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    slideAnim.setValue(-panelHeight);
    backdropAnim.setValue(0);
  }, [visible, slideAnim, backdropAnim, panelHeight]);

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -panelHeight,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onClose();
      }
    });
  }, [backdropAnim, onClose, panelHeight, slideAnim]);

  const handlePressNotification = useCallback(
    (notification: Notification) => {
      if (!notification.read) {
        void markAsReadMutation.mutateAsync(notification.id).catch(() => undefined);
      }
    },
    [markAsReadMutation],
  );

  const handleDeleteNotification = useCallback(
    (notificationId: string) => {
      void deleteNotificationMutation.mutateAsync(notificationId).catch(() => undefined);
    },
    [deleteNotificationMutation],
  );

  const handleMarkAllAsRead = useCallback(() => {
    void markAllAsReadMutation.mutateAsync().catch(() => undefined);
  }, [markAllAsReadMutation]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose}>
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropAnim,
              },
            ]}
          />
        </Pressable>

        <Animated.View
          style={[
            styles.panel,
            {
              paddingTop: insets.top + theme.spacing.sm,
              maxHeight: panelHeight,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Notificaciones</Text>
            <View style={styles.panelHeaderActions}>
              <TouchableOpacity
                onPress={handleMarkAllAsRead}
                activeOpacity={0.7}
                disabled={markAllAsReadMutation.isPending}
              >
                <Text style={styles.markAllText}>Marcar todas como leídas</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClose} activeOpacity={0.7} hitSlop={8}>
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : visibleNotifications.length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons
                name="bell-off-outline"
                size={32}
                color={theme.colors.textDisabled}
              />
              <Text style={styles.emptyText}>No tenés notificaciones</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {visibleNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onPress={handlePressNotification}
                  onDelete={handleDeleteNotification}
                />
              ))}

              {hasMore && (
                <TouchableOpacity
                  style={styles.loadMoreBtn}
                  onPress={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.loadMoreText}>Ver más</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: theme.radius.xl,
    borderBottomRightRadius: theme.radius.xl,
    ...theme.shadows.md,
  },
  panelHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: theme.components.borderWidth,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  panelTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  panelHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  markAllText: {
    flex: 1,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.primary,
  },
  loadingBox: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyBox: {
    paddingVertical: theme.spacing.xxl,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingBottom: theme.spacing.lg,
  },
  swipeContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  swipeActions: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: SWIPE_ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.error,
  },
  deleteAction: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteActionText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.surface,
  },
  itemWrapper: {
    backgroundColor: theme.colors.surface,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: theme.components.borderWidth,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  itemUnread: {
    backgroundColor: theme.colors.primaryLight,
  },
  itemIconBox: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  itemTitle: {
    flex: 1,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
  },
  itemBody: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  itemTime: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textDisabled,
    marginTop: theme.spacing.xs,
  },
  loadMoreBtn: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  loadMoreText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
});

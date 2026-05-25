/**
 * Pantalla de listado de participantes de una juntada.
 *
 * Muestra todos los participantes activos con avatar, rol y estado de asistencia.
 * Los participantes pueden modificar su asistencia; el organizador puede editar
 * la asistencia de cualquier invitado tocando su fila.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { supabase } from '@/lib/supabase/client';
import { theme } from '@/shared/constants/theme';
import { Routes } from '@/navigation/routes';
import { ModifyAttendanceLink } from '@/shared/components/ModifyAttendanceLink';
import { Toast } from '@/shared/components/Toast';
import { useParticipants } from '../hooks/useParticipants';
import { ModifyAttendanceScreen } from './ModifyAttendanceScreen';
import { getParticipantDisplayName } from '../utils/participantDisplay';
import type { MeetupParticipant, AttendanceStatus } from '../types';
import type { MainStackParamList } from '@/features/meetups/types';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'ParticipantList'>;
type RoutePropType = RouteProp<MainStackParamList, 'ParticipantList'>;

/** Target del modal de asistencia: propio o de otro participante (organizador) */
type AttendanceModalTarget =
  | { mode: 'self' }
  | { mode: 'organizer'; participant: MeetupParticipant };

/** Paleta de colores determinísticos para avatares con iniciales */
const AVATAR_PALETTE = [
  theme.colors.primary,
  theme.colors.secondary,
  '#0EA5E9',
  '#059669',
  theme.colors.warning,
  theme.colors.error,
];

/**
 * Genera un índice de color determinístico a partir de un string.
 *
 * @param str - String a hashear (userId)
 * @returns Índice dentro de AVATAR_PALETTE
 */
const getAvatarColorIndex = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % AVATAR_PALETTE.length;
};

/**
 * Extrae las iniciales de un nombre completo (máximo 2 caracteres).
 *
 * @param name - Nombre completo
 * @returns Iniciales en mayúsculas
 */
const getInitials = (name: string): string => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/** Configuración visual de badges de asistencia */
const ATTENDANCE_CONFIG: Record<
  AttendanceStatus,
  { label: string; bgColor: string; textColor: string }
> = {
  confirmed: {
    label: 'Confirmado',
    bgColor: theme.colors.successLight,
    textColor: theme.colors.success,
  },
  pending: {
    label: 'Pendiente',
    bgColor: '#FEF3C7',
    textColor: '#92400E',
  },
  declined: {
    label: 'Decliné',
    bgColor: theme.colors.errorLight,
    textColor: theme.colors.error,
  },
};

interface ParticipantRowProps {
  participant: MeetupParticipant;
  onPress?: () => void;
  /** Indica si la fila es editable por el organizador */
  editable?: boolean;
}

/** Fila individual de participante en la lista */
const ParticipantRow = ({
  participant,
  onPress,
  editable = false,
}: ParticipantRowProps) => {
  const config = ATTENDANCE_CONFIG[participant.attendanceStatus];
  const avatarColor = AVATAR_PALETTE[getAvatarColorIndex(participant.userId)];
  const isOrganizer = participant.role === 'organizer';
  const displayName = getParticipantDisplayName(participant);
  const initials = getInitials(displayName);

  // Si tiene avatar en el perfil, mostrar foto; si no, iniciales con color determinístico
  const avatarUrl = participant.profile.avatarUrl;

  const content = (
    <>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      )}

      <View style={styles.participantInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.participantName} numberOfLines={1}>
            {displayName}
          </Text>
          {isOrganizer && (
            <Ionicons name="star" size={14} color={theme.colors.warning} />
          )}
        </View>
        <Text style={styles.participantUsername}>
          @{participant.profile.username}
        </Text>
        {isOrganizer && (
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Organizador</Text>
          </View>
        )}
      </View>

      <View style={[styles.attendanceBadge, { backgroundColor: config.bgColor }]}>
        <Text style={[styles.attendanceText, { color: config.textColor }]}>
          {config.label}
        </Text>
      </View>

      {editable && (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.colors.textDisabled}
        />
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.participantRow, editable && styles.participantRowEditable]}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Editar asistencia de ${displayName}`}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.participantRow}>{content}</View>;
};

export const ParticipantListScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { meetupId } = route.params;

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [attendanceModalTarget, setAttendanceModalTarget] =
    useState<AttendanceModalTarget | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  /**
   * Transporta el mensaje de Toast entre onSave y onClose del modal de
   * asistencia. Evita que el Toast se monte durante la animación de cierre
   * del bottom sheet, lo que generaba el efecto visual duplicado.
   */
  const pendingToastRef = useRef<string | null>(null);

  const {
    participants,
    isLoading,
    error,
    updateAttendance,
    updateParticipantAttendance,
    leaveMeetup,
    refresh,
  } = useParticipants(meetupId, currentUserId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
  }, []);

  const currentParticipant = participants.find(
    (p) => p.userId === currentUserId,
  );
  const isOrganizer = currentParticipant?.role === 'organizer';
  const isParticipant = !!currentParticipant && !isOrganizer;
  const currentAttendance =
    currentParticipant?.attendanceStatus ?? 'pending';

  const modalCurrentStatus =
    attendanceModalTarget?.mode === 'organizer'
      ? attendanceModalTarget.participant.attendanceStatus
      : currentAttendance;

  const modalParticipantName =
    attendanceModalTarget?.mode === 'organizer'
      ? getParticipantDisplayName(attendanceModalTarget.participant)
      : undefined;

  /**
   * Confirma y ejecuta el abandono de la juntada.
   */
  const handleLeaveMeetup = () => {
    Alert.alert(
      'Abandonar juntada',
      '¿Estás seguro de que querés abandonar esta juntada? Podés volver a unirte con el código.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Abandonar',
          style: 'destructive',
          onPress: async () => {
            setIsLeaving(true);
            const result = await leaveMeetup();
            setIsLeaving(false);

            if (result.error) {
              Alert.alert('Error', result.error);
              return;
            }

            navigation.navigate(Routes.MeetupHome);
          },
        },
      ],
    );
  };

  if (isLoading && participants.length === 0) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Cargando participantes...</Text>
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
          <Ionicons
            name="arrow-back"
            size={22}
            color={theme.colors.textPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Participantes</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {error ? (
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
      ) : (
        <FlatList
          data={participants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const canEditAsOrganizer =
              isOrganizer &&
              item.role !== 'organizer' &&
              item.userId !== currentUserId;

            return (
              <ParticipantRow
                participant={item}
                editable={canEditAsOrganizer}
                onPress={
                  canEditAsOrganizer
                    ? () =>
                        setAttendanceModalTarget({
                          mode: 'organizer',
                          participant: item,
                        })
                    : undefined
                }
              />
            );
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            isOrganizer ? (
              <Text style={styles.organizerHint}>
                Tocá un participante para modificar su asistencia
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No hay participantes activos en esta juntada
              </Text>
            </View>
          }
        />
      )}

      {isParticipant && (
        <View style={styles.footer}>
          <ModifyAttendanceLink
            align="stretch"
            showTopMargin={false}
            onPress={() => setAttendanceModalTarget({ mode: 'self' })}
          />
          <TouchableOpacity
            style={[styles.leaveBtn, isLeaving && styles.leaveBtnDisabled]}
            onPress={handleLeaveMeetup}
            disabled={isLeaving}
            activeOpacity={0.8}
          >
            {isLeaving ? (
              <ActivityIndicator color={theme.colors.surface} />
            ) : (
              <Text style={styles.leaveBtnText}>Abandonar juntada</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <ModifyAttendanceScreen
        visible={attendanceModalTarget !== null}
        currentStatus={modalCurrentStatus}
        participantName={modalParticipantName}
        onClose={() => {
          setAttendanceModalTarget(null);
          // Recargar datos después del cierre para no bloquear la animación
          void refresh();
          if (pendingToastRef.current) {
            setToast({ message: pendingToastRef.current, type: 'success' });
            pendingToastRef.current = null;
          }
        }}
        onSave={async (status) => {
          if (attendanceModalTarget?.mode === 'organizer') {
            const result = await updateParticipantAttendance(
              attendanceModalTarget.participant.userId,
              status,
            );
            if (result.error) throw new Error(result.error);
            pendingToastRef.current = '✓ Asistencia actualizada';
            return;
          }

          const result = await updateAttendance(status);
          if (result.error) throw new Error(result.error);
          pendingToastRef.current = '✓ Asistencia actualizada';
        }}
      />

      <Toast
        message={toast?.message ?? ''}
        type={toast?.type ?? 'success'}
        visible={!!toast}
        onHide={() => setToast(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
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
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  organizerHint: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.md,
    ...theme.shadows.sm,
  },
  participantRowEditable: {
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.surface,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.full,
  },
  participantInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  participantName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    flexShrink: 1,
  },
  participantUsername: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    marginTop: theme.spacing.xs,
  },
  roleBadgeText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: '#92400E',
  },
  attendanceBadge: {
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  attendanceText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.error,
    textAlign: 'center',
  },
  retryText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  leaveBtn: {
    height: theme.components.buttonHeight,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.error,
  },
  leaveBtnDisabled: {
    opacity: 0.6,
  },
  leaveBtnText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.surface,
  },
});

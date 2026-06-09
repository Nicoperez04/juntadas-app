/**
 * Resumen de participantes en el detalle de juntada.
 *
 * Muestra los primeros 5 participantes con avatar, rol y badge de asistencia,
 * el link "Ver participantes" hacia la lista completa, el hint para el
 * organizador y el acceso a modificar la asistencia propia. Extraído de
 * MeetupDetailScreen para que la pantalla quede como orquestadora.
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/shared/constants/theme';
import { ModifyAttendanceLink } from '@/shared/components/ModifyAttendanceLink';
import { getParticipantDisplayName } from '@/features/participants/utils/participantDisplay';
import type { MeetupParticipant } from '../types';

/** Cantidad máxima de participantes visibles antes del link "+N más" */
const MAX_VISIBLE_PARTICIPANTS = 5;

/**
 * Paleta de colores para avatares de participantes.
 * El índice se calcula hasheando el userId para consistencia visual.
 */
const AVATAR_PALETTE = [
  '#7C3AED',
  '#EC4899',
  '#0EA5E9',
  '#059669',
  '#D97706',
  '#DC2626',
  '#7C3AED',
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

/**
 * Label visual y color para cada estado de asistencia.
 * Centraliza los valores para que sean consistentes en toda la sección.
 */
const ATTENDANCE_CONFIG: Record<
  string,
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

/** Props de la fila de un participante en la lista */
interface ParticipantRowProps {
  participant: MeetupParticipant;
  onPress?: () => void;
  editable?: boolean;
}

/**
 * Fila individual de participante con avatar (foto o iniciales),
 * nombre, username, estrella de organizador y badge de asistencia.
 */
const ParticipantItem = ({
  participant,
  onPress,
  editable = false,
}: ParticipantRowProps) => {
  const config =
    ATTENDANCE_CONFIG[participant.attendanceStatus] ??
    ATTENDANCE_CONFIG.pending;
  const avatarColor = AVATAR_PALETTE[getAvatarColorIndex(participant.userId)];

  const displayName = getParticipantDisplayName(participant);
  const initials = getInitials(displayName);

  // Si tiene avatar en el perfil, mostrar foto; si no, iniciales con color determinístico
  const avatarUrl = participant.profile.avatarUrl;

  const content = (
    <>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.participantAvatar} />
      ) : (
        <View
          style={[styles.participantAvatar, { backgroundColor: avatarColor }]}
        >
          <Text style={styles.participantAvatarText}>{initials}</Text>
        </View>
      )}
      <View style={styles.participantInfo}>
        <Text style={styles.participantName} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.participantUsername}>
          @{participant.profile.username}
        </Text>
      </View>
      {participant.role === 'organizer' && (
        <Ionicons
          name="star"
          size={14}
          color="#D97706"
          style={styles.organizerStar}
        />
      )}
      <View
        style={[styles.attendanceBadge, { backgroundColor: config.bgColor }]}
      >
        <Text style={[styles.attendanceBadgeText, { color: config.textColor }]}>
          {config.label}
        </Text>
      </View>
      {editable && (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={theme.colors.textDisabled}
        />
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[
          styles.participantRow,
          editable && styles.participantRowEditable,
        ]}
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

/** Props del resumen de participantes */
interface MeetupParticipantsSummaryProps {
  participants: MeetupParticipant[];
  /** true si el usuario actual es el organizador de la juntada */
  isOrganizer: boolean;
  /** true si la juntada está activa — habilita la edición de asistencia */
  isActive: boolean;
  /** true si el usuario es un invitado activo que puede modificar su asistencia */
  isParticipant: boolean;
  /** Navega a la lista completa de participantes */
  onSeeAll: () => void;
  /** Abre el modal de asistencia de un invitado (acción del organizador) */
  onEditParticipant: (participant: MeetupParticipant) => void;
  /** Abre el modal de asistencia propia */
  onModifyOwnAttendance: () => void;
}

export const MeetupParticipantsSummary = ({
  participants,
  isOrganizer,
  isActive,
  isParticipant,
  onSeeAll,
  onEditParticipant,
  onModifyOwnAttendance,
}: MeetupParticipantsSummaryProps) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Participantes ({participants.length})
        </Text>
        <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
          <Text style={styles.seeAllLink}>Ver participantes</Text>
        </TouchableOpacity>
      </View>
      {isOrganizer && isActive && (
        <Text style={styles.organizerHint}>
          Tocá un participante para modificar su asistencia
        </Text>
      )}
      <View style={styles.participantsList}>
        {participants.slice(0, MAX_VISIBLE_PARTICIPANTS).map((participant) => {
          const canEditAsOrganizer =
            isOrganizer && isActive && participant.role !== 'organizer';

          return (
            <ParticipantItem
              key={participant.id}
              participant={participant}
              editable={canEditAsOrganizer}
              onPress={
                canEditAsOrganizer
                  ? () => onEditParticipant(participant)
                  : undefined
              }
            />
          );
        })}
        {participants.length > MAX_VISIBLE_PARTICIPANTS && (
          <TouchableOpacity
            style={styles.moreParticipants}
            onPress={onSeeAll}
            activeOpacity={0.7}
          >
            <Text style={styles.moreParticipantsText}>
              +{participants.length - MAX_VISIBLE_PARTICIPANTS} más
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {isParticipant && isActive && (
        <ModifyAttendanceLink onPress={onModifyOwnAttendance} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  seeAllLink: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.primary,
  },
  organizerHint: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  participantsList: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  participantRowEditable: {
    backgroundColor: theme.colors.background,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantAvatarText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.surface,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  participantUsername: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  organizerStar: {
    marginRight: theme.spacing.xs,
  },
  attendanceBadge: {
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
  },
  attendanceBadgeText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
  },
  moreParticipants: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  moreParticipantsText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.primary,
  },
});

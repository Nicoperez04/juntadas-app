/**
 * Pantalla de detalle de una juntada.
 *
 * Muestra la información completa de la juntada: datos principales,
 * acciones (Jugar / Recuerdos), lista de participantes con sus estados
 * de asistencia, y la sección de código para compartir.
 *
 * El rol del usuario actual se determina buscando su ID dentro de la
 * lista de participantes. El código se copia al clipboard vía expo-clipboard
 * y se comparte vía la API nativa de Share.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { supabase } from '@/lib/supabase/client';
import { theme } from '@/shared/constants/theme';
import { useMeetups } from '../hooks/useMeetups';
import type {
  Meetup,
  MeetupParticipant,
  ParticipantRole,
  MainStackParamList,
} from '../types';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'MeetupDetail'>;
type RoutePropType = RouteProp<MainStackParamList, 'MeetupDetail'>;

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
 * Formatea una fecha en formato legible para el usuario.
 * Soporta ISO (YYYY-MM-DD) y DD/MM/YYYY.
 *
 * @param dateStr - Fecha como string
 * @returns Fecha formateada
 */
const formatDate = (dateStr: string): string => {
  if (dateStr.includes('/')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

/**
 * Label visual y color para cada estado de asistencia.
 * Centraliza los valores para que sean consistentes en toda la pantalla.
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
    label: 'No va',
    bgColor: theme.colors.errorLight,
    textColor: theme.colors.error,
  },
};

/** Card de acción principal (Jugar / Recuerdos) */
interface ActionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}

const ActionCard = ({ icon, label, color, onPress }: ActionCardProps) => (
  <Pressable
    style={({ pressed }) => [
      styles.actionCard,
      pressed && styles.actionCardPressed,
    ]}
    onPress={onPress}
  >
    <View style={[styles.actionIconBox, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={28} color={color} />
    </View>
    <Text style={[styles.actionLabel, { color }]}>{label}</Text>
  </Pressable>
);

/** Fila de un participante en la lista */
interface ParticipantRowProps {
  participant: MeetupParticipant;
}

const ParticipantItem = ({ participant }: ParticipantRowProps) => {
  const config =
    ATTENDANCE_CONFIG[participant.attendanceStatus] ??
    ATTENDANCE_CONFIG.pending;
  const avatarColor =
    AVATAR_PALETTE[getAvatarColorIndex(participant.userId)];
  const initials = getInitials(participant.profile.fullName);

  return (
    <View style={styles.participantRow}>
      <View
        style={[styles.participantAvatar, { backgroundColor: avatarColor }]}
      >
        <Text style={styles.participantAvatarText}>{initials}</Text>
      </View>
      <View style={styles.participantInfo}>
        <Text style={styles.participantName} numberOfLines={1}>
          {participant.profile.fullName}
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
        style={[
          styles.attendanceBadge,
          { backgroundColor: config.bgColor },
        ]}
      >
        <Text
          style={[styles.attendanceBadgeText, { color: config.textColor }]}
        >
          {config.label}
        </Text>
      </View>
    </View>
  );
};

export const MeetupDetailScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { meetupId } = route.params;

  const { getMeetupById, getMeetupParticipants } = useMeetups();

  const [meetup, setMeetup] = useState<Meetup | null>(null);
  const [participants, setParticipants] = useState<MeetupParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  /** Estado visual del botón copiar: 'idle' | 'copied' */
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

  // Obtener el ID del usuario actual para determinar su rol en la juntada
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const [meetupResult, participantsResult] = await Promise.all([
      getMeetupById(meetupId),
      getMeetupParticipants(meetupId),
    ]);

    if (meetupResult.error) {
      setError(meetupResult.error);
    } else {
      setMeetup(meetupResult.data);
    }

    if (participantsResult.data) {
      setParticipants(participantsResult.data);
    }

    setIsLoading(false);
  }, [meetupId, getMeetupById, getMeetupParticipants]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /** Rol del usuario actual determinado desde la lista de participantes */
  const currentUserParticipant = participants.find(
    (p) => p.userId === currentUserId,
  );
  const userRole: ParticipantRole =
    currentUserParticipant?.role ?? 'participant';

  const confirmedCount = participants.filter(
    (p) => p.attendanceStatus === 'confirmed',
  ).length;

  /**
   * Comparte el código de la juntada usando la API nativa Share.
   * Permite al usuario enviarlo por el canal que prefiera (WhatsApp, etc.).
   */
  const handleShare = async () => {
    if (!meetup) return;
    try {
      await Share.share({
        message: `¡Unite a mi juntada "${meetup.title}"! Usá el código: ${meetup.joinCode}`,
        title: 'Compartir juntada',
      });
    } catch {
      // Error ignorado — el usuario puede haber cancelado el share sheet
    }
  };

  /**
   * Copia el código de la juntada al clipboard del dispositivo y muestra
   * feedback visual transitorio: el ícono cambia a checkmark durante 2 segundos
   * para confirmar la acción sin necesidad de un modal o alerta.
   */
  const handleCopy = async () => {
    if (!meetup) return;
    await Clipboard.setStringAsync(meetup.joinCode);
    setCopyState('copied');
    setTimeout(() => setCopyState('idle'), 2000);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Cargando juntada...</Text>
      </SafeAreaView>
    );
  }

  if (error || !meetup) {
    return (
      <SafeAreaView style={styles.errorFullScreen} edges={['top', 'bottom']}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={theme.colors.error}
        />
        <Text style={styles.errorFullText}>
          {error ?? 'No se pudo cargar la juntada'}
        </Text>
        <TouchableOpacity onPress={loadData} activeOpacity={0.7}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isOrganizer = userRole === 'organizer';
  const roleLabel = isOrganizer ? 'Organizador' : 'Invitado';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
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
        <Text style={styles.headerTitle}>Detalle</Text>
        <View
          style={[
            styles.roleBadge,
            isOrganizer ? styles.badgeOrganizer : styles.badgeParticipant,
          ]}
        >
          <Text
            style={[
              styles.roleBadgeText,
              isOrganizer
                ? styles.badgeTextOrganizer
                : styles.badgeTextParticipant,
            ]}
          >
            {roleLabel}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card principal con datos de la juntada */}
        <View style={styles.mainCard}>
          <Text style={styles.meetupTitle}>{meetup.title}</Text>
          {meetup.description && (
            <Text style={styles.meetupDescription}>{meetup.description}</Text>
          )}

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons
                name="calendar"
                size={18}
                color={theme.colors.primary}
              />
            </View>
            <View>
              <Text style={styles.infoLabel}>Fecha y hora</Text>
              <Text style={styles.infoValue}>
                {formatDate(meetup.date)} · {meetup.time}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons
                name="location"
                size={18}
                color={theme.colors.secondary}
              />
            </View>
            <View style={styles.infoTextFlex}>
              <Text style={styles.infoLabel}>Ubicación</Text>
              <Text style={styles.infoValue} numberOfLines={2}>
                {meetup.location}
              </Text>
            </View>
          </View>

          {meetup.estimatedCost !== null && (
            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Ionicons
                  name="cash"
                  size={18}
                  color={theme.colors.success}
                />
              </View>
              <View>
                <Text style={styles.infoLabel}>Costo estimado</Text>
                <Text style={styles.infoValue}>
                  ${meetup.estimatedCost} por persona
                </Text>
              </View>
            </View>
          )}

          {/* Contador de participantes */}
          <View style={styles.participantCounter}>
            <Ionicons
              name="people"
              size={16}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.participantCounterText}>
              {participants.length} participantes · {confirmedCount}{' '}
              confirmados
            </Text>
          </View>
        </View>

        {/* Botones de acción: Jugar y Recuerdos */}
        <View style={styles.actionsRow}>
          <ActionCard
            icon="game-controller"
            label="Jugar"
            color={theme.colors.primary}
            onPress={() => {
              /* Placeholder — se implementa en el bloque de Impostor */
            }}
          />
          <ActionCard
            icon="images"
            label="Recuerdos"
            color={theme.colors.secondary}
            onPress={() => {
              /* Placeholder — se implementa en el bloque de Memorias */
            }}
          />
        </View>

        {/* Sección de participantes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Participantes ({participants.length})
          </Text>
          <View style={styles.participantsList}>
            {participants.map((participant) => (
              <ParticipantItem
                key={participant.id}
                participant={participant}
              />
            ))}
          </View>
        </View>

        {/* Sección de compartir */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compartir juntada</Text>
          <View style={styles.shareCard}>
            <Text style={styles.shareLabel}>Código de acceso</Text>
            {/* El código se muestra con letter-spacing ampliado para simular monospace */}
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{meetup.joinCode}</Text>
            </View>
            <Text style={styles.shareHint}>
              Compartí este código para que otros puedan unirse
            </Text>
            <View style={styles.shareButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.shareBtn,
                  styles.shareBtnCopy,
                  pressed && styles.shareBtnPressed,
                ]}
                onPress={handleCopy}
              >
                <Ionicons
                  name={copyState === 'copied' ? 'checkmark' : 'copy-outline'}
                  size={18}
                  color={
                    copyState === 'copied'
                      ? theme.colors.success
                      : theme.colors.primary
                  }
                />
                <Text
                  style={[
                    styles.shareBtnText,
                    copyState === 'copied' && styles.shareBtnTextCopied,
                  ]}
                >
                  {copyState === 'copied' ? '¡Copiado!' : 'Copiar'}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.shareBtn,
                  styles.shareBtnShare,
                  pressed && styles.shareBtnPressed,
                ]}
                onPress={handleShare}
              >
                <Ionicons
                  name="share-social-outline"
                  size={18}
                  color={theme.colors.surface}
                />
                <Text style={[styles.shareBtnText, styles.shareBtnTextWhite]}>
                  Compartir
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
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
  errorFullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  errorFullText: {
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
  roleBadge: {
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: 4,
  },
  badgeOrganizer: {
    backgroundColor: '#FEF3C7',
  },
  badgeParticipant: {
    backgroundColor: theme.colors.primaryLight,
  },
  roleBadgeText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
  },
  badgeTextOrganizer: {
    color: '#92400E',
  },
  badgeTextParticipant: {
    color: theme.colors.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  mainCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  meetupTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  meetupDescription: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextFlex: {
    flex: 1,
  },
  infoLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
    marginTop: 2,
  },
  participantCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  participantCounterText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    gap: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  actionCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  actionIconBox: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
  },
  section: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
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
  shareCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  shareLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.md,
  },
  codeBox: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  codeText: {
    fontSize: 28,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    letterSpacing: 8,
    /* Letter-spacing ampliado para simular tipografía monospace */
  },
  shareHint: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  shareButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    width: '100%',
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
  },
  shareBtnCopy: {
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  shareBtnShare: {
    backgroundColor: theme.colors.primary,
  },
  shareBtnPressed: {
    opacity: 0.8,
  },
  shareBtnText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
  shareBtnTextCopied: {
    color: theme.colors.success,
  },
  shareBtnTextWhite: {
    color: theme.colors.surface,
  },
  bottomSpace: {
    height: theme.spacing.xl,
  },
});

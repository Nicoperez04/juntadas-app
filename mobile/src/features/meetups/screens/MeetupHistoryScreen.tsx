/**
 * Pantalla de historial de juntadas pasadas.
 *
 * Lista juntadas finalizadas o canceladas en las que el usuario participó,
 * ya sea como organizador o invitado. Estructura similar al home pero sin
 * acciones de crear o unirse.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '@/shared/constants/theme';
import { Routes } from '@/navigation/routes';
import { useMeetups } from '../hooks/useMeetups';
import type { MeetupWithRole, MeetupStatus, MainStackParamList } from '../types';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'MeetupHistory'>;

/**
 * Formatea una fecha almacenada como string para mostrar al usuario.
 *
 * @param dateStr - Fecha como string (ISO o DD/MM/YYYY)
 * @returns Fecha en formato DD/MM/YYYY
 */
const formatDate = (dateStr: string): string => {
  if (dateStr.includes('/')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

/** Configuración visual del badge de estado de la juntada */
const STATUS_CONFIG: Record<
  MeetupStatus,
  { label: string; bgColor: string; textColor: string }
> = {
  active: {
    label: 'Activa',
    bgColor: theme.colors.primaryLight,
    textColor: theme.colors.primary,
  },
  finished: {
    label: 'Finalizada',
    bgColor: theme.colors.successLight,
    textColor: theme.colors.success,
  },
  cancelled: {
    label: 'Cancelada',
    bgColor: theme.colors.errorLight,
    textColor: theme.colors.error,
  },
};

interface HistoryCardProps {
  meetup: MeetupWithRole;
  onPress: () => void;
}

/** Card de juntada histórica con badge de estado */
const HistoryCard = ({ meetup, onPress }: HistoryCardProps) => {
  const statusConfig = STATUS_CONFIG[meetup.status];
  const isOrganizer = meetup.userRole === 'organizer';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {meetup.title}
        </Text>
        <View
          style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}
        >
          <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      <View style={styles.cardInfoRow}>
        <Ionicons
          name="calendar-outline"
          size={13}
          color={theme.colors.textSecondary}
        />
        <Text style={styles.cardInfoText}>
          {formatDate(meetup.date)} · {meetup.time}
        </Text>
      </View>

      <View style={styles.cardInfoRow}>
        <Ionicons
          name="location-outline"
          size={13}
          color={theme.colors.textSecondary}
        />
        <Text style={styles.cardInfoText} numberOfLines={1}>
          {meetup.location}
        </Text>
      </View>

      <View style={styles.cardFooter}>
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
            {isOrganizer ? 'Organizador' : 'Invitado'}
          </Text>
        </View>
        <Text style={styles.countText}>
          {meetup.participantCount} participantes
        </Text>
      </View>
    </Pressable>
  );
};

export const MeetupHistoryScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { getFinishedMeetups } = useMeetups();

  const [historyMeetups, setHistoryMeetups] = useState<MeetupWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: err } = await getFinishedMeetups();

    if (err) {
      setError(err);
    } else {
      setHistoryMeetups(data ?? []);
    }

    setIsLoading(false);
  }, [getFinishedMeetups]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

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
        <Text style={styles.headerTitle}>Historial</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando historial...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons
            name="alert-circle-outline"
            size={36}
            color={theme.colors.error}
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadHistory} activeOpacity={0.7}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {historyMeetups.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrapper}>
                <Ionicons
                  name="time-outline"
                  size={64}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={styles.emptyTitle}>Sin historial aún</Text>
              <Text style={styles.emptySubtitle}>
                Acá vas a ver tus juntadas finalizadas y canceladas
              </Text>
            </View>
          ) : (
            historyMeetups.map((meetup) => (
              <HistoryCard
                key={meetup.id}
                meetup={meetup}
                onPress={() =>
                  navigation.navigate(Routes.MeetupDetail, {
                    meetupId: meetup.id,
                  })
                }
              />
            ))
          )}
          <View style={styles.bottomSpace} />
        </ScrollView>
      )}
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  loadingText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  statusBadge: {
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  cardInfoText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  roleBadge: {
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
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
  countText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.md,
  },
  emptyIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpace: {
    height: theme.spacing.xl,
  },
});

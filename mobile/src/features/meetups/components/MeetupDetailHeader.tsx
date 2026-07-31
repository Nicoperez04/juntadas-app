/**
 * Encabezado informativo del detalle de juntada.
 *
 * Agrupa los banners de estado (cancelada / finalizada / abandonada) y la
 * card principal con título, descripción, fecha y hora, ubicación, costo
 * estimado y contador de participantes. Extraído de MeetupDetailScreen
 * para que la pantalla quede como orquestadora.
 */
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/shared/constants/theme';
import type { Meetup } from '../types';

/** Altura fija del banner de portada en el detalle */
const COVER_BANNER_HEIGHT = 200;

/** Props del encabezado del detalle */
interface MeetupDetailHeaderProps {
  meetup: Meetup;
  /** true si el usuario abandonó la juntada — oculta el contador de participantes */
  hasAbandoned: boolean;
  /** Cantidad total de participantes activos */
  participantCount: number;
  /** Cantidad de participantes con asistencia confirmada */
  confirmedCount: number;
}

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

export const MeetupDetailHeader = ({
  meetup,
  hasAbandoned,
  participantCount,
  confirmedCount,
}: MeetupDetailHeaderProps) => {
  const isCancelled = meetup.status === 'cancelled';
  const isFinished = meetup.status === 'finished';

  return (
    <>
      {/* Banner de portada — solo si la juntada tiene foto configurada */}
      {meetup.cover_url && (
        <Image
          source={{ uri: meetup.cover_url }}
          style={styles.coverBanner}
          resizeMode="cover"
          accessibilityRole="image"
          accessibilityLabel={`Portada de ${meetup.title}`}
        />
      )}

      {/* Banner de estado para juntadas canceladas o finalizadas */}
      {(isCancelled || isFinished) && (
        <View
          style={[
            styles.statusBanner,
            isCancelled
              ? styles.statusBannerCancelled
              : styles.statusBannerFinished,
          ]}
        >
          <Ionicons
            name={isCancelled ? 'close-circle' : 'checkmark-circle'}
            size={20}
            color={isCancelled ? theme.colors.error : theme.colors.textSecondary}
          />
          <Text
            style={[
              styles.statusBannerText,
              isCancelled
                ? styles.statusBannerTextCancelled
                : styles.statusBannerTextFinished,
            ]}
          >
            {isCancelled
              ? 'Esta juntada fue cancelada'
              : 'Esta juntada ya finalizó'}
          </Text>
        </View>
      )}

      {/* Banner para usuarios que abandonaron la juntada */}
      {hasAbandoned && (
        <View style={styles.abandonedBanner}>
          <Ionicons
            name="exit-outline"
            size={20}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.abandonedBannerText}>
            Abandonaste esta juntada. Podés volver a unirte con el código.
          </Text>
        </View>
      )}

      {/* Card principal con datos de la juntada */}
      <View style={styles.mainCard}>
        <Text style={styles.meetupTitle}>{meetup.title}</Text>
        {meetup.description && (
          <Text style={styles.meetupDescription}>{meetup.description}</Text>
        )}

        <View style={styles.infoRow}>
          <View style={styles.infoIconBox}>
            <Ionicons name="calendar" size={18} color={theme.colors.primary} />
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
            <Ionicons name="location" size={18} color={theme.colors.secondary} />
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
              <Ionicons name="cash" size={18} color={theme.colors.success} />
            </View>
            <View>
              <Text style={styles.infoLabel}>Costo estimado</Text>
              <Text style={styles.infoValue}>
                ${meetup.estimatedCost} por persona
              </Text>
            </View>
          </View>
        )}

        {/* Contador de participantes — oculto si el usuario abandonó */}
        {!hasAbandoned && (
          <View style={styles.participantCounter}>
            <Ionicons
              name="people"
              size={16}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.participantCounterText}>
              {participantCount} participantes · {confirmedCount} confirmados
            </Text>
          </View>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  coverBanner: {
    width: '100%',
    height: COVER_BANNER_HEIGHT,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.border,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  statusBannerCancelled: {
    backgroundColor: theme.colors.errorLight,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  statusBannerFinished: {
    backgroundColor: theme.colors.border,
    borderWidth: 1,
    borderColor: theme.colors.textDisabled,
  },
  statusBannerText: {
    flex: 1,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
  },
  statusBannerTextCancelled: {
    color: theme.colors.error,
  },
  statusBannerTextFinished: {
    color: theme.colors.textSecondary,
  },
  abandonedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.border,
    borderWidth: 1,
    borderColor: theme.colors.textDisabled,
  },
  abandonedBannerText: {
    flex: 1,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
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
});

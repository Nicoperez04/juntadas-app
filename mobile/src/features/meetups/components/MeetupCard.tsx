/**
 * Card que muestra el resumen de una juntada.
 * Incluye badge de rol, fecha, ubicación y avatares apilados de participantes.
 *
 * Extraído de MeetupHomeScreen (antes privado a esa pantalla) para
 * reusarlo tal cual en GroupMeetupsScreen — mismo criterio visual en
 * ambos listados de juntadas.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Pressable, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/shared/constants/theme';
import { isPastMeetup } from '../utils/meetupDateTime';
import type { MeetupWithRole } from '../types';

const AVATAR_PALETTE = [
  theme.colors.primary,
  theme.colors.secondary,
  '#0EA5E9',
  '#059669',
  '#D97706',
];

/**
 * Formatea una fecha almacenada como string para mostrar al usuario.
 * Soporta tanto el formato ISO (YYYY-MM-DD) como DD/MM/YYYY.
 *
 * @param dateStr - Fecha como string
 * @returns Fecha en formato DD/MM/YYYY
 */
const formatDate = (dateStr: string): string => {
  if (dateStr.includes('/')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

/** Props de la card de juntada individual */
interface MeetupCardProps {
  meetup: MeetupWithRole;
  onPress: () => void;
  index?: number;
}

/**
 * @param meetup - Datos de la juntada con rol del usuario
 * @param onPress - Callback al presionar la card
 */
export const MeetupCard = ({ meetup, onPress, index }: MeetupCardProps) => {
  const isOrganizer = meetup.userRole === 'organizer';
  const visibleAvatars = Math.min(meetup.participantCount, 3);
  const overflow = meetup.participantCount - 3;

  // Animaciones de entrada en cascada (staggered)
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  // Animación de feedback táctil al presionar
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        delay: (index ?? 0) * 30,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 150,
        delay: (index ?? 0) * 30,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 3,
    }).start();
  };

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { scale }] }}>
      <Pressable
        style={styles.card}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
      {/* Fila superior: thumbnail de portada (si existe) + datos de la juntada */}
      <View style={styles.cardTopRow}>
        {meetup.cover_url && (
          <Image
            source={{ uri: meetup.cover_url }}
            style={styles.cardThumbnail}
            resizeMode="cover"
            accessibilityRole="image"
            accessibilityLabel={`Portada de ${meetup.title}`}
          />
        )}

        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {meetup.title}
            </Text>
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
          </View>

          <View style={styles.cardInfoRow}>
            <Ionicons
              name="calendar-outline"
              size={13}
              color={theme.colors.textSecondary}
            />
            <View style={styles.cardDateBlock}>
              <Text style={styles.cardInfoText}>
                {formatDate(meetup.date)} · {meetup.time}
              </Text>
              {meetup.status === 'active' &&
                isPastMeetup(meetup.date, meetup.time) && (
                  <Text style={styles.pastMeetupHint}>
                    Esta juntada ya ocurrió
                  </Text>
                )}
            </View>
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
        </View>
      </View>

      <View style={styles.cardFooter}>
        {/* Avatares apilados — placeholders con color determinístico */}
        <View style={styles.avatarStack}>
          {Array.from({ length: visibleAvatars }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.avatarSmall,
                {
                  backgroundColor: AVATAR_PALETTE[i % AVATAR_PALETTE.length],
                  marginLeft: i > 0 ? -8 : 0,
                },
              ]}
            />
          ))}
          {overflow > 0 && (
            <View
              style={[styles.avatarSmall, styles.avatarOverflow, { marginLeft: -8 }]}
            >
              <Text style={styles.avatarOverflowText}>
                +{overflow}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.countText}>
          {meetup.confirmedCount}/{meetup.participantCount} confirmados
        </Text>
      </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
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
  cardTopRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  cardThumbnail: {
    width: 60,
    height: 60,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.border,
  },
  cardBody: {
    flex: 1,
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
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  cardInfoText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  cardDateBlock: {
    flex: 1,
  },
  pastMeetupHint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
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
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSmall: {
    width: 26,
    height: 26,
    borderRadius: theme.radius.full,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  avatarOverflow: {
    backgroundColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverflowText: {
    fontSize: 9,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textSecondary,
  },
  countText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
  },
});

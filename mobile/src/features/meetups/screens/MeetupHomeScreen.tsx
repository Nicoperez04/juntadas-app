/**
 * Pantalla principal de juntadas (home autenticado).
 *
 * Muestra la lista de juntadas activas del usuario con cards que incluyen
 * el rol, fecha, ubicación y conteo de participantes. Incluye acciones
 * rápidas para crear y unirse a juntadas, un empty state atractivo cuando
 * no hay juntadas, y un tab bar visual en la parte inferior.
 *
 * El skeleton de carga evita la pantalla en blanco mientras se obtienen
 * los datos del servidor.
 */
import React, { useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { appLogoSource } from '@/shared/assets/appAssets';
import { theme } from '@/shared/constants/theme';
import { Routes } from '@/navigation/routes';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMeetups } from '../hooks/useMeetups';
import type { MeetupWithRole, MainStackParamList } from '../types';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'MeetupHome'>;

/**
 * Paleta de colores para avatares de placeholder en las cards.
 * Usa colores del tema extendidos con complementarios cohesivos.
 */
const AVATAR_PALETTE = [
  theme.colors.primary,
  theme.colors.secondary,
  '#0EA5E9',
  '#059669',
  '#D97706',
];

/**
 * Genera un índice de color determinístico a partir de un string.
 * Garantiza que el mismo string siempre produzca el mismo color de avatar.
 *
 * @param str - String a hashear (userId, nombre, etc.)
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
 * Si el nombre está vacío, retorna '?'.
 *
 * @param name - Nombre completo del usuario
 * @returns Iniciales en mayúsculas
 */
const getInitials = (name: string): string => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

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

/** Componente de card skeleton para el estado de carga inicial */
const SkeletonCard = () => {
  const opacity = useRef(new Animated.Value(0.4)).current;

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
    <Animated.View style={[styles.skeletonCard, { opacity }]}>
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, { width: '55%' }]} />
    </Animated.View>
  );
};

/** Props de la card de juntada individual */
interface MeetupCardProps {
  meetup: MeetupWithRole;
  onPress: () => void;
}

/**
 * Card que muestra el resumen de una juntada en la lista principal.
 * Incluye badge de rol, fecha, ubicación y avatares apilados de participantes.
 *
 * @param meetup - Datos de la juntada con rol del usuario
 * @param onPress - Callback al presionar la card
 */
const MeetupCard = ({ meetup, onPress }: MeetupCardProps) => {
  const isOrganizer = meetup.userRole === 'organizer';
  const visibleAvatars = Math.min(meetup.participantCount, 3);
  const overflow = meetup.participantCount - 3;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
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
  );
};

/** Definición de cada tab del menú inferior */
interface TabDefinition {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}

const TABS: TabDefinition[] = [
  { id: 'home', label: 'Inicio', icon: 'home-outline', activeIcon: 'home' },
  {
    id: 'create',
    label: 'Crear',
    icon: 'add-circle-outline',
    activeIcon: 'add-circle',
  },
  {
    id: 'join',
    label: 'Unirse',
    icon: 'enter-outline',
    activeIcon: 'enter',
  },
  {
    id: 'games',
    label: 'Juegos',
    icon: 'game-controller-outline',
    activeIcon: 'game-controller',
  },
  {
    id: 'profile',
    label: 'Perfil',
    icon: 'person-outline',
    activeIcon: 'person',
  },
];

export const MeetupHomeScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { meetups, isLoading, error, refresh } = useMeetups();
  const { profile, loadProfile } = useAuth();

  // Nombre para el avatar — prioriza el perfil de la tabla profiles
  // sobre los metadatos de Auth para reflejar cambios del ProfileScreen
  const userName = profile?.fullName ?? profile?.username ?? '';

  /**
   * Recarga la lista cada vez que el home recibe foco (montaje o vuelta desde
   * crear/unirse/detalle). useEffect solo corre al montar; useFocusEffect cubre
   * el caso de volver atrás sin remontar el componente.
   */
  useFocusEffect(
    useCallback(() => {
      refresh();
      void loadProfile();
    }, [refresh, loadProfile]),
  );

  const handleTabPress = useCallback(
    (tabId: string) => {
      if (tabId === 'create') navigation.navigate(Routes.CreateMeetup);
      if (tabId === 'join') navigation.navigate(Routes.JoinMeetup);
      if (tabId === 'games') navigation.navigate(Routes.Games);
      if (tabId === 'profile') navigation.navigate(Routes.Profile);
    },
    [navigation],
  );

  const handleMeetupPress = useCallback(
    (meetupId: string) => {
      navigation.navigate(Routes.MeetupDetail, { meetupId });
    },
    [navigation],
  );

  const avatarBgColor =
    AVATAR_PALETTE[getAvatarColorIndex(userName || 'user')];
  const initials = getInitials(userName);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrapper}>
        <Ionicons
          name="people-circle-outline"
          size={80}
          color={theme.colors.primary}
        />
      </View>
      <Text style={styles.emptyTitle}>No tenés juntadas aún</Text>
      <Text style={styles.emptySubtitle}>
        Creá una juntada o unite a una con el código de tu amigo
      </Text>
      <Pressable
        style={({ pressed }) => [
          styles.emptyButton,
          pressed && styles.emptyButtonPressed,
        ]}
        onPress={() => navigation.navigate(Routes.CreateMeetup)}
      >
        <Ionicons name="add" size={18} color={theme.colors.surface} />
        <Text style={styles.emptyButtonText}>Crear mi primera juntada</Text>
      </Pressable>
    </View>
  );

  const renderError = () => (
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
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.topSafe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>Bienvenido</Text>
            <View style={styles.headerTitleRow}>
              <Image
                source={appLogoSource}
                style={styles.headerLogo}
                resizeMode="contain"
              />
              <Text style={styles.headerTitle}>Mis juntadas</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.notificationBtn}
              activeOpacity={0.7}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color={theme.colors.textPrimary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerAvatar, { backgroundColor: profile?.avatarUrl ? 'transparent' : avatarBgColor }]}
              onPress={() => navigation.navigate(Routes.Profile)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Ver mi perfil"
            >
              {profile?.avatarUrl ? (
                <Image
                  source={{ uri: profile.avatarUrl }}
                  style={styles.headerAvatarImage}
                />
              ) : (
                <Text style={styles.headerAvatarText}>{initials}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Acciones rápidas */}
        <View style={styles.quickActions}>
          <Pressable
            style={({ pressed }) => [
              styles.quickCard,
              pressed && styles.quickCardPressed,
            ]}
            onPress={() => navigation.navigate(Routes.CreateMeetup)}
          >
            <View
              style={[
                styles.quickIconBox,
                { backgroundColor: theme.colors.primaryLight },
              ]}
            >
              <Ionicons
                name="add-circle"
                size={30}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.quickLabel}>{'Crear\njuntada'}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.quickCard,
              pressed && styles.quickCardPressed,
            ]}
            onPress={() => navigation.navigate(Routes.JoinMeetup)}
          >
            <View
              style={[
                styles.quickIconBox,
                // Fallback defensivo por si secondaryLight no estuviera definido en el tema
                { backgroundColor: theme.colors.secondaryLight ?? `${theme.colors.secondary}20` },
              ]}
            >
              <Ionicons
                name="enter"
                size={30}
                color={theme.colors.secondary}
              />
            </View>
            <Text style={styles.quickLabel}>{'Unirse a\njuntada'}</Text>
          </Pressable>
        </View>

        {/* Título de sección con contador */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Próximas juntadas</Text>
          {meetups.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{meetups.length}</Text>
            </View>
          )}
        </View>

        {/* Contenido: skeleton, error, vacío o lista */}
        {isLoading && meetups.length === 0 ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : error ? (
          renderError()
        ) : meetups.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {meetups.map((meetup) => (
              <MeetupCard
                key={meetup.id}
                meetup={meetup}
                onPress={() => handleMeetupPress(meetup.id)}
              />
            ))}
            <TouchableOpacity
              style={styles.historyLink}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(Routes.MeetupHistory)}
            >
              <Text style={styles.historyLinkText}>Ver historial</Text>
              <Ionicons
                name="chevron-forward"
                size={15}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </>
        )}

        {/* Espacio para que el contenido no quede tapado por el tab bar */}
        <View style={styles.scrollBottom} />
      </ScrollView>

      {/* Tab bar fijo en la parte inferior */}
      <SafeAreaView style={styles.tabSafe} edges={['bottom']}>
        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const isActive = tab.id === 'home';
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.tabItem}
                onPress={() => handleTabPress(tab.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={22}
                  color={
                    isActive
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.tabLabel,
                    isActive && styles.tabLabelActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerSubtitle: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: 2,
  },
  headerLogo: {
    width: 30,
    height: 30,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  notificationBtn: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.surface,
  },
  headerAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: theme.radius.full,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  scrollBottom: {
    height: theme.spacing.xxl,
  },
  quickActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  quickCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  quickCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  quickIconBox: {
    width: 54,
    height: 54,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  quickLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  countBadge: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
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
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
  },
  skeletonCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  skeletonTitle: {
    height: 18,
    width: '70%',
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    marginBottom: theme.spacing.sm,
  },
  skeletonLine: {
    height: 13,
    width: '90%',
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    marginTop: theme.spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: theme.spacing.xl,
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
    marginBottom: theme.spacing.xl,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  emptyButtonPressed: {
    opacity: 0.85,
  },
  emptyButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.surface,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
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
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  historyLinkText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.primary,
  },
  tabSafe: {
    backgroundColor: theme.colors.surface,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
  },
  tabLabelActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
  },
});

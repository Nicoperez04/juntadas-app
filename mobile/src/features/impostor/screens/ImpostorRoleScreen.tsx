/**
 * Pantalla de revelación de roles del juego Impostor.
 *
 * Experiencia inmersiva con fondo oscuro. Muestra progreso de jugadores
 * sin revelar quién es el impostor hasta que el juego termine en persona.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { theme } from '@/shared/constants/theme';
import { Routes } from '@/navigation/routes';
import { AppButton } from '@/shared/components/AppButton';
import { APP_TAB_BAR_OFFSET } from '@/shared/components/AppTabBar';
import { triggerSelectionHaptic, triggerSuccessHaptic } from '@/shared/utils/haptics';
import type { MainStackParamList } from '@/navigation/types';
import { ImpostorTabBar } from '../components/ImpostorTabBar';
import { impostorColors } from '../constants/impostorTheme';
import { getCategoryLabel } from '../data/wordBank';
import { useImpostor } from '../hooks/useImpostor';
import { getAvatarColor, getInitials } from '../utils/playerAvatars';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'ImpostorRole'>;
type RoutePropType = RouteProp<MainStackParamList, 'ImpostorRole'>;

/** Indicador de progreso con dots — sin revelar identidades */
interface ProgressDotsProps {
  total: number;
  currentIndex: number;
}

const ProgressDots = ({ total, currentIndex }: ProgressDotsProps) => (
  <View style={styles.dotsRow}>
    {Array.from({ length: total }).map((_, index) => {
      const isDone = index < currentIndex;
      const isCurrent = index === currentIndex;
      return (
        <View
          key={`dot-${index}`}
          style={[
            styles.dot,
            isDone && styles.dotDone,
            isCurrent && styles.dotCurrent,
          ]}
        />
      );
    })}
  </View>
);

export const ImpostorRoleScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const meetupId = route.params?.meetupId;

  const {
    session,
    nextPlayer,
    currentPlayer,
    currentIsImpostor,
    revealedCount,
    clearSession,
  } = useImpostor(meetupId);

  const [isRevealed, setIsRevealed] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!session) {
      navigation.replace(Routes.ImpostorStart, { meetupId });
    }
  }, [session, meetupId, navigation]);

  useEffect(() => {
    flipAnim.setValue(0);
    setIsRevealed(false);
  }, [session?.currentPlayerIndex, flipAnim]);

  const flipCard = useCallback(() => {
    if (isRevealed) return;
    void triggerSelectionHaptic();
    setIsRevealed(true);
    Animated.spring(flipAnim, {
      toValue: 1,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
  }, [flipAnim, isRevealed]);

  const handleNext = useCallback(() => {
    void triggerSuccessHaptic();
    nextPlayer();
  }, [nextPlayer]);

  const handleNewRound = useCallback(() => {
    navigation.navigate(Routes.ImpostorStart, { meetupId });
  }, [navigation, meetupId]);

  const handleFinish = useCallback(() => {
    // Al salir del flujo se limpia la sesión para que la próxima entrada
    // vuelva a cargar la base desde participantes confirmados de la juntada
    clearSession();

    if (meetupId) {
      navigation.navigate(Routes.MeetupDetail, { meetupId });
      return;
    }
    navigation.navigate(Routes.Games, {});
  }, [navigation, meetupId, clearSession]);

  if (!session || !currentPlayer) {
    return null;
  }

  const totalPlayers = session.players.length;
  const currentNumber = session.currentPlayerIndex + 1;
  const isPlayingPhase = session.phase === 'playing';

  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  if (isPlayingPhase) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.topSafe} edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.headerTitleLight}>¡A jugar!</Text>
          </View>
        </SafeAreaView>

        <ScrollView
          style={styles.finalScroll}
          contentContainerStyle={styles.finalScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.finalIconWrapper}>
            <Ionicons name="sparkles" size={64} color={theme.colors.secondary} />
          </View>
          <Text style={styles.finalTitle}>¡Todos vieron su rol!</Text>
          <Text style={styles.finalSubtitle}>Descubrid quién es el impostor</Text>

          <View style={styles.finalPlayersList}>
            {session.players.map((player) => (
              <View key={player.id} style={styles.finalPlayerRow}>
                <View
                  style={[
                    styles.finalPlayerAvatar,
                    { backgroundColor: getAvatarColor(player.id) },
                  ]}
                >
                  <Text style={styles.finalPlayerInitials}>
                    {getInitials(player.name)}
                  </Text>
                </View>
                <Text style={styles.finalPlayerName}>{player.name}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Footer fijo: acciones siempre visibles por encima del tab bar */}
        <View style={styles.finalActions}>
          <AppButton label="Nueva ronda" onPress={handleNewRound} />
          <AppButton label="Terminar" variant="ghost" onPress={handleFinish} />
        </View>

        <ImpostorTabBar activeTabId="games" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.topSafe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>Tu rol</Text>
          <Text style={styles.headerPlayerName}>{currentPlayer.name}</Text>
          <Text style={styles.progressLabel}>
            Jugador {currentNumber} de {totalPlayers}
          </Text>
          <ProgressDots total={totalPlayers} currentIndex={session.currentPlayerIndex} />
          <Text style={styles.revealedHint}>
            {revealedCount} de {totalPlayers} ya vieron su rol
          </Text>
        </View>
      </SafeAreaView>

      <View style={styles.body}>
        <View style={styles.passPhoneBanner}>
          <Ionicons name="phone-portrait-outline" size={18} color={theme.colors.primaryLight} />
          <Text style={styles.passPhoneText}>
            Pasá el teléfono a {currentPlayer.name}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.95}
          onPress={flipCard}
          disabled={isRevealed}
          style={styles.cardTouchable}
        >
          <Animated.View
            style={[
              styles.flipCard,
              styles.cardFront,
              {
                transform: [{ perspective: 1000 }, { rotateY: frontRotate }],
                opacity: frontOpacity,
              },
            ]}
          >
            <Ionicons name="eye-off" size={56} color={theme.colors.surface} />
            <Text style={styles.cardFrontTitle}>Tocá para revelar tu rol</Text>
            <Text style={styles.cardFrontHint}>
              Asegurate de que solo vos estés mirando la pantalla
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.flipCard,
              styles.cardBack,
              {
                transform: [{ perspective: 1000 }, { rotateY: backRotate }],
                opacity: backOpacity,
              },
            ]}
          >
            {currentIsImpostor ? (
              <>
                <Ionicons name="eye-off" size={72} color={theme.colors.error} />
                <Text style={styles.impostorLabel}>IMPOSTOR</Text>
                <Text style={styles.impostorHint}>
                  No sabés la palabra. Intentá adivinarla sin que te descubran.
                </Text>
                {session.impostorPrompt ? (
                  <Text style={styles.impostorExtraHint}>
                    Pista: {session.impostorPrompt}
                  </Text>
                ) : null}
              </>
            ) : (
              <>
                <Ionicons name="eye" size={56} color={theme.colors.success} />
                <Text style={styles.wordEyebrow}>TU PALABRA ES</Text>
                <Text style={styles.wordValue}>{session.normalPrompt}</Text>
                <Text style={styles.wordHint}>
                  Describila sin decirla. Descubrí quién es el impostor.
                </Text>
                {session.showCategoryToGroup && (
                  <Text style={styles.categoryHint}>
                    Tema: {getCategoryLabel(session.topic)}
                  </Text>
                )}
              </>
            )}
          </Animated.View>
        </TouchableOpacity>

        {isRevealed && (
          <View style={styles.nextButtonWrapper}>
            <AppButton label="Listo, pasar al siguiente" onPress={handleNext} />
          </View>
        )}
      </View>

      <ImpostorTabBar activeTabId="games" />
    </View>
  );
};

const CARD_HEIGHT = 360;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: impostorColors.revealBackground,
  },
  topSafe: {
    backgroundColor: impostorColors.revealBackground,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  headerEyebrow: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textDisabled,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerPlayerName: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.surface,
  },
  progressLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.primaryLight,
    marginTop: theme.spacing.xs,
  },
  revealedHint: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textDisabled,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginVertical: theme.spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.textDisabled,
    opacity: 0.4,
  },
  dotDone: {
    backgroundColor: theme.colors.success,
    opacity: 1,
  },
  dotCurrent: {
    backgroundColor: theme.colors.primary,
    opacity: 1,
    width: 12,
    height: 12,
  },
  headerTitleLight: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.surface,
  },
  body: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  passPhoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: impostorColors.heroDark,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  passPhoneText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.surface,
  },
  cardTouchable: {
    flex: 1,
    maxHeight: CARD_HEIGHT,
    alignSelf: 'center',
    width: '100%',
  },
  flipCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: CARD_HEIGHT,
    borderRadius: theme.radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backfaceVisibility: 'hidden',
    ...theme.shadows.md,
  },
  cardFront: {
    backgroundColor: impostorColors.heroDark,
  },
  cardBack: {
    backgroundColor: theme.colors.surface,
  },
  cardFrontTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.surface,
    marginTop: theme.spacing.lg,
    textAlign: 'center',
  },
  cardFrontHint: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primaryLight,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  impostorLabel: {
    fontSize: theme.typography.sizes.xxl + 4,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.error,
    marginTop: theme.spacing.md,
    letterSpacing: 2,
  },
  impostorHint: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    lineHeight: 22,
  },
  impostorExtraHint: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    fontStyle: 'italic',
  },
  wordEyebrow: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textSecondary,
    letterSpacing: 2,
    marginTop: theme.spacing.md,
  },
  wordValue: {
    fontSize: theme.typography.sizes.xxl + 8,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  wordHint: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    lineHeight: 20,
  },
  categoryHint: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textDisabled,
    marginTop: theme.spacing.md,
  },
  nextButtonWrapper: {
    marginTop: theme.spacing.lg,
  },
  finalScroll: {
    flex: 1,
  },
  finalScrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  finalActions: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    // Reserva espacio para el tab bar absoluto y evita que "Terminar" quede tapado
    paddingBottom: APP_TAB_BAR_OFFSET + theme.spacing.sm,
    gap: theme.spacing.sm,
    backgroundColor: impostorColors.revealBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: impostorColors.heroDark,
  },
  finalIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: theme.radius.full,
    backgroundColor: impostorColors.heroDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
  },
  finalTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.surface,
    textAlign: 'center',
  },
  finalSubtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textDisabled,
    textAlign: 'center',
  },
  finalPlayersList: {
    width: '100%',
    gap: theme.spacing.sm,
    marginVertical: theme.spacing.lg,
  },
  finalPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: impostorColors.heroDark,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  finalPlayerAvatar: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finalPlayerInitials: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.surface,
  },
  finalPlayerName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.surface,
  },
});

/**
 * Pantalla principal del juego ¿Qué soy? en orientación landscape.
 *
 * Muestra el nombre del personaje al jugador mientras el grupo adivina.
 * Al agotar las cartas de la categoría, las vuelve a barajar automáticamente.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { theme } from '@/shared/constants/theme';
import type { MainStackParamList } from '@/navigation/types';
import {
  getCategoryLabel,
  getShuffledCards,
} from '@/features/games/data/whoAmIData';
import { triggerSelectionHaptic } from '@/shared/utils/haptics';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'WhoAmIGame'>;
type GameRouteProp = RouteProp<MainStackParamList, 'WhoAmIGame'>;

/** Duración de la transición entre cartas */
const CARD_TRANSITION_MS = 260;

/** Desplazamiento vertical de la animación de carta */
const CARD_TRANSLATE_DISTANCE = 36;

export const WhoAmIGameScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<GameRouteProp>();
  const { category } = route.params;

  const [cards, setCards] = useState(() => getShuffledCards(category));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardTranslateY = useRef(new Animated.Value(0)).current;

  const categoryLabel = getCategoryLabel(category);
  const currentWord = cards[currentIndex] ?? cards[0];
  const totalCards = cards.length;

  /**
   * Bloquea landscape al entrar y restaura portrait al salir para no
   * afectar el resto de pantallas de la app.
   */
  useEffect(() => {
    const lockLandscape = async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    };

    void lockLandscape();

    return () => {
      void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  /**
   * Anima salida hacia arriba y entrada desde abajo al cambiar de carta.
   * Si se agotaron las cartas, baraja de nuevo antes de reiniciar el índice.
   */
  const advanceCard = useCallback(() => {
    if (isAnimating) {
      return;
    }

    setIsAnimating(true);
    void triggerSelectionHaptic();

    Animated.sequence([
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 0,
          duration: CARD_TRANSITION_MS,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateY, {
          toValue: -CARD_TRANSLATE_DISTANCE,
          duration: CARD_TRANSITION_MS,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateY, {
          toValue: CARD_TRANSLATE_DISTANCE,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setCurrentIndex((previousIndex) => {
        const nextIndex = previousIndex + 1;

        if (nextIndex >= cards.length) {
          setCards(getShuffledCards(category));
          return 0;
        }

        return nextIndex;
      });

      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: CARD_TRANSITION_MS,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateY, {
          toValue: 0,
          duration: CARD_TRANSITION_MS,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsAnimating(false);
      });
    });
  }, [cardOpacity, cardTranslateY, cards.length, category, isAnimating]);

  const handleExit = () => {
    void triggerSelectionHaptic();
    navigation.goBack();
  };

  const displayIndex = Math.min(currentIndex + 1, totalCards);

  return (
    <View style={styles.root}>
      <View style={styles.gradientBase} />
      <View style={styles.gradientOverlay} />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <TouchableOpacity
              style={styles.exitButton}
              onPress={handleExit}
              accessibilityRole="button"
              accessibilityLabel="Salir del juego"
            >
              <MaterialCommunityIcons name="close" size={22} color={theme.colors.surface} />
              <Text style={styles.exitButtonText}>Salir</Text>
            </TouchableOpacity>
            <Text style={styles.categoryLabel}>{categoryLabel}</Text>
          </View>

          <Text style={styles.counter}>
            {displayIndex} / {totalCards}
          </Text>
        </View>

        <View style={styles.cardArea}>
          <Animated.Text
            style={[
              styles.characterName,
              {
                opacity: cardOpacity,
                transform: [{ translateY: cardTranslateY }],
              },
            ]}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            {currentWord}
          </Animated.Text>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.skipButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={advanceCard}
            disabled={isAnimating}
            accessibilityRole="button"
            accessibilityLabel="Pasar carta"
          >
            <Text style={styles.skipButtonText}>Pasar</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.guessButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={advanceCard}
            disabled={isAnimating}
            accessibilityRole="button"
            accessibilityLabel="Adivinó, siguiente carta"
          >
            <Text style={styles.guessButtonText}>¡Adivinó! Siguiente</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  gradientBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.primary,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.secondary,
    opacity: 0.28,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  topLeft: {
    gap: theme.spacing.sm,
    flexShrink: 1,
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  exitButtonText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.surface,
  },
  categoryLabel: {
    fontSize: theme.typography.sizes.sm,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: theme.typography.weights.medium,
  },
  counter: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.surface,
    marginTop: theme.spacing.xs,
  },
  cardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  characterName: {
    fontSize: 48,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.surface,
    textAlign: 'center',
    lineHeight: 56,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  actionButton: {
    minHeight: theme.components.buttonHeight,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  skipButton: {
    borderWidth: 2,
    borderColor: theme.colors.surface,
    backgroundColor: 'transparent',
  },
  skipButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.surface,
  },
  guessButton: {
    backgroundColor: theme.colors.surface,
  },
  guessButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
});

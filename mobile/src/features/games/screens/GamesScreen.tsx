/**
 * Hub principal de juegos y herramientas — accesible desde el tab bar.
 *
 * Presenta un grid de cards animadas agrupadas en "Juegos" y "Herramientas".
 * Los títulos no implementados muestran badge "Próximamente" y un toast informativo.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '@/shared/constants/theme';
import { Routes } from '@/navigation/routes';
import type { MainStackParamList } from '@/navigation/types';
import { Toast } from '@/shared/components/Toast';
import { triggerSelectionHaptic } from '@/shared/utils/haptics';
import { ImpostorTabBar } from '@/features/impostor/components/ImpostorTabBar';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'Games'>;
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Relación ancho/alto de cada card del grid */
const CARD_ASPECT_RATIO = 1.1;

/** Retraso entre la animación de entrada de cada card */
const STAGGER_DELAY_MS = 70;

/** Duración de fade + slide al montar la pantalla */
const ENTRANCE_DURATION_MS = 420;

/** Escala al presionar una card disponible */
const PRESS_SCALE = 0.96;

/** Opacidad de cards marcadas como "Próximamente" */
const COMING_SOON_OPACITY = 0.55;

interface GameHubCard {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  backgroundColor: string;
  iconColor: string;
  available: boolean;
}

interface GameCardProps {
  item: GameHubCard;
  width: number;
  animationIndex: number;
  onPress: (item: GameHubCard) => void;
}

/**
 * Card individual del hub con animación de entrada escalonada
 * y feedback táctil de escala al presionar.
 */
const GameCard = ({ item, width, animationIndex, onPress }: GameCardProps) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(22)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const cardHeight = width * CARD_ASPECT_RATIO;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: ENTRANCE_DURATION_MS,
        delay: animationIndex * STAGGER_DELAY_MS,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: ENTRANCE_DURATION_MS,
        delay: animationIndex * STAGGER_DELAY_MS,
        useNativeDriver: true,
      }),
    ]).start();
  }, [animationIndex, opacity, translateY]);

  const handlePressIn = () => {
    if (!item.available) {
      return;
    }

    Animated.spring(scale, {
      toValue: PRESS_SCALE,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 26,
      bounciness: 6,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          width,
          height: cardHeight,
          opacity: item.available ? opacity : Animated.multiply(opacity, COMING_SOON_OPACITY),
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <Pressable
        style={[
          styles.card,
          {
            backgroundColor: item.backgroundColor,
            width,
            height: cardHeight,
          },
        ]}
        onPress={() => onPress(item)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityState={{ disabled: !item.available }}
        accessibilityLabel={item.title}
      >
        {!item.available ? (
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonBadgeText}>Próximamente</Text>
          </View>
        ) : null}

        <MaterialCommunityIcons name={item.icon} size={44} color={item.iconColor} />

        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.cardDescription} numberOfLines={1}>
          {item.description}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

/**
 * Renderiza un grid de 2 columnas con animación escalonada continua
 * a partir del índice base indicado.
 */
interface GameGridProps {
  items: GameHubCard[];
  startIndex: number;
  cardWidth: number;
  onPress: (item: GameHubCard) => void;
}

const GameGrid = ({ items, startIndex, cardWidth, onPress }: GameGridProps) => (
  <View style={styles.grid}>
    {items.map((item, index) => (
      <GameCard
        key={item.id}
        item={item}
        width={cardWidth}
        animationIndex={startIndex + index}
        onPress={onPress}
      />
    ))}
  </View>
);

export const GamesScreen = () => {
  const navigation = useNavigation<NavProp>();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null,
  );
  const screenOpacity = useRef(new Animated.Value(1)).current;

  const cardWidth = useMemo(() => {
    const horizontalPadding = theme.spacing.lg * 2;
    const gap = theme.spacing.md;
    const screenWidth = Dimensions.get('window').width;
    return (screenWidth - horizontalPadding - gap) / 2;
  }, []);

  const gameItems = useMemo<GameHubCard[]>(
    () => [
      {
        id: 'impostor',
        title: 'Impostor',
        description: 'Descubrí quién miente',
        icon: 'eye-off',
        backgroundColor: theme.colors.primaryLight,
        iconColor: theme.colors.primary,
        available: true,
      },
      {
        id: 'what-am-i',
        title: '¿Qué soy?',
        description: 'Adiviná con preguntas',
        icon: 'account-question',
        backgroundColor: '#DBEAFE',
        iconColor: '#2563EB',
        available: true,
      },
      {
        id: 'group-questions',
        title: 'Preguntas para el grupo',
        description: 'Icebreakers para el grupo',
        icon: 'comment-question-outline',
        backgroundColor: '#FFEDD5',
        iconColor: '#EA580C',
        available: false,
      },
      {
        id: 'scorekeeper',
        title: 'Anotador genérico',
        description: 'Llevá el puntaje',
        icon: 'counter',
        backgroundColor: theme.colors.successLight,
        iconColor: theme.colors.success,
        available: false,
      },
    ],
    [],
  );

  const toolItems = useMemo<GameHubCard[]>(
    () => [
      {
        id: 'timer',
        title: 'Temporizador',
        description: 'Cuenta regresiva o cronómetro',
        icon: 'timer',
        backgroundColor: theme.colors.errorLight,
        iconColor: theme.colors.error,
        available: true,
      },
      {
        id: 'teams',
        title: 'Equipos aleatorios',
        description: 'Sorteo aleatorio de grupos',
        icon: 'account-group',
        backgroundColor: theme.colors.warningLight,
        iconColor: theme.colors.warning,
        available: true,
      },
    ],
    [],
  );

  /**
   * Navega con un fade breve para suavizar la transición visual
   * antes de cambiar de pantalla en el stack.
   */
  const navigateWithFade = useCallback(
    (navigate: () => void) => {
      Animated.sequence([
        Animated.timing(screenOpacity, {
          toValue: 0.88,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(screenOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();

      navigate();
    },
    [screenOpacity],
  );

  const handleCardPress = useCallback(
    (item: GameHubCard) => {
      if (!item.available) {
        void triggerSelectionHaptic();
        setToast({ message: 'Próximamente', type: 'success' });
        return;
      }

      void triggerSelectionHaptic();

      switch (item.id) {
        case 'impostor':
          navigateWithFade(() => navigation.navigate(Routes.ImpostorStart, {}));
          break;
        case 'what-am-i':
          navigateWithFade(() => navigation.navigate(Routes.WhoAmISetup));
          break;
        case 'timer':
          navigateWithFade(() => navigation.navigate(Routes.Timer));
          break;
        case 'teams':
          navigateWithFade(() => navigation.navigate(Routes.TeamRandomizer));
          break;
        default:
          break;
      }
    },
    [navigateWithFade, navigation],
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.topSafe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Juegos</Text>
        </View>
      </SafeAreaView>

      <Animated.View style={[styles.content, { opacity: screenOpacity }]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Juegos</Text>
          <GameGrid
            items={gameItems}
            startIndex={0}
            cardWidth={cardWidth}
            onPress={handleCardPress}
          />

          <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Herramientas</Text>
          <GameGrid
            items={toolItems}
            startIndex={gameItems.length}
            cardWidth={cardWidth}
            onPress={handleCardPress}
          />
        </ScrollView>
      </Animated.View>

      <ImpostorTabBar activeTabId="games" />

      <Toast
        message={toast?.message ?? ''}
        type={toast?.type ?? 'success'}
        visible={toast !== null}
        onHide={() => setToast(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topSafe: {
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  sectionTitleSpaced: {
    marginTop: theme.spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  cardWrapper: {
    ...theme.shadows.sm,
  },
  card: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  comingSoonBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    ...theme.shadows.sm,
  },
  comingSoonBadgeText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
  },
  cardTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

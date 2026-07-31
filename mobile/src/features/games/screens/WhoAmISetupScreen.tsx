/**
 * Pantalla de selección de categoría para el juego ¿Qué soy?.
 *
 * Muestra un grid de categorías con el mismo lenguaje visual que GamesScreen
 * y navega al juego pasando la categoría elegida como parámetro.
 */
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '@/shared/constants/theme';
import { Routes } from '@/navigation/routes';
import type { MainStackParamList } from '@/navigation/types';
import type { WhoAmICategorySelection } from '@/features/games/data/whoAmIData';
import { triggerSelectionHaptic } from '@/shared/utils/haptics';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'WhoAmISetup'>;
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const CARD_ASPECT_RATIO = 1.1;
const STAGGER_DELAY_MS = 70;
const ENTRANCE_DURATION_MS = 420;
const PRESS_SCALE = 0.96;

interface CategoryCardItem {
  id: WhoAmICategorySelection;
  title: string;
  icon: IconName;
  backgroundColor: string;
  iconColor: string;
}

interface CategoryCardProps {
  item: CategoryCardItem;
  width: number;
  animationIndex: number;
  onPress: (category: WhoAmICategorySelection) => void;
}

/**
 * Card de categoría con animación escalonada de entrada y feedback de press.
 */
const CategoryCard = ({ item, width, animationIndex, onPress }: CategoryCardProps) => {
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
          opacity,
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
        onPress={() => onPress(item.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={item.title}
      >
        <MaterialCommunityIcons name={item.icon} size={44} color={item.iconColor} />
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

export const WhoAmISetupScreen = () => {
  const navigation = useNavigation<NavProp>();

  const cardWidth = useMemo(() => {
    const horizontalPadding = theme.spacing.lg * 2;
    const gap = theme.spacing.md;
    const screenWidth = Dimensions.get('window').width;
    return (screenWidth - horizontalPadding - gap) / 2;
  }, []);

  const categoryItems = useMemo<CategoryCardItem[]>(
    () => [
      {
        id: 'politicos',
        title: 'Políticos',
        icon: 'account-tie',
        backgroundColor: '#FEE2E2',
        iconColor: theme.colors.error,
      },
      {
        id: 'deportistas',
        title: 'Deportistas',
        icon: 'soccer',
        backgroundColor: theme.colors.successLight,
        iconColor: theme.colors.success,
      },
      {
        id: 'actores',
        title: 'Actores',
        icon: 'movie-open',
        backgroundColor: theme.colors.secondaryLight,
        iconColor: theme.colors.secondary,
      },
      {
        id: 'cantantes',
        title: 'Cantantes',
        icon: 'microphone-variant',
        backgroundColor: theme.colors.primaryLight,
        iconColor: theme.colors.primary,
      },
      {
        id: 'personajes_ficcion',
        title: 'Personajes de ficción',
        icon: 'wizard-hat',
        backgroundColor: '#E0E7FF',
        iconColor: '#4338CA',
      },
      {
        id: 'famosos_argentinos',
        title: 'Famosos argentinos',
        icon: 'flag-variant',
        backgroundColor: theme.colors.warningLight,
        iconColor: theme.colors.warning,
      },
      {
        id: 'todas',
        title: 'Todas mezcladas',
        icon: 'shuffle-variant',
        backgroundColor: '#F3E8FF',
        iconColor: '#9333EA',
      },
    ],
    [],
  );

  const handleSelectCategory = useCallback(
    (category: WhoAmICategorySelection) => {
      void triggerSelectionHaptic();
      navigation.navigate(Routes.WhoAmIGame, { category });
    },
    [navigation],
  );

  const handleGoBack = () => {
    void triggerSelectionHaptic();
    navigation.goBack();
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.topSafe} edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={theme.colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>¿Qué soy?</Text>
          <Text style={styles.headerSubtitle}>
            Mostrá el teléfono a los demás. ¡Ellos saben quién sos vos!
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Elegí una categoría</Text>

        <View style={styles.grid}>
          {categoryItems.map((item, index) => (
            <CategoryCard
              key={item.id}
              item={item}
              width={cardWidth}
              animationIndex={index}
              onPress={handleSelectCategory}
            />
          ))}
        </View>
      </ScrollView>
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
  headerRow: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    lineHeight: 20,
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
  cardTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
});

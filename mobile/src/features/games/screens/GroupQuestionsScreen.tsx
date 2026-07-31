/**
 * Pantalla del juego Preguntas para el grupo.
 *
 * Muestra una pregunta icebreaker a la vez en portrait con fondo cálido.
 * Al agotar el mazo, baraja de nuevo y continúa sin mensaje de fin.
 */
import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
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
import type { MainStackParamList } from '@/navigation/types';
import { getShuffledQuestions } from '@/features/games/data/groupQuestionsData';
import { triggerSelectionHaptic } from '@/shared/utils/haptics';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'GroupQuestions'>;

/** Color base del juego — naranja cálido distinto al violeta de ¿Qué soy? */
const GAME_BACKGROUND = theme.colors.warning;

/** Duración de la transición lateral entre preguntas */
const QUESTION_TRANSITION_MS = 280;

/** Desplazamiento horizontal de la animación */
const QUESTION_TRANSLATE_DISTANCE = 48;

export const GroupQuestionsScreen = () => {
  const navigation = useNavigation<NavProp>();

  const [questions, setQuestions] = useState(() => getShuffledQuestions());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const questionOpacity = useRef(new Animated.Value(1)).current;
  const questionTranslateX = useRef(new Animated.Value(0)).current;

  const currentQuestion = questions[currentIndex] ?? questions[0];
  const questionNumber = currentIndex + 1;

  /**
   * Anima salida hacia la izquierda y entrada desde la derecha al avanzar.
   * Si se agotaron las preguntas, baraja de nuevo antes de reiniciar el índice.
   */
  const advanceQuestion = useCallback(() => {
    if (isAnimating) {
      return;
    }

    setIsAnimating(true);
    void triggerSelectionHaptic();

    Animated.sequence([
      Animated.parallel([
        Animated.timing(questionOpacity, {
          toValue: 0,
          duration: QUESTION_TRANSITION_MS,
          useNativeDriver: true,
        }),
        Animated.timing(questionTranslateX, {
          toValue: -QUESTION_TRANSLATE_DISTANCE,
          duration: QUESTION_TRANSITION_MS,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(questionOpacity, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(questionTranslateX, {
          toValue: QUESTION_TRANSLATE_DISTANCE,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setCurrentIndex((previousIndex) => {
        const nextIndex = previousIndex + 1;

        if (nextIndex >= questions.length) {
          setQuestions(getShuffledQuestions());
          return 0;
        }

        return nextIndex;
      });

      Animated.parallel([
        Animated.timing(questionOpacity, {
          toValue: 1,
          duration: QUESTION_TRANSITION_MS,
          useNativeDriver: true,
        }),
        Animated.timing(questionTranslateX, {
          toValue: 0,
          duration: QUESTION_TRANSITION_MS,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsAnimating(false);
      });
    });
  }, [isAnimating, questionOpacity, questionTranslateX, questions.length]);

  const handleExit = () => {
    void triggerSelectionHaptic();
    navigation.goBack();
  };

  return (
    <View style={styles.root}>
      <View style={styles.gradientBase} />
      <View style={styles.gradientOverlay} />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.exitButton}
            onPress={handleExit}
            accessibilityRole="button"
            accessibilityLabel="Salir del juego"
          >
            <MaterialCommunityIcons name="close" size={22} color={theme.colors.surface} />
            <Text style={styles.exitButtonText}>Salir</Text>
          </TouchableOpacity>

          <Text style={styles.questionLabel}>Pregunta {questionNumber}</Text>
        </View>

        <View style={styles.questionArea}>
          <ScrollView
            contentContainerStyle={styles.questionScrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Animated.Text
              style={[
                styles.questionText,
                {
                  opacity: questionOpacity,
                  transform: [{ translateX: questionTranslateX }],
                },
              ]}
            >
              {currentQuestion}
            </Animated.Text>
          </ScrollView>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.nextButton,
              pressed && styles.nextButtonPressed,
            ]}
            onPress={advanceQuestion}
            disabled={isAnimating}
            accessibilityRole="button"
            accessibilityLabel="Siguiente pregunta"
          >
            <Text style={styles.nextButtonText}>Siguiente pregunta</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: GAME_BACKGROUND,
  },
  gradientBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: GAME_BACKGROUND,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.secondary,
    opacity: 0.18,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.sm,
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  exitButtonText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.surface,
  },
  questionLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: 'rgba(255,255,255,0.72)',
  },
  questionArea: {
    flex: 1,
    justifyContent: 'center',
  },
  questionScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
  },
  questionText: {
    fontSize: 22,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.surface,
    textAlign: 'center',
    lineHeight: 32,
  },
  footer: {
    paddingBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  nextButton: {
    minHeight: theme.components.buttonHeight,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  nextButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  nextButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: GAME_BACKGROUND,
  },
});

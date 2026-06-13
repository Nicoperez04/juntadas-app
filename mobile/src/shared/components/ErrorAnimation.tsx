/**
 * Animación de error global con la misma estructura y timing que SuccessAnimation.
 *
 * Secuencia de ~2.5 s: círculo rojo con anillo rotatorio → X con bounce →
 * destellos radiales → mensaje → pausa legible → fade out.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '@/shared/constants/theme';

interface ErrorAnimationProps {
  /** Texto descriptivo que aparece debajo del ícono animado */
  message: string;
  /** Dispara la secuencia completa cuando pasa a true */
  visible: boolean;
  /** Se invoca al terminar el fade out final */
  onHide: () => void;
}

/** Diámetro del círculo principal de la animación */
const CIRCLE_SIZE = 96;

/** Distancia que recorren los destellos desde el centro hacia afuera */
const SPARKLE_TRAVEL = 36;

/** Ángulos (en grados) de los tres destellos, distribuidos como en el logo */
const SPARKLE_ANGLES = [35, 130, 235];

/** Paleta roja para diferenciar visualmente el feedback de error */
const ERROR_COLORS = {
  primary: '#EF4444',
  dark: '#DC2626',
  ring: '#FCA5A5',
  sparkle: '#FCA5A5',
} as const;

/**
 * Convierte un ángulo en grados a desplazamiento X/Y para animaciones radiales.
 */
const angleToOffset = (degrees: number, distance: number) => {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: Math.cos(radians) * distance,
    y: Math.sin(radians) * distance,
  };
};

/**
 * Dispara el haptic de error tolerando dispositivos sin motor háptico.
 */
const triggerErrorHaptic = async (): Promise<void> => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // Ignorado — simuladores o dispositivos sin soporte háptico
  }
};

export const ErrorAnimation = ({
  message,
  visible,
  onHide,
}: ErrorAnimationProps) => {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const circleScale = useRef(new Animated.Value(0)).current;
  const ringRotation = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const sparkleAnims = useRef(
    SPARKLE_ANGLES.map(() => ({
      translate: new Animated.Value(0),
      opacity: new Animated.Value(0),
    })),
  ).current;

  const [shouldRender, setShouldRender] = useState(false);

  /**
   * Orquesta las seis fases temporales cuando `visible` pasa a true.
   * Misma cadencia que SuccessAnimation para mantener consistencia de UX.
   */
  useEffect(() => {
    if (!visible) return;

    setShouldRender(true);
    overlayOpacity.setValue(0);
    containerOpacity.setValue(1);
    circleScale.setValue(0);
    ringRotation.setValue(0);
    iconScale.setValue(0);
    textOpacity.setValue(0);
    sparkleAnims.forEach((sparkle) => {
      sparkle.translate.setValue(0);
      sparkle.opacity.setValue(0);
    });

    void triggerErrorHaptic();

    // Fase 1 (0–400 ms): círculo con spring + anillo rotatorio
    const phase1 = Animated.parallel([
      Animated.spring(circleScale, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(ringRotation, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]);

    // Fase 2 (300–700 ms): X con bounce
    const phase2 = Animated.sequence([
      Animated.delay(300),
      Animated.spring(iconScale, {
        toValue: 1.2,
        friction: 4,
        tension: 180,
        useNativeDriver: true,
      }),
      Animated.spring(iconScale, {
        toValue: 1,
        friction: 5,
        tension: 140,
        useNativeDriver: true,
      }),
    ]);

    // Fase 3 (500–900 ms): destellos radiales con fade out
    const phase3 = Animated.sequence([
      Animated.delay(500),
      Animated.parallel(
        sparkleAnims.map((sparkle) =>
          Animated.parallel([
            Animated.timing(sparkle.translate, {
              toValue: 1,
              duration: 400,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(sparkle.opacity, {
                toValue: 1,
                duration: 120,
                useNativeDriver: true,
              }),
              Animated.timing(sparkle.opacity, {
                toValue: 0,
                duration: 280,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ),
      ),
    ]);

    // Fase 4 (700–1000 ms): mensaje con fade in
    const phase4 = Animated.sequence([
      Animated.delay(700),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

    // Fase 5 (1000–2000 ms): pausa con todo visible para que el mensaje se lea
    const phase5 = Animated.delay(2000);

    // Fase 6 (2000–2500 ms): fade out suave del conjunto
    const phase6 = Animated.sequence([
      Animated.delay(2000),
      Animated.parallel([
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 500,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 500,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]);

    Animated.parallel([phase1, phase2, phase3, phase4, phase5, phase6]).start(
      ({ finished }) => {
        if (!finished) return;
        setShouldRender(false);
        onHide();
      },
    );

    return () => {
      overlayOpacity.stopAnimation();
      containerOpacity.stopAnimation();
      circleScale.stopAnimation();
      ringRotation.stopAnimation();
      iconScale.stopAnimation();
      textOpacity.stopAnimation();
      sparkleAnims.forEach((sparkle) => {
        sparkle.translate.stopAnimation();
        sparkle.opacity.stopAnimation();
      });
    };
  }, [
    visible,
    overlayOpacity,
    containerOpacity,
    circleScale,
    ringRotation,
    iconScale,
    textOpacity,
    sparkleAnims,
    onHide,
  ]);

  if (!shouldRender) return null;

  const ringSpin = ringRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal transparent visible={shouldRender} animationType="none" statusBarTranslucent>
      <View style={styles.wrapper} pointerEvents="box-none">
        <Animated.View
          style={[styles.overlay, { opacity: overlayOpacity }]}
          pointerEvents="none"
        />

        <Animated.View
          style={[styles.content, { opacity: containerOpacity }]}
          pointerEvents="none"
        >
          <View style={styles.iconArea}>
            <Animated.View
              style={[
                styles.rotatingRing,
                { transform: [{ rotate: ringSpin }] },
              ]}
            />

            <Animated.View
              style={[
                styles.circle,
                { transform: [{ scale: circleScale }] },
              ]}
            >
              <View style={styles.circleBase} />
              <View style={styles.circleGradientOverlay} />

              <Animated.View
                style={[
                  styles.iconWrap,
                  { transform: [{ scale: iconScale }] },
                ]}
              >
                <Ionicons name="close" size={44} color={theme.colors.surface} />
              </Animated.View>
            </Animated.View>

            {sparkleAnims.map((sparkle, index) => {
              const offset = angleToOffset(SPARKLE_ANGLES[index], SPARKLE_TRAVEL);
              const translateX = sparkle.translate.interpolate({
                inputRange: [0, 1],
                outputRange: [0, offset.x],
              });
              const translateY = sparkle.translate.interpolate({
                inputRange: [0, 1],
                outputRange: [0, offset.y],
              });

              return (
                <Animated.View
                  key={SPARKLE_ANGLES[index]}
                  style={[
                    styles.sparkle,
                    {
                      opacity: sparkle.opacity,
                      transform: [{ translateX }, { translateY }],
                    },
                  ]}
                />
              );
            })}
          </View>

          <Animated.Text style={[styles.message, { opacity: textOpacity }]}>
            {message}
          </Animated.Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  content: {
    alignItems: 'center',
    maxWidth: '80%',
  },
  iconArea: {
    width: CIRCLE_SIZE + 24,
    height: CIRCLE_SIZE + 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rotatingRing: {
    position: 'absolute',
    width: CIRCLE_SIZE + 16,
    height: CIRCLE_SIZE + 16,
    borderRadius: theme.radius.full,
    borderWidth: 3,
    borderColor: ERROR_COLORS.ring,
    borderTopColor: 'rgba(252, 165, 165, 0.25)',
    borderRightColor: ERROR_COLORS.primary,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: ERROR_COLORS.primary,
  },
  /** Capa oscura en diagonal para aproximar el gradiente rojo sin librerías extra */
  circleGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: ERROR_COLORS.dark,
    opacity: 0.55,
    borderTopLeftRadius: theme.radius.full,
    borderBottomRightRadius: theme.radius.full,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  sparkle: {
    position: 'absolute',
    width: 10,
    height: 4,
    borderRadius: theme.radius.sm,
    backgroundColor: ERROR_COLORS.sparkle,
  },
  message: {
    marginTop: theme.spacing.lg,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.surface,
    textAlign: 'center',
    lineHeight: 22,
  },
});

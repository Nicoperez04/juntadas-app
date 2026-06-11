/**
 * Pantalla de temporizador con dos modos: cuenta regresiva y cronómetro.
 *
 * La cuenta regresiva permite configurar MM:SS antes de iniciar, vibra y
 * parpadea al llegar a cero. El cronómetro cuenta hacia arriba sin límite.
 * No persiste estado — todo vive en memoria durante la sesión.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '@/shared/constants/theme';
import { AppButton } from '@/shared/components/AppButton';
import { triggerSelectionHaptic } from '@/shared/utils/haptics';
import type { MainStackParamList } from '@/navigation/types';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'Timer'>;

/** Modos disponibles del temporizador */
type TimerMode = 'countdown' | 'stopwatch';

/** Estados del ciclo de vida del timer */
type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

/** Tamaño mínimo del display según especificación (72sp) */
const DISPLAY_FONT_SIZE = 72;

/** Intervalo de actualización de la cuenta regresiva (precisión de segundos) */
const COUNTDOWN_TICK_MS = 1000;

/** Intervalo del cronómetro — actualización fluida de los milisegundos */
const STOPWATCH_TICK_MS = 16;

/**
 * Formatea segundos totales a cadena MM:SS con padding.
 *
 * @param totalSeconds - Segundos a formatear (siempre positivo)
 * @returns Cadena en formato "MM:SS"
 */
const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

/**
 * Formatea milisegundos transcurridos del cronómetro como MM:SS.mmm.
 * Solo se usa en modo cronómetro una vez iniciado.
 */
const formatStopwatchTime = (totalMs: number): string => {
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const milliseconds = totalMs % 1000;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
};

/**
 * Parsea un valor numérico de input limitándolo al rango [min, max].
 * Retorna 0 si el texto no es un número válido.
 */
const parseBoundedNumber = (text: string, min: number, max: number): number => {
  const parsed = parseInt(text.replace(/\D/g, ''), 10);
  if (Number.isNaN(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
};

/** Vibración de alerta al finalizar la cuenta regresiva */
const triggerTimerFinishedHaptic = async (): Promise<void> => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // Ignorado — simuladores o dispositivos sin soporte háptico
  }
};

export const TimerScreen = () => {
  const navigation = useNavigation<NavProp>();

  const [mode, setMode] = useState<TimerMode>('countdown');
  const [status, setStatus] = useState<TimerStatus>('idle');

  // Configuración de cuenta regresiva (solo editable en idle/paused antes de correr)
  const [configMinutes, setConfigMinutes] = useState('1');
  const [configSeconds, setConfigSeconds] = useState('0');

  // Tiempo restante en segundos (solo cuenta regresiva)
  const [currentSeconds, setCurrentSeconds] = useState(0);

  // Tiempo transcurrido del cronómetro en milisegundos
  const [stopwatchMs, setStopwatchMs] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** Base acumulada al pausar — evita drift al reanudar el cronómetro */
  const stopwatchBaseMsRef = useRef(0);
  /** Timestamp de inicio de la corrida actual del cronómetro */
  const stopwatchStartRef = useRef<number | null>(null);
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const blinkLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  /** Detiene el intervalo activo para evitar ticks huérfanos */
  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /** Detiene la animación de parpadeo del display */
  const stopBlinkAnimation = useCallback(() => {
    blinkLoopRef.current?.stop();
    blinkLoopRef.current = null;
    blinkAnim.setValue(1);
  }, [blinkAnim]);

  /** Inicia parpadeo visual cuando la cuenta regresiva llega a cero */
  const startBlinkAnimation = useCallback(() => {
    stopBlinkAnimation();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.25,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    );
    blinkLoopRef.current = loop;
    loop.start();
  }, [blinkAnim, stopBlinkAnimation]);

  /** Reinicia al estado inicial del modo actual */
  const handleReset = useCallback(() => {
    clearTimerInterval();
    stopBlinkAnimation();
    setStatus('idle');

    if (mode === 'countdown') {
      const mins = parseBoundedNumber(configMinutes, 0, 99);
      const secs = parseBoundedNumber(configSeconds, 0, 59);
      const total = mins * 60 + secs;
      setCurrentSeconds(total > 0 ? total : 60);
    } else {
      setCurrentSeconds(0);
      setStopwatchMs(0);
      stopwatchBaseMsRef.current = 0;
      stopwatchStartRef.current = null;
    }
  }, [mode, configMinutes, configSeconds, clearTimerInterval, stopBlinkAnimation]);

  /** Cambia de modo y reinicia todo — evita mezclar estados entre modos */
  const handleModeChange = useCallback(
    (newMode: TimerMode) => {
      if (newMode === mode) return;
      clearTimerInterval();
      stopBlinkAnimation();
      setMode(newMode);
      setStatus('idle');
      setCurrentSeconds(newMode === 'countdown' ? 60 : 0);
      setStopwatchMs(0);
      stopwatchBaseMsRef.current = 0;
      stopwatchStartRef.current = null;
      setConfigMinutes('1');
      setConfigSeconds('0');
    },
    [mode, clearTimerInterval, stopBlinkAnimation],
  );

  /** Alterna entre iniciar y pausar según el estado actual */
  const handleStartPause = useCallback(() => {
    void triggerSelectionHaptic();

    if (status === 'finished') return;

    if (status === 'running') {
      clearTimerInterval();

      // Congelamos el tiempo exacto al pausar el cronómetro
      if (mode === 'stopwatch' && stopwatchStartRef.current !== null) {
        const elapsed = stopwatchBaseMsRef.current + (Date.now() - stopwatchStartRef.current);
        stopwatchBaseMsRef.current = elapsed;
        stopwatchStartRef.current = null;
        setStopwatchMs(elapsed);
      }

      setStatus('paused');
      return;
    }

    if (mode === 'countdown' && status === 'idle') {
      const mins = parseBoundedNumber(configMinutes, 0, 99);
      const secs = parseBoundedNumber(configSeconds, 0, 59);
      const total = mins * 60 + secs;
      const safeTotal = total > 0 ? total : 60;
      setCurrentSeconds(safeTotal);
    }

    if (mode === 'stopwatch') {
      stopwatchStartRef.current = Date.now();
    }

    setStatus('running');
  }, [status, mode, configMinutes, configSeconds, clearTimerInterval]);

  // Tick del timer — corre solo cuando status === 'running'
  useEffect(() => {
    if (status !== 'running') return;

    if (mode === 'stopwatch') {
      intervalRef.current = setInterval(() => {
        if (stopwatchStartRef.current === null) return;
        setStopwatchMs(
          stopwatchBaseMsRef.current + (Date.now() - stopwatchStartRef.current),
        );
      }, STOPWATCH_TICK_MS);
    } else {
      intervalRef.current = setInterval(() => {
        setCurrentSeconds((prev) => {
          if (prev <= 1) {
            clearTimerInterval();
            setStatus('finished');
            void triggerTimerFinishedHaptic();
            startBlinkAnimation();
            return 0;
          }

          return prev - 1;
        });
      }, COUNTDOWN_TICK_MS);
    }

    return () => clearTimerInterval();
  }, [status, mode, clearTimerInterval, startBlinkAnimation]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      clearTimerInterval();
      stopBlinkAnimation();
    };
  }, [clearTimerInterval, stopBlinkAnimation]);

  const isRunning = status === 'running';
  const isFinished = status === 'finished';
  // Los inputs solo se muestran antes del primer inicio; al pausar se mantiene el display
  const showCountdownInputs = mode === 'countdown' && status === 'idle';

  // Vista previa del tiempo configurado mientras el usuario edita los inputs
  const previewSeconds =
    mode === 'countdown' && status === 'idle'
      ? (() => {
          const mins = parseBoundedNumber(configMinutes, 0, 99);
          const secs = parseBoundedNumber(configSeconds, 0, 59);
          const total = mins * 60 + secs;
          return total > 0 ? total : 0;
        })()
      : currentSeconds;

  const isUrgent =
    mode === 'countdown' && previewSeconds <= 10 && (isRunning || isFinished);
  const displayColor = isUrgent || isFinished ? theme.colors.error : theme.colors.textPrimary;

  const startPauseLabel =
    status === 'running' ? 'Pausar' : status === 'paused' ? 'Reanudar' : 'Iniciar';

  // Milisegundos solo visibles en cronómetro una vez iniciado (corriendo o pausado)
  const showStopwatchMs = mode === 'stopwatch' && status !== 'idle';
  const displayTime = showStopwatchMs
    ? formatStopwatchTime(stopwatchMs)
    : formatTime(mode === 'stopwatch' ? 0 : previewSeconds);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header con botón de volver */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Temporizador</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Toggle de modo */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'countdown' && styles.modeTabActive]}
            onPress={() => handleModeChange('countdown')}
            disabled={isRunning}
          >
            <Text
              style={[
                styles.modeTabText,
                mode === 'countdown' && styles.modeTabTextActive,
              ]}
            >
              Cuenta regresiva
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'stopwatch' && styles.modeTabActive]}
            onPress={() => handleModeChange('stopwatch')}
            disabled={isRunning}
          >
            <Text
              style={[
                styles.modeTabText,
                mode === 'stopwatch' && styles.modeTabTextActive,
              ]}
            >
              Cronómetro
            </Text>
          </TouchableOpacity>
        </View>

        {/* Área central: inputs de configuración o display del tiempo */}
        <View style={styles.centerArea}>
          {showCountdownInputs ? (
            <View style={styles.configRow}>
              <View style={styles.configField}>
                <Text style={styles.configLabel}>Minutos</Text>
                <TextInput
                  style={styles.configInput}
                  value={configMinutes}
                  onChangeText={(text) =>
                    setConfigMinutes(String(parseBoundedNumber(text, 0, 99)))
                  }
                  keyboardType="number-pad"
                  maxLength={2}
                  editable={!isRunning}
                />
              </View>
              <Text style={styles.configSeparator}>:</Text>
              <View style={styles.configField}>
                <Text style={styles.configLabel}>Segundos</Text>
                <TextInput
                  style={styles.configInput}
                  value={configSeconds}
                  onChangeText={(text) =>
                    setConfigSeconds(String(parseBoundedNumber(text, 0, 59)))
                  }
                  keyboardType="number-pad"
                  maxLength={2}
                  editable={!isRunning}
                />
              </View>
            </View>
          ) : null}

          <Animated.View style={{ opacity: isFinished ? blinkAnim : 1 }}>
            <Text
              style={[
                styles.timeDisplay,
                showStopwatchMs && styles.timeDisplayStopwatch,
                { color: displayColor },
              ]}
            >
              {displayTime}
            </Text>
          </Animated.View>

          {isFinished ? (
            <Text style={styles.finishedLabel}>¡Tiempo!</Text>
          ) : null}
        </View>

        {/* Controles inferiores */}
        <View style={styles.controls}>
          <AppButton
            label={startPauseLabel}
            onPress={handleStartPause}
            disabled={isFinished}
          />
          <AppButton
            label="Reiniciar"
            variant="ghost"
            onPress={handleReset}
            disabled={status === 'idle' && !isFinished}
          />
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
  safeArea: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xs,
    borderWidth: theme.components.borderWidth,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xl,
  },
  modeTab: {
    flex: 1,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: theme.colors.primary,
  },
  modeTabText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
  },
  modeTabTextActive: {
    color: theme.colors.surface,
    fontWeight: theme.typography.weights.semibold,
  },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.lg,
  },
  configRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  configField: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  configLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
  },
  configInput: {
    width: 80,
    height: theme.components.inputHeight,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: theme.components.inputBorderWidth,
    borderColor: theme.colors.border,
    textAlign: 'center',
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  configSeparator: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textSecondary,
    paddingBottom: theme.spacing.md,
  },
  timeDisplay: {
    fontSize: DISPLAY_FONT_SIZE,
    fontWeight: theme.typography.weights.bold,
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  /** Ligeramente más chico para que MM:SS.mmm entre sin recortarse */
  timeDisplayStopwatch: {
    fontSize: 56,
    letterSpacing: 0,
  },
  finishedLabel: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.error,
  },
  controls: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
});

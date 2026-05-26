/**
 * Pantalla de bienvenida — primer contacto del usuario con la app.
 *
 * Estructura:
 * 1. Logo + nombre de app
 * 2. Título hero con palabra destacada en primario
 * 3. Prueba social: avatares + contador de usuarios
 * 4. Lista de tres propuestas de valor con ícono
 * 5. CTA principal y link secundario de acceso
 *
 * No requiere autenticación ni formulario; solo navegación.
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { appConfig } from '@/config/appConfig';
import { AppLogo } from '@/shared/components/AppLogo';
import { AppButton } from '@/shared/components/AppButton';
import { theme } from '@/shared/constants/theme';
import { Routes } from '@/navigation/routes';

type NavProp = NativeStackNavigationProp<Record<string, undefined>>;

/** Propuestas de valor que se renderizan en la sección de features */
const FEATURES = [
  {
    icon: 'calendar-outline' as const,
    title: 'Organizá tus juntadas',
    description: 'Creá eventos, fijá fecha, lugar y quién va.',
  },
  {
    icon: 'people-outline' as const,
    title: 'Invitá a tus amigos',
    description: 'Compartí el código y listo, todos adentro.',
  },
  {
    icon: 'camera-outline' as const,
    title: 'Guardá los recuerdos',
    description: 'Subí fotos y armá la galería de cada juntada.',
  },
];

/**
 * Colores para los avatares de prueba social.
 * Uso decorativo únicamente — no representan usuarios reales.
 * El azul (#3B82F6) no está en el theme por ser un color de apoyo puntual.
 */
const AVATAR_COLORS = [
  theme.colors.primary,
  theme.colors.secondary,
  '#3B82F6',
  theme.colors.success,
];

export const WelcomeScreen = () => {
  const navigation = useNavigation<NavProp>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Marca */}
          <View style={styles.logoSection}>
            <AppLogo />
            <Text style={styles.appName}>{appConfig.app.name}</Text>
          </View>

          {/* Título hero con énfasis en la palabra clave */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>
              Tus juntadas,{'\n'}
              <Text style={styles.titleHighlight}>organizadas</Text>
            </Text>
            <Text style={styles.subtitle}>
              La app para organizar salidas con amigos sin el caos de los grupos de WhatsApp.
            </Text>
          </View>

          {/* Prueba social — genera confianza antes de pedir registro */}
          <View style={styles.socialProof}>
            <View style={styles.avatarsRow}>
              {AVATAR_COLORS.map((color, index) => (
                <View
                  key={index}
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: color,
                      marginLeft: index === 0 ? 0 : -12,
                    },
                  ]}
                >
                  <Ionicons name="person" size={16} color={theme.colors.surface} />
                </View>
              ))}
            </View>
            <Text style={styles.socialText}>+1,200 usuarios ya organizan sus juntadas</Text>
          </View>

          {/* Propuestas de valor */}
          <View style={styles.featuresSection}>
            {FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <View style={styles.featureIconWrapper}>
                  <Ionicons name={feature.icon} size={22} color={theme.colors.primary} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Acciones */}
          <View style={styles.actions}>
            <AppButton
              label="Comenzar gratis →"
              onPress={() => navigation.navigate(Routes.Register)}
            />
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate(Routes.Login)}
              activeOpacity={0.7}
            >
              <Text style={styles.loginLinkText}>Ya tengo cuenta</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.sm + 4,
  },
  appName: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  titleSection: {
    marginBottom: theme.spacing.lg + 4,
  },
  title: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    lineHeight: 42,
    marginBottom: theme.spacing.sm + 4,
  },
  titleHighlight: {
    color: theme.colors.primary,
  },
  subtitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.regular,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg + 4,
    gap: theme.spacing.sm + 4,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  socialText: {
    flex: 1,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
  },
  featuresSection: {
    marginBottom: theme.spacing.xl + 4,
    gap: theme.spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm + 6,
  },
  featureIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    paddingTop: 2,
  },
  featureTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  featureDescription: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.regular,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  actions: {
    gap: theme.spacing.sm,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm + 4,
  },
  loginLinkText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
  },
});

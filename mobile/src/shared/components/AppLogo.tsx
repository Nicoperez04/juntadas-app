/**
 * Logo de la aplicación — ícono cuadrado con fondo primario.
 *
 * Usado en WelcomeScreen y CompleteProfileScreen para dar contexto visual
 * de marca. El ícono de personas representa la idea central de la app:
 * organizar grupos de amigos.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/shared/constants/theme';

export const AppLogo = () => {
  return (
    <View style={styles.container}>
      <Ionicons name="people" size={40} color={theme.colors.surface} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: theme.components.logoSize,
    height: theme.components.logoSize,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/**
 * Logo de la aplicación.
 *
 * Usado en WelcomeScreen y CompleteProfileScreen para dar contexto visual
 * de marca con el asset oficial de la app.
 */
import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { appLogoSource } from '@/shared/assets/appAssets';
import { theme } from '@/shared/constants/theme';

export const AppLogo = () => {
  return (
    <View style={styles.container}>
      <Image
        source={appLogoSource}
        style={styles.image}
        resizeMode="contain"
        accessibilityLabel="Logo de Ronda App"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: theme.components.logoSize,
    height: theme.components.logoSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

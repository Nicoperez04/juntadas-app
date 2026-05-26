/**
 * Logo de la aplicación.
 *
 * Usado en WelcomeScreen y CompleteProfileScreen para dar contexto visual
 * de marca con el asset oficial de la app.
 */
import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { theme } from '@/shared/constants/theme';

const appLogo = require('../../../assets/logo-nobg.png');

export const AppLogo = () => {
  return (
    <View style={styles.container}>
      <Image source={appLogo} style={styles.image} resizeMode="contain" />
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

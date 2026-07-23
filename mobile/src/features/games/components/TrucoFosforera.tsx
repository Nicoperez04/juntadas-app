import React from 'react';
import { StyleSheet, View } from 'react-native';

interface TrucoFosforeraProps {
  /** Puntos a renderizar (entre 0 y 5) */
  points: number;
}

/**
 * Componente que dibuja de 1 a 5 fósforos programáticamente.
 * Simula el aspecto visual real de un fósforo de madera con la cabecita roja.
 */
export const TrucoFosforera = ({ points }: TrucoFosforeraProps) => {
  return (
    <View style={styles.box}>
      {/* 1er punto: Línea superior */}
      {points >= 1 && (
        <View style={[styles.matchstick, styles.horizontalStick, { top: 0 }]}>
          <View style={[styles.matchHead, styles.headLeft]} />
          <View style={styles.matchBody} />
        </View>
      )}

      {/* 2do punto: Línea derecha */}
      {points >= 2 && (
        <View style={[styles.matchstick, styles.verticalStick, { right: 0 }]}>
          <View style={[styles.matchHead, styles.headBottom]} />
          <View style={styles.matchBody} />
        </View>
      )}

      {/* 3er punto: Línea inferior */}
      {points >= 3 && (
        <View style={[styles.matchstick, styles.horizontalStick, { bottom: 0 }]}>
          <View style={[styles.matchHead, styles.headRight]} />
          <View style={styles.matchBody} />
        </View>
      )}

      {/* 4to punto: Línea izquierda */}
      {points >= 4 && (
        <View style={[styles.matchstick, styles.verticalStick, { left: 0 }]}>
          <View style={[styles.matchHead, styles.headTop]} />
          <View style={styles.matchBody} />
        </View>
      )}

      {/* 5to punto: Diagonal cruzada */}
      {points >= 5 && (
        <View style={[styles.matchstick, styles.diagonalStick]}>
          <View style={[styles.matchHead, styles.headDiagonal]} />
          <View style={styles.matchBody} />
        </View>
      )}
    </View>
  );
};

const STICK_THICKNESS = 4;
const HEAD_SIZE = 6;

const styles = StyleSheet.create({
  box: {
    width: 44,
    height: 44,
    position: 'relative',
    margin: 8,
  },
  matchstick: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalStick: {
    left: 2,
    right: 2,
    height: STICK_THICKNESS,
    flexDirection: 'row',
  },
  verticalStick: {
    top: 2,
    bottom: 2,
    width: STICK_THICKNESS,
    flexDirection: 'column',
  },
  diagonalStick: {
    top: 2,
    left: 2,
    width: 54, // Longitud de la diagonal para cruzar el box de 44x44
    height: STICK_THICKNESS,
    transform: [{ rotate: '45deg' }],
    transformOrigin: 'top left',
    flexDirection: 'row',
  },
  matchBody: {
    flex: 1,
    backgroundColor: '#F3E5AB', // Color madera de fósforo
    borderRadius: 1,
    height: '100%',
    width: '100%',
  },
  matchHead: {
    width: HEAD_SIZE,
    height: HEAD_SIZE,
    backgroundColor: '#D32F2F', // Rojo fósforo
    borderRadius: 3,
    position: 'absolute',
    zIndex: 2,
  },
  // Ubicaciones de las cabecitas para que queden en las esquinas correctas
  headLeft: {
    left: -2,
    top: -1,
  },
  headTop: {
    top: -2,
    left: -1,
  },
  headRight: {
    right: -2,
    top: -1,
  },
  headBottom: {
    bottom: -2,
    left: -1,
  },
  headDiagonal: {
    right: -2,
    top: -1,
  },
});

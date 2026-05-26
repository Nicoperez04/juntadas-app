/**
 * Assets estáticos centralizados de la app.
 *
 * Agrupamos los require() de imágenes en un único módulo para que Metro resuelva
 * siempre la misma ruta relativa al root del proyecto y falle en build time si
 * falta el archivo, evitando inconsistencias entre entornos de desarrollo.
 */
import type { ImageSourcePropType } from 'react-native';

/** Logo oficial de Ronda App (`mobile/assets/logo-nobg.png`) */
export const appLogoSource: ImageSourcePropType = require('../../../assets/logo-nobg.png');

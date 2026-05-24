/**
 * Sistema de diseño de Juntadas — única fuente de verdad visual.
 *
 * Todos los colores, espaciados, radios, tipografía y tokens de componentes
 * deben leerse desde aquí. Nunca hardcodear valores en pantallas o componentes.
 *
 * Paleta derivada del Figma del proyecto:
 *   https://www.figma.com/design/Iu9DQtttfYfcuWrFqmJuwb/
 */

/**
 * Paleta de colores de la aplicación.
 * Los colores "Light" son variantes de fondo para badges, chips e íconos con relleno.
 */
export const colors = {
  /** Violeta principal — acciones primarias, links activos, marca */
  primary: '#7C3AED',
  /** Fondo suave del color primario — badges, íconos decorativos */
  primaryLight: '#EDE9FE',
  /** Rosa — acentos secundarios, detalles de UI */
  secondary: '#EC4899',
  /** Fondo suave del secundario */
  secondaryLight: '#FCE7F3',
  /** Fondo global de la app */
  background: '#F8F7FF',
  /** Fondo de surfaces elevadas: cards, inputs, modales */
  surface: '#FFFFFF',
  /** Texto principal — títulos y cuerpo de alto contraste */
  textPrimary: '#1A1A1A',
  /** Texto secundario — subtítulos, labels, placeholders visibles */
  textSecondary: '#6B7280',
  /** Texto desactivado — placeholders, hints */
  textDisabled: '#9CA3AF',
  /** Borde por defecto de inputs y divisores */
  border: '#E5E7EB',
  /** Estado de error */
  error: '#EF4444',
  /** Fondo suave de error — banners de alerta */
  errorLight: '#FEE2E2',
  /** Estado de éxito */
  success: '#10B981',
  /** Fondo suave de éxito */
  successLight: '#D1FAE5',
  /** Estado de advertencia */
  warning: '#F59E0B',
  /** Fondo suave de advertencia — banners de perfil incompleto */
  warningLight: '#FEF3C7',
} as const;

/**
 * Escala de espaciados en múltiplos de 4px.
 * Usá siempre estas constantes para margin, padding y gap.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/**
 * Escala de border-radius.
 * `full` se usa para elementos completamente circulares (avatares, chips pill).
 */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

/**
 * Sistema tipográfico.
 * `sizes` en píxeles, `weights` como strings para compatibilidad con StyleSheet de RN.
 */
export const typography = {
  sizes: {
    /** 12px — etiquetas muy pequeñas, errores inline, términos legales */
    xs: 12,
    /** 14px — labels de inputs, textos de apoyo, links de footer */
    sm: 14,
    /** 16px — cuerpo de texto, subtítulos, botones */
    md: 16,
    /** 18px — encabezados de sección */
    lg: 18,
    /** 24px — títulos medianos */
    xl: 24,
    /** 32px — títulos hero de pantalla */
    xxl: 32,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

/**
 * Dimensiones fijas de componentes base.
 * Mantenerlas en sync garantiza que todos los inputs y botones tengan la misma altura visual.
 */
export const components = {
  /** Altura unificada de inputs y botones para alineación vertical coherente */
  inputHeight: 52,
  buttonHeight: 52,
  /** Grosor de borde estándar para divisores y contenedores */
  borderWidth: 1,
  /** Grosor de borde para inputs — ligeramente más grueso para mejorar la legibilidad */
  inputBorderWidth: 1.5,
  /** Tamaño del logo cuadrado de la app */
  logoSize: 80,
} as const;

/**
 * Sombras multiplataforma.
 * En iOS se usan las propiedades shadow*; en Android se usa `elevation`.
 * Aplicar ambas en el mismo StyleSheet para cobertura cross-platform.
 */
export const shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

/** Objeto unificado para importar todo el sistema de diseño con un único import */
export const theme = {
  colors,
  spacing,
  radius,
  typography,
  components,
  shadows,
} as const;

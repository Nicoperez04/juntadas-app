export const appConfig = {
  app: {
    name: 'Ronda App',
    version: '1.0.0',
  },
  meetups: {
    joinCodeLength: 6,
    maxParticipants: 12,
  },
  impostor: {
    minPlayers: 3,
    maxPlayers: 12,
  },
} as const;

export const colors = {
  primary: '#7C3AED',
  secondary: '#EC4899',
  background: '#F8F7FF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  success: '#10B981',
  error: '#EF4444',
  white: '#FFFFFF',
  primaryLight: '#EDE9FE',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const;

export const typography = {
  sizes: { xs: 12, sm: 13, md: 14, base: 15, lg: 16, xl: 18, xxl: 24, xxxl: 28, display: 32 },
  weights: { regular: '400', medium: '500', semibold: '600', bold: '700' },
} as const;

export const components = {
  buttonHeight: 52,
  inputHeight: 52,
  logoSize: 80,
} as const;
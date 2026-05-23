Revisión — Bloque 1: Comentarios, calidad y consistencia visual

Contexto
El Bloque 1 de autenticación ya fue implementado. Necesito que hagas una revisión completa de todo el código generado aplicando las reglas del proyecto y mejorando la calidad general antes de continuar con el siguiente bloque.

Tarea 1 — Comentarios profesionales
Revisá y comentá todos los archivos del Bloque 1 siguiendo estas reglas:

Comentarios en español, en lenguaje natural, explicando el "por qué" no el "qué"
Cada función, hook y servicio debe tener un comentario de cabecera con propósito, parámetros y retorno
Los bloques de lógica compleja deben explicar la intención detrás
Los tipos e interfaces deben tener comentario en cada campo no evidente
Nunca comentar cosas obvias
No dejar console.log sin marcar con // TODO: remover

Archivos a revisar:

mobile/src/features/auth/types.ts
mobile/src/features/auth/schemas/authSchemas.ts
mobile/src/features/auth/services/authService.ts
mobile/src/features/auth/hooks/useAuth.ts
mobile/src/shared/components/AppButton.tsx
mobile/src/shared/components/AppInput.tsx
mobile/src/shared/components/AppLogo.tsx
mobile/src/features/auth/screens/WelcomeScreen.tsx
mobile/src/features/auth/screens/LoginScreen.tsx
mobile/src/features/auth/screens/RegisterScreen.tsx
mobile/src/features/auth/screens/ForgotPasswordScreen.tsx
mobile/src/features/auth/screens/CompleteProfileScreen.tsx
mobile/src/navigation/AuthNavigator.tsx

Tarea 2 — Sistema de diseño consistente y profesional
El diseño en Figma es una referencia visual, pero no sigue una estructura sistemática: los tamaños, colores, espaciados y componentes no son siempre consistentes entre pantallas. Tu trabajo es implementar un sistema de diseño profesional y replicable que tome como base el Figma pero lo mejore.

Creá mobile/src/shared/constants/theme.ts
Este archivo debe ser la única fuente de verdad del diseño. Debe exportar:

// Paleta de colores completa
colors: {
  primary: '#7C3AED',
  primaryLight: '#EDE9FE',
  secondary: '#EC4899',
  secondaryLight: '#FCE7F3',
  background: '#F8F7FF',
  surface: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textDisabled: '#9CA3AF',
  border: '#E5E7EB',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
}

// Espaciados en múltiplos de 4
spacing: {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48
}

// Border radius
radius: {
  sm: 8, md: 12, lg: 16, xl: 24, full: 9999
}

// Tipografía
typography: {
  sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 24, xxl: 32 },
  weights: { regular: '400', medium: '500', semibold: '600', bold: '700' }
}

// Componentes base
components: {
  inputHeight: 52,
  buttonHeight: 52,
  borderWidth: 1,
}

// Sombras
shadows: {
  sm: { shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation },
  md: { ... },
}

Revisá y corregí todos los estilos de las pantallas y componentes
Una vez creado theme.ts, reemplazá todos los valores hardcodeados de colores, espaciados, radios y tipografía en los archivos del Bloque 1 por referencias al theme. Por ejemplo, en lugar de backgroundColor: '#7C3AED' debe decir backgroundColor: theme.colors.primary.

Además aplicá estas mejoras de diseño profesional:

Todos los headers de pantallas deben tener la misma altura y estructura
Los footers con links deben tener el mismo espaciado y tipografía en todas las pantallas
Los inputs deben verse exactamente igual en todas las pantallas — mismo borde, mismo radio, mismo padding
Los botones primarios deben ser idénticos en todas las pantallas
El espaciado entre elementos debe seguir la escala del theme, sin valores sueltos como marginBottom: 23
Usá ScrollView con contentContainerStyle en todas las pantallas para que funcionen correctamente en pantallas pequeñas

Tarea 3 — Verificación de reglas
Revisá todos los archivos del Bloque 1 y reportá cualquier violación de las siguientes reglas:

Uso de any en TypeScript
Strings de rutas hardcodeados en lugar de constantes de Routes
Queries a Supabase fuera de los servicios
Inline styles complejos fuera de StyleSheet.create
console.log sin marcar

Restricciones

No instalar dependencias nuevas
No modificar app.json, tsconfig.json, package.json
No modificar src/lib/supabase/client.ts, src/config/env.ts ni AppNavigator.tsx
No hacer commits
No modificar archivos fuera de los listados en este prompt

Al finalizar reportá

Lista de archivos modificados
Violaciones de reglas encontradas y cómo se corrigieron
Decisiones de diseño tomadas para mejorar la consistencia visual
Cualquier punto que requiera revisión manual o decisión del equipo

! Garantiza que el diseño sea correcto, profesional y limpio, que siga el uso de las skills instaladas y las mejores practicas profesionales.

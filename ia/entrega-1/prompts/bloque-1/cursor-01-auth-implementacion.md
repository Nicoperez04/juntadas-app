Implementación — Bloque 1: Autenticación

Contexto del proyecto
Estoy desarrollando una app móvil llamada Juntadas con React Native + Expo SDK 55 + TypeScript. El backend es Supabase (Auth + PostgreSQL). La navegación usa React Navigation con native-stack.
La arquitectura es modular por features. Todo el código de autenticación vive en mobile/src/features/auth/. Los componentes reutilizables van en mobile/src/shared/components/. La navegación está en mobile/src/navigation/.
El cliente de Supabase ya está configurado en mobile/src/lib/supabase/client.ts y se importa como @/lib/supabase/client. El path alias @/ apunta a mobile/src/.
La navegación base ya está implementada. AppNavigator.tsx escucha cambios de sesión de Supabase y redirige automáticamente entre AuthNavigator y MainNavigator. No hay que tocar esa lógica.

Diseño
Tenés acceso al archivo de Figma del proyecto via MCP, el cual ya testeamos y funciona correctamente, ante cualquier imprevisto te paso nuevamente la url del figma para que debas tener acceso: https://www.figma.com/design/Iu9DQtttfYfcuWrFqmJuwb/Diseño-de-Wireframes---MockUps---DAM?node-id=73-23&t=esaJqdW2s16efUrA-1 . Antes de implementar cada pantalla consultá el diseño correspondiente para respetar colores, tipografía, espaciados, íconos y estructura visual exacta.
Los tokens visuales principales son, si te es util guardar esta informacion en un archivo para no replicar busquedas innecesarias en el futuro, hazlo:

Color primario: #7C3AED (violeta)
Color secundario: #EC4899 (rosa, usado en detalles)
Fondo general: #F8F7FF
Texto principal: #1A1A1A, secundario: #6B7280
Border radius botones y cards: 12-16px
Botón primario: fondo #7C3AED, texto blanco, ancho completo, height 52px
Inputs: borde #E5E7EB, border radius 12px, height 52px, padding horizontal 16px
Tipografía: pesos 400, 500, 600 y 700. Tamaños: 14, 16, 18, 24, 32px

Lo que necesito que implementes

1. Tipos (mobile/src/features/auth/types.ts)
Definí las interfaces y tipos necesarios para el módulo de auth:

LoginFormData — email y password
RegisterFormData — fullName, email y password
ForgotPasswordFormData — email
CompleteProfileFormData — username
AuthUser — representación del usuario autenticado con id, email, fullName, username, avatarUrl

2. Schemas de validación (mobile/src/features/auth/schemas/authSchemas.ts)
Creá schemas Zod para cada formulario:

loginSchema — email válido, password mínimo 6 caracteres
registerSchema — fullName mínimo 2 caracteres, email válido, password mínimo 6 caracteres
forgotPasswordSchema — email válido
completeProfileSchema — username mínimo 3 caracteres, máximo 20, solo letras minúsculas, números y guión bajo, sin espacios. Regex: /^[a-z0-9_]+$/

Todos los mensajes de error deben estar en español.

3. Servicio (mobile/src/features/auth/services/authService.ts)
Implementá las siguientes funciones usando el cliente de Supabase:

signUp(data: RegisterFormData) — registro con email y password, pasando fullName y username en raw_user_meta_data
signIn(data: LoginFormData) — inicio de sesión con email y password
signOut() — cierre de sesión
resetPassword(email: string) — envío de email de recuperación vía supabase.auth.resetPasswordForEmail
getCurrentUser() — obtener usuario actual de la sesión activa
updateProfile(userId: string, data: Partial<CompleteProfileFormData>) — actualizar la tabla profiles en Supabase

Cada función debe:

Manejar errores explícitamente con try/catch
Retornar siempre { data, error } donde error es string | null
Nunca lanzar excepciones sin capturar

4. Hook (mobile/src/features/auth/hooks/useAuth.ts)
Implementá un hook que exponga:

login(data: LoginFormData) — llama a signIn
register(data: RegisterFormData) — llama a signUp
logout() — llama a signOut
resetPassword(email: string) — llama a resetPassword
completeProfile(data: CompleteProfileFormData) — llama a updateProfile con el userId actual
isLoading: boolean
error: string | null

Cada acción setea isLoading en true al inicio y false al terminar, y actualiza error si hubo un problema. La redirección post-login/register la maneja automáticamente AppNavigator, no el hook.

5. Componentes compartidos (mobile/src/shared/components/)
Creá estos componentes base que van a usar todas las pantallas:

AppButton.tsx — botón con variantes primary y ghost. Props: label: string, onPress: () => void, isLoading?: boolean, variant?: 'primary' | 'ghost', disabled?: boolean. Cuando isLoading es true muestra un ActivityIndicator en lugar del label.
AppInput.tsx — input con label superior, ícono izquierdo opcional, soporte para secureTextEntry con toggle de visibilidad. Props: label: string, placeholder?: string, leftIcon?: React.ReactNode, error?: string, más todos los props nativos de TextInput. Muestra el error en rojo debajo del input cuando existe.
AppLogo.tsx — cuadrado con fondo #7C3AED, border radius 16px, tamaño 80x80px, con el ícono de personas en blanco en el centro. Usar el ícono de @expo/vector-icons que más se parezca al diseño.

6. Pantallas (mobile/src/features/auth/screens/)
Implementá las 5 pantallas respetando el diseño de Figma. Todas deben usar KeyboardAvoidingView para manejar el teclado correctamente en iOS y Android.

WelcomeScreen.tsx — logo en la parte superior, título "Tus juntadas, organizadas" con la palabra "organizadas" en color #7C3AED, subtítulo descriptivo, sección con avatares de usuarios y texto "+1,200 usuarios ya organizan sus juntadas", lista de 3 features con ícono y descripción, botón primario "Comenzar gratis →" que navega a Register, link "Ya tengo cuenta" que navega a Login.
LoginScreen.tsx — flecha de volver, título "Bienvenido", subtítulo, input de email con ícono de sobre, input de password con ícono de candado y toggle de visibilidad, link "¿Olvidaste tu contraseña?" en violeta que navega a ForgotPassword, botón "Iniciar sesión", texto "¿No tenés cuenta?" con link "Crear cuenta" en violeta que navega a Register. Usa React Hook Form + loginSchema. Muestra errores inline bajo cada campo.
RegisterScreen.tsx — flecha de volver, título "Creá tu cuenta", subtítulo, input de nombre, input de email, input de password con toggle, botón "Continuar", texto "¿Ya tenés cuenta?" con link "Iniciar sesión". Usa React Hook Form + registerSchema. Muestra errores inline. Al pie: texto de términos y condiciones en gris.
ForgotPasswordScreen.tsx — flecha de volver, título "Olvidaste tu contraseña", subtítulo explicativo, input de email, botón "Enviar instrucciones". Al enviarse exitosamente muestra un mensaje de confirmación en verde en lugar del formulario. Usa React Hook Form + forgotPasswordSchema.
CompleteProfileScreen.tsx — pantalla sin botón de volver, título "Completá tu perfil", subtítulo, input de username con validación en tiempo real, botón "Continuar". Usa React Hook Form + completeProfileSchema.

7. Navegación
Reemplazá los componentes () => null en mobile/src/navigation/AuthNavigator.tsx por los imports reales de cada pantalla implementada.

Puntos pendientes de validación y decisiones que necesito que reportes
Al finalizar necesito que analices y reportes explícitamente los siguientes puntos:

Validaciones pendientes:

¿El trigger de Supabase que crea el perfil automáticamente al registrarse recibe correctamente el fullName y username desde raw_user_meta_data? Indicá si esto necesita verificación manual en el dashboard de Supabase.
¿El CompleteProfileScreen debería verificar si el username ya existe antes de guardar? Actualmente la restricción UNIQUE en la tabla lo rechazará a nivel de base de datos, pero el error debería mostrarse de forma amigable.
¿El flujo de ForgotPassword funciona correctamente con Supabase en modo desarrollo sin dominio configurado?

Puntos flojos o mejorables:

Evaluá si el manejo de errores del servicio es suficiente o si conviene mapear los códigos de error de Supabase Auth a mensajes en español más descriptivos para el usuario.
Evaluá si useAuth debería usar useCallback para memorizar las funciones y evitar re-renders innecesarios.
Indicá si hay alguna pantalla donde el KeyboardAvoidingView pueda necesitar ajuste según el comportamiento en Android vs iOS.
Indicá si los componentes AppButton y AppInput son suficientemente genéricos para reutilizarse en los bloques siguientes o si conviene extenderlos ahora.

Restricciones

No instalar dependencias nuevas
No modificar app.json, tsconfig.json, package.json
No modificar src/lib/supabase/client.ts ni src/config/env.ts
No modificar AppNavigator.tsx
No hacer commits
Usar siempre StyleSheet.create, nunca inline styles complejos
Usar siempre las constantes de Routes para la navegación, nunca strings hardcodeados
Todos los textos visibles en español
Mensajes de error de validación en español

Al finalizar reportá

Lista completa de archivos creados o modificados con su path exacto
Decisiones tomadas que no estaban especificadas en este prompt
Puntos pendientes de validación detallados arriba
Cualquier limitación técnica encontrada durante la implementación

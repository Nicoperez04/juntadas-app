# Documentación — Cierre del Bloque 6: Perfil mejorado

## Tarea
Organizá la evidencia del Bloque 6 dentro de `ia/entrega-2/`.

## 1. Crear ia/entrega-2/conversaciones/bloque-6/cursor-bloque-6-completo.md

# Conversación Bloque 6 — Perfil mejorado

**Herramienta:** Cursor Agent
**Rama:** feature/bloque-6-perfil

## Resumen

### Lo que se implementó
- expo.scheme "rondaapp" + intentFilters Android en app.json
- redirectTo en resetPasswordForEmail apuntando a rondaapp://reset-password
- ResetPasswordScreen: nueva contraseña via deep link con validación
  Zod, toggle mostrar/ocultar, toast ✓ + haptic al guardar
- Handler PASSWORD_RECOVERY en AppNavigator con navegación
  imperativa via navigationRef para evitar problemas de cold start
- setSessionFromRecoveryUrl en authService: extrae access_token
  y refresh_token del hash de la URL y llama a supabase.auth.setSession()
- ChangePasswordScreen: cambio de contraseña estando logueado,
  verifica contraseña actual con signInWithPassword antes de updateUser
- Botón "Cambiar contraseña" en sección Seguridad del ProfileScreen
- Eliminar cuenta con doble confirmación: modal + email exacto
  (E2: limpia push_token + cierra sesión; hard delete pendiente para E3)
- Fix: mensaje de error en español para contraseña igual a la actual
- Fix: input de email del modal de eliminar cuenta con estilos explícitos

### Decisiones tomadas
- Navegación imperativa con navigationRef para el deep link en cold start
  porque initialRouteName no tiene efecto después del primer mount
- Ir directo al home tras recovery (no pedir login de nuevo) —
  comportamiento estándar de apps profesionales
- Eliminar cuenta como soft delete en E2 (limpia token + cierra sesión)
  hard delete requiere Edge Function o RPC con service role (E3)
- Linking nativo de React Native (sin expo-linking que no está instalado)
- detectSessionInUrl: false en el cliente — procesamiento manual del URL

### Problemas encontrados y resueltos
- Deep link no navegaba a ResetPassword en cold start —
  resuelto con navigationRef y navegación imperativa en onReady
- Link expirado al probar — causado por Gmail agrupando emails
  en hilo; solución: abrir el email más reciente del hilo
- Mensaje "New password should be different" en inglés —
  interceptado en mapAuthError() de authService
- Input de email del modal invisible — resuelto con estilos explícitos
  y alignSelf: stretch en el contenedor

### Deuda técnica documentada
- Hard delete de cuenta requiere Edge Function con service role (E3)
- deleted_at en profiles para soft delete real (E3)

## Conversación completa
[Pegar acá la conversación exportada de Cursor, con el script que creamos si es necesario]

## 2. Verificá estructura de prompts

ia/entrega-2/prompts/bloque-6/
├── 01_perfil_mejorado.md ✓
├── 02_correctivo_perfil.md ✓
└── 03_documentar_bloque-6.md ← este prompt

## 3. Actualizá ia/entrega-2/indice_ia.md

Verificar que los ítems del bloque 6 existen y agregar:
[número siguiente] - Documentación y cierre del Bloque 6

## Restricciones
- No tocar ningún archivo de código
- No hacer commits
- Solo crear o modificar archivos dentro de ia/entrega-2/

## Al finalizar reportá
1. Archivos creados o modificados
2. Cualquier inconsistencia encontrada

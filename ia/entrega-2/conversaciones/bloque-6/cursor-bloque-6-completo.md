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
- Logs `[Recovery]` temporales en AppNavigator y authService (marcados TODO: remover)
- Prompts de diagnóstico/fix de deep link y toast en ResetPasswordScreen
  no tienen archivo .md propio — documentados en esta conversación

## Prompts y respuestas

### Prompt 1 — 01_perfil_mejorado.md

Implementación completa del Bloque 6 en 7 tareas:

1. **Análisis previo:** expo-linking no instalado; AppNavigator sin handler PASSWORD_RECOVERY; sin ResetPassword en routes; authService sin updatePassword; ForgotPasswordScreen sin redirectTo.
2. **Deep links:** scheme + intentFilters en app.json; redirectTo en resetPasswordForEmail.
3. **ResetPasswordScreen:** formulario Zod, updateUser, toast de éxito.
4. **Navegación:** Routes.ResetPassword, AuthNavigator, onAuthStateChange PASSWORD_RECOVERY, Linking listener.
5. **ChangePasswordScreen:** verificación contraseña actual + updateUser; botón en ProfileScreen.
6. **Eliminar cuenta:** doble modal + deleteAccount (limpia push_token + signOut).
7. **Documentación:** prompts e índice ia (ítems 61–65).

**Archivos principales creados/modificados:** ResetPasswordScreen, ChangePasswordScreen, AppNavigator, AuthNavigator, MainNavigator, authService, ProfileScreen, routes, types, authSchemas, useAuth, app.json, indice_ia.

---

### Prompt 2 — Diagnóstico PASSWORD_RECOVERY (Ask mode)

Análisis del bug de cold start sin modificar código:

- `initialRouteName` no navega si AuthNavigator ya montó Welcome
- Carrera entre `getSession()` y `setSession()` del deep link
- `PASSWORD_RECOVERY` puede no dispararse con `setSession()` manual
- `setSessionFromRecoveryUrl` exige `refresh_token`; no lee `type=recovery`

---

### Prompt 3 — Fix deep link con navigationRef

**Cambios en AppNavigator.tsx:**
- `createNavigationContainerRef<AuthStackParamList>()`
- `pendingNavigationRef` + `flushPendingNavigation()` en `onReady` y `useEffect`
- `activatePasswordRecovery()` encola ruta ResetPassword tras procesar URL

**Cambios en authService.ts:**
- Logs `[Recovery]` temporales para adb logcat
- Fallback si hay `access_token` + `type=recovery` sin `refresh_token`

---

### Prompt 4 — 02_correctivo_perfil.md

1. Mensaje Supabase en inglés → `mapAuthError()` en authService
2. Modal eliminar cuenta: TextInput con estilos explícitos (width 100%, minHeight 48, etc.)

---

### Prompt 5 — Fix animación de éxito ResetPasswordScreen

Patrón de EditMeetupScreen / ReviewFormScreen:
- `void triggerSuccessHaptic()`
- Toast: `"✓ Contraseña actualizada correctamente"`

---

### Prompt 6 — 03_documentar_bloque-6.md

Cierre documental del bloque (este archivo e índice actualizado).

## Conversación completa

> La conversación exportada de Cursor puede pegarse aquí con el script de exportación del proyecto.
> Hasta entonces, la evidencia funcional del bloque queda en los prompts numerados de
> `ia/entrega-2/prompts/bloque-6/` y en los resúmenes de cada prompt arriba.

## Archivos de código tocados en el bloque (referencia)

| Área | Archivos |
|------|----------|
| Deep links | `app.json`, `authService.ts` |
| Recovery UI | `ResetPasswordScreen.tsx`, `ChangePasswordScreen.tsx` |
| Navegación | `AppNavigator.tsx`, `AuthNavigator.tsx`, `MainNavigator.tsx`, `routes.ts`, `types.ts` |
| Perfil | `ProfileScreen.tsx`, `useAuth.ts`, `authSchemas.ts`, `types.ts` |
| Documentación | `ia/entrega-2/prompts/bloque-6/*`, `ia/entrega-2/indice_ia.md` |

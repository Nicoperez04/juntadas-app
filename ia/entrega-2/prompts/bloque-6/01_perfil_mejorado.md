# Bloque 6 — Perfil mejorado

## Contexto
Rama actual: feature/bloque-6-perfil
Bloques 0 al 5 completos y mergeados a entrega-2.

Estado actual del perfil:
- Vista de perfil con foto, nombre, username, estadísticas ✓
- Edición de nombre completo y username ✓
- Cambio de foto de perfil ✓
- Toggle de notificaciones ✓
- Cerrar sesión ✓
- "Olvidaste tu contraseña" envía el email pero el deep link
  apuntaba a localhost:3000 — ya corregido en Supabase:
  Site URL = rondaapp://
  Redirect URL = rondaapp://reset-password

Lo que falta:
- expo.scheme no configurado en app.json
- No hay handler de PASSWORD_RECOVERY en onAuthStateChange
- No existe ResetPasswordScreen
- No existe flujo de cambio de contraseña estando logueado
- No existe opción de eliminar cuenta

Stack relevante:
- React Native + Expo SDK 55 + TypeScript
- Supabase Auth
- React Navigation
- React Hook Form + Zod ya instalados
- expo-linking (verificar si está instalado)
- Design tokens en src/shared/constants/theme.ts
- Sin TypeScript any, comentarios en español

## Tu tarea
Realizá las siguientes tareas en orden.

---

### Tarea 1 — Análisis previo

Antes de tocar cualquier archivo, reportá:

1. ¿Está instalado expo-linking? Buscá en package.json
2. ¿Cómo está estructurado el AppNavigator?
   ¿Maneja el evento PASSWORD_RECOVERY en onAuthStateChange?
3. ¿Existe alguna ruta o pantalla llamada ResetPassword
   en routes.ts o navigation/types.ts?
4. ¿authService tiene algún método updatePassword o similar?
5. ¿Cómo está implementado el ForgotPasswordScreen?
   ¿Llama a resetPasswordForEmail con redirectTo o sin él?

No tocar ningún archivo, solo reportar.

---

### Tarea 2 — Configurar deep links

En app.json agregar:
1. expo.scheme: "rondaapp"
2. En expo.android agregar intentFilters para manejar
   el deep link rondaapp://reset-password:

"intentFilters": [
  {
    "action": "VIEW",
    "autoVerify": true,
    "data": [
      {
        "scheme": "rondaapp",
        "host": "reset-password"
      }
    ],
    "category": ["BROWSABLE", "DEFAULT"]
  }
]

En authService.ts actualizar resetPasswordForEmail
para incluir redirectTo:

await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'rondaapp://reset-password'
})

No hacer:
- No tocar otros archivos todavía

Archivos esperados:
- app.json (scheme + intentFilters)
- src/features/auth/services/authService.ts (redirectTo agregado)

---

### Tarea 3 — Pantalla ResetPasswordScreen

Crear src/features/auth/screens/ResetPasswordScreen.tsx

Comportamiento:
- Esta pantalla se muestra cuando el usuario abre el deep link
  del email de recuperación
- Campos: nueva contraseña + confirmar contraseña
- Validación con Zod:
  * Mínimo 6 caracteres
  * Las dos contraseñas deben coincidir
- Al guardar: llamar a supabase.auth.updateUser({ password })
- En éxito: toast ✓ "Contraseña actualizada" + navegar al home
- En error: mostrar mensaje de error

UI:
- Mismo estilo que ForgotPasswordScreen
- Título "Nueva contraseña"
- Subtítulo "Ingresá tu nueva contraseña"
- Inputs con toggle de mostrar/ocultar contraseña
- Botón "Guardar contraseña"
- Seguir tokens de theme.ts

No hacer:
- No registrar la ruta todavía (va en Tarea 4)
- No hacer commits

Archivos esperados:
- src/features/auth/screens/ResetPasswordScreen.tsx

---

### Tarea 4 — Handler de deep link y navegación

Alcance:

1. Agregar Routes.ResetPassword en routes.ts
2. Agregar ResetPassword: undefined en AuthStackParamList
   en navigation/types.ts
3. Registrar ResetPasswordScreen en el navigator de auth
   (AuthNavigator o donde corresponda según la estructura actual)

4. En AppNavigator.tsx (o donde esté onAuthStateChange):
   Agregar handler para el evento PASSWORD_RECOVERY:

   supabase.auth.onAuthStateChange((event, session) => {
     if (event === 'PASSWORD_RECOVERY') {
       // Navegar a ResetPasswordScreen
     }
     // ... lógica existente
   })

5. Configurar el listener de deep links con expo-linking
   (o Linking de React Native si expo-linking no está):
   - Al abrir la app con el scheme rondaapp://reset-password
     navegar a ResetPasswordScreen

No hacer:
- No cambiar la lógica de autenticación existente
- No hacer commits

Archivos esperados:
- src/navigation/routes.ts (modificado)
- src/navigation/types.ts (modificado)
- Navigator de auth (modificado)
- AppNavigator.tsx (handler PASSWORD_RECOVERY)

---

### Tarea 5 — Cambiar contraseña desde el perfil

En la pantalla de perfil (ProfileScreen) agregar
una sección "Seguridad" con un botón "Cambiar contraseña".

Al tocarlo: navegar a una pantalla ChangePasswordScreen
(dentro del stack del perfil o como modal).

Crear src/features/auth/screens/ChangePasswordScreen.tsx:

Comportamiento:
- Campos: contraseña actual + nueva contraseña + confirmar
- Validación con Zod igual que ResetPasswordScreen
- Verificar contraseña actual:
  supabase.auth.signInWithPassword({ email, password: actual })
  Si falla: mostrar "Contraseña actual incorrecta"
- Si es correcta: llamar a supabase.auth.updateUser({ password: nueva })
- En éxito: toast ✓ "Contraseña actualizada" + goBack()
- En error: mostrar mensaje

UI:
- Título "Cambiar contraseña"
- Mismo estilo que ResetPasswordScreen
- Inputs con toggle mostrar/ocultar

Agregar ruta en routes.ts y types.ts.
Registrar en el navigator correspondiente.
Conectar botón en ProfileScreen.

No hacer:
- No hacer commits

Archivos esperados:
- src/features/auth/screens/ChangePasswordScreen.tsx
- src/navigation/routes.ts (modificado)
- src/navigation/types.ts (modificado)
- Navigator correspondiente (modificado)
- ProfileScreen (botón agregado)

---

### Tarea 6 — Eliminar cuenta

En ProfileScreen agregar al final (antes de Cerrar sesión
o después, con separación visual clara) un botón
"Eliminar cuenta" con estilo destructivo (rojo/borde rojo).

Comportamiento:
- Al tocar: modal de confirmación doble
  Primer modal: "¿Estás seguro? Esta acción no se puede deshacer."
  Botones: "Cancelar" / "Continuar"
  Segundo modal (solo si confirmó el primero):
  "Escribí tu email para confirmar"
  Input de texto donde debe escribir su email exacto
  Si coincide: proceder con la eliminación
  Si no coincide: mostrar error

- Proceso de eliminación:
  1. Llamar a supabase.auth.admin.deleteUser() no está disponible
     en el cliente — usar una alternativa:
     Marcar el usuario como eliminado en profiles con un campo
     deleted_at TIMESTAMPTZ, o
     Llamar a supabase.rpc('delete_user') si existe una función,
     o simplemente cerrar sesión y mostrar mensaje de que
     la solicitud fue enviada (para E2 esto es suficiente)

  IMPORTANTE: verificar qué es posible hacer con el cliente
  de Supabase antes de implementar. Si no se puede hacer
  hard delete desde el cliente, implementar soft delete
  agregando deleted_at a profiles y cerrar sesión.

- En éxito: cerrar sesión + navegar a pantalla de bienvenida
- Toast: "Tu cuenta ha sido eliminada"

No hacer:
- No crear migraciones por ahora — si se necesita deleted_at,
  reportarlo y esperar aprobación antes de crear la migración
- No hacer commits

Archivos esperados:
- ProfileScreen (botón y modales agregados)
- authService.ts (método deleteAccount agregado)
- Migración si es necesaria: REPORTAR ANTES DE CREAR

---

### Tarea 7 — Documentar este prompt

Crear ia/entrega-2/prompts/bloque-6/01_perfil_mejorado.md
con el contenido completo de este prompt.

Actualizar ia/entrega-2/indice_ia.md agregando:
[número siguiente] - Deep links: scheme rondaapp, intentFilters,
  redirectTo en resetPasswordForEmail
[número siguiente] - ResetPasswordScreen: nueva contraseña via deep link
[número siguiente] - Handler PASSWORD_RECOVERY en AppNavigator
[número siguiente] - ChangePasswordScreen: cambio de contraseña logueado
[número siguiente] - Eliminar cuenta desde perfil

No hacer:
- No tocar archivos de código
- No hacer commits

Archivos esperados:
- ia/entrega-2/prompts/bloque-6/01_perfil_mejorado.md
- ia/entrega-2/indice_ia.md (actualizado)

---

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- Seguir tokens de src/shared/constants/theme.ts
- No hacer commits
- Reportar archivos modificados y decisiones al finalizar cada tarea
- Si algo es ambiguo o requiere decisión, preguntar antes de asumir

## Al finalizar
Resumen con:
1. Archivos creados y modificados
2. Decisiones tomadas
3. Pendientes manuales si los hay
4. Cómo probarlo en dispositivo

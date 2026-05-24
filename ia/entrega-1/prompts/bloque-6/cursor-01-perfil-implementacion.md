# Implementación — Bloque 6: Perfil de usuario

## Contexto del proyecto
App móvil Juntadas, React Native + Expo SDK 55 + TypeScript. Backend Supabase. Rama activa: feature/bloque-6-perfil.
Arquitectura modular por features. Todo el código vive en mobile/src/features/auth/ (el perfil es parte del módulo auth ya existente). Sistema de diseño en mobile/src/shared/constants/theme.ts — ningún valor hardcodeado. Consultá Figma via MCP antes de implementar.
El cliente Supabase se importa desde @/lib/supabase/client. El hook useAuth ya existe en mobile/src/features/auth/hooks/useAuth.ts y tiene completeProfile implementado — reutilizarlo donde corresponda.

## Lo que necesito que implementes

### 1. Servicio — agregar a authService.ts
Agregá estas funciones al servicio existente:

- `getProfile(userId)` — obtiene el perfil completo desde la tabla profiles
- `updateProfile(userId, data)` — actualiza full_name, username y/o avatar_url en profiles. Antes de actualizar el username, verificar que no esté en uso por otro usuario.
- `uploadAvatar(userId, imageUri)` — sube la imagen al bucket avatars de Supabase Storage con path {userId}/avatar.jpg, retorna la URL pública. Si ya existe una foto previa, la reemplaza.
- `getUserStats(userId)` — retorna { organizedCount: number, participantCount: number } consultando meetups y meetup_participants
- `signOut()` — ya existe, verificar que esté implementado correctamente

### 2. Hook — actualizar useAuth.ts
Agregá al hook existente:

- `profile` — estado del perfil del usuario actual
- `stats` — { organizedCount, participantCount }
- `isLoadingProfile: boolean`
- `updateProfile(data)` — llama al servicio, actualiza el estado local
- `uploadAvatar(imageUri)` — llama al servicio, actualiza profile.avatarUrl
- `logout()` — llama a signOut(), la navegación la maneja AppNavigator automáticamente
- `loadProfile()` — carga el perfil y estadísticas del usuario actual

### 3. Pantalla — ProfileScreen.tsx
Ubicación: mobile/src/features/auth/screens/ProfileScreen.tsx
Consultá el mockup de Figma via MCP antes de implementar. La pantalla tiene estas secciones:

**Header:**
- Título "Mi perfil"
- Botón de editar (ícono lápiz) en el header derecho que activa el modo edición

**Sección avatar:**
- Avatar circular grande (80px) con iniciales sobre fondo de color determinístico si no tiene foto, o la foto si tiene
- En modo edición: overlay con ícono de cámara que al tocar abre expo-image-picker con opciones de cámara o galería
- Nombre completo debajo del avatar en bold
- Username con @ en gris

**Sección estadísticas:**
- Dos cards lado a lado: "Juntadas organizadas" y "Juntadas como invitado" con el número grande y el label debajo

**Sección información:**
- Campo Email — solo lectura, siempre
- Campo Nombre completo — texto en modo vista, input editable en modo edición
- Campo Username — texto en modo vista, input editable con validación en modo edición

**Banner de perfil incompleto:**
- Si el username empieza con user_ (generado automáticamente), mostrar un banner amarillo/naranja al tope: "Completá tu perfil — Agregá tu nombre y elegí un username" con botón "Completar"
- Al tocar "Completar" activa el modo edición directamente

**Sección acciones:**
- Botón "Cerrar sesión" destructivo (rojo, ghost) con ícono de logout
- Al tocar muestra un modal de confirmación: "¿Cerrar sesión?" con botones "Cancelar" y "Sí, cerrar sesión"
- Al confirmar llama a logout() del hook

**Modo edición:**
- Al activarse los campos de nombre y username se vuelven editables
- Botones "Cancelar" y "Guardar" en el header reemplazan al botón de editar
- Validaciones con Zod: nombre mínimo 2 caracteres, username 3-20 caracteres solo letras minúsculas números y guión bajo
- Toast de éxito al guardar usando el componente Toast existente
- Si el username ya está en uso mostrar error inline bajo el campo

### 4. Bucket de Storage para avatares
Crear el bucket avatars en Supabase Storage con estas políticas RLS. Ejecutar en SQL Editor:

```sql
-- Insertar/actualizar propio avatar
CREATE POLICY "avatars: upload own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars: update own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Leer avatares — público para todos los autenticados
CREATE POLICY "avatars: select public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
```

### 5. Navegación
Reemplazá el placeholder de ProfileScreen en MainNavigator.tsx por el import real.
El tab "Perfil" del footer en MeetupHomeScreen y en ImpostorTabBar ya debe navegar a Routes.Profile.

## Restricciones

- No instalar dependencias nuevas sin informarlo — expo-image-picker ya está instalado
- No modificar AppNavigator.tsx, client.ts, env.ts
- No hacer commits
- Comentar todo el código en español
- Usar siempre StyleSheet.create y Routes
- Consultar Figma via MCP antes de implementar la pantalla

## Al finalizar reportá

- Archivos creados o modificados
- Cómo quedó el flujo de edición inline
- Cómo quedó el upload de avatar
- SQL para el bucket de avatares — confirmar que está documentado
- Puntos pendientes de validación
- Estado final de MainNavigator para ProfileScreen

# Fix B5 — Avatar del header no muestra foto de perfil y no navega al perfil

## Contexto del proyecto
App móvil Juntadas, React Native + Expo SDK 55 + TypeScript estricto.
La pantalla principal es MeetupHomeScreen, ubicada en:
  src/features/meetups/screens/MeetupHomeScreen.tsx

El sistema de autenticación y perfil de usuario vive en:
  src/features/auth/hooks/useAuth.ts
  src/features/auth/services/authService.ts

El sistema de diseño centralizado está en:
  src/shared/constants/theme.ts

La navegación usa constantes de Routes desde:
  src/navigation/routes.ts

## Comportamiento esperado
El avatar circular en el header derecho de MeetupHomeScreen debe:
1. Mostrar la foto de perfil del usuario si tiene una cargada en Supabase
   Storage (campo avatar_url en la tabla profiles)
2. Mostrar las iniciales del nombre sobre fondo de color determinístico
   como fallback cuando no hay foto
3. Al tocarlo, navegar a ProfileScreen (Routes.Profile)
4. Actualizarse automáticamente cuando el usuario vuelve de ProfileScreen
   habiendo guardado una foto nueva

## Comportamiento actual (bugs)
1. El avatar siempre muestra iniciales — nunca la foto aunque el usuario
   la haya guardado en ProfileScreen
2. El avatar es un View estático — tocarlo no hace nada
3. El nombre del usuario se obtiene de user_metadata de la sesión de
   Supabase Auth, no de la tabla profiles — puede estar desactualizado
   si el usuario editó su nombre en ProfileScreen

## Causa raíz identificada

En MeetupHomeScreen, el estado del avatar se construye así:

  const [userName, setUserName] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const metadata = session?.user?.user_metadata;
      const name = (metadata?.full_name as string | undefined)
        ?? session?.user?.email ?? '';
      setUserName(name);
    });
  }, []);

Problemas:
- Solo lee user_metadata de Auth — no consulta la tabla profiles donde
  vive avatar_url
- El useEffect corre una sola vez al montar — no recarga al volver
  de ProfileScreen
- El avatar es un View, no un TouchableOpacity — no navega

## Solución propuesta

### Arquitectura del fix

En lugar de hacer una query directa a Supabase desde MeetupHomeScreen
(violación de la arquitectura — las pantallas no consultan Supabase
directamente), usar el hook useAuth que ya tiene loadProfile() y
expone el objeto profile con avatarUrl y fullName.

El perfil se recarga con useFocusEffect para que al volver de
ProfileScreen los datos estén frescos.

El avatar se convierte en TouchableOpacity que navega a Routes.Profile.

Si profile.avatarUrl existe, se renderiza con el componente Image de
React Native. Si no, se mantiene el fallback de iniciales sobre color
determinístico.

## Cambios a aplicar

### Archivo único — src/features/meetups/screens/MeetupHomeScreen.tsx

Leé el archivo completo antes de modificar cualquier línea.

#### Cambio 1 — Actualizar imports
Verificar que estos imports existan. Agregar los que falten:
- Image desde 'react-native' (para mostrar la foto de perfil)
- useAuth desde '@/features/auth/hooks/useAuth'

No agregar imports que ya existan. Leer el archivo antes de modificar.

#### Cambio 2 — Reemplazar el estado local del usuario
Eliminar completamente:

  const [userName, setUserName] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const metadata = session?.user?.user_metadata;
      const name = (metadata?.full_name as string | undefined)
        ?? session?.user?.email ?? '';
      setUserName(name);
    });
  }, []);

Reemplazar por:

  const { profile, loadProfile } = useAuth();

  // Nombre para el avatar — prioriza el perfil de la tabla profiles
  // sobre los metadatos de Auth para reflejar cambios del ProfileScreen
  const userName = profile?.fullName ?? profile?.username ?? '';

#### Cambio 3 — Recargar perfil al recibir foco
El useFocusEffect existente solo llama a refresh() para recargar la
lista de juntadas. Expandirlo para que también recargue el perfil:

Buscar el useFocusEffect existente que dice:
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

Reemplazarlo por:
  useFocusEffect(
    useCallback(() => {
      refresh();
      void loadProfile();
    }, [refresh, loadProfile]),
  );

#### Cambio 4 — Convertir el avatar en TouchableOpacity con soporte de foto
Buscar el bloque del avatar en el header. Actualmente es:

  <View
    style={[styles.headerAvatar, { backgroundColor: avatarBgColor }]}
  >
    <Text style={styles.headerAvatarText}>{initials}</Text>
  </View>

Reemplazarlo por un TouchableOpacity que navegue al perfil y muestre
la foto si existe:

  <TouchableOpacity
    style={[styles.headerAvatar, { backgroundColor: profile?.avatarUrl ? 'transparent' : avatarBgColor }]}
    onPress={() => navigation.navigate(Routes.Profile)}
    activeOpacity={0.8}
    accessibilityRole="button"
    accessibilityLabel="Ver mi perfil"
  >
    {profile?.avatarUrl ? (
      <Image
        source={{ uri: profile.avatarUrl }}
        style={styles.headerAvatarImage}
      />
    ) : (
      <Text style={styles.headerAvatarText}>{initials}</Text>
    )}
  </TouchableOpacity>

#### Cambio 5 — Agregar estilo para la imagen del avatar
En el StyleSheet al final del archivo, agregar dentro del objeto de estilos:

  headerAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: theme.radius.full,
  },

Verificar el tamaño exacto de headerAvatar en el StyleSheet existente
para asegurarse de que el Image lo rellena completamente.

#### Cambio 6 — Eliminar import de supabase si quedó sin usar
Después de aplicar los cambios anteriores, verificar si supabase sigue
siendo importado en el archivo. Si el único uso era el useEffect del
getSession que eliminamos, remover el import:
  import { supabase } from '@/lib/supabase/client';

No remover si supabase se usa en otro lugar del archivo.

## Restricciones
- Solo modificar src/features/meetups/screens/MeetupHomeScreen.tsx
- No modificar useAuth.ts ni authService.ts
- No modificar ProfileScreen.tsx
- No instalar dependencias nuevas
- No hacer commits
- Usar siempre theme.* para valores visuales
- Usar siempre Routes.* para navegación — nunca strings hardcodeados
- No hacer queries directas a Supabase desde la pantalla —
  toda la lógica de datos va por useAuth

## Al finalizar reportá
1. Path exacto del archivo modificado
2. Líneas aproximadas donde quedó cada uno de los 6 cambios
3. Confirmación de si Image ya estaba importado o se agregó
4. Confirmación de si useAuth ya estaba importado o se agregó
5. Confirmación de si el import de supabase se removió o se mantuvo
   y por qué
6. Tamaño exacto del headerAvatar encontrado en el StyleSheet
   (width y height) para verificar que el Image lo rellena correctamente
7. Cualquier inconsistencia encontrada en el archivo que no esté
   relacionada con este bug
8. Verificación de que no quedaron referencias a userName como
   estado local (useState) ni al useEffect de getSession eliminado
# Fix B10 — Reemplazar Alert nativo de foto de perfil por modal custom

## Contexto del proyecto
App móvil Juntadas, React Native + Expo SDK 55 + TypeScript estricto.
La pantalla de perfil de usuario está en:
  src/features/auth/screens/ProfileScreen.tsx

El sistema de diseño centralizado está en:
  src/shared/constants/theme.ts

## Comportamiento esperado
Al tocar el avatar en modo edición, debe aparecer un modal bottom sheet
con el diseño de la app que ofrezca dos opciones: Cámara y Galería.
El modal debe ser coherente visualmente con el resto de la app —
mismo border radius, colores, tipografía y sombras que el modal de
logout existente en la misma pantalla.

## Comportamiento actual (bug)
Al tocar el avatar aparece un Alert.alert nativo del sistema operativo
con el diálogo genérico de Android/iOS, visualmente inconsistente con
el diseño de la app.

## Causa raíz
En ProfileScreen.tsx, la función handleAvatarPress usa Alert.alert:

  Alert.alert('Cambiar foto de perfil', 'Elegí una opción', [
    { text: 'Cámara', onPress: () => void handlePickImage('camera') },
    { text: 'Galería', onPress: () => void handlePickImage('gallery') },
  ]);

## Solución propuesta
Reemplazar el Alert.alert por un Modal custom tipo bottom sheet,
usando el mismo patrón visual que el modal de logout ya existente
en la misma pantalla. El modal de foto debe tener:

- Overlay semitransparente oscuro
- Card blanca con border radius xl en la parte superior
- Handle de arrastre decorativo (igual al de ModifyAttendanceScreen)
- Título "Cambiar foto de perfil"
- Dos opciones con ícono y label: Cámara y Galería
- Botón Cancelar al pie
- Mismo sistema de colores, spacing y tipografía que el resto de la app

## Cambios a aplicar

### Archivo único — src/features/auth/screens/ProfileScreen.tsx

Leé el archivo completo antes de modificar.

#### Cambio 1 — Agregar estado para el modal de foto
Cerca de donde está showLogoutModal, agregar:

  /** Controla la visibilidad del modal de selección de fuente de foto */
  const [showAvatarModal, setShowAvatarModal] = useState(false);

#### Cambio 2 — Reemplazar handleAvatarPress
Buscar la función handleAvatarPress que actualmente llama Alert.alert.
Reemplazarla por:

  /** Abre el modal custom de selección de fuente de foto */
  const handleAvatarPress = () => {
    setShowAvatarModal(true);
  };

#### Cambio 3 — Agregar el Modal custom antes del cierre del return
Antes del Modal de logout existente, agregar el nuevo modal de foto:

  {/* Modal de selección de fuente de foto de perfil */}
  <Modal
    transparent
    animationType="slide"
    visible={showAvatarModal}
    onRequestClose={() => setShowAvatarModal(false)}
    statusBarTranslucent
  >
    <View style={styles.avatarModalOverlay}>
      <Pressable
        style={StyleSheet.absoluteFillObject}
        onPress={() => setShowAvatarModal(false)}
      />
      <View style={styles.avatarModalSheet}>
        {/* Handle decorativo */}
        <View style={styles.avatarModalHandle} />

        <Text style={styles.avatarModalTitle}>Cambiar foto de perfil</Text>

        {/* Opción Cámara */}
        <TouchableOpacity
          style={styles.avatarModalOption}
          onPress={() => {
            setShowAvatarModal(false);
            void handlePickImage('camera');
          }}
          activeOpacity={0.7}
        >
          <View style={styles.avatarModalOptionIcon}>
            <Ionicons name="camera-outline" size={24} color={theme.colors.primary} />
          </View>
          <Text style={styles.avatarModalOptionLabel}>Cámara</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        {/* Opción Galería */}
        <TouchableOpacity
          style={styles.avatarModalOption}
          onPress={() => {
            setShowAvatarModal(false);
            void handlePickImage('gallery');
          }}
          activeOpacity={0.7}
        >
          <View style={styles.avatarModalOptionIcon}>
            <Ionicons name="images-outline" size={24} color={theme.colors.primary} />
          </View>
          <Text style={styles.avatarModalOptionLabel}>Galería de fotos</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        {/* Botón cancelar */}
        <TouchableOpacity
          style={styles.avatarModalCancel}
          onPress={() => setShowAvatarModal(false)}
          activeOpacity={0.7}
        >
          <Text style={styles.avatarModalCancelText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>

#### Cambio 4 — Agregar estilos del modal de foto
En el StyleSheet al final del archivo, agregar los estilos nuevos
después de los estilos del modal de logout existentes.
Usar siempre theme.* — nunca valores hardcodeados:

  avatarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  avatarModalSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
    ...theme.shadows.md,
  },
  avatarModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.full,
    alignSelf: 'center',
    marginVertical: theme.spacing.sm,
  },
  avatarModalTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  avatarModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatarModalOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarModalOptionLabel: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textPrimary,
  },
  avatarModalCancel: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  avatarModalCancelText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
  },

#### Cambio 5 — Verificar que Alert se puede remover del import
Después de aplicar todos los cambios, verificar si Alert sigue siendo
usado en algún otro lugar del archivo. Si el único uso era en
handleAvatarPress, removerlo del import de react-native.

## Restricciones
- Solo modificar src/features/auth/screens/ProfileScreen.tsx
- No modificar useAuth.ts ni authService.ts
- No modificar el modal de logout existente
- No instalar dependencias nuevas
- No hacer commits
- Usar siempre theme.* para valores visuales
- Usar Ionicons para los íconos — ya está importado en el archivo

## Al finalizar reportá
1. Path exacto del archivo modificado
2. Líneas aproximadas de cada uno de los 5 cambios
3. Confirmación de si Alert se removió del import o se mantuvo y por qué
4. Si encontraste otros usos de Alert.alert en el archivo además
   del que reemplazamos
5. Cualquier inconsistencia encontrada no relacionada con este bug
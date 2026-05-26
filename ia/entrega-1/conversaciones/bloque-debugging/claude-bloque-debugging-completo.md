# Conversación Bloque Debugging — Fixes y pulido UX

**Herramienta:** Claude Code CLI  
**Rama:** entrega-1

---

## Resumen

### Lo que se corrigió
- Footer tab bar ausente en CreateMeetup, JoinMeetup, Profile, MeetupDetail e History

### Decisiones tomadas
- AppTabBar creado en shared/components como componente canónico
- ImpostorTabBar refactorizado a re-export para no romper imports existentes
- Early returns de loading/error en MeetupDetail sin tab bar (pantallas transitorias)

### Pendientes
- B3: Bug impostor — al eliminar último jugador se restablecen todos
- B4: Animación de éxito duplicada en modificar asistencia
- B5: Foto de perfil no se propaga al avatar del header
- (resto de bugs listados)

---

## Sesión 1 — B1: Footer tab bar faltante en pantallas principales

### Prompt
# Fix B1 — Footer tab bar faltante en pantallas principales

## Contexto
El proyecto usa un Stack Navigator con tab bars renderizados como componentes
dentro de cada pantalla. MeetupHomeScreen y las pantallas de Impostor ya tienen
el tab bar. El bug es que CreateMeetupScreen, JoinMeetupScreen, ProfileScreen
y MeetupDetailScreen NO lo tienen, por eso al navegar a esas pantallas el footer
desaparece.

El componente ImpostorTabBar en src/features/impostor/components/ImpostorTabBar.tsx
ya implementa la lógica completa. El problema es que:
1. Está en la feature equivocada (impostor) siendo un componente compartido
2. No se usa en las pantallas que lo necesitan

## Tarea

### Paso 1 — Crear AppTabBar en shared
Creá el archivo src/shared/components/AppTabBar.tsx.

Es EXACTAMENTE igual a ImpostorTabBar pero:
- Se llama AppTabBar
- La prop se llama activeTab en lugar de activeTabId
- Acepta los valores: 'home' | 'create' | 'join' | 'games' | 'profile'
- Default: 'home'

El contenido (TABS array, handleTabPress, estilos) debe ser idéntico al de
ImpostorTabBar — solo cambian el nombre del componente y la prop.

### Paso 2 — Actualizar ImpostorTabBar
Reemplazá el contenido de src/features/impostor/components/ImpostorTabBar.tsx
para que sea un re-export de AppTabBar con activeTab="games" por defecto:

```tsx
/**
 * Re-export de AppTabBar preconfigurado para el flujo de Impostor.
 * Mantiene la interfaz original para no romper los imports existentes.
 */
import React from 'react';
import { AppTabBar } from '@/shared/components/AppTabBar';

interface ImpostorTabBarProps {
  activeTabId?: string;
}

export const ImpostorTabBar = ({ activeTabId = 'games' }: ImpostorTabBarProps) => (
  <AppTabBar activeTab={(activeTabId as 'home' | 'create' | 'join' | 'games' | 'profile') ?? 'games'} />
);
```

### Paso 3 — Agregar AppTabBar a CreateMeetupScreen
Leé src/features/meetups/screens/CreateMeetupScreen.tsx.

El layout actual tiene: SafeAreaView > KeyboardAvoidingView > ScrollView (o View).

Necesitás:
1. Importar AppTabBar desde @/shared/components/AppTabBar
2. Cambiar el root container a flex: 1 con View si no lo es ya
3. Agregar <AppTabBar activeTab="create" /> ANTES del cierre del root View,
   DESPUÉS del ScrollView/KeyboardAvoidingView
4. Agregar paddingBottom al contentContainerStyle del ScrollView para que
   el contenido no quede tapado por el tab bar (usar theme.spacing.xl * 2 = 64)

Estructura final: 
<View style={{ flex: 1 }}>
<SafeAreaView edges={['top']} ...>
...header...
</SafeAreaView>
<KeyboardAvoidingView style={{ flex: 1 }}>
<ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
...contenido...
</ScrollView>
</KeyboardAvoidingView>
<AppTabBar activeTab="create" />
</View>

### Paso 4 — Agregar AppTabBar a JoinMeetupScreen
Leé src/features/meetups/screens/JoinMeetupScreen.tsx y aplicá el mismo
patrón que CreateMeetupScreen pero con activeTab="join".

### Paso 5 — Agregar AppTabBar a ProfileScreen
Leé src/features/auth/screens/ProfileScreen.tsx y aplicá el mismo
patrón con activeTab="profile".

### Paso 6 — Agregar AppTabBar a MeetupDetailScreen
Leé src/features/meetups/screens/MeetupDetailScreen.tsx.
Esta pantalla tiene scroll. Agregá AppTabBar con activeTab="home"
(el detalle no tiene tab propio, home queda activo).

### Paso 7 — Agregar AppTabBar a MeetupHistoryScreen
Leé src/features/meetups/screens/MeetupHistoryScreen.tsx.
Agregá AppTabBar con activeTab="home".

## Restricciones
- No modificar MainNavigator.tsx, routes.ts, app.json, tsconfig.json, package.json
- No instalar dependencias nuevas
- No modificar MeetupHomeScreen (ya tiene el tab bar inline correcto)
- No modificar GamesScreen, ImpostorStartScreen (ya usan ImpostorTabBar)
- ImpostorRoleScreen NO debe tener tab bar (decisión de producto: pantalla inmersiva sin footer)
- Usar siempre theme.* para estilos, nunca valores hardcodeados
- Usar siempre Routes.* para navegación, nunca strings

## Al finalizar reportá
- Lista exacta de archivos creados y modificados
- Si alguna pantalla tenía una estructura que hizo difícil agregar el tab bar, describí qué encontraste y cómo lo resolviste
- Cualquier inconsistencia encontrada en las pantallas revisadas

### Respuesta
---
Archivos creados
- src/shared/components/AppTabBar.tsx — nuevo componente compartido, idéntico a ImpostorTabBar pero con prop activeTab (valores: 'home' | 'create' | 'join' | 'games' | 'profile', default 'home').
Archivos modificados
- src/features/impostor/components/ImpostorTabBar.tsx — reemplazado por re-export de AppTabBar, mantiene la prop activeTabId para no romper imports existentes.
- src/features/meetups/screens/CreateMeetupScreen.tsx — añadido AppTabBar activeTab="create". Reestructurado: root View + SafeAreaView edges={['top']} solo para el header. paddingBottom: xl*2 al scrollContent.
- src/features/meetups/screens/JoinMeetupScreen.tsx — mismo patrón. AppTabBar activeTab="join". paddingBottom: xl*2 al contentContainerStyle.
- src/features/auth/screens/ProfileScreen.tsx — reemplazado import ImpostorTabBar → AppTabBar, uso cambiado a <AppTabBar activeTab="profile" />. Esta pantalla ya tenía la estructura correcta (root View + SafeAreaView solo para top).
- src/features/meetups/screens/MeetupDetailScreen.tsx — añadido AppTabBar activeTab="home". Reestructurado root igual que las otras pantallas. paddingBottom: xl*2 al scrollContent. Los early returns de loading/error mantienen su propio SafeAreaView sin tab bar (son pantallas transitorias de carga).
- src/features/meetups/screens/MeetupHistoryScreen.tsx — añadido AppTabBar activeTab="home". Reestructurado root. paddingBottom: xl*2 al scrollContent.
Inconsistencias encontradas
- ProfileScreen ya usaba ImpostorTabBar con activeTabId="profile" y ya tenía la estructura View > SafeAreaView(top) correcta — fue el único caso donde solo hubo que cambiar el import/prop.
- MeetupDetailScreen tiene dos early returns (loading/error) que devuelven SafeAreaView standalone. Se dejaron sin tab bar intencionalmente: son pantallas de estado transitorio, no navegación normal.
- El bottomSpace que existía en CreateMeetup y MeetupDetail (un View con height: theme.spacing.xl) se dejó intacto; el paddingBottom: xl*2 del ScrollView es adicional y garantiza que el contenido no quede tapado por el tab bar en pantallas con poco contenido.

---

## Sesión 2 — B3: Bug impostor — restauración de jugadores al eliminar el último

### Contexto de la sesión
Este fix requirió varias iteraciones. Se intentaron enfoques alternativos
(cleanup en useFocusEffect, clearSession en botón back) que generaron loops 
de re-render o rompieron la navegación. Se revirtió el archivo con 
`git checkout` y se aplicó la solución mínima de 3 cambios sobre el archivo
original. Ver decisión de alcance en la respuesta.

### Prompt
# Fix B3 — Bug impostor: eliminar último jugador restaura la lista

## Causa raíz identificada
En ImpostorStartScreen hay un useEffect que detecta cuando players.length
llega a 0 y restaura la lista desde la sesión guardada en Zustand.
Ese efecto fue diseñado para pre-cargar jugadores al volver de ImpostorRole,
pero no distingue entre "lista vacía porque el usuario la limpió" y
"lista vacía porque recién entró a la pantalla".

## Fix
En src/features/impostor/screens/ImpostorStartScreen.tsx aplicar 3 cambios:

### Cambio 1 — Agregar flag de control
Después de showAddPlayer agregar:

  const [playersManuallyCleared, setPlayersManuallyCleared] = useState(false);

### Cambio 2 — Actualizar handleRemovePlayer
  const handleRemovePlayer = useCallback((playerId: string) => {
    void triggerSelectionHaptic();
    setPlayers((prev) => {
      const next = prev.filter((p) => p.id !== playerId);
      if (next.length === 0) setPlayersManuallyCleared(true);
      return next;
    });
  }, []);

### Cambio 3 — Actualizar la condición del useEffect
  if (session?.players.length && players.length === 0 && !playersManuallyCleared)

## Restricciones
- Solo modificar ImpostorStartScreen.tsx
- No modificar useImpostor.ts ni el store de Zustand
- No hacer commits

### Respuesta
Los 3 cambios aplicados:
- Cambio 1: nuevo estado playersManuallyCleared agregado después de showAddPlayer (línea ~98)
- Cambio 2: handleRemovePlayer modificado para activar el flag al llegar a 0 jugadores (líneas ~213-223)  
- Cambio 3: condición del useEffect actualizada con !playersManuallyCleared (línea ~171)

#### Decisión de alcance documentada
La sesión del juego (jugadores agregados manualmente) persiste en el store
de Zustand en memoria mientras la app está abierta. Al cerrar y reabrir
la app, el estado se reinicia automáticamente.

Esto es coherente con la definición del juego en doc_tecnica_e1.md como
"dinámica social en vivo presencial" sin persistencia en backend. No se
considera bug — mejora la UX en rondas consecutivas durante la misma
sesión de uso. Si el usuario necesita una lista nueva sin reiniciar la app,
debe eliminar los jugadores manualmente uno por uno.

---

## Sesión 3 — B4: Modal de asistencia no se cierra después de guardar

### Contexto de la sesión
Este bug requirió dos iteraciones. El diagnóstico inicial identificó
el problema como superposición de dos Modales de React Native animando
en simultáneo (Toast montándose durante la animación de cierre del sheet).
Al ver capturas de pantalla del comportamiento real, se identificó la
causa raíz correcta: el onSave bloqueaba el cierre del modal con queries
a Supabase que se ejecutaban antes de que closeModal() pudiera llamarse.

### Prompt 1 — Diagnóstico inicial
### Contexto del proyecto
App móvil Juntadas, React Native + Expo SDK 55 + TypeScript estricto.
El modal de modificación de asistencia (ModifyAttendanceScreen) es un
bottom sheet custom con animaciones propias (Animated API de React Native).
El Toast es un componente de feedback transitorio que usa su propio Modal
con animaciones fade in/out.

Ambos componentes viven en:
- src/features/participants/screens/ModifyAttendanceScreen.tsx
- src/shared/components/Toast.tsx

Se usan en dos pantallas:
- src/features/meetups/screens/MeetupDetailScreen.tsx
- src/features/participants/screens/ParticipantListScreen.tsx

### Comportamiento esperado
Al guardar una modificación de asistencia exitosamente:
1. El bottom sheet se cierra con su animación (slide down + fade overlay)
2. Una vez cerrado completamente, aparece el Toast de éxito centrado
3. El Toast se muestra una sola vez durante 2 segundos y desaparece

### Comportamiento actual (bug)
Al guardar exitosamente:
- La animación de éxito aparece duplicada (dos flashes del Toast)
- El modal vuelve a mostrarse brevemente después de cerrarse
- El Toast y el cierre del modal se superponen visualmente

### Causa raíz identificada

El flujo actual en ambas pantallas es:

  onSave={async (status) => {
    await participantService.updateAttendance(...);
    setToast({ message: '✓ Asistencia actualizada', type: 'success' }); // ← PROBLEMA
  }}
  onClose={() => setAttendanceModalTarget(null)}

El problema está en el timing: ModifyAttendanceScreen.handleSave() llama
a onSave() y luego llama a closeModal() internamente. closeModal() ejecuta
una animación asíncrona de 280ms (slide down) + 220ms (fade overlay) antes
de desmontarse. Durante esa animación, el padre ya recibió el setToast y
monta el componente Toast, que a su vez crea su propio Modal. Dos Modales
de React Native animando en simultáneo producen el comportamiento duplicado.

La solución es separar el setToast del onSave y moverlo al onClose,
que se dispara después de que la animación de cierre del sheet terminó
completamente. Para pasar información de éxito entre ambos callbacks
se usa una ref interna.

### Solución propuesta

En cada pantalla (MeetupDetailScreen y ParticipantListScreen):

1. Agregar una ref para transportar el mensaje de éxito entre callbacks:
   const pendingToastRef = useRef<string | null>(null);

2. En onSave: ejecutar el servicio y guardar el mensaje en la ref,
   pero NO llamar a setToast todavía.

3. En onClose: leer la ref, mostrar el Toast si hay mensaje pendiente,
   y limpiar la ref.

### Cambios a aplicar

#### Archivo 1 — src/features/meetups/screens/MeetupDetailScreen.tsx

Cambio 1.1 — Agregar ref para el mensaje pendiente cerca de los otros
useState y useRef del componente:

  /**
   * Transporta el mensaje de Toast entre onSave y onClose del modal de
   * asistencia. Se usa ref en lugar de estado para no generar re-renders
   * intermedios durante la animación de cierre del bottom sheet.
   */
  const pendingToastRef = useRef<string | null>(null);

Cambio 1.2 — Modificar el bloque onSave del ModifyAttendanceScreen.
Eliminar los setToast del onSave y reemplazarlos por
pendingToastRef.current = '✓ Asistencia actualizada' en cada rama.
Mantener loadData() y refreshParticipants() en el onSave.

Cambio 1.3 — Modificar el onClose del ModifyAttendanceScreen:

  onClose={() => {
    setAttendanceModalTarget(null);
    if (pendingToastRef.current) {
      setToast({ message: pendingToastRef.current, type: 'success' });
      pendingToastRef.current = null;
    }
  }}

#### Archivo 2 — src/features/participants/screens/ParticipantListScreen.tsx

Aplicar exactamente el mismo patrón que en MeetupDetailScreen.

### Restricciones
- Solo modificar MeetupDetailScreen.tsx y ParticipantListScreen.tsx
- No modificar ModifyAttendanceScreen.tsx ni Toast.tsx
- No modificar participantService.ts ni useParticipants.ts
- No instalar dependencias nuevas
- No hacer commits

### Al finalizar reportá
1. Lista exacta de archivos modificados con path completo
2. Líneas aproximadas donde quedó cada cambio en cada archivo
3. Nombres exactos de las funciones del servicio encontradas
4. Confirmación de que useRef estaba o no importado previamente
5. Diferencias entre cómo ambas pantallas manejan el onSave
6. Cualquier inconsistencia encontrada
7. Verificación de que no quedaron llamadas a setToast dentro del onSave

### Respuesta 1

Fix aplicado con pendingToastRef para separar el setToast del onSave.

#### Archivos modificados
- src/features/meetups/screens/MeetupDetailScreen.tsx
- src/features/participants/screens/ParticipantListScreen.tsx

#### Cambios aplicados
- MeetupDetailScreen (línea 12): useRef agregado al import de React
- MeetupDetailScreen (líneas 269-275): pendingToastRef declarado
- MeetupDetailScreen (líneas 758-778): onClose expandido con lectura de ref
- MeetupDetailScreen (líneas 779-795): onSave — setToast reemplazado por
  pendingToastRef.current en ambas ramas; loadData() y refreshParticipants()
  se mantuvieron en onSave
- ParticipantListScreen (línea 8): useRef agregado al import de React
- ParticipantListScreen (líneas 195-201): pendingToastRef declarado
- ParticipantListScreen (líneas 373-383): onClose expandido con lectura de ref
- ParticipantListScreen (líneas 384-398): onSave — setToast reemplazado por
  pendingToastRef.current en ambas ramas

#### Funciones de servicio encontradas
Ambas pantallas usan el hook useParticipants, no participantService
directamente:
- Modo organizador: updateParticipantAttendance(participant.userId, status)
- Modo self: updateAttendance(status)

#### Resultado
El fix se aplicó correctamente pero el modal seguía sin cerrarse.
Al ver capturas de pantalla se identificó que el problema real era que
loadData() y refreshParticipants() dentro del onSave bloqueaban el await
en handleSave() de ModifyAttendanceScreen, impidiendo que closeModal()
se ejecutara.

---

### Prompt 2 — Fix correcto
### Contexto
El fix anterior (B4 Prompt 1) movió correctamente el setToast del onSave
al onClose mediante pendingToastRef. Sin embargo el modal sigue sin cerrarse
después de guardar porque el onSave ahora llama await loadData() y await
refreshParticipants() que hacen queries a Supabase. ModifyAttendanceScreen.
handleSave() espera que onSave() resuelva antes de llamar a closeModal().
Las queries bloquean esa espera y el usuario ve el modal congelado con el
Toast encima.

### Causa raíz real
En ModifyAttendanceScreen.tsx (no modificar este archivo), handleSave hace:

  await onSave(selectedStatus);  // espera que el padre termine TODO
  await closeModal();            // recién entonces cierra

El onSave del padre no debería hacer operaciones lentas — solo la escritura
mínima necesaria. Las recargas de datos (loadData, refresh) deben moverse
al onClose que se llama después de que el sheet terminó de animarse.

### Comportamiento esperado post-fix
1. Usuario toca Guardar
2. onSave — solo escritura a Supabase (~200ms) — rápido
3. ModifyAttendanceScreen anima el cierre del sheet (~500ms)
4. onClose — recarga datos en background + muestra Toast
5. Toast aparece una sola vez con el sheet ya cerrado

### Cambios a aplicar

#### Archivo 1 — src/features/meetups/screens/MeetupDetailScreen.tsx

Leé el archivo completo antes de modificar.

El onSave debe quedar solo con la operación de escritura al servicio,
el error check y el seteo de la ref. Sin await loadData() ni await
refreshParticipants(). Usar los nombres exactos de funciones que ya
existen en el archivo — no inventar nombres.

El onClose debe quedar con las recargas en background más el Toast:

  onClose={() => {
    setAttendanceModalTarget(null);
    void loadData();
    void refreshParticipants();
    if (pendingToastRef.current) {
      setToast({ message: pendingToastRef.current, type: 'success' });
      pendingToastRef.current = null;
    }
  }}

#### Archivo 2 — src/features/participants/screens/ParticipantListScreen.tsx

Leé el archivo completo antes de modificar.

Aplicar el mismo patrón. Verificar si tiene loadData, refresh u otra
función de recarga — usar la que exista en ese archivo.

El onClose debe quedar:

  onClose={() => {
    setAttendanceModalTarget(null);
    void refresh();
    if (pendingToastRef.current) {
      setToast({ message: pendingToastRef.current, type: 'success' });
      pendingToastRef.current = null;
    }
  }}

### Restricciones
- Solo modificar MeetupDetailScreen.tsx y ParticipantListScreen.tsx
- No modificar ModifyAttendanceScreen.tsx ni Toast.tsx
- No modificar participantService.ts ni useParticipants.ts
- No hacer commits
- Usar nombres de funciones exactos que ya existen en cada archivo

### Al finalizar reportá
1. Archivos modificados con path exacto
2. Líneas aproximadas de cada cambio
3. Funciones de recarga encontradas en cada archivo
4. Cómo quedó el onSave en cada archivo (solo escritura, sin recargas)
5. Cómo quedó el onClose en cada archivo (con recargas y Toast)
6. Cualquier inconsistencia encontrada

### Respuesta 2

#### Archivos modificados
- src/features/meetups/screens/MeetupDetailScreen.tsx
- src/features/participants/screens/ParticipantListScreen.tsx

#### Cambios aplicados
- MeetupDetailScreen (~líneas 758-784): onSave — removidos await loadData()
  y await refreshParticipants(). Quedó solo escritura al servicio + error
  check + pendingToastRef.current
- MeetupDetailScreen (~líneas 758-784): onClose — agregados void loadData()
  y void refreshParticipants() para recargar en background después del cierre
- ParticipantListScreen (~líneas 372-380): onSave ya estaba limpio desde
  el Prompt 1 — sin cambios necesarios
- ParticipantListScreen (~líneas 372-380): onClose — agregado void refresh()

#### Funciones de recarga por pantalla
- MeetupDetailScreen: loadData (useCallback local) + refreshParticipants
  (alias de useParticipants)
- ParticipantListScreen: refresh (directo de useParticipants, sin alias)

#### Flujo correcto post-fix
1. Usuario toca Guardar
2. onSave — solo escritura a Supabase (~200ms) — modal puede cerrar rápido
3. ModifyAttendanceScreen anima el cierre del sheet (~500ms)
4. onClose — void loadData() + void refreshParticipants() en background
5. Toast aparece una sola vez con el sheet ya cerrado

#### Inconsistencias encontradas
ParticipantListScreen ya tenía el onSave limpio desde el Prompt 1,
por lo que el único cambio necesario en la segunda iteración fue el onClose.

En MeetupDetailScreen se detectó que el estado toast se declara antes
de los early returns del componente — los early returns en líneas ~337-362
podrían eventualmente necesitar su propio manejo de toast si se agregan
estados de error en esas ramas. Anotado para futuras entregas.

#### Pendientes
Ninguno relacionado a este bug.

---

## Sesión 4 — B5: Avatar del header no muestra foto de perfil y no navega al perfil

### Prompt
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

### Respuesta

## Fix B5 aplicado

### Diagnóstico
MeetupHomeScreen construía el avatar del header leyendo únicamente
user_metadata de la sesión de Supabase Auth — nunca consultaba la tabla
profiles donde vive avatar_url. Además el avatar era un View estático
sin navegación, y el useEffect que cargaba el nombre corría una sola vez
al montar sin recargarse al volver de ProfileScreen.

La solución fue reemplazar la lógica local por el hook useAuth que ya
expone profile con avatarUrl y fullName, recargar el perfil en el
useFocusEffect existente, y convertir el avatar en TouchableOpacity
con soporte de Image cuando hay foto.

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| src/features/meetups/screens/MeetupHomeScreen.tsx | Modificado |

### Cambios aplicados

- **C1 (líneas 12-30):** Image agregado a react-native. useState removido
  del import de React. Import de supabase removido (único uso era el
  useEffect de getSession eliminado en C3)
- **C2 (líneas 264-269):** `const [userName, setUserName] = useState('')`
  reemplazado por `const { profile, loadProfile } = useAuth()`. userName
  ahora se deriva de `profile?.fullName ?? profile?.username ?? ''`
- **C3 (líneas 271-276):** `void loadProfile()` agregado al useFocusEffect
  existente. useEffect de getSession eliminado por completo
- **C4 (líneas ~372-380):** View del avatar reemplazado por TouchableOpacity
  con onPress navegando a Routes.Profile. Lógica condicional: muestra Image
  si profile.avatarUrl existe, iniciales como fallback
- **C5 (líneas 573-577):** Estilo headerAvatarImage agregado con
  width: '100%', height: '100%', borderRadius: theme.radius.full.
  El headerAvatar tiene 38×38px — Image lo rellena exactamente

### Estado de imports antes del fix
- Image: no estaba importado — se agregó
- useAuth: no estaba importado — se agregó
- supabase: estaba importado — se removió (único uso eliminado)

### Flujo correcto post-fix
1. Usuario entra a MeetupHomeScreen → useFocusEffect llama loadProfile()
2. profile.avatarUrl disponible → avatar muestra la foto
3. Usuario toca el avatar → navega a Routes.Profile
4. Usuario carga foto nueva en ProfileScreen → vuelve al home
5. useFocusEffect recarga el perfil → avatar muestra la foto nueva

### Inconsistencias encontradas (no relacionadas con este bug)
MeetupHomeScreen tiene su propio tab bar inline (TABS array + renderizado
manual) en lugar de usar el componente AppTabBar creado en Fix B1. Es
funcional pero duplica la lógica del tab bar compartido. Anotado como
deuda técnica para Entrega 2 — no se toca en esta entrega para no
introducir regresiones de última hora.

### Pendientes
- Deuda técnica E2: refactorizar el tab bar inline de MeetupHomeScreen
  para usar AppTabBar como el resto de las pantallas

## Sesión 5 — B9: Cursor del input de código aparece al extremo derecho

### Contexto de la sesión
Fix aplicado con Claude Code integrado en VS Code (extensión Anthropic).
El bug era estructural — con un TextInput normal y letterSpacing no es
posible controlar la posición del cursor en Android. La solución
correcta fue reemplazar el TextInput por un input OTP custom con
6 cajas individuales.

### Solución aplicada
Reemplazar el TextInput con letterSpacing por 6 cajas OTP individuales
con un TextInput invisible detrás que captura el input real. Cada caja
muestra el carácter correspondiente y un cursor visual en la primera
caja vacía.

### Archivos modificados
- src/features/meetups/screens/JoinMeetupScreen.tsx

### Decisiones técnicas
- TextInput invisible centraliza el manejo del input y la validación
  existente con React Hook Form + Zod (no se modificó el schema)
- 6 Views individuales renderizan cada carácter con cursor visual
- Los progress dots del diseño original se eliminaron — las cajas
  OTP cumplen la misma función visualmente
- Estilos nuevos: hiddenInput, otpRow, otpBox, otpBoxActive,
  otpBoxError, otpChar, otpCursor

### Herramienta utilizada
Claude Code extensión de VS Code (Anthropic) — no Claude Code CLI

## Sesión 6 — B10: Popup de foto de perfil reemplazado por modal custom

### Prompt
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

### Respuesta

## Fix B10 aplicado

### Diagnóstico
ProfileScreen usaba Alert.alert nativo del sistema operativo para
mostrar las opciones de Cámara y Galería al tocar el avatar en modo
edición. El diálogo nativo es visualmente inconsistente con el diseño
de la app — colores, tipografía y estilo no coinciden con el sistema
de diseño.

La solución fue reemplazar Alert.alert por un Modal bottom sheet custom
usando el mismo patrón visual del modal de logout ya existente en la
misma pantalla.

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| src/features/auth/screens/ProfileScreen.tsx | Modificado |

### Cambios aplicados
- (~línea 193): estado showAvatarModal agregado
- (~línea 316): handleAvatarPress reemplazado — llama setShowAvatarModal(true)
- (~línea 571): Modal JSX del bottom sheet de foto insertado antes del
  modal de logout (60 líneas). Incluye handle decorativo, dos opciones
  con ícono y label, y botón Cancelar
- (~línea 890): 11 estilos avatarModal* agregados al StyleSheet
- (línea 20): Alert removido del import. Pressable agregado.

### Estado de imports
- Alert: removido — no tenía otros usos en el archivo
- Pressable: agregado — necesario para el overlay de cierre del modal

### Inconsistencias encontradas
Ninguna. El archivo estaba bien estructurado y consistente con el
sistema de diseño.

### Pendientes
Ninguno relacionado a este bug.

---

## Sesión adicional — Fixes participantes y UX (Nico)

### Lo que se corrigió
- Avatar de participantes en MeetupDetailScreen (leía participant.avatarUrl en lugar de participant.profile.avatarUrl)
- Avatar en ParticipantListScreen con el mismo fix
- Footer sin parpadeo: React.memo en AppTabBar + animation: 'none' en MainNavigator
- Toast de asistencia duplicado: Promise.all en handleAttendanceClose
- Botón "Abandonar juntada" agregado en MeetupDetailScreen para participantes
- joinMeetup actualizado para permitir volver a unirse si left_at IS NOT NULL
- Historial: badge "Abandonada" + acceso restringido en detalle si el usuario abandonó

---

## Sesión adicional — cursor-09: Botón finalizar juntada

### Prompt

En el detalle de una juntada, refiriéndose a las acciones sobre una juntada, se puede solo cancelar la juntada. Tenemos que agregar un botón para finalizar la juntada.

Poner el botón con los mismos estilos que el botón de cancelar, pero por encima de este.

Este prompt va a `bloque-debugging`. Mirar lo que hay para respetar el formato.

### Respuesta

Se agregó la acción de finalizar juntada para organizadores en juntadas activas.

### Cambios aplicados

- `meetupService.finishMeetup(meetupId, userId)` valida que el usuario sea organizador, rechaza juntadas canceladas o ya finalizadas y actualiza `status` a `finished`.
- `useMeetups` expone `finishMeetup` y refresca la lista al finalizar correctamente.
- `MeetupDetailScreen` agrega estado de finalización, botón "Finalizar juntada" encima de "Cancelar juntada" con los mismos estilos, modal de confirmación y toast de éxito/error.

### Archivos modificados

- `mobile/src/features/meetups/services/meetupService.ts`
- `mobile/src/features/meetups/hooks/useMeetups.ts`
- `mobile/src/features/meetups/screens/MeetupDetailScreen.tsx`
- `ia/entrega-1/prompts/bloque-debugging/cursor-09-finalizar-juntada.md`
- `ia/entrega-1/indice_ia.md`

---

## Sesión adicional — cursor-10: Color warning para finalizar juntada

### Prompt

Hace que el botón de finalizar juntada sea del color warning de los definidos. Hacele sus estilos así como tiene `cancelBtn`.

### Respuesta

Se separaron los estilos de la acción "Finalizar juntada" para que use los tokens de advertencia del sistema de diseño.

### Cambios aplicados

- `MeetupDetailScreen` usa `styles.finishBtn` y `styles.finishBtnText` para el botón de finalizar.
- El botón usa `theme.colors.warningLight` como fondo, `theme.colors.warning` como borde, ícono y texto.
- El modal de confirmación usa `styles.modalWarningBtn` y `styles.modalWarningBtnText`, con `theme.colors.warning`.
- La acción de cancelar mantiene los estilos rojos destructivos (`cancelBtn` / `modalDestructiveBtn`).

### Archivos modificados

- `mobile/src/features/meetups/screens/MeetupDetailScreen.tsx`
- `ia/entrega-1/prompts/bloque-debugging/cursor-10-finalizar-warning.md`
- `ia/entrega-1/indice_ia.md`

---

## Sesión adicional — cursor-11: Congelar asistencia en juntadas finalizadas o canceladas

### Prompt

Necesito arreglar el hecho de que sobre una juntada finalizada o cancelada se pueda seguir modificando la asistencia. Esta debería quedar congelada una vez la juntada esté en estos estados.

### Respuesta

Se bloqueó la modificación de asistencia cuando la juntada ya no está activa.

### Cambios aplicados

- `participantService` agrega una verificación previa del estado de `meetups` antes de modificar asistencia propia o asistencia de otros como organizador.
- Si la juntada está `cancelled` o `finished`, el servicio devuelve un mensaje específico y no actualiza `attendance_status`.
- `ParticipantListScreen` carga el estado de la juntada y desactiva edición de asistencia si no está `active`.
- En modo congelado, la lista queda en solo lectura y muestra el texto "La asistencia quedó congelada porque la juntada ya no está activa".
- El footer de modificar asistencia/abandonar se oculta para participantes si la juntada ya no está activa.

### Archivos modificados

- `mobile/src/features/participants/services/participantService.ts`
- `mobile/src/features/participants/screens/ParticipantListScreen.tsx`
- `ia/entrega-1/prompts/bloque-debugging/cursor-11-congelar-asistencia.md`
- `ia/entrega-1/indice_ia.md`

---

## Sesión adicional — cursor-12: Auditoría de índice, statistics y documentación IA

### Prompt

Necesito que revises el `statistics.json` y `indice_ia.md` en búsqueda de
inconsistencias entre la carpeta `entrega-1` y todo su contenido y lo que dicen
estos archivos.

Luego se pidió documentar el prompt y la respuesta como se venía haciendo, y
aplicar las correcciones considerando `statistics.json` como global, eliminando
las referencias a UX fixes y documentando la skill faltante.

También se aclaró que no se debe crear `.cursor/` porque es propio del
desarrollador que utilizó Cursor, y que la documentación debe reflejar que se
usó Claude además de Cursor.

### Respuesta

Se corrigió la documentación IA de la entrega para que el índice, las
estadísticas y el registro de skills queden alineados con el contenido real del
directorio.

### Cambios aplicados

- `statistics.json` pasó a ser un inventario global de uso IA, con secciones
  para Cursor, Claude/Claude Code CLI y ChatGPT/Codex.
- Se eliminaron del índice las referencias al export faltante de UX fixes.
- Se corrigió el enlace roto del prompt B5 de Claude:
  `claude-04-B5-avatar-header.md` → `claude-04-B5-perfil.md`.
- Se creó el prompt faltante `prompts/exportacion-conversaciones.md`.
- Se documentó `photo-gallery-patterns.mdc` en `skills_instaladas.md` sin crear
  `.cursor/`.
- El índice ahora registra explícitamente el Bloque Debugging de Claude Code CLI.
- Se agregó el prompt `cursor-12-auditoria-indice-statistics.md`.

### Archivos modificados

- `ia/entrega-1/conversaciones/statistics.json`
- `ia/entrega-1/indice_ia.md`
- `ia/entrega-1/skills_instaladas.md`
- `ia/entrega-1/prompts/exportacion-conversaciones.md`
- `ia/entrega-1/prompts/bloque-debugging/cursor-12-auditoria-indice-statistics.md`
- `ia/entrega-1/conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`

---

## Sesión adicional — cursor-13: Scroll inferior en inicio de Impostor

### Prompt

Ahora necesito que arregles un problema con el scrollbar en el momento de
iniciar el juego Impostor. El scrollbar vertical no baja lo suficiente para
poder presionar el botón de jugar o empezar juego.

Esto va al bloque debugging porque estamos con un fix.

### Respuesta

Se corrigió el espacio inferior del `ScrollView` en `ImpostorStartScreen` para
que el botón final de inicio de partida no quede tapado por el tab bar fijo.

### Cambios aplicados

- `ImpostorStartScreen` importa `APP_TAB_BAR_OFFSET` desde `AppTabBar`.
- `styles.scrollContent.paddingBottom` ahora suma `APP_TAB_BAR_OFFSET` más
  `theme.spacing.xl`.
- El contenido puede scrollear lo suficiente para dejar visible y presionable
  el botón "Iniciar partida" por encima del footer.

### Archivos modificados

- `mobile/src/features/impostor/screens/ImpostorStartScreen.tsx`
- `ia/entrega-1/prompts/bloque-debugging/cursor-13-impostor-scroll-start.md`
- `ia/entrega-1/conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`
- `ia/entrega-1/indice_ia.md`

---

## Sesión adicional — cursor-14: Logo en bienvenida y nombre Ronda App

### Prompt

Debemos resolver el siguiente inconveniente. Ahora mismo sobre la pantalla de
bienvenida no aparece el logo correspondiente que esta en assets y el nombre de
la aplicacion debe ser Ronda App. El problema es que a mi no me aparece el logo
pero a mi compañero si, tambien hay que corregir el slug dentro del app.json
para que respete ese nombre.

Almacena este prompt dentro del bloque debugging con la informacion
correspondiente.

### Respuesta

Se centralizó la carga del logo oficial, se alineó el nombre visible de la app
con **Ronda App** y se corrigió el slug de Expo.

### Cambios aplicados

- Nuevo módulo `src/shared/assets/appAssets.ts` con `appLogoSource` como única
  fuente del `require()` de `logo-nobg.png`.
- `AppLogo` y `MeetupHomeScreen` reutilizan ese export compartido.
- `WelcomeScreen` deja de hardcodear "Juntadas" y lee `appConfig.app.name`.
- `appConfig.app.name` pasa a `Ronda App`.
- `app.json`: `slug` actualizado de `juntadas` a `ronda-app`.

### Diagnóstico del logo inconsistente entre devs

El icono genérico violeta con personas corresponde a la versión anterior de
`AppLogo` (Ionicons). Si el código ya está actualizado pero el PNG no se ve,
lo más probable es cache de Metro o un placeholder de OneDrive sin descargar.
Recomendación: `npx expo start -c` y verificar que exista
`mobile/assets/logo-nobg.png` localmente.

### Archivos modificados

- `mobile/src/shared/assets/appAssets.ts`
- `mobile/src/shared/components/AppLogo.tsx`
- `mobile/src/features/meetups/screens/MeetupHomeScreen.tsx`
- `mobile/src/features/auth/screens/WelcomeScreen.tsx`
- `mobile/src/config/appConfig.ts`
- `mobile/app.json`
- `ia/entrega-1/prompts/bloque-debugging/cursor-14-welcome-logo-app-name.md`
- `ia/entrega-1/conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`
- `ia/entrega-1/indice_ia.md`

---

## Sesión adicional — cursor-15: Jugadores manuales desaparecen al tocar Nueva ronda

### Prompt

Necesito que analices y corrijas un bug en el flujo del juego Impostor.

Desde Detalle de juntada se inicia el juego con participantes confirmados como
base. Al agregar jugadores manualmente y jugar una ronda, al tocar "Nueva ronda"
desaparecen los agregados manuales y solo quedan los confirmados originales.

Comportamiento esperado: los manuales persisten mientras dure la sesión del
juego; "Nueva ronda" reinicia solo roles/palabra/estado de ronda, no la lista;
al reentrar desde cero debe volver a cargarse la base desde confirmados.

Esto va al bloque debugging porque estamos con un fix.

### Respuesta

Se corrigió el conflicto entre dos `useFocusEffect` que competían al volver del
flujo de roles al setup.

### Diagnóstico

1. Un efecto restauraba jugadores desde la sesión Zustand (incluidos manuales).
2. Otro recargaba **siempre** desde Supabase los confirmados cuando había
   `meetupId`, pisando la lista restaurada al completar la petición async.

### Cambios aplicados

- Un solo `useFocusEffect` con lógica bifurcada:
  - Sesión activa → restaurar desde Zustand, sin fetch a Supabase.
  - Sin sesión + `meetupId` → cargar base inicial desde confirmados.
- `updateSessionPlayers` en `useImpostor` para sincronizar altas/bajas manuales
  en el setup entre rondas.
- Validación anti-duplicados por nombre (case-insensitive) al agregar jugador.
- `clearSession()` al tocar "Terminar" para permitir reentrada limpia.

### Archivos modificados

- `mobile/src/features/impostor/screens/ImpostorStartScreen.tsx`
- `mobile/src/features/impostor/screens/ImpostorRoleScreen.tsx`
- `mobile/src/features/impostor/hooks/useImpostor.ts`
- `ia/entrega-1/prompts/bloque-debugging/cursor-15-impostor-jugadores-nueva-ronda.md`
- `ia/entrega-1/conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`
- `ia/entrega-1/indice_ia.md`

---

## Sesión adicional — cursor-16: Botones cortados en fin de ronda de Impostor

### Prompt

En la pantalla de fin de ronda del Impostor, con muchos participantes el botón
"Terminar" queda cortado o fuera de pantalla. Los botones "Nueva ronda" y
"Terminar" deben verse completos y ser tocables siempre.

Esto va al bloque debugging porque estamos con un fix.

### Respuesta

Se reestructuró el layout de la fase final en `ImpostorRoleScreen` separando
contenido scrolleable de acciones fijas.

### Diagnóstico

Lista de jugadores y botones compartían un `ScrollView` sin `flex: 1` y con
`paddingBottom` insuficiente para el tab bar absoluto (`APP_TAB_BAR_OFFSET`).

### Cambios aplicados

- `ScrollView` con `flex: 1` para icono, títulos y lista de jugadores.
- Footer fijo `finalActions` con "Nueva ronda" y "Terminar".
- `paddingBottom: APP_TAB_BAR_OFFSET + theme.spacing.sm` en el footer para
  evitar solapamiento con el tab bar.

### Archivos modificados

- `mobile/src/features/impostor/screens/ImpostorRoleScreen.tsx`
- `ia/entrega-1/prompts/bloque-debugging/cursor-16-impostor-fin-ronda-scroll.md`
- `ia/entrega-1/conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`
- `ia/entrega-1/indice_ia.md`

---

## Sesión de cierre — Fixes finales E1

### Lo que se corrigió

- Botón "Finalizar juntada" ahora solo aparece cuando la juntada ya comenzó (fecha y hora cumplidas)
- Mejoras adicionales en el módulo Impostor
- Logo, nombre e ícono de la app configurados
- Splash screen con color violeta y logo
- Estados de carga (skeleton) agregados en Figma: Mis Juntadas, Recuerdos y Detalle

### Prompts relacionados

- [`cursor-09-fix-finalizar-juntada.md`](../../prompts/bloque-debugging/cursor-09-fix-finalizar-juntada.md) — visibilidad condicionada de "Finalizar juntada"
- [`cursor-14-welcome-logo-app-name.md`](../../prompts/bloque-debugging/cursor-14-welcome-logo-app-name.md) — logo y nombre Ronda App en bienvenida
- [`cursor-15-impostor-jugadores-nueva-ronda.md`](../../prompts/bloque-debugging/cursor-15-impostor-jugadores-nueva-ronda.md) — persistencia de jugadores manuales
- [`cursor-16-impostor-fin-ronda-scroll.md`](../../prompts/bloque-debugging/cursor-16-impostor-fin-ronda-scroll.md) — layout responsivo fin de ronda
- [`cursor-10-documentar-cierre-e1.md`](../../prompts/bloque-debugging/cursor-10-documentar-cierre-e1.md) — documentación de cierre E1

### Documentación generada

- `ia/entrega-1/resumen_uso_ia.md`
- `docs/PENDIENTES.md`
- `docs/BACKLOG_E2_E3.md`

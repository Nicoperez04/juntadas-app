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
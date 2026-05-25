@AGENTS.md
# CLAUDE.md — juntadas-app / mobile

Contexto permanente para Claude Code CLI. Leé este archivo antes de
cualquier tarea. No lo modifiques salvo decisión explícita del equipo.

---

## Proyecto

App móvil para organizar juntadas entre amigos. Ciclo completo:
antes (organizar), durante (juego Impostor), después (recuerdos/fotos).

**Entrega activa:** Entrega 1 — MVP Básico  
**Rama:** entrega-1  
**Materia:** Desarrollo de Aplicaciones Móviles — UTN La Plata

---

## Stack

- React Native 0.83.6 + Expo SDK 55 + TypeScript estricto (sin `any`)
- Navegación: React Navigation `native-stack` — nunca Expo Router
- Estado global: Zustand (juego Impostor) — TanStack Query instalado pero NO se usa en E1
- Estado de servidor: `useState` + `useEffect` directo por ahora
- Backend: Supabase (Auth + PostgreSQL + Storage)
- Formularios: React Hook Form + Zod
- Estilos: `StyleSheet.create` — nunca inline styles complejos
- Path alias: `@/` apunta a `src/`

---

## Arquitectura — reglas estrictas

### Estructura modular por features
src/features/
auth/         — login, registro, perfil, completar perfil
meetups/      — juntadas (CRUD, join, historial)
participants/ — asistencia, participantes
impostor/     — juego local con Zustand
memories/     — fotos (pendiente E1)
src/shared/
components/   — AppButton, AppInput, AppTabBar, Toast, etc.
constants/    — theme.ts (única fuente de verdad visual)
utils/        — haptics, etc.
src/lib/supabase/client.ts  — cliente único, no duplicar
src/navigation/ — AppNavigator, AuthNavigator, MainNavigator, routes.ts

### Reglas de capas
- Las **pantallas** no llaman a Supabase directamente — todo va por servicios
- Los **servicios** tienen sufijo `Service` y retornan `{ data, error }`
- Los **hooks** tienen prefijo `use` y encapsulan estado + llamadas al servicio
- Los **schemas** tienen sufijo `Schema` y usan Zod
- Las **pantallas** son arrow functions con props tipadas con interfaces

### Navegación
- Siempre usar constantes de `Routes` desde `@/navigation/routes`
- Nunca strings hardcodeados para rutas
- No usar Expo Router ni la carpeta `app/` como root

---

## Sistema de diseño — theme.ts

Archivo: `src/shared/constants/theme.ts` — única fuente de verdad.
Colores principales:
primary:     #7C3AED  (violeta)
secondary:   #EC4899  (rosa)
background:  #F8F7FF
surface:     #FFFFFF
textPrimary: #1A1A1A
textSecondary: #6B7280
Componentes:
inputHeight:  52px
buttonHeight: 52px
borderWidth:  1
Spacing: xs(4) sm(8) md(16) lg(24) xl(32) xxl(48)
Radius:  sm(8) md(12) lg(16) xl(24) full(9999)

Nunca hardcodear colores, spacing ni radios. Siempre `theme.*`.

---

## Footer / Tab Bar

El tab bar es un componente custom (`AppTabBar`) renderizado dentro
de cada pantalla — NO es un BottomTabNavigator de React Navigation.

Pantallas CON tab bar y su tab activo:
- MeetupHomeScreen     → activeTab="home"
- CreateMeetupScreen   → activeTab="create"
- JoinMeetupScreen     → activeTab="join"
- GamesScreen          → activeTab="games" (via ImpostorTabBar)
- ImpostorStartScreen  → activeTab="games" (via ImpostorTabBar)
- ProfileScreen        → activeTab="profile"
- MeetupDetailScreen   → activeTab="home"
- MeetupHistoryScreen  → activeTab="home"

Pantallas SIN tab bar (decisión de producto):
- ImpostorRoleScreen   — pantalla inmersiva individual
- AuthNavigator screens — flujo público sin navegación principal

---

## Juego Impostor — decisiones de estado

- Estado vive en Zustand (`useImpostorStore`) en memoria
- NO se persiste en Supabase ni AsyncStorage — es dinámica presencial
- Al cerrar la app el estado se reinicia automáticamente
- `clearSession` existe pero NO debe llamarse en cleanup de useFocusEffect
  (genera loops de re-render)
- La sesión persiste durante una sesión de uso de la app — comportamiento
  esperado para rondas consecutivas

---

## Supabase — reglas

- Cliente único: `@/lib/supabase/client` — nunca crear otro
- No modificar: `src/lib/supabase/client.ts`, `src/config/env.ts`
- RLS habilitado — toda query necesita usuario autenticado
- Retorno uniforme de servicios: `{ data: T | null, error: string | null }`
- Errores de Supabase se mapean a español en los servicios (ver `mapAuthError`)

---

## Restricciones permanentes

- NO modificar: `app.json`, `tsconfig.json`, `package.json`
- NO instalar dependencias sin decisión explícita del equipo
- NO hacer commits — el desarrollador los hace manualmente
- NO modificar `AppNavigator.tsx` sin decisión explícita
- NO usar `any` en TypeScript
- NO correr migraciones de Supabase desde el agente
- Todos los textos visibles en español
- Mensajes de error de validación en español

---

## Al finalizar cualquier tarea — reportar siempre

1. Lista completa de archivos creados o modificados con path exacto
2. Decisiones tomadas que no estaban especificadas en el prompt
3. Inconsistencias encontradas en el código existente
4. Cualquier punto que requiera validación manual
5. Si se tocó algo fuera del alcance indicado, explicar por qué

---

## Skills disponibles

- `/diagnose` — para bugs: Reproduce → Hipótesis → Fix → Verificar
- `/grill-me` — para stress-testear decisiones de diseño antes de implementar
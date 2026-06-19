# Bloque 8 — Correctivos aplicados

Prompts correctivos y desviaciones del alcance original de
`01_cierre_final.md` que se aplicaron durante el cierre de E2.

---

## Correctivo 1 — TeamRandomizer: fondo gris al mezclar (intento 1)

Ver también: [`02_fix_fondo_mezclar_teamrandomizer.md`](02_fix_fondo_mezclar_teamrandomizer.md)

### Problema
Al presionar "Mezclar de nuevo", un recuadro gris aparece en la zona
de las cards durante el fade out.

### Hipótesis
El `backgroundColor` de `stepPanel`, `stepsRow` y `stepViewport` queda
expuesto cuando las cards llegan a `opacity: 0`.

### Solución intentada
En `TeamRandomizerScreen.tsx`, StyleSheet:

1. `stepPanel` → `backgroundColor: 'transparent'`
2. `stepsRow` → `backgroundColor: 'transparent'`
3. `stepViewport` → `backgroundColor: 'transparent'`

### Resultado
**Insuficiente** — el recuadro persistió. Ver Correctivo 2.

---

## Correctivo 2 — TeamRandomizer: fondo gris al mezclar (fix definitivo)

### Análisis
- Transparentar paneles no cambia lo visible: tenían el mismo color que
  `styles.root` (`#F8F7FF`).
- Durante el fade, lo expuesto es el **`ScrollView` del paso 2** sin
  `backgroundColor` (blanco/gris implícito en Android).
- `elevation: 1` en `teamCard` + `useNativeDriver` en opacity genera
  artefactos grises en Android.

### Solución
En `TeamRandomizerScreen.tsx`:

1. Nuevo estilo `mainContent` → `flex: 1` + `theme.colors.background`
   en `KeyboardAvoidingView`
2. Nuevo estilo `resultScroll` → `flex: 1` + `theme.colors.background`
   en el ScrollView del paso resultado
3. `teamsListArea` → `theme.colors.background` (capa estática bajo el fade)
4. `stepViewport`, `stepsRow`, `stepPanel` → `theme.colors.background`
5. Estado `isRemixing` durante fade out/in
6. Estilo `teamCardRemixing` → `elevation: 0`, `shadowOpacity: 0`,
   `shadowRadius: 0` mientras `isRemixing === true`

No tocar la lógica de fade (150 ms + 150 ms) ni el slide entre pasos.

Archivos esperados:
- `src/features/games/screens/TeamRandomizerScreen.tsx`

---

## Correctivo 3 — Notificaciones: guard isExpoGo en App.tsx

### Problema
Aunque `notificationService.registerPushToken` tenía guard para Expo Go,
`App.tsx` importaba/registraba push al login sin el mismo guard —
errores en consola al desarrollar con Expo Go.

### Solución
En `App.tsx`:

- Import de `isExpoGoEnvironment` desde `notificationService`
- Import **dinámico** de `expo-notifications` solo si `!isExpoGoEnvironment()`
- En `onAuthStateChange`: llamar `registerPushToken` solo si hay sesión
  **y** `!isExpoGoEnvironment()`

Archivos esperados:
- `App.tsx`
- `src/features/notifications/services/notificationService.ts`
  (export `isExpoGoEnvironment` si no existía)

---

## Correctivo 4 — Impostor: flujo simplificado (desviación de Tarea 4)

El prompt original pedía modal de confirmación al terminar partida.
Se implementó flujo más directo para juego presencial:

### Cambios
- **Navegación:** Hub de juegos → `ImpostorStart` directo (sin pantalla
  intermedia de instrucciones obligatoria)
- **Instrucciones:** modal opcional "Cómo se juega" desde ícono help
  en header de `ImpostorStartScreen` (`HOW_TO_STEPS`)
- **Fin de partida:** en `ImpostorRoleScreen`, botones inline:
  - **"Nueva ronda"** → `resetRound()` (mantiene jugadores y categoría,
    nueva palabra, vuelve a fase de revelación)
  - **"Terminar"** → `clearSession()` + `navigate(ImpostorStart)` (vuelve
    al Setup, no al hub de juegos)
- **`useImpostor`:** método `resetRound()` expuesto

Archivos esperados:
- `src/features/impostor/screens/ImpostorStartScreen.tsx`
- `src/features/impostor/screens/ImpostorRoleScreen.tsx`
- `src/features/impostor/hooks/useImpostor.ts`

---

## Correctivo 5 — Home: carga simplificada (desviación de Tarea 5)

El prompt original pedía skeleton completo con shimmer animado.
Se implementó alternativa más simple:

### Solución
En `MeetupHomeScreen.tsx`:

- Flag `isPageLoading` true mientras **cualquier** query relevante
  esté en `isLoading`
- Mientras carga: `ActivityIndicator` + texto `"Cargando tus juntadas..."`
  centrados (sin skeleton ni shimmer)
- Contenido real solo cuando todas las queries resolvieron

Archivos esperados:
- `src/features/meetups/screens/MeetupHomeScreen.tsx`

---

## Reglas generales
- Comentarios en español
- Sin TypeScript `any`
- No hacer commits
- Reportar archivos modificados al finalizar

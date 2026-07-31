# Bloque 3 — Historial mejorado

> Prompt completo de implementación del Bloque 3 (Entrega 2).
> Ver conversación exportada en `conversaciones/bloque-3/cursor-bloque-3-completo.md`.

## Contexto general
Continuamos con la Entrega 2 (E2) del proyecto Juntadas.
Los Bloques 0, 1 y 2 están completos y mergeados a entrega-2.
La rama actual de trabajo es `feature/bloque-3-historial-mejorado`.

Cambios relevantes de bloques anteriores:
- TanStack Query v5 integrado
- useCurrentUser disponible en src/shared/hooks/
- MeetupDetailScreen partida en subcomponentes y useMeetupDetail
- Tipado de navegación centralizado en src/navigation/types.ts
- El enum meetup_status tiene: active, finished, cancelled
- El enum participant_role tiene: organizer, participant
- reviews_enabled en meetups, tabla meetup_reviews implementada
- MeetupOrganizerActions tiene: cancelar, finalizar, transferir organizador

## Stack del proyecto
- React Native + Expo SDK 55 + TypeScript
- Supabase (Auth + PostgreSQL + Storage)
- React Navigation (stack navigator)
- TanStack Query v5
- Zustand v5 (solo en impostor)
- React Hook Form + Zod
- AsyncStorage (ya instalado)
- @gorhom/bottom-sheet (a instalar en Tarea 1)
- react-native-reanimated (a instalar en Tarea 1)
- react-native-gesture-handler (a instalar en Tarea 1)
- Design tokens en src/shared/constants/theme.ts (fuente única de verdad)
- Todos los comentarios en español
- Sin TypeScript any

## Modelo de negocio definido
- El historial muestra TODAS las juntadas del usuario (activas, finalizadas, canceladas)
- El home sigue mostrando solo las activas
- Participante puede ocultar una juntada de su historial (solo para él)
- Organizador puede ocultar para él solo O eliminar para todos (hard delete)
- Solo el organizador puede reactivar una juntada finalizada
- Si la juntada tiene reseñas al reactivar: advertencia antes de confirmar
- Al reactivar: status = 'active', reseñas conservadas

## Tu tarea
Realizá las siguientes tareas en orden.
Completá y reportá cada una antes de pasar a la siguiente.

---

### Tarea 1 — Instalación de dependencias y setup

Alcance:
1. Instalar dependencias:
   npx expo install @gorhom/bottom-sheet react-native-reanimated react-native-gesture-handler

2. En babel.config.js agregar el plugin de Reanimated
   como ÚLTIMO plugin de la lista:
   plugins: ['react-native-reanimated/plugin']

3. En App.tsx:
   - Importar GestureHandlerRootView de react-native-gesture-handler
   - Importar BottomSheetModalProvider de @gorhom/bottom-sheet
   - Envolver toda la app con GestureHandlerRootView (flex: 1)
   - Agregar BottomSheetModalProvider dentro de GestureHandlerRootView,
     fuera del QueryClientProvider pero dentro del GestureHandlerRootView
     El orden correcto de providers de adentro hacia afuera:
     GestureHandlerRootView > BottomSheetModalProvider > QueryClientProvider > resto

4. Después de instalar: indicar que se debe reiniciar Metro con caché limpia:
   npx expo start -c

No hacer:
- No tocar ninguna pantalla todavía
- No hacer commits

Archivos esperados:
- babel.config.js (modificado)
- App.tsx (modificado)
- package.json (actualizado por expo install)

---

### Tarea 2 — Migración de base de datos

Crear supabase/migrations/008_meetup_hidden.sql con:

1. Tabla meetup_hidden:
   - id UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - meetup_id UUID NOT NULL REFERENCES meetups(id) ON DELETE CASCADE
   - user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
   - created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   - UNIQUE(meetup_id, user_id)

2. RLS en meetup_hidden:
   - SELECT: solo el propio usuario (user_id = auth.uid())
   - INSERT: solo el propio usuario
   - DELETE: solo el propio usuario

3. Comentarios en español

IMPORTANTE: solo generás el archivo SQL, no lo ejecutés.
La migración la ejecuta el equipo manualmente en el SQL Editor de Supabase.

Archivos esperados:
- supabase/migrations/008_meetup_hidden.sql

---

### Tarea 3 — Servicio y hook del historial

Contexto:
- meetupService.ts maneja todas las operaciones sobre meetups
- Hoy getMeetups o similar solo retorna juntadas activas para el home
- Necesitamos un método separado para el historial completo

Alcance:
1. En meetupService.ts agregar:

   getAllUserMeetups(userId):
   - Retorna TODAS las juntadas del usuario (active + finished + cancelled)
   - Excluye las juntadas que están en meetup_hidden para ese usuario
   - Join con meetup_participants para obtener el rol del usuario
   - Ordenadas por date DESC
   - Retorna { data: MeetupWithRole[], error }

   hideMeetup(meetupId, userId):
   - Inserta en meetup_hidden
   - Retorna { data: null, error }

   deleteMeetupForAll(meetupId):
   - Hard delete de la juntada en meetups (CASCADE elimina participantes,
     memories, reviews, hidden)
   - Solo debe llamarse si el usuario es organizador (validar antes de llamar)
   - Retorna { data: null, error }

   reactivateMeetup(meetupId):
   - Actualiza status = 'active' en meetups
   - Retorna { data: null, error }

2. En useMeetups.ts agregar con TanStack Query v5:
   - useAllUserMeetups(userId): useQuery con key ['allMeetups', userId]
   - useHideMeetup: useMutation, invalida ['allMeetups', userId]
   - useDeleteMeetupForAll: useMutation, invalida ['allMeetups', userId]
     y también ['meetups', userId]
   - useReactivateMeetup: useMutation, invalida ['allMeetups', userId]
     y ['meetups', userId]

No hacer:
- No modificar getMeetups existente (el home lo sigue usando)
- No tocar otros servicios

Archivos esperados:
- src/features/meetups/services/meetupService.ts (4 métodos nuevos)
- src/features/meetups/hooks/useMeetups.ts (4 hooks nuevos)

---

### Tarea 4 — Rediseño de MeetupHistoryScreen

Contexto:
- MeetupHistoryScreen hoy muestra solo finished y cancelled
- Hay que reemplazarla completamente con el nuevo diseño
- Los filtros se abren desde un bottom sheet con @gorhom/bottom-sheet
- La búsqueda es en tiempo real sobre los datos cargados

Alcance:

**Estructura de la pantalla:**
- Barra de búsqueda fija en la parte superior
- Fila de chips de filtros activos (si hay alguno aplicado)
  con X para quitar cada uno individualmente
- Botón "Filtros" con ícono que abre el bottom sheet
- Lista de juntadas filtradas

**Bottom sheet de filtros:**
Usar BottomSheetModal de @gorhom/bottom-sheet
Snap points: ['50%', '75%']
Contenido del sheet:
- Título "Filtros"
- Sección "Estado": chips seleccionables
  Todas / Activas / Finalizadas / Canceladas (selección única)
- Sección "Rol": chips seleccionables
  Todas / Organizador / Participante (selección única)
- Sección "Fecha": dos date pickers (Desde / Hasta)
  usando @react-native-community/datetimepicker que ya está instalado
- Botón "Aplicar filtros" y botón "Limpiar filtros"

**Diseño de chips estilo moderno:**
- Chip no seleccionado: fondo neutro, borde sutil, texto gris
- Chip seleccionado: fondo del color primario del theme, texto blanco
- Transición suave al seleccionar (usando Animated de React Native)
- Chips de filtros activos en la pantalla principal muestran el valor
  y una X para quitarlo

**Cards del historial:**
- Mostrar badge de estado con color según status:
  active → color primario, finished → gris, cancelled → rojo suave
- Mostrar rol del usuario en la juntada (Organizador / Participante)
- Si reviews_enabled = true → ícono de estrella (ya existe este badge)
- Swipe hacia la izquierda para revelar acciones:
  "Ocultar" (para participante) o "Ocultar" / "Eliminar para todos"
  (para organizador)
  Usar Animated de React Native para el swipe, sin librerías nuevas

**Lógica de filtrado:**
- Todo client-side sobre los datos de useAllUserMeetups
- Búsqueda: filtra por título case-insensitive
- Estado: filtra por meetup.status
- Rol: filtra por el rol del usuario en esa juntada
- Fecha: filtra por meetup.date dentro del rango desde/hasta
- Los filtros se combinan (AND)

No hacer:
- No instalar librerías adicionales para el swipe
- No paginar (client-side es suficiente para desarrollo)

Archivos esperados:
- src/features/meetups/screens/MeetupHistoryScreen.tsx (rediseñado)

---

### Tarea 5 — Acciones de ocultar y eliminar

Contexto:
- El swipe del historial revela las acciones
- Ocultar: disponible para todos (participante y organizador)
- Eliminar para todos: solo disponible para el organizador
- Ambas requieren confirmación antes de ejecutarse

Alcance:
1. Al presionar "Ocultar":
   - Modal de confirmación: "¿Querés ocultar esta juntada de tu historial?
     Solo desaparecerá para vos."
   - Al confirmar: llamar a useHideMeetup
   - En éxito: toast ✓ + haptic, juntada desaparece de la lista

2. Al presionar "Eliminar para todos" (solo organizador):
   - Modal de confirmación con texto fuerte:
     "¿Eliminar esta juntada para todos los participantes?
      Esta acción no se puede deshacer."
   - Al confirmar: llamar a useDeleteMeetupForAll
   - En éxito: toast ✓ + haptic, juntada desaparece

No hacer:
- No modificar otros flujos de eliminación

Archivos esperados:
- src/features/meetups/screens/MeetupHistoryScreen.tsx (acciones integradas)

---

### Tarea 6 — Reactivar juntada finalizada

Contexto:
- MeetupOrganizerActions tiene las acciones del organizador
- La reactivación solo aplica a juntadas con status = 'finished'
- Si tiene reseñas (reviews_enabled = true y hay al menos una reseña)
  mostrar advertencia adicional

Alcance:
En MeetupOrganizerActions.tsx agregar acción "Reactivar juntada":
- Solo visible si status === 'finished' && isOrganizer
- Modal de confirmación estándar:
  "¿Reactivar esta juntada? Volverá a aparecer como activa."
- Si la juntada tiene reviews_enabled = true: agregar al modal
  una advertencia adicional:
  "Esta juntada tiene reseñas. Al reactivarla se conservan,
   pero no se podrán agregar nuevas hasta que la finalices de nuevo."
- Al confirmar: llamar a useReactivateMeetup
- En éxito: toast ✓ + haptic

No hacer:
- No modificar otras acciones existentes
- No tocar otros archivos

Archivos esperados:
- src/features/meetups/components/MeetupOrganizerActions.tsx (modificado)

---

### Tarea 7 — Documentar el prompt de este bloque

Crear ia/entrega-2/prompts/bloque-3/01_historial_mejorado.md
con el contenido completo de este prompt.

Actualizar ia/entrega-2/indice_ia.md agregando:
20 - Instalación @gorhom/bottom-sheet + setup Reanimated y GestureHandler
21 - Migración meetup_hidden para ocultar juntadas individuales
22 - getAllUserMeetups, hideMeetup, deleteMeetupForAll, reactivateMeetup
23 - Rediseño MeetupHistoryScreen: búsqueda, filtros, chips, swipe actions
24 - Acciones ocultar y eliminar para todos desde historial
25 - Reactivar juntada finalizada desde MeetupOrganizerActions

Actualizar ia/entrega-2/skills_instaladas.md agregando:
- @gorhom/bottom-sheet — bottom sheet con animación fluida para filtros
  del historial. Instalada en Bloque 3.
- react-native-reanimated — peer dep de bottom-sheet, animaciones nativas
- react-native-gesture-handler — peer dep de bottom-sheet, gestos nativos

No hacer:
- No tocar archivos de código
- No hacer commits

Archivos esperados:
- ia/entrega-2/prompts/bloque-3/01_historial_mejorado.md
- ia/entrega-2/indice_ia.md (actualizado)
- ia/entrega-2/skills_instaladas.md (actualizado)

---

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- Seguir tokens de src/shared/constants/theme.ts para todo elemento visual
- No hacer commits
- Reportar archivos modificados y decisiones al finalizar cada tarea
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar todo el bloque
Generar resumen con:
1. Archivos creados
2. Archivos modificados
3. Decisiones tomadas
4. Cosas a revisar manualmente o probar en dispositivo

## Nota post-implementación (correctivo Babel)

Al crear `babel.config.js` con `presets: ['babel-preset-expo']`, el bundling
falló con `Cannot find module 'babel-preset-expo'` porque el preset no estaba
declarado en `package.json`. El proyecto funcionaba antes sin `babel.config.js`
porque Expo aplica su configuración por defecto internamente.

**Solución aplicada:**
```bash
npx expo install babel-preset-expo
```

Tras instalar, reiniciar Metro con caché limpia:
```bash
npx expo start -c
```

## Nota post-implementación (correctivo NativeWorklets / Reanimated 4)

Error en dispositivo:
`TurboModule method "installTurboModule" called with 1 arguments (expected argument count: 0)`
con stack en `NativeWorklets`.

**Causa:** Reanimated 4 depende de `react-native-worklets`. Expo Go SDK 55 trae el
módulo nativo en versión **0.7.4**, pero sin declararlo en `package.json` npm
instalaba **0.8.3** (mismatch JS vs nativo). Además, `babel.config.js` declaraba
manualmente `react-native-reanimated/plugin` cuando con Reanimated 4 + worklets
`babel-preset-expo` debe usar `react-native-worklets/plugin` automáticamente.

**Solución aplicada:**
```bash
npx expo install react-native-worklets
```

- `babel.config.js` simplificado: solo `presets: ['babel-preset-expo']`
- `import 'react-native-gesture-handler'` como primer import en `index.ts`
- Reiniciar Metro: `npx expo start -c`

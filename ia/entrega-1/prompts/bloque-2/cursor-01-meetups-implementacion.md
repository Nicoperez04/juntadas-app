# Implementación — Bloque 2: Gestión de Juntadas

## Contexto del proyecto

App móvil llamada Juntadas, React Native + Expo SDK 55 + TypeScript. Backend Supabase. Navegación con React Navigation native-stack. Rama activa: `feature/bloque-2-meetups`.

La arquitectura es modular por features. Todo el código de este bloque vive en `mobile/src/features/meetups/`. El sistema de diseño está centralizado en `mobile/src/shared/constants/theme.ts` y debe usarse como única fuente de verdad — ningún valor de color, espaciado, radio o tipografía puede estar hardcodeado.

Los componentes base `AppButton` y `AppInput` ya existen en `mobile/src/shared/components/` y deben reutilizarse en todas las pantallas de este bloque.

El cliente de Supabase se importa desde `@/lib/supabase/client`. El path alias `@/` apunta a `mobile/src/`.

## Diseño

Tenés acceso al archivo de Figma del proyecto via MCP. Consultá el diseño antes de implementar cada pantalla. El Figma es una referencia visual, pero el objetivo es superarlo en calidad y consistencia aplicando las siguientes mejoras profesionales:

- Usar las skills instaladas `sleek-design-mobile-apps`, `frontend-design` y `vercel-react-native-skills` para elevar la calidad visual
- Agregar microinteracciones sutiles: estados `pressed` en botones y cards, feedback visual al tocar elementos
- Las cards de juntadas deben tener sombra sutil usando `theme.shadows`
- Los badges de rol (Organizador/Invitado) deben tener colores semánticos consistentes con el theme
- El empty state del home debe ser visualmente atractivo, no solo texto
- Los estados de carga deben usar skeletons o spinners consistentes, nunca pantallas en blanco
- Las transiciones entre estados (loading → data → error) deben ser fluidas
- Todos los formularios deben tener feedback visual inmediato en cada campo
- El código de juntada debe mostrarse con tipografía monospace y destacado visualmente

## Lo que necesito que implementes

### 1. Tipos (`mobile/src/features/meetups/types.ts`)

```typescript
// Estado posible de una juntada
type MeetupStatus = 'active' | 'cancelled' | 'finished'

// Rol del usuario en una juntada
type ParticipantRole = 'organizer' | 'participant'

// Estado de asistencia
type AttendanceStatus = 'pending' | 'confirmed' | 'declined'

// Entidad principal de juntada
interface Meetup {
  id, title, description, date, time, location,
  estimatedCost, status, joinCode, createdBy, createdAt, updatedAt, cancelledAt
}

// Juntada con datos del participante actual incluidos
interface MeetupWithRole extends Meetup {
  userRole: ParticipantRole
  attendanceStatus: AttendanceStatus
  participantCount: number
  confirmedCount: number
}

// Datos del formulario de creación
interface CreateMeetupFormData {
  title, description, date, time, location, estimatedCost
}

// Datos del formulario de unirse
interface JoinMeetupFormData {
  joinCode: string
}

// Participante de una juntada
interface MeetupParticipant {
  id, meetupId, userId, role, attendanceStatus, joinedAt, leftAt
  profile: { fullName: string, username: string, avatarUrl: string | null }
}
```

### 2. Schemas (`mobile/src/features/meetups/schemas/meetupSchemas.ts`)

- `createMeetupSchema` — title requerido mínimo 3 caracteres, description opcional, date requerida (fecha válida no pasada), time requerido formato HH:MM, location requerido mínimo 3 caracteres, estimatedCost opcional número positivo. Todos los mensajes en español.
- `joinMeetupSchema` — joinCode exactamente 6 caracteres alfanuméricos en mayúsculas. Mensaje de error en español.

### 3. Servicio (`mobile/src/features/meetups/services/meetupService.ts`)

Implementá las siguientes funciones con manejo explícito de errores, retornando siempre `{ data, error }`:

- `createMeetup(userId, data)` — crea la juntada en la tabla `meetups` con un `join_code` generado automáticamente (6 caracteres alfanuméricos en mayúsculas, verificar que sea único), luego inserta al creador en `meetup_participants` con `role: 'organizer'` y `attendance_status: 'confirmed'`. Ambas operaciones deben ser atómicas — si falla la segunda, revertir la primera.
- `getUserMeetups(userId)` — obtiene todas las juntadas activas donde el usuario es organizador o participante. Hace join con `meetup_participants` para obtener el rol y estado de asistencia del usuario, y cuenta participantes. Ordena por fecha ascendente.
- `getMeetupByCode(joinCode)` — busca una juntada por su `join_code`. Retorna null si no existe o está cancelada.
- `getMeetupById(meetupId)` — obtiene el detalle completo de una juntada con el conteo de participantes.
- `joinMeetup(userId, joinCode)` — verifica que la juntada exista y esté activa, verifica que el usuario no esté ya participando, inserta en `meetup_participants` con `role: 'participant'` y `attendance_status: 'pending'`.
- `generateJoinCode()` — función interna que genera un código de 6 caracteres alfanuméricos en mayúsculas y verifica unicidad contra la base de datos.
- `getMeetupParticipants(meetupId)` — obtiene todos los participantes de una juntada con sus datos de perfil, ordenados por rol (organizador primero) y luego por nombre.

### 4. Hook (`mobile/src/features/meetups/hooks/useMeetups.ts`)

Implementá un hook que exponga:

- `meetups: MeetupWithRole[]` — lista de juntadas del usuario
- `isLoading: boolean`
- `error: string | null`
- `createMeetup(data)` — llama al servicio y recarga la lista
- `joinMeetup(joinCode)` — llama al servicio, retorna la juntada si tuvo éxito
- `getMeetupById(id)` — obtiene detalle de una juntada
- `getMeetupParticipants(id)` — obtiene participantes
- `refresh()` — recarga la lista de juntadas

Usá `useCallback` en todas las funciones. El estado de loading y error se maneja internamente.

### 5. Pantallas (`mobile/src/features/meetups/screens/`)

#### `MeetupHomeScreen.tsx`

Pantalla principal autenticada. Estructura:

- Header con título "Mis juntadas", ícono de notificación y avatar del usuario (iniciales sobre fondo violeta)
- Dos botones de acción rápida: "Crear juntada" y "Unirse a juntada" — cards con ícono y label, fondo primaryLight
- Sección "Próximas juntadas" con contador de juntadas activas
- Lista de cards de juntadas, cada una con: título, badge de rol (Organizador en amarillo/naranja, Invitado en violeta claro), fecha y hora con ícono de calendario, ubicación con ícono de pin, avatares apilados de los primeros 3 participantes con "+N" si hay más, conteo total y estado de confirmaciones
- Si no hay juntadas: empty state con ícono, título "No tenés juntadas aún" y botón para crear
- Link "Ver historial" al pie
- Tab bar inferior con 5 tabs: Inicio, Crear, Unirse, Juegos, Perfil — el tab activo en violeta

#### `CreateMeetupScreen.tsx`

Formulario de creación. Estructura:

- Header con flecha de volver y título "Nueva juntada"
- Formulario con React Hook Form + `createMeetupSchema`:
  - Input de título
  - Input de descripción (multiline, opcional)
  - Selector de fecha — usar `DateTimePickerAndroid` / `DateTimePicker` de `@react-native-community/datetimepicker` si está disponible, sino un input de texto con formato DD/MM/YYYY
  - Selector de hora similar
  - Input de ubicación
  - Input de costo estimado (numérico, opcional) con símbolo `$` adelante
- Botón "Crear juntada" al pie
- Al crear exitosamente, navegar al detalle de la juntada creada

#### `JoinMeetupScreen.tsx`

Pantalla para unirse. Estructura:

- Header con flecha de volver y título "Unirse a juntada"
- Ilustración o ícono decorativo
- Subtítulo explicativo
- Input de código con tipografía monospace, mayúsculas automáticas, máximo 6 caracteres
- Botón "Unirse"
- Estado de error si el código no existe o la juntada está cancelada — mensaje claro y específico
- Al unirse exitosamente, navegar al detalle de la juntada

#### `MeetupDetailScreen.tsx`

Detalle completo. Estructura:

- Header con flecha de volver, título "Detalle" y badge de rol del usuario actual
- Card principal con: nombre de la juntada, fecha con ícono, ubicación con ícono, conteo de participantes con confirmados y pendientes
- Dos botones de acción: "Jugar" (violeta) y "Recuerdos" (rosa) — cards con ícono
- Sección "Participantes" con lista: avatar con iniciales de color, nombre completo, badge de estado (Confirmado en verde, Pendiente en amarillo)
- Sección "Compartir juntada" con el código destacado visualmente (tipografía monospace, fondo primaryLight) y botones de copiar y compartir
- Al tocar copiar, copiar el código al clipboard con feedback visual (toast o cambio de ícono)

### 6. Navegación

Reemplazá los placeholders en `MainNavigator.tsx` por los imports reales de:

- `MeetupHomeScreen`
- `CreateMeetupScreen`
- `JoinMeetupScreen`
- `MeetupDetailScreen`

Configurá `MeetupHomeScreen` como `initialRouteName` del `MainNavigator`.

El tab bar del home es visual por ahora — los tabs Crear y Unirse deben navegar a sus pantallas correspondientes. Los tabs Juegos y Perfil quedan como placeholder hasta el bloque correspondiente.

## Generación del `join_code`

El código debe generarse así:

- caracteres válidos: `ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`
- longitud: 6
- verificar unicidad en la tabla `meetups` antes de usar
- máximo 5 intentos, si falla lanzar error

## Manejo de errores del servicio

Traducir al español los errores más comunes:

- Juntada no encontrada o código inválido
- El usuario ya es participante de esta juntada
- La juntada está cancelada o finalizada
- Error al generar código único (después de 5 intentos)

## Restricciones

- No instalar dependencias nuevas sin informarlo primero
- Si `@react-native-community/datetimepicker` no está disponible, usar input de texto para fecha y hora
- No modificar `app.json`, `tsconfig.json`, `package.json` sin avisar
- No modificar `AppNavigator.tsx`, `client.ts`, `env.ts`
- No hacer commits
- Usar siempre `StyleSheet.create`, nunca inline styles complejos
- Usar siempre constantes de `Routes` para navegación
- Comentar todo el código en español siguiendo las reglas del proyecto
- Consultar Figma via MCP antes de implementar cada pantalla y aplicar mejoras de diseño profesional
- Si encontrás una skill en `skills.sh` que mejoraría la implementación, informalo antes de instalarla

## Al finalizar reportá

- Lista completa de archivos creados o modificados con path exacto
- Decisiones tomadas que no estaban especificadas
- Si necesitó o recomendaría instalar alguna dependencia o skill adicional
- Puntos pendientes de validación o mejoras detectadas
- Estado final de `MainNavigator` — listá cada pantalla con su estado (import real o placeholder)

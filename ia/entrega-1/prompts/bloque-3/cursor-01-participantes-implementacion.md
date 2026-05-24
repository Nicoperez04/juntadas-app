# Implementación — Bloque 3: Participantes y acciones sobre juntadas

## Contexto del proyecto

App móvil Juntadas, React Native + Expo SDK 55 + TypeScript. Backend Supabase. Rama activa: `feature/bloque-3-participantes`.

La arquitectura es modular por features. El código de participantes vive en `mobile/src/features/participants/`. Las acciones sobre juntadas (editar, cancelar, historial) viven en `mobile/src/features/meetups/`.

El sistema de diseño está en `mobile/src/shared/constants/theme.ts` — ningún valor puede estar hardcodeado. Los componentes base `AppButton` y `AppInput` están en `mobile/src/shared/components/`. El cliente Supabase se importa desde `@/lib/supabase/client`.

Consultá el diseño en Figma via MCP antes de implementar cada pantalla. El Figma es referencia visual — mejorá la consistencia y calidad donde corresponda usando las skills instaladas.

## Lo que necesito que implementes

### 1. Tipos (`mobile/src/features/participants/types.ts`)

Ya existe un archivo base. Agregá o completá:

- `UpdateAttendanceData` — `{ attendanceStatus: AttendanceStatus }`
- `LeaveParticipantData` — `{ meetupId: string, userId: string }`

### 2. Servicio (`mobile/src/features/participants/services/participantService.ts`)

Implementá con manejo explícito de errores, retornando siempre `{ data, error }`:

- `updateAttendance(meetupId, userId, status)` — actualiza `attendance_status` en `meetup_participants`. Solo el propio usuario puede cambiar su estado.
- `leaveMeetup(meetupId, userId)` — setea `left_at = NOW()` en el registro del participante. No borra el registro — soft delete. Verifica que el usuario no sea el organizador antes de ejecutar (un organizador no puede abandonar su propia juntada).
- `getParticipants(meetupId)` — obtiene todos los participantes activos (`left_at IS NULL`) con sus datos de perfil, ordenados por rol (organizador primero) y luego por nombre.

### 3. Hook (`mobile/src/features/participants/hooks/useParticipants.ts`)

Implementá un hook que exponga:

- `participants: MeetupParticipant[]`
- `isLoading: boolean`
- `error: string | null`
- `updateAttendance(status: AttendanceStatus)` — actualiza el estado del usuario actual
- `leaveMeetup()` — abandona la juntada
- `refresh()` — recarga la lista

El hook recibe `meetupId` y `userId` como parámetros. Carga los participantes al montar.

### 4. Pantallas de participantes (`mobile/src/features/participants/screens/`)

#### ParticipantListScreen.tsx

Pantalla que muestra todos los participantes de una juntada. Recibe `meetupId` por params de navegación.

Estructura:

- Header con flecha de volver y título "Participantes"
- Lista de participantes con: avatar con iniciales sobre fondo de color determinístico, nombre completo, username, badge de rol (estrella dorada para organizador), badge de estado de asistencia (Confirmado en verde, Pendiente en amarillo, Declinó en rojo)
- Si el usuario actual es participante (no organizador): botón flotante o al pie para modificar su propia asistencia
- Si el usuario actual es participante: botón "Abandonar juntada" en rojo al pie
- El organizador no ve el botón de abandonar

#### ModifyAttendanceScreen.tsx (o modal)

Puede implementarse como un bottom sheet modal o una pantalla simple. Muestra tres opciones:

- ✅ Confirmado
- ⏳ Pendiente
- ❌ Decliné

Al seleccionar, llama a `updateAttendance` y cierra el modal/pantalla.

### 5. Acciones sobre juntadas (`mobile/src/features/meetups/`)

#### Servicio — agregar a `meetupService.ts`:

- `cancelMeetup(meetupId, userId)` — verifica que el usuario sea el organizador, setea `status = 'cancelled'` y `cancelled_at = NOW()`. Solo el organizador puede cancelar.
- `editMeetup(meetupId, userId, data)` — verifica que el usuario sea el organizador, actualiza los campos editables de la juntada (`title`, `description`, `date`, `time`, `location`, `estimatedCost`).
- `getFinishedMeetups(userId)` — obtiene juntadas con `status = 'finished'` o `status = 'cancelled'` donde el usuario participó.

#### EditMeetupScreen.tsx

Formulario igual a `CreateMeetupScreen` pero pre-cargado con los datos actuales. Solo accesible para el organizador. Al guardar exitosamente, navega de vuelta al detalle.

#### MeetupHistoryScreen.tsx

Lista de juntadas pasadas (finalizadas o canceladas). Estructura similar al home pero sin acciones de crear/unirse. Cada card muestra badge de estado (Finalizada/Cancelada). Accesible desde el link "Ver historial" del home.

### 6. Actualizar MeetupDetailScreen.tsx

Agregá las siguientes acciones que faltan:

- Botón "Ver participantes" que navega a `ParticipantListScreen` con el `meetupId`
- Si el usuario es organizador: botón "Editar" en el header que navega a `EditMeetupScreen`
- Si el usuario es organizador: opción "Cancelar juntada" (puede ser un botón destructivo al pie o una opción en un menú)
- Si el usuario es participante: botón "Modificar asistencia" visible en la sección de participantes

### 7. Navegación

Reemplazá los placeholders en `MainNavigator.tsx` por los imports reales de:

- `ParticipantListScreen`
- `EditMeetupScreen`
- `MeetupHistoryScreen`

Configurá los params de navegación correctamente para cada pantalla.

## Reglas de negocio importantes

- Un organizador NO puede abandonar su propia juntada
- Un organizador NO puede modificar su propio estado de asistencia (siempre está confirmado)
- Solo el organizador puede editar o cancelar una juntada
- Una juntada cancelada no puede editarse
- El historial incluye tanto juntadas donde el usuario fue organizador como participante

## Restricciones

- No instalar dependencias sin informarlo primero
- No modificar `AppNavigator.tsx`, `client.ts`, `env.ts`
- No hacer commits
- Comentar todo el código en español siguiendo las reglas del proyecto
- Usar siempre `StyleSheet.create`
- Usar siempre constantes de `Routes` para navegación
- Consultar Figma via MCP antes de cada pantalla
- Si encontrás una skill útil en skills.sh, informalo antes de instalarla

## Al finalizar reportá

- Lista completa de archivos creados o modificados
- Decisiones tomadas no especificadas en el prompt
- Dependencias o skills adicionales recomendadas
- Puntos pendientes de validación
- Estado final de MainNavigator

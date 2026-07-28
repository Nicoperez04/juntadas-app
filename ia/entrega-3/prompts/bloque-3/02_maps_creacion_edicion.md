# Bloque 3 — RF-40: Selección de ubicación GPS en creación/edición de juntadas

**Fecha:** 25/07/2026  
**Rama:** `feature/bloque-3-maps`  
**RF:** RF-40 (continuación) — Completar el ciclo del dato de coordenadas

---

## 1. Objetivo

Permitir al usuario organizado seleccionar una ubicación GPS exacta al crear o editar una juntada, de modo que las coordenadas queden persistidas en Supabase y sean leídas luego por `LocationCard` en `MeetupDetailScreen`.

---

## 2. Análisis previo

### Estado antes de esta implementación

| Componente | Campo ubicación | Coordenadas |
|---|---|---|
| `CreateMeetupScreen` | `<FieldInput>` texto libre | ❌ No existían |
| `EditMeetupScreen` | `<FieldInput>` texto libre | ❌ No existían |
| `createMeetupSchema` | `location: z.string()` | ❌ No existían |
| `meetupService.ts` → `createMeetup` | `location` en INSERT | ❌ No se enviaban |
| `meetupService.ts` → `editMeetup` | `location` en UPDATE | ❌ No se enviaban |

### Decisión de diseño

- El campo `location` (texto libre) **se mantiene** como campo requerido — es el nombre descriptivo de la dirección.
- `latitude` y `longitude` se agregan como **opcionales** — el usuario puede crear una juntada sin pin de mapa.
- `LocationPicker` convive **debajo** del `<FieldInput>` de ubicación, sin reemplazarlo.
- Las coordenadas en el form se manejan como `null` cuando no fueron seleccionadas.

---

## 3. Archivos modificados

### `meetupSchemas.ts`
Adición de dos campos opcionales al schema compartido de creación/edición:

```typescript
latitude: z.number().nullable().optional(),
longitude: z.number().nullable().optional(),
```

`CreateMeetupFormData` (re-exportado en `types.ts` como alias de `CreateMeetupSchema`) hereda automáticamente los nuevos campos.

---

### `LocationPicker.tsx` (NUEVO)

Componente funcional en `mobile/src/features/meetups/components/LocationPicker.tsx`.

**Tres estados visuales:**

| Estado | Visualización |
|---|---|
| Sin coordenadas | Botón con borde punteado + ícono mapa |
| Con coordenadas | Minipreview estático del mapa + coords + botones Cambiar/Quitar |
| Modal abierto | `MapView` full-screen + `Marker` arrastrable + banner de instrucción |

**Integración con React Hook Form:**
- El componente recibe `latitudActual` / `longitudActual` como valores actuales del formulario.
- Al confirmar llama a `onChangeLatitude` / `onChangeLongitude` — callbacks que llaman a `setValue` de RHF internamente desde la pantalla padre.
- Las coordenadas temporales dentro del Modal son estado local: si el usuario cancela, el form no se modifica.

**Comportamiento del mapa interactivo:**
- `onRegionChangeComplete` mueve el Marker al centro del mapa al hacer scroll (el pin sigue al mapa).
- El Marker es `draggable` para ajuste fino sin necesidad de hacer scroll.
- `PROVIDER_GOOGLE` garantiza correcta renderización en Android.
- `scrollEnabled={false}` en el minipreview evita conflictos con el `ScrollView` padre.

---

### `CreateMeetupScreen.tsx`
- Import de `LocationPicker`.
- `defaultValues` extendidos con `latitude: null` y `longitude: null`.
- Dos `Controller` anidados (uno por campo) que pasan los valores al `LocationPicker`.

---

### `EditMeetupScreen.tsx`
- Import de `LocationPicker`.
- `defaultValues` extendidos con `latitude: null` y `longitude: null`.
- `reset()` en `loadMeetup` incluye `latitude: data.latitude ?? null` y `longitude: data.longitude ?? null` para pre-cargar coordenadas existentes.
- Mismo patrón de Controllers anidados que en Create.

---

### `meetupService.ts`
- `MeetupRow` extendida con `latitude: number | null` y `longitude: number | null`.
- `mapMeetupRow` mapea `row.latitude ?? null` y `row.longitude ?? null`.
- `createMeetup` → INSERT incluye `latitude` y `longitude`.
- `editMeetup` → UPDATE incluye `latitude` y `longitude` (permite sobrescribir o borrar con null).

---

## 4. Columnas en Supabase

La tabla `meetups` debe tener las columnas:

```sql
ALTER TABLE meetups
  ADD COLUMN IF NOT EXISTS latitude  DOUBLE PRECISION DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION DEFAULT NULL;
```

Si no existen, el INSERT no fallará (Supabase ignora columnas extra del payload), pero los datos no quedarán guardados. Verificar en el dashboard de Supabase → `Table Editor` → tabla `meetups`.

---

## 5. Probar localmente con Expo Go

> **Nota:** `react-native-maps` con `PROVIDER_GOOGLE` no funciona en Expo Go estándar. Para pruebas locales usar el **Development Client** (build nativo previo):

### Opción A — Expo Go (visualización en iOS simulador)
En iOS, `react-native-maps` puede usar el proveedor de Apple Maps sin `PROVIDER_GOOGLE`. Para que el LocationPicker funcione en Expo Go en iOS:
1. Abrir `LocationPicker.tsx` y cambiar temporalmente `provider={PROVIDER_GOOGLE}` a `provider={undefined}` (solo para test local).
2. `npx expo start --clear`
3. Escanear QR con Expo Go en iOS.

### Opción B — Development Client (recomendado para Android)
```bash
# 1. Generar build de desarrollo con APK
eas build -p android --profile development

# 2. Instalar en el dispositivo
adb install ronda-app.apk

# 3. Levantar el servidor Metro
npx expo start --dev-client
```

### Flujo de prueba
1. Crear una juntada nueva → completar título, fecha, hora, ubicación (texto).
2. Presionar **"+ Agregar ubicación"** → se abre el modal.
3. Mover el mapa → el pin sigue al centro de la pantalla.
4. Presionar **"Confirmar ubicación"** → el modal se cierra; aparece el minipreview.
5. Guardar la juntada → verificar en `MeetupDetailScreen` que `LocationCard` muestra el mapa.
6. Entrar a Editar la juntada → el pin debe estar pre-cargado en la posición guardada.
7. Presionar **"Quitar"** en el picker → las coords se borran; `LocationCard` muestra el empty state.

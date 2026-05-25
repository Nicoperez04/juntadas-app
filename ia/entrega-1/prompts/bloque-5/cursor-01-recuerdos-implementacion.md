# Prompt — Bloque 5: Recuerdos (Galería de fotos)

Implementación — Bloque 5: Recuerdos (Galería de fotos)

## Contexto del proyecto

App móvil Juntadas, React Native + Expo SDK 55 + TypeScript. Backend Supabase. Rama activa: feature/bloque-5-recuerdos.

Arquitectura modular por features. Todo el código vive en `mobile/src/features/memories/`. Sistema de diseño en `mobile/src/shared/constants/theme.ts` — ningún valor hardcodeado. El bucket memories ya existe en Supabase Storage. Consultá Figma via MCP antes de implementar.

Skills a usar: vercel-react-native-skills, building-native-ui, sleek-design-mobile-apps, frontend-design.

Skills adicionales a intentar instalar antes de empezar (desde la raíz del repo, no desde mobile/):

```bash
npx skills add pbakaus/impeccable/delight
npx skills add emilkowalski/skill/emil-design-eng
npx skills add expo/skills/native-data-fetching
```

Si alguna falla, documentarlo en el reporte y continuar sin ella.

## Decisiones confirmadas

- Solo se pueden subir fotos en juntadas activas o finalizadas — no canceladas
- Sin límite de fotos por juntada en E1
- Orden: más recientes primero
- Vista ampliada al tocar una foto con gestos de cierre
- Selección múltiple al subir (múltiples fotos a la vez)
- Sin caption/pie de foto
- Si el usuario abandonó la juntada no puede ver ni subir recuerdos (ya implementado en MeetupDetailScreen)

## Lo que necesito que implementes

### 1. Verificar políticas RLS del bucket memories

Antes de implementar, verificar en Supabase que el bucket memories tiene las políticas correctas. Si no las tiene, generar el SQL necesario y documentarlo como comentario en el código para ejecutar manualmente:

```sql
-- Ver si existe bucket y sus políticas
SELECT * FROM storage.buckets WHERE id = 'memories';
SELECT * FROM pg_policies WHERE tablename = 'objects' AND qual LIKE '%memories%';
```

Las políticas necesarias son:

- **INSERT:** participante activo de la juntada puede subir fotos
- **SELECT:** participante activo puede ver fotos
- **DELETE:** solo quien subió la foto puede borrarla

### 2. Tipos (`mobile/src/features/memories/types.ts`)

El archivo ya existe. Reemplazá su contenido con:

```typescript
interface Memory {
  id: string
  meetupId: string
  uploadedBy: string
  fileUrl: string
  filePath: string
  mediaType: 'photo'
  createdAt: string
  // Datos del perfil de quien subió la foto
  uploaderName: string
  uploaderUsername: string
  uploaderAvatarUrl: string | null
}

interface UploadMemoryData {
  meetupId: string
  imageUri: string
  userId: string
}
```

### 3. Servicio (`mobile/src/features/memories/services/memoriesService.ts`)

- `getMemories(meetupId)` — obtiene todas las fotos de una juntada con datos del perfil de quien las subió, ordenadas por created_at descendente
- `uploadMemory(data: UploadMemoryData)` — sube la imagen a Supabase Storage con path `{meetupId}/{userId}/{timestamp}.jpg`, inserta el registro en la tabla memories y retorna la memoria creada
- `deleteMemory(memoryId, userId, filePath)` — verifica que el usuario es quien subió la foto, borra el archivo de Storage y el registro de la tabla
- `uploadMultipleMemories(meetupId, userId, imageUris)` — llama a uploadMemory en paralelo con Promise.all para subir múltiples fotos

Manejo de errores consistente retornando siempre `{ data, error }`.

### 4. Hook (`mobile/src/features/memories/hooks/useMemories.ts`)

```typescript
const useMemories = (meetupId: string, currentUserId: string | null) => {
  const [memories, setMemories] = useState<Memory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carga las fotos al montar
  // uploadPhotos: abre image picker con allowsMultipleSelection: true,
  //   llama a uploadMultipleMemories y recarga la lista
  // deletePhoto: llama a deleteMemory y recarga la lista
  // refresh: recarga la lista

  return { memories, isLoading, isUploading, error, uploadPhotos, deletePhoto, refresh }
}
```

### 5. Pantalla principal (`mobile/src/features/memories/screens/MemoriesGalleryScreen.tsx`)

Recibe `meetupId` y `isActive` por params de navegación.

Estructura consultando Figma via MCP:

- Header con flecha de volver y título "Recuerdos"
- Si `isActive`: botón "+" o "Subir foto" en el header derecho
- Nombre de la juntada y fecha como subtítulo
- Grid de fotos 3 columnas usando FlatList con `numColumns={3}`
- Cada celda del grid: foto cuadrada que ocupa 1/3 del ancho de pantalla con gap de 2px
- Sobre cada foto: avatar pequeño + nombre de quien la subió en la esquina inferior izquierda con overlay oscuro sutil
- Si la foto es del usuario actual: ícono de papelera en esquina superior derecha al mantener presionado
- Empty state si no hay fotos: ícono de cámara, texto "No hay recuerdos aún", botón "Subir la primera foto" si `isActive`
- Estado de carga: skeleton grid 3x3
- Botón flotante (FAB) "+" en esquina inferior derecha si `isActive` — alternativa al botón del header

**Al subir fotos:**

- Abre expo-image-picker con `allowsMultipleSelection: true`, `mediaTypes: 'Images'`, `quality: 0.8`
- Mientras sube: overlay de carga sobre el grid con progreso si son múltiples fotos ("Subiendo 2 de 3...")
- Toast de éxito al terminar: "✓ X foto(s) agregada(s)", replicar toast del sistema

**Al eliminar una foto:**

- Mantener presionado la foto del usuario actual para mostrar opción de eliminar
- Modal de confirmación: "¿Eliminar esta foto? Esta acción no se puede deshacer."
- Toast de éxito al eliminar

### 6. Vista ampliada (`mobile/src/features/memories/screens/MemoryViewerScreen.tsx`)

Pantalla modal que se abre al tocar cualquier foto de la galería.

- Fondo negro
- Foto centrada que ocupa el ancho completo manteniendo aspect ratio
- Gesto de swipe down para cerrar (usar PanResponder o Animated — no instalar Reanimated)
- Botón X en esquina superior derecha para cerrar
- En la parte inferior: avatar y nombre de quien subió la foto + fecha
- Si la foto es del usuario actual: botón de papelera
- Navegación entre fotos: swipe horizontal izquierda/derecha entre fotos de la galería
- Indicador de posición: "3 / 12" arriba a la derecha

### 7. Actualizar MeetupDetailScreen

El botón "Recuerdos" ya existe. Actualizá la navegación para pasar los params correctos:

```typescript
navigation.navigate(Routes.MemoriesGallery, {
  meetupId,
  isActive: meetup.status === 'active' || meetup.status === 'finished'
})
```

### 8. Navegación

En `MainNavigator.tsx`, reemplazá el placeholder de MemoriesGalleryScreen por el import real.

Agregá MemoryViewer a Routes y registrá MemoryViewerScreen en el stack como pantalla modal:

```typescript
<Stack.Screen
  name={Routes.MemoryViewer}
  component={MemoryViewerScreen}
  options={{ presentation: 'modal' }}
/>
```

Params:

```typescript
MemoriesGallery: { meetupId: string; isActive: boolean }
MemoryViewer: { memories: Memory[]; initialIndex: number; meetupId: string }
```

### 9. Skill propia del proyecto

Creá el archivo `.cursor/rules/photo-gallery-patterns.mdc` con una skill propia que documente los patrones de galería de fotos de este proyecto:

```markdown
# photo-gallery-patterns

Patrones específicos de galería de fotos para la app Juntadas.

## Supabase Storage
- Bucket: `memories`, path: `{meetupId}/{userId}/{timestamp}.jpg`
- Siempre usar `upsert: false` al subir para evitar sobrescribir
- La URL pública se obtiene con `supabase.storage.from('memories').getPublicUrl(path)`
- Para eliminar: primero borrar de storage, luego de la tabla memories

## Grid de fotos
- FlatList con numColumns={3}, no ScrollView con rows manuales
- Ancho de celda: `(Dimensions.get('window').width - gaps) / 3`
- Gap entre celdas: 2px
- Fotos siempre cuadradas con aspect ratio 1:1

## Vista ampliada
- Presentación como modal con fondo negro
- Swipe down para cerrar con PanResponder
- Swipe horizontal para navegar entre fotos
- Pasar el array completo de memories e initialIndex como params

## Permisos de cámara y galería
- expo-image-picker ya está instalado y configurado en app.json
- Siempre verificar permisos antes de abrir el picker
- Usar `ImagePicker.requestMediaLibraryPermissionsAsync()` para galería
- Usar `ImagePicker.requestCameraPermissionsAsync()` para cámara

## Carga y estados
- isLoading: skeleton grid mientras carga la primera vez
- isUploading: overlay con progreso sobre el grid
- Empty state: siempre mostrar opción de subir si isActive
```

## Restricciones

- No instalar dependencias nuevas sin informarlo — expo-image-picker ya está instalado
- No modificar AppNavigator.tsx, client.ts, env.ts
- No hacer commits
- Comentar todo el código en español
- Usar siempre StyleSheet.create y Routes
- Consultar Figma via MCP antes de implementar

## Al finalizar reportá

- Archivos creados o modificados
- Skills adicionales que se pudieron o no instalar
- Políticas RLS del bucket memories — estado actual y SQL necesario si faltan
- Cómo quedó la navegación entre fotos en el viewer
- Cómo quedó la skill propia en `.cursor/rules/`
- Puntos pendientes de validación

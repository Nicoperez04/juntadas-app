# Bloque 7a — Correcciones funcionales y UX

## Contexto
Rama actual: feature/bloque-7-animaciones-ux
Este prompt cubre correcciones funcionales y de UX.
Las animaciones y el ícono de la app van en el prompt 7b.

Stack relevante:
- React Native + Expo SDK 55 + TypeScript
- expo-image-picker ya instalado
- expo-haptics ya instalado
- Design tokens en src/shared/constants/theme.ts
- Sin TypeScript any, comentarios en español

## Tu tarea
Realizá las siguientes tareas en orden.

---

### Tarea 1 — "Cortar" → "Elegir foto"

Problema:
En dos lugares aparece el texto "Cortar" cuando debería
decir "Elegir foto":
1. Al cambiar foto de perfil
2. Al agregar/cambiar foto de portada de juntada

Alcance:
Buscar en todo src/ el texto "Cortar" o "cortar" en contexto
de selección de imágenes y reemplazarlo por "Elegir foto".
También buscar "crop" o "Crop" si es que viene de alguna
librería o constante.

Reportar todos los archivos donde se encontró y se cambió.

No hacer:
- No cambiar la lógica de selección de imágenes
- No hacer commits

---

### Tarea 2 — Subir recuerdos con cámara o galería

Problema:
Al subir fotos como recuerdos solo se puede elegir desde
la galería. Debe funcionar igual que la foto de perfil:
permitir elegir entre cámara y galería.

Alcance:
1. Buscar cómo está implementado el picker de foto de perfil
   (ProfileScreen o authService) — ese es el patrón a replicar
2. En MemoriesGalleryScreen (o donde se suba la foto de recuerdo),
   reemplazar la llamada directa a ImagePicker.launchImageLibraryAsync
   por un modal/action sheet con dos opciones:
   "Tomar foto" → launchCameraAsync
   "Elegir de galería" → launchImageLibraryAsync
3. El modal debe ser consistente con el estilo de la app
4. Pedir permisos de cámara si no están otorgados
   (igual que como se hace para la galería)

No hacer:
- No cambiar la lógica de subida a Supabase Storage
- No hacer commits

Archivos esperados:
- src/features/memories/screens/MemoriesGalleryScreen.tsx
  (o donde esté el picker de recuerdos)

---

### Tarea 3 — Organizador puede eliminar cualquier foto de recuerdos

Problema:
Actualmente solo se puede eliminar la foto propia.
El organizador debe poder eliminar cualquier foto
de cualquier participante.

Alcance:
1. Verificar cómo se determina si el usuario puede eliminar
   una foto (buscar en memoriesService o el hook de memories)
2. Agregar lógica: si el usuario es organizador de la juntada,
   puede eliminar cualquier foto; si es participante, solo las suyas
3. El organizador debe tener el botón de eliminar visible
   en todas las fotos, no solo en las propias

Para saber si el usuario es organizador, usar el dato que
ya está disponible en el contexto de la juntada (meetup.created_by
o isOrganizer que ya existe en useMeetupDetail o similar).

No hacer:
- No cambiar la UI de la galería
- No hacer commits

Archivos esperados:
- src/features/memories/screens/MemoriesGalleryScreen.tsx
- src/features/memories/services/memoriesService.ts
  (si la validación está en el servicio)

---

### Tarea 4 — Haptic al hacer long press en foto de recuerdo

Problema:
Al mantener presionada una foto para que aparezca el botón
de eliminar, no hay feedback háptico.

Alcance:
En MemoriesGalleryScreen, en el handler de long press:
- Agregar Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  al inicio del onLongPress
- Mismo patrón que se usa en otros long press de la app

No hacer:
- No cambiar la lógica del long press
- No hacer commits

Archivos esperados:
- src/features/memories/screens/MemoriesGalleryScreen.tsx

---

### Tarea 5 — Fix refresh innecesario al salir de modificar asistencia

Problema:
Al entrar al modal/pantalla de modificar asistencia de un
participante desde el detalle de la juntada y salir sin
hacer cambios, se hace un refresh innecesario de la página.

Alcance:
1. Buscar dónde se dispara el refresh al volver de modificar
   asistencia (probablemente en useMeetupDetail o en el
   onFocus/navigation listener de MeetupDetailScreen)
2. Agregar una condición: solo invalidar/refrescar si
   realmente se modificó la asistencia
3. Una forma de implementarlo: pasar un parámetro de retorno
   desde la pantalla de modificar asistencia indicando si
   hubo cambios (params.updated = true/false)

No hacer:
- No cambiar la lógica de modificación de asistencia
- No hacer commits

Archivos esperados:
- src/features/meetups/screens/MeetupDetailScreen.tsx
  (o useMeetupDetail.ts según dónde esté el listener)

---

### Tarea 6 — Mejoras visuales en ProfileScreen

Problema:
- Botones "Cerrar sesión" y "Eliminar cuenta" tienen el mismo
  peso visual, deberían diferenciarse
- El texto dice "Notificaciones push", debería decir solo
  "Notificaciones"
- El ícono de editar perfil (lápiz) es pequeño y poco visible

Alcance:
En ProfileScreen.tsx:

1. Botones de sesión/cuenta:
   - "Cerrar sesión": mantener estilo outlined (borde, sin fondo)
     pero con color neutro (gris o primario suave)
   - "Eliminar cuenta": fondo rojo sólido, texto blanco
     Debe quedar claro que es una acción destructiva
   - Separación visual entre ambos botones

2. Texto "Notificaciones push" → "Notificaciones"

3. Ícono de editar perfil:
   - Reemplazar el ícono actual por 'pencil' de MaterialCommunityIcons
   - Tamaño del ícono: 22dp (más grande que el actual)
   - El botón contenedor debe ser al menos 44x44dp

No hacer:
- No cambiar la lógica de ninguno de los botones
- No hacer commits

Archivos esperados:
- src/features/auth/screens/ProfileScreen.tsx

---

### Tarea 7 — Accesibilidad básica (WCAG AA)

Alcance:
Revisar y corregir en toda la app:

1. Tamaño de fuente mínimo 14sp para texto de cuerpo:
   - Buscar en src/ estilos con fontSize menor a 14
   - Corregir los que sean texto de cuerpo visible
     (excluir badges pequeños o contadores donde sea intencional)

2. Áreas táctiles mínimo 48x48dp:
   - Revisar botones icónicos pequeños:
     * Campana de notificaciones en home
     * Botón X de chips de filtros
     * Botones de navegación del header
     * Cualquier TouchableOpacity con ícono sin padding suficiente
   - Agregar padding o minWidth/minHeight donde falte
   - Usar hitSlop si el área visual debe quedar chica pero
     el área táctil debe ser grande:
     hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}

3. No cambiar el diseño visual de ningún elemento,
   solo el área táctil y el fontSize donde corresponda

No hacer:
- No redesignar ninguna pantalla
- No hacer commits

---

### Tarea 8 — Documentar este prompt

Crear ia/entrega-2/prompts/bloque-7/01_correcciones_funcionales_ux.md
con el contenido completo de este prompt.

Actualizar ia/entrega-2/indice_ia.md agregando:
[número siguiente] - Bloque 7a: correcciones funcionales y UX
  (foto recuerdos con cámara, organizador elimina fotos,
  haptic long press, fix refresh asistencia, perfil visual,
  accesibilidad WCAG AA básica)

No hacer:
- No tocar archivos de código
- No hacer commits

Archivos esperados:
- ia/entrega-2/prompts/bloque-7/01_correcciones_funcionales_ux.md
- ia/entrega-2/indice_ia.md (actualizado)

---

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- Seguir tokens de src/shared/constants/theme.ts
- No hacer commits
- Reportar archivos modificados y decisiones al finalizar cada tarea
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar
Resumen con:
1. Archivos creados y modificados
2. Decisiones tomadas
3. Cómo probarlo en dispositivo

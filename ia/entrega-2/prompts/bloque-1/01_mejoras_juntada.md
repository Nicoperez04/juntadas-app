# Bloque 1 — Mejoras de Juntada

## Contexto general
Continuamos con la Entrega 2 (E2) del proyecto Juntadas.
El Bloque 0 está completo y mergeado a entrega-2.
La rama actual de trabajo es `feature/bloque-1-mejoras-juntada`.

El Bloque 0 introdujo los siguientes cambios relevantes para este bloque:
- TanStack Query integrado en App.tsx con QueryClientProvider
- useMeetups.ts migrado a useQuery/useMutation con keys ['meetups', userId]
- useCurrentUser.ts disponible en src/shared/hooks/
- MeetupDetailScreen partida en subcomponentes: MeetupDetailHeader, MeetupParticipantsSummary, MeetupOrganizerActions
- useMeetupDetail.ts encapsula lógica del detalle
- Tipado de navegación centralizado en src/navigation/types.ts

## Stack del proyecto
- React Native + Expo SDK 55 + TypeScript
- Supabase (Auth + PostgreSQL + Storage)
- React Navigation (stack navigator)
- TanStack Query v5
- Zustand v5 (solo en impostor)
- React Hook Form + Zod
- expo-image-picker (ya instalado)
- expo-clipboard (ya instalado)
- Design tokens en src/shared/constants/theme.ts (fuente única de verdad)
- Todos los comentarios en español
- Sin TypeScript any

## Tu tarea
Realizá las siguientes tareas en orden. Completá y reportá cada una antes de pasar a la siguiente.

---

### Tarea 1 — Migración de base de datos

Crear el archivo supabase/migrations/005_meetup_cover.sql con el siguiente contenido:

1. Agregar columna cover_url TEXT NULL a la tabla meetups
2. Crear bucket de Storage 'meetup-covers' si no existe, con public: false
3. Políticas RLS del bucket:
   - SELECT: usuarios autenticados que sean miembros activos de la juntada
     (usar la función is_active_meetup_member() que ya existe en la DB)
   - INSERT: solo el organizador de la juntada (role = 'organizer' en meetup_participants)
   - UPDATE: solo el organizador
   - DELETE: solo el organizador
4. Comentarios en español en el SQL

IMPORTANTE: solo generás el archivo SQL. No ejecutes nada.
La migración la ejecuta el equipo manualmente en el SQL Editor de Supabase.

Archivos esperados:
- supabase/migrations/005_meetup_cover.sql

---

### Tarea 2 — Actualizar tipos y servicio

Contexto:
- El tipo Meetup está definido en src/features/meetups/types.ts
- meetupService.ts encapsula todas las operaciones sobre meetups y meetup_participants
- El organizador tiene role = 'organizer' en meetup_participants
- created_by en meetups también identifica al organizador original

Alcance:
1. Agregar cover_url?: string | null al tipo Meetup en meetups/types.ts
2. En meetupService.ts agregar los siguientes métodos:

   uploadMeetupCover(meetupId: string, fileUri: string, userId: string):
   - Sube la imagen al bucket 'meetup-covers' con path: {meetupId}/{userId}/{timestamp}.jpg
   - Actualiza cover_url en la tabla meetups con la URL pública del archivo
   - Retorna { data: string | null, error }

   removeMeetupCover(meetupId: string, filePath: string):
   - Elimina el archivo del bucket
   - Setea cover_url = null en meetups
   - Retorna { data: null, error }

   transferOrganizer(meetupId: string, newOrganizerUserId: string, currentOrganizerUserId: string):
   - Cambia role = 'member' al organizador actual en meetup_participants
   - Cambia role = 'organizer' al nuevo organizador en meetup_participants
   - Actualiza created_by en meetups al nuevo organizador
   - Todo en secuencia; si algún paso falla, retorna el error sin continuar
   - Retorna { data: null, error }

No hacer:
- No modificar métodos existentes de meetupService
- No tocar otros servicios

Archivos esperados:
- src/features/meetups/types.ts (cover_url agregado)
- src/features/meetups/services/meetupService.ts (3 métodos nuevos)

---

### Tarea 3 — Actualizar useMeetups y useMeetupDetail

Contexto:
- useMeetups.ts ya usa TanStack Query v5 tras el Bloque 0
- useMeetupDetail.ts encapsula la lógica del detalle de juntada

Alcance:
1. En useMeetups.ts agregar mutaciones:
   - useUploadMeetupCover: llama a meetupService.uploadMeetupCover,
     en onSuccess invalida ['meetups', userId] y ['meetup', meetupId]
   - useRemoveMeetupCover: llama a meetupService.removeMeetupCover,
     en onSuccess invalida las mismas queries
   - useTransferOrganizer: llama a meetupService.transferOrganizer,
     en onSuccess invalida ['meetups', userId] y ['meetup', meetupId]

2. En useMeetupDetail.ts asegurarse de que el meetup retornado
   incluya cover_url para que los componentes puedan accederlo

No hacer:
- No cambiar mutaciones existentes
- No tocar otros hooks

Archivos esperados:
- src/features/meetups/hooks/useMeetups.ts (3 mutaciones nuevas)
- src/features/meetups/hooks/useMeetupDetail.ts (verificar cover_url incluido)

---

### Tarea 4 — Foto de portada en crear y editar juntada

Contexto:
- CreateMeetupScreen y EditMeetupScreen usan React Hook Form + Zod
- expo-image-picker ya está instalado y se usa en memories
- El patrón de selección de imagen está implementado en useMemories.ts,
  podés tomar referencia de cómo se usa ImagePicker ahí
- La portada es opcional, no es un campo requerido

Alcance:
1. En CreateMeetupScreen.tsx:
   - Agregar sección de portada opcional antes o después del formulario
   - Botón/área táctil que abre ImagePicker (galería, calidad 0.8, aspect 16:9)
   - Si el usuario selecciona una imagen, mostrar preview de la foto elegida
   - Botón para quitar la foto si ya eligió una
   - Al crear la juntada con éxito: si hay foto seleccionada, llamar a uploadMeetupCover
     con el meetupId recién creado
   - El flujo de navegación post-creación no cambia

2. En EditMeetupScreen.tsx:
   - Si la juntada ya tiene cover_url, mostrar la portada actual con opción de cambiarla o quitarla
   - Si no tiene portada, mostrar opción de agregar una
   - Al guardar: si hay foto nueva, subir y actualizar; si se quitó, llamar a removeMeetupCover
   - Usar los mismos componentes visuales que en CreateMeetupScreen para consistencia

UI:
- El área de portada ocupa el ancho completo con aspect ratio 16:9
- Si no hay portada: área con borde punteado, ícono de cámara y texto "Agregar portada (opcional)"
- Si hay portada: imagen con overlay semitransparente y botón de editar/quitar
- Seguir exactamente los tokens de theme.ts para colores, spacing y tipografía
- No instalar librerías nuevas

No hacer:
- No cambiar la lógica del formulario existente
- No modificar los schemas de Zod (cover no va en el form, se maneja por separado)
- No tocar otros screens

Archivos esperados:
- src/features/meetups/screens/CreateMeetupScreen.tsx (modificado)
- src/features/meetups/screens/EditMeetupScreen.tsx (modificado)

---

### Tarea 5 — Mostrar portada en detalle y lista

Contexto:
- MeetupDetailHeader.tsx muestra el encabezado del detalle de juntada
- MeetupHomeScreen.tsx muestra la lista de juntadas del usuario

Alcance:
1. En MeetupDetailHeader.tsx:
   - Si el meetup tiene cover_url, mostrar la imagen como banner superior
     ocupando el ancho completo con height fijo (ej: 200dp)
   - Si no tiene portada, mantener el header actual sin imagen
   - La imagen debe tener resizeMode: 'cover'

2. En MeetupHomeScreen.tsx:
   - Si la juntada tiene cover_url, mostrar como thumbnail a la izquierda de la card
     (cuadrado ~60dp) con resizeMode: 'cover' y borderRadius del theme
   - Si no tiene portada, mostrar el ícono/placeholder actual

No hacer:
- No cambiar la estructura de navegación
- No modificar otros componentes

Archivos esperados:
- src/features/meetups/components/MeetupDetailHeader.tsx (modificado)
- src/features/meetups/screens/MeetupHomeScreen.tsx (modificado)

---

### Tarea 6 — Compartir juntada por link/WhatsApp

Contexto:
- expo-clipboard ya está instalado y se usa en la app
- El código de la juntada existe en meetup.join_code
- No implementamos deep links reales; el mensaje es texto plano con el código
- La funcionalidad de compartir va en el detalle de la juntada
- MeetupOrganizerActions.tsx tiene las acciones del organizador,
  pero compartir debe estar disponible para TODOS los miembros (organizador y participantes)

Alcance:
1. Crear src/features/meetups/components/MeetupShareButton.tsx:
   - Botón visible para todos los miembros de la juntada
   - Al presionar, muestra un pequeño modal o bottom sheet con dos opciones:
     a) "Copiar código" → copia join_code al clipboard con expo-clipboard,
        muestra toast de confirmación "Código copiado"
     b) "Compartir por WhatsApp" → abre WhatsApp con mensaje pre-armado:
        "Te invito a [nombre de la juntada] en Juntadas 🎉
         El código para unirte es: [join_code]
         ¡Nos vemos!"
        Usar Linking.openURL con el scheme de WhatsApp:
        whatsapp://send?text=...
   - Si WhatsApp no está instalado, mostrar toast de error claro
   - Usar expo-clipboard para copiar y Linking de react-native para WhatsApp

2. Integrar MeetupShareButton en MeetupDetailScreen.tsx
   en una posición visible (cerca del header o junto a las acciones principales)

No hacer:
- No instalar expo-sharing ni ninguna librería nueva
- No implementar deep links reales
- No modificar la lógica del detalle

Archivos esperados:
- src/features/meetups/components/MeetupShareButton.tsx (nuevo)
- src/features/meetups/screens/MeetupDetailScreen.tsx (modificado, integración del botón)

---

### Tarea 7 — Cambio de organizador

Contexto:
- MeetupOrganizerActions.tsx tiene las acciones exclusivas del organizador
- useMeetupDetail.ts expone isOrganizer y la lista de participantes activos
- useTransferOrganizer está disponible tras la Tarea 3
- El cambio de organizador es una acción irreversible desde la UI
  (técnicamente reversible en DB, pero el usuario no lo sabe)

Alcance:
1. En MeetupOrganizerActions.tsx agregar opción "Transferir organización":
   - Solo visible si isOrganizer = true
   - Al presionar: mostrar modal con lista de participantes activos
     (excluir al organizador actual de la lista)
   - Cada participante muestra avatar + nombre completo
   - Al seleccionar uno: pedir confirmación con texto claro:
     "¿Transferir la organización a [nombre]?
      Ya no podrás administrar esta juntada."
   - Al confirmar: llamar a useTransferOrganizer
   - En caso de éxito: mostrar toast "Organización transferida" y
     el componente se actualiza automáticamente (isOrganizer pasa a false)
   - En caso de error: mostrar toast de error

No hacer:
- No modificar la lógica de otros actions
- No tocar otros componentes ni pantallas

Archivos esperados:
- src/features/meetups/components/MeetupOrganizerActions.tsx (modificado)

---

## Reglas generales
- No instalar dependencias adicionales
- No tocar android/ ni ios/
- No hacer commits
- Comentarios en español
- Sin TypeScript any
- Seguir tokens de src/shared/constants/theme.ts para todo elemento visual
- Reportar archivos modificados y decisiones al finalizar cada tarea
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar todo el bloque
Generar resumen con:
1. Archivos creados
2. Archivos modificados
3. Decisiones tomadas
4. Cosas a revisar manualmente o probar en dispositivo

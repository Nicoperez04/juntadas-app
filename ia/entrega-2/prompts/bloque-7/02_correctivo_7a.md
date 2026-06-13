# Bloque 7a — Correctivo

## Corrección 1 — Revertir allowsEditing a true

Problema:
Se desactivó allowsEditing en foto de perfil y portada de juntada
para evitar el texto "Cortar". Esto eliminó el editor de recorte
que el usuario necesita. Hay que revertirlo.

Alcance:
En los siguientes archivos, volver a poner allowsEditing: true
en todas las llamadas a ImagePicker.launchImageLibraryAsync
y launchCameraAsync donde se había quitado:
- src/features/auth/screens/ProfileScreen.tsx
- src/features/meetups/screens/CreateMeetupScreen.tsx
- src/features/meetups/screens/EditMeetupScreen.tsx

El texto "Cortar" que muestra Android es nativo y no se puede
cambiar — se acepta ese comportamiento.

No hacer:
- No cambiar ninguna otra lógica
- No hacer commits

Archivos esperados:
- src/features/auth/screens/ProfileScreen.tsx
- src/features/meetups/screens/CreateMeetupScreen.tsx
- src/features/meetups/screens/EditMeetupScreen.tsx

---

## Corrección 2 — Portada de juntada con cámara + galería

Problema:
Al agregar portada de juntada solo se puede elegir desde
la galería. Debe funcionar igual que recuerdos:
modal con "Tomar foto" y "Elegir de galería".

Alcance:
En CreateMeetupScreen.tsx y EditMeetupScreen.tsx,
replicar exactamente el mismo modal de selección que
se implementó en MemoriesGalleryScreen en el 7a:
- Botón que abre modal/action sheet
- "Tomar foto" → launchCameraAsync con allowsEditing: true
- "Elegir de galería" → launchImageLibraryAsync con allowsEditing: true
- Pedir permisos de cámara si no están otorgados
- Mismo estilo visual que el modal de recuerdos

No hacer:
- No cambiar la lógica de subida a Supabase Storage
- No hacer commits

Archivos esperados:
- src/features/meetups/screens/CreateMeetupScreen.tsx
- src/features/meetups/screens/EditMeetupScreen.tsx

---

## Corrección 3 — Foto de perfil se guarda solo al presionar Guardar

Problema:
Al editar el perfil, la foto se guarda automáticamente al
elegirla sin esperar a que el usuario presione "Guardar"
en el header.

Alcance:
En ProfileScreen.tsx, cambiar el flujo de la foto de perfil:

1. Al elegir una foto (cámara o galería): guardar solo
   el URI local en un estado temporal (pendingAvatarUri)
   y mostrarlo como preview en el avatar
2. Al presionar "Guardar" en el header: subir la foto
   junto con los demás cambios (nombre, username)
3. Al presionar "Cancelar": descartar pendingAvatarUri
   y mostrar el avatar original

El upload a Supabase Storage debe ocurrir SOLO cuando
el usuario presiona "Guardar", no antes.

No hacer:
- No cambiar la lógica de subida a Storage
- No tocar otros campos del perfil
- No hacer commits

Archivos esperados:
- src/features/auth/screens/ProfileScreen.tsx

---

## Corrección 4 — Footer del home más chico que el resto

Problema:
El tab bar en la pantalla Home se ve más chico que en
las otras pantallas (Perfil, Juegos, etc.).
Esto ocurrió porque en el 7a se tocó AppTabBar.tsx
para accesibilidad y se introdujo una inconsistencia.

Alcance:
En src/shared/components/AppTabBar.tsx:
1. Verificar que el height del tab bar es consistente
   en todos los tabs
2. Verificar que el padding y tamaño de íconos es igual
   para todos los tabs incluyendo el de Home
3. Si hay estilos condicionales que aplican diferente
   al tab activo vs inactivo, verificar que no afectan
   el tamaño del contenedor
4. El resultado debe ser que todos los tabs se vean
   del mismo tamaño

No hacer:
- No cambiar el diseño visual del tab bar
- No hacer commits

Archivos esperados:
- src/shared/components/AppTabBar.tsx

---

## Corrección 5 — Documentar este prompt

Crear ia/entrega-2/prompts/bloque-7/02_correctivo_7a.md
con el contenido completo de este prompt.

No hacer:
- No tocar archivos fuera de los indicados
- No hacer commits

Archivos esperados:
- ia/entrega-2/prompts/bloque-7/02_correctivo_7a.md

---

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- Seguir tokens de src/shared/constants/theme.ts
- No hacer commits
- Reportar archivos modificados y decisiones al finalizar

## Al finalizar
Resumen con:
1. Archivos modificados
2. Decisiones tomadas
3. Cómo probarlo

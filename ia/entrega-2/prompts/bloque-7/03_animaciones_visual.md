# Bloque 7b — Animaciones y visual

## Contexto
Rama actual: feature/bloque-7-animaciones-ux
Los assets de la app fueron actualizados:
- icon.png → logo de Ronda App (1024x1024)
- android-icon-foreground.png → logo de Ronda App
- splash-icon.png → logo de Ronda App

Stack relevante:
- React Native + Expo SDK 55 + TypeScript
- Animated de React Native (sin librerías externas)
- expo-haptics ya instalado
- Design tokens en src/shared/constants/theme.ts
- Sin TypeScript any, comentarios en español

## Tu tarea
Realizá las siguientes tareas en orden.

---

### Tarea 1 — Verificar configuración de íconos en app.json

Alcance:
Verificar que app.json apunta correctamente a los assets
actualizados. La configuración debe quedar así:

"icon": "./assets/icon.png",
"splash": {
  "image": "./assets/splash-icon.png",
  "resizeMode": "contain",
  "backgroundColor": "#7C3AED"
},
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/android-icon-foreground.png",
    "backgroundColor": "#7C3AED"
  },
  ...resto existente
}

Si ya está configurado así, reportarlo y no cambiar nada.
Si algo difiere, corregirlo.

No hacer:
- No cambiar ningún otro campo de app.json
- No hacer commits

Archivos esperados:
- app.json (verificado o corregido)

---

### Tarea 2 — Nueva animación de éxito global

Contexto:
La animación de éxito actual es un checkmark flotante
pequeño y centrado. Debe reemplazarse por una animación
más impactante e inspirada en el logo de Ronda App
(círculo que rota + flecha que hace pop + destellos).

Crear src/shared/components/SuccessAnimation.tsx

Diseño de la animación (usando solo Animated de React Native):
- Duración total: ~1.5 segundos
- Secuencia:

  Fase 1 (0-400ms): Aparición
  - Un círculo de fondo escala de 0 a 1 con spring
  - Color del gradiente del logo: del violeta (#7C3AED)
    al rosa (#EC4899)
  - El círculo tiene un borde que rota 360° en esta fase

  Fase 2 (300-700ms): Checkmark
  - Un checkmark aparece en el centro con scale spring
    de 0 a 1.2 y vuelve a 1 (efecto bounce)
  - Color: blanco

  Fase 3 (500-900ms): Destellos
  - 3 pequeños puntos/líneas que salen desde el borde
    del círculo en distintas direcciones (como los
    destellos de la flecha del logo)
  - Animación: translateX/Y desde el centro hacia afuera
    con fade out simultáneo

  Fase 4 (900-1200ms): Texto
  - El mensaje de éxito aparece debajo con fade in
  - Tipografía: theme.fontSizes.md, bold, color del tema

  Fase 5 (1200-1500ms): Espera y desaparece
  - Todo el conjunto hace fade out suave

Props del componente:
- message: string — texto a mostrar
- visible: boolean — controla si se muestra
- onHide: () => void — callback cuando termina la animación

Posicionamiento:
- Overlay absoluto centrado en pantalla
- zIndex alto (por encima de todo el contenido)
- Fondo semitransparente detrás (rgba(0,0,0,0.3))

No hacer:
- No instalar librerías de animación
- No usar Lottie
- No hacer commits

Archivos esperados:
- src/shared/components/SuccessAnimation.tsx

---

### Tarea 3 — Reemplazar animación de éxito en toda la app

Contexto:
Actualmente existe un componente de toast/animación de éxito
que se usa en múltiples pantallas. Hay que identificarlo
y reemplazarlo por el nuevo SuccessAnimation en todos
los lugares donde se muestra feedback de éxito visual.

Alcance:
1. Buscar en src/ el componente actual de animación/toast
   de éxito (puede llamarse SuccessToast, Toast, ToastMessage,
   o similar). Identificar todos los archivos que lo usan.

2. En cada pantalla/componente que muestre animación de éxito,
   reemplazar el componente actual por SuccessAnimation:
   - Agregar estado: showSuccess (boolean) y successMessage (string)
   - Al completar una acción exitosa: setSuccessMessage('...'),
     setShowSuccess(true)
   - En el JSX: <SuccessAnimation
       visible={showSuccess}
       message={successMessage}
       onHide={() => setShowSuccess(false)}
     />
   - Quitar el toast/animación anterior

3. Lugares donde SEGURO hay animación de éxito (verificar
   y reemplazar todos):
   - Modificar asistencia
   - Crear juntada
   - Editar juntada
   - Transferir organizador
   - Finalizar juntada
   - Subir foto de portada
   - Guardar perfil
   - Cambiar contraseña
   - Cualquier otro que encuentres

No hacer:
- No tocar la lógica de negocio de ninguna pantalla
- No cambiar los mensajes de éxito existentes
- No hacer commits

Archivos esperados:
- src/shared/components/SuccessAnimation.tsx (usado en todos)
- Todas las pantallas donde se reemplazó el toast

---

### Tarea 4 — Animaciones de transición en TeamRandomizer

Contexto:
Las transiciones al mezclar equipos y al volver a configurar
en TeamRandomizerScreen no son fluidas.

Alcance:
En src/features/games/screens/TeamRandomizerScreen.tsx:

1. Transición de Paso 1 → Paso 2 (formar equipos):
   - El contenido del paso 1 hace slide out hacia la izquierda
   - El contenido del paso 2 entra desde la derecha
   - Duración: 300ms, easing: ease-in-out

2. Transición de Paso 2 → Paso 1 (volver a configurar):
   - El contenido del paso 2 hace slide out hacia la derecha
   - El contenido del paso 1 entra desde la izquierda
   - Duración: 300ms

3. Al presionar "Mezclar de nuevo":
   - Los equipos actuales hacen fade out + scale down
   - Los nuevos equipos hacen fade in + scale up
   - Duración: 400ms

Usar Animated de React Native, sin librerías externas.

No hacer:
- No cambiar la lógica de formación de equipos
- No hacer commits

Archivos esperados:
- src/features/games/screens/TeamRandomizerScreen.tsx

---

### Tarea 5 — Documentar este prompt

Crear ia/entrega-2/prompts/bloque-7/03_animaciones_visual.md
con el contenido completo de este prompt.

Actualizar ia/entrega-2/indice_ia.md agregando:
[número siguiente] - Bloque 7b: nueva animación de éxito global,
  íconos de app actualizados, animaciones TeamRandomizer

No hacer:
- No tocar archivos de código fuera de los indicados
- No hacer commits

Archivos esperados:
- ia/entrega-2/prompts/bloque-7/03_animaciones_visual.md
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
2. Decisiones de diseño tomadas
3. Cómo probarlo en dispositivo

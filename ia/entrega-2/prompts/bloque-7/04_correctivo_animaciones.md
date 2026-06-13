# Bloque 7b — Correctivo animaciones

## Corrección 1 — Texto visible más tiempo en SuccessAnimation

Problema:
El texto que aparece debajo del checkmark se ve por muy
poco tiempo y no se alcanza a leer.

Alcance:
En src/shared/components/SuccessAnimation.tsx:

Extender la duración total de ~1.5s a ~2.5s:
- Fase 1 (círculo): 0-400ms — sin cambios
- Fase 2 (checkmark): 300-700ms — sin cambios  
- Fase 3 (destellos): 500-900ms — sin cambios
- Fase 4 (texto): 700-1000ms fade in — sin cambios
- Nueva Fase 5 (espera): 1000-2000ms — TODO visible, sin animación
- Fase 6 (fade out): 2000-2500ms — fade out suave de todo

El texto debe ser visible y legible durante al menos 1 segundo
completo antes de empezar a desaparecer.

No hacer:
- No cambiar el diseño visual
- No cambiar los destellos ni el checkmark
- No hacer commits

Archivos esperados:
- src/shared/components/SuccessAnimation.tsx

---

## Corrección 2 — Nuevo componente ErrorAnimation

Crear src/shared/components/ErrorAnimation.tsx

Debe ser idéntico a SuccessAnimation en estructura y timing,
con estas diferencias:

Visual:
- Círculo de fondo: color rojo (#EF4444) con gradiente
  hacia rojo oscuro (#DC2626)
- Borde rotatorio: rojo claro (#FCA5A5)
- En lugar del checkmark: una X (usando dos líneas o
  el texto "✕" o ícono close de @expo/vector-icons)
- Destellos: color rojo (#FCA5A5) en lugar del violeta/rosa
- Texto: color blanco igual que SuccessAnimation
- Haptic: Haptics.notificationAsync(NotificationFeedbackType.Error)
  en lugar del haptic de éxito

Props identicos a SuccessAnimation:
- message: string
- visible: boolean
- onHide: () => void

---

## Corrección 3 — Reemplazar toasts de error por ErrorAnimation

Alcance:
Buscar en src/ todos los lugares donde se muestra
un toast o mensaje de error al usuario (no errores de
consola, sino errores visibles al usuario tipo:
"Los nombres no pueden repetirse", "Error al guardar", etc.)
y reemplazarlos por ErrorAnimation.

Lugares prioritarios donde hay errores visibles:
- Juegos (nombres duplicados, validaciones)
- Formularios de juntada (errores de guardado)
- Perfil (errores al guardar, contraseña incorrecta)
- Cualquier otro lugar donde haya toast de error visible

Mismo patrón que SuccessAnimation:
- Estado: showError (boolean) y errorMessage (string)
- Al error: setErrorMessage('...'), setShowError(true)
- En JSX: <ErrorAnimation
    visible={showError}
    message={errorMessage}
    onHide={() => setShowError(false)}
  />

No hacer:
- No cambiar los mensajes de error existentes
- No tocar errores de consola o logs
- No hacer commits

Archivos esperados:
- src/shared/components/ErrorAnimation.tsx (nuevo)
- Pantallas donde se reemplazaron los toasts de error

---

## Corrección 4 — Documentar este prompt

Crear ia/entrega-2/prompts/bloque-7/04_correctivo_animaciones.md
con el contenido completo de este prompt.

No hacer:
- No tocar archivos fuera de los indicados
- No hacer commits

Archivos esperados:
- ia/entrega-2/prompts/bloque-7/04_correctivo_animaciones.md

---

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- No hacer commits
- Reportar archivos modificados al finalizar

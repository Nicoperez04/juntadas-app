# Prompt — Bloque 5: Recuerdos (Fixes)

Fixes — Bloque 5: Recuerdos

## Fix 1 — Refresh al eliminar desde MemoryViewerScreen

**Problema:** Al eliminar una foto desde la vista ampliada (MemoryViewerScreen), el toast de éxito aparece pero la galería no se actualiza hasta que el usuario sale y vuelve a entrar.

**Causa probable:** deletePhoto del hook se llama desde MemoryViewerScreen pero el refresh() no se propaga de vuelta a MemoriesGalleryScreen.

**Fix:** En MemoriesGalleryScreen.tsx, al navegar al viewer pasá un callback onDelete como param:

```typescript
navigation.navigate(Routes.MemoryViewer, {
  memories,
  initialIndex: index,
  meetupId,
  onDelete: (memoryId: string) => {
    setMemories(prev => prev.filter(m => m.id !== memoryId));
  }
})
```

En MemoryViewerScreen.tsx, después de eliminar exitosamente:

- Llamar route.params.onDelete(memoryId)
- Si quedan fotos en el viewer, navegar a la foto anterior o siguiente
- Si era la última foto, cerrar el viewer automáticamente con navigation.goBack()

Actualizá MainStackParamList en types.ts para incluir onDelete en los params de MemoryViewer.

## Fix 2 — Ayuda sobre cómo eliminar fotos

**Problema:** No hay indicación visible de cómo eliminar una foto. El usuario no sabe que tiene que mantener presionado.

**Fix:** Dos cambios:

### A — Tooltip en primera visita

En MemoriesGalleryScreen.tsx, mostrar un tooltip o snackbar informativo la primera vez que el usuario entra a la galería con fotos. Usar AsyncStorage para recordar si ya se mostró:

```typescript
// Al cargar la galería con fotos por primera vez:
const hasSeenTip = await AsyncStorage.getItem('memories_delete_tip_shown');
if (!hasSeenTip && memories.length > 0) {
  setShowDeleteTip(true);
  await AsyncStorage.setItem('memories_delete_tip_shown', 'true');
}
```

El tooltip debe decir: "💡 Mantené presionada una foto para eliminarla" — aparece como un banner sutil en la parte inferior de la pantalla durante 3 segundos, similar al Toast existente.

### B — Botón de ayuda (?) en el header

En MemoriesGalleryScreen.tsx, agregar un ícono help-circle-outline en el header derecho (al lado del botón de subir si está activa). Al tocarlo mostrar un modal con las instrucciones:

**Cómo usar Recuerdos**

📸 **Subir fotos**
Tocá el botón + para subir fotos desde tu galería. Podés elegir varias a la vez.

🔍 **Ver en detalle**
Tocá cualquier foto para verla en pantalla completa. Deslizá para navegar entre fotos.

🗑️ **Eliminar fotos**
Mantené presionada una foto tuya para eliminarla, o usá el ícono de papelera en la vista de detalle.

Mismo diseño que el modal "Cómo se juega" del Impostor — fondo semitransparente, card centrada, pasos numerados, botón "Entendido".

## Restricciones

- No instalar dependencias nuevas
- No hacer commits
- Comentar cambios en español
- No modificar archivos fuera de los mencionados

## Al finalizar reportá

- Archivos modificados
- Cómo quedó el callback onDelete entre pantallas
- Cómo quedó el tooltip de primera visita
- Puntos pendientes de validación

# Bloque 3 — Corrección 2: diseño, buscador, bottom sheet y animaciones

## Contexto
Rama actual: feature/bloque-3-historial-mejorado
Corrección anterior mejoró el layout general pero quedan problemas concretos.
Este prompt los resuelve sin tocar lógica de negocio ni hooks.

---

### Corrección 1 — Buscador bloqueado

Problema:
Al tocar el buscador hace el efecto hover pero no permite escribir.
Hay un componente (TouchableOpacity, Pressable o View) encima del TextInput
que intercepta el toque antes de que llegue al input.

Alcance:
En MeetupHistoryScreen.tsx revisar el contenedor del buscador:
- Eliminar cualquier TouchableOpacity o Pressable que envuelva al TextInput
- El TextInput debe ser directamente tocable sin wrapper que lo bloquee
- El estado de focus (borde violeta + sombra) debe activarse con onFocus del TextInput
- El estado blur debe activarse con onBlur del TextInput
- Verificar que al tocar el input aparece el teclado correctamente

No hacer:
- No cambiar el diseño visual del buscador
- No tocar la lógica de búsqueda

Archivos esperados:
- src/features/meetups/screens/MeetupHistoryScreen.tsx

---

### Corrección 2 — Bottom sheet: altura y compactación

Problema:
Al abrir el bottom sheet los botones "Aplicar filtros" y "Limpiar filtros"
no son visibles hasta que el usuario desliza hacia arriba.
El contenido actual (3 secciones: Estado, Rol, Fecha) debería caber
perfectamente sin necesidad de scroll con el contenido actual.

Alcance:
En MeetupHistoryScreen.tsx:

1. Usar enableDynamicSizing={true} en BottomSheetModal para que
   el sheet se ajuste automáticamente al contenido real

2. Si enableDynamicSizing no está disponible en la versión instalada,
   calcular la altura fija del contenido:
   - Título: ~50dp
   - Sección Estado (label + chips + wrap): ~100dp
   - Sección Rol (label + chips): ~80dp
   - Sección Fecha (label + dos inputs): ~100dp
   - Botones (Aplicar + Limpiar): ~120dp
   - Padding top/bottom: ~40dp
   Total estimado: ~490dp
   Usar snapPoints={['auto']} o un único snap point calculado

3. El sheet debe abrirse mostrando TODO el contenido visible
   sin necesidad de deslizar. Con los filtros actuales no hace falta scroll.

4. Cuando en el futuro haya más filtros y no entren, ahí sí tendrá
   sentido el scroll interno. Por ahora el objetivo es que todo entre.

5. Compactar el espaciado interno del sheet:
   - Reducir paddingVertical entre secciones
   - Chips más compactos (paddingVertical más chico)
   - Reducir altura de los inputs de fecha

No hacer:
- No cambiar la funcionalidad de los filtros
- No quitar ninguna sección

Archivos esperados:
- src/features/meetups/screens/MeetupHistoryScreen.tsx

---

### Corrección 3 — Selección múltiple en filtro de estado

Problema:
Actualmente el filtro de estado es de selección única.
Se necesita selección múltiple para poder ver por ejemplo
Activas + Canceladas al mismo tiempo.

Comportamiento nuevo:
- "Todas" = sin filtro aplicado, muestra todo (seleccionado por defecto)
- "Activas", "Finalizadas", "Canceladas" = selección múltiple independiente
- Al seleccionar cualquiera de las tres, "Todas" se deselecciona
- Si se deseleccionan todas las opciones individuales, vuelve a "Todas"
- En la pantalla principal, el chip activo muestra los estados seleccionados:
  "Estado: Activas, Canceladas ×"

Alcance:
En MeetupHistoryScreen.tsx:
1. Cambiar el estado de selectedStatus de string a string[]
2. Lógica de selección:
   - Si toca "Todas": limpiar el array → []
   - Si toca una opción individual: agregarla o quitarla del array
   - Si el array queda vacío: equivale a "Todas"
3. La lógica de filtrado client-side debe actualizar:
   - Si array vacío: no filtrar por estado
   - Si array con valores: mostrar solo juntadas cuyo status esté en el array
4. El chip activo en la pantalla principal muestra los estados seleccionados
   separados por coma

No hacer:
- No cambiar la lógica de selección de Rol (sigue siendo única)
- No cambiar la lógica de fechas

Archivos esperados:
- src/features/meetups/screens/MeetupHistoryScreen.tsx

---

### Corrección 4 — Animaciones de éxito faltantes

Problema:
Las acciones nuevas del Bloque 3 no tienen toast + haptic de éxito.

Alcance:
Revisar todas las acciones nuevas implementadas en este bloque y
agregar toast ✓ + triggerSuccessHaptic() donde falte:

1. Ocultar juntada (desde historial swipe y desde detalle)
   → toast: "✓ Juntada ocultada de tu historial"

2. Eliminar juntada para todos (desde historial swipe y desde detalle)
   → toast: "✓ Juntada eliminada"

3. Reactivar juntada (desde detalle)
   → verificar si ya tiene toast, si no: "✓ Juntada reactivada"

Usar exactamente el mismo patrón de toast y haptic que usan
las acciones existentes (cancelar juntada, transferir organizador, etc.)

No hacer:
- No cambiar la lógica de las acciones
- No instalar librerías

Archivos esperados:
- src/features/meetups/screens/MeetupHistoryScreen.tsx
- src/features/meetups/screens/MeetupDetailScreen.tsx
- src/features/meetups/components/MeetupOrganizerActions.tsx
  (solo si reactivar no tiene toast)

---

### Corrección 5 — Documentar este prompt

Crear ia/entrega-2/prompts/bloque-3/02_correctivo_diseno_historial.md
con el contenido completo de este prompt.

Actualizar ia/entrega-2/indice_ia.md agregando:
26 - Corrección diseño historial: buscador, bottom sheet, selección múltiple y animaciones

No hacer:
- No tocar archivos de código
- No hacer commits

Archivos esperados:
- ia/entrega-2/prompts/bloque-3/02_correctivo_diseno_historial.md
- ia/entrega-2/indice_ia.md (actualizado)

---

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- Seguir tokens de src/shared/constants/theme.ts
- No hacer commits
- Reportar cambios realizados al finalizar cada corrección
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar
Resumen con:
1. Cambios realizados por corrección
2. Decisiones tomadas
3. Cómo probarlo en dispositivo

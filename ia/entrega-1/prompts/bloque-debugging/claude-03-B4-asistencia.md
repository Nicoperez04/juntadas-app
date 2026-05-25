# Fix B4 — Modal de asistencia: no se cierra después de guardar

## Prompt 1 — Diagnóstico inicial

### Contexto del proyecto
App móvil Juntadas, React Native + Expo SDK 55 + TypeScript estricto.
El modal de modificación de asistencia (ModifyAttendanceScreen) es un
bottom sheet custom con animaciones propias (Animated API de React Native).
El Toast es un componente de feedback transitorio que usa su propio Modal
con animaciones fade in/out.

Ambos componentes viven en:
- src/features/participants/screens/ModifyAttendanceScreen.tsx
- src/shared/components/Toast.tsx

Se usan en dos pantallas:
- src/features/meetups/screens/MeetupDetailScreen.tsx
- src/features/participants/screens/ParticipantListScreen.tsx

### Comportamiento esperado
Al guardar una modificación de asistencia exitosamente:
1. El bottom sheet se cierra con su animación (slide down + fade overlay)
2. Una vez cerrado completamente, aparece el Toast de éxito centrado
3. El Toast se muestra una sola vez durante 2 segundos y desaparece

### Comportamiento actual (bug)
Al guardar exitosamente:
- La animación de éxito aparece duplicada (dos flashes del Toast)
- El modal vuelve a mostrarse brevemente después de cerrarse
- El Toast y el cierre del modal se superponen visualmente

### Causa raíz identificada

El flujo actual en ambas pantallas es:

  onSave={async (status) => {
    await participantService.updateAttendance(...);
    setToast({ message: '✓ Asistencia actualizada', type: 'success' }); // ← PROBLEMA
  }}
  onClose={() => setAttendanceModalTarget(null)}

El problema está en el timing: ModifyAttendanceScreen.handleSave() llama
a onSave() y luego llama a closeModal() internamente. closeModal() ejecuta
una animación asíncrona de 280ms (slide down) + 220ms (fade overlay) antes
de desmontarse. Durante esa animación, el padre ya recibió el setToast y
monta el componente Toast, que a su vez crea su propio Modal. Dos Modales
de React Native animando en simultáneo producen el comportamiento duplicado.

La solución es separar el setToast del onSave y moverlo al onClose,
que se dispara después de que la animación de cierre del sheet terminó
completamente. Para pasar información de éxito entre ambos callbacks
se usa una ref interna.

### Solución propuesta

En cada pantalla (MeetupDetailScreen y ParticipantListScreen):

1. Agregar una ref para transportar el mensaje de éxito entre callbacks:
   const pendingToastRef = useRef<string | null>(null);

2. En onSave: ejecutar el servicio y guardar el mensaje en la ref,
   pero NO llamar a setToast todavía.

3. En onClose: leer la ref, mostrar el Toast si hay mensaje pendiente,
   y limpiar la ref.

### Cambios a aplicar

#### Archivo 1 — src/features/meetups/screens/MeetupDetailScreen.tsx

Cambio 1.1 — Agregar ref para el mensaje pendiente cerca de los otros
useState y useRef del componente:

  /**
   * Transporta el mensaje de Toast entre onSave y onClose del modal de
   * asistencia. Se usa ref en lugar de estado para no generar re-renders
   * intermedios durante la animación de cierre del bottom sheet.
   */
  const pendingToastRef = useRef<string | null>(null);

Cambio 1.2 — Modificar el bloque onSave del ModifyAttendanceScreen.
Eliminar los setToast del onSave y reemplazarlos por
pendingToastRef.current = '✓ Asistencia actualizada' en cada rama.
Mantener loadData() y refreshParticipants() en el onSave.

Cambio 1.3 — Modificar el onClose del ModifyAttendanceScreen:

  onClose={() => {
    setAttendanceModalTarget(null);
    if (pendingToastRef.current) {
      setToast({ message: pendingToastRef.current, type: 'success' });
      pendingToastRef.current = null;
    }
  }}

#### Archivo 2 — src/features/participants/screens/ParticipantListScreen.tsx

Aplicar exactamente el mismo patrón que en MeetupDetailScreen.

### Restricciones
- Solo modificar MeetupDetailScreen.tsx y ParticipantListScreen.tsx
- No modificar ModifyAttendanceScreen.tsx ni Toast.tsx
- No modificar participantService.ts ni useParticipants.ts
- No instalar dependencias nuevas
- No hacer commits

### Al finalizar reportá
1. Lista exacta de archivos modificados con path completo
2. Líneas aproximadas donde quedó cada cambio en cada archivo
3. Nombres exactos de las funciones del servicio encontradas
4. Confirmación de que useRef estaba o no importado previamente
5. Diferencias entre cómo ambas pantallas manejan el onSave
6. Cualquier inconsistencia encontrada
7. Verificación de que no quedaron llamadas a setToast dentro del onSave

---

## Prompt 2 — Fix correcto basado en capturas de pantalla

### Contexto
El fix anterior (B4 Prompt 1) movió correctamente el setToast del onSave
al onClose mediante pendingToastRef. Sin embargo el modal sigue sin cerrarse
después de guardar porque el onSave ahora llama await loadData() y await
refreshParticipants() que hacen queries a Supabase. ModifyAttendanceScreen.
handleSave() espera que onSave() resuelva antes de llamar a closeModal().
Las queries bloquean esa espera y el usuario ve el modal congelado con el
Toast encima.

### Causa raíz real
En ModifyAttendanceScreen.tsx (no modificar este archivo), handleSave hace:

  await onSave(selectedStatus);  // espera que el padre termine TODO
  await closeModal();            // recién entonces cierra

El onSave del padre no debería hacer operaciones lentas — solo la escritura
mínima necesaria. Las recargas de datos (loadData, refresh) deben moverse
al onClose que se llama después de que el sheet terminó de animarse.

### Comportamiento esperado post-fix
1. Usuario toca Guardar
2. onSave — solo escritura a Supabase (~200ms) — rápido
3. ModifyAttendanceScreen anima el cierre del sheet (~500ms)
4. onClose — recarga datos en background + muestra Toast
5. Toast aparece una sola vez con el sheet ya cerrado

### Cambios a aplicar

#### Archivo 1 — src/features/meetups/screens/MeetupDetailScreen.tsx

Leé el archivo completo antes de modificar.

El onSave debe quedar solo con la operación de escritura al servicio,
el error check y el seteo de la ref. Sin await loadData() ni await
refreshParticipants(). Usar los nombres exactos de funciones que ya
existen en el archivo — no inventar nombres.

El onClose debe quedar con las recargas en background más el Toast:

  onClose={() => {
    setAttendanceModalTarget(null);
    void loadData();
    void refreshParticipants();
    if (pendingToastRef.current) {
      setToast({ message: pendingToastRef.current, type: 'success' });
      pendingToastRef.current = null;
    }
  }}

#### Archivo 2 — src/features/participants/screens/ParticipantListScreen.tsx

Leé el archivo completo antes de modificar.

Aplicar el mismo patrón. Verificar si tiene loadData, refresh u otra
función de recarga — usar la que exista en ese archivo.

El onClose debe quedar:

  onClose={() => {
    setAttendanceModalTarget(null);
    void refresh();
    if (pendingToastRef.current) {
      setToast({ message: pendingToastRef.current, type: 'success' });
      pendingToastRef.current = null;
    }
  }}

### Restricciones
- Solo modificar MeetupDetailScreen.tsx y ParticipantListScreen.tsx
- No modificar ModifyAttendanceScreen.tsx ni Toast.tsx
- No modificar participantService.ts ni useParticipants.ts
- No hacer commits
- Usar nombres de funciones exactos que ya existen en cada archivo

### Al finalizar reportá
1. Archivos modificados con path exacto
2. Líneas aproximadas de cada cambio
3. Funciones de recarga encontradas en cada archivo
4. Cómo quedó el onSave en cada archivo (solo escritura, sin recargas)
5. Cómo quedó el onClose en cada archivo (con recargas y Toast)
6. Cualquier inconsistencia encontrada
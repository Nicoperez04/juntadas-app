# Fixes UX — Bloque 3: Toast, asistencia y participantes

## Contexto

App Juntadas, React Native + Expo SDK 55 + TypeScript. Sistema de diseño en `theme.ts`.

---

## Fix 1 — Rediseño completo del Toast

Reemplazá completamente `mobile/src/shared/components/Toast.tsx` con un diseño centrado en pantalla:

- **Posición:** centrado horizontal y verticalmente en la pantalla (no en la parte superior)
- **Forma:** card cuadrada/redondeada de aproximadamente 140x140px
- **Contenido:** ícono grande (48px) arriba, texto debajo
- **Para success:** ícono `checkmark-circle` de Ionicons en `theme.colors.success` con fondo `theme.colors.successLight`
- **Para error:** ícono `alert-circle` en `theme.colors.error` con fondo `theme.colors.errorLight`
- **Fondo del card:** `theme.colors.surface` con sombra `theme.shadows.md`
- **Border radius:** `theme.radius.xl`
- **Animación de entrada:** fade in con `Animated.timing` opacidad 0→1 en 200ms
- **Animación de salida:** fade out 1→0 en 200ms antes de ocultarse
- **Overlay:** fondo semitransparente muy sutil (`rgba(0,0,0,0.15)`) que no bloquea visualmente
- **Duración visible:** 2 segundos entre entrada y salida
- El `onHide` se llama después de la animación de salida

```typescript
interface ToastProps {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
  onHide: () => void;
}
```

---

## Fix 2 — Modal de modificar asistencia

El componente `ModifyAttendanceScreen` se usa como modal bottom sheet. Los problemas son: fondo negro al aparecer/desaparecer, animación no fluida, y diseño desalineado.

Reemplazá la implementación actual en `mobile/src/features/participants/screens/ModifyAttendanceScreen.tsx`:

- Usar `Modal` nativo con `animationType="slide"` y `transparent={true}`
- Overlay: `rgba(0,0,0,0.4)` con `Animated.timing` opacity 0→0.4 en 250ms al abrir, 0.4→0 al cerrar
- El card del bottom sheet debe tener: `borderTopLeftRadius: theme.radius.xl`, `borderTopRightRadius: theme.radius.xl`, fondo `theme.colors.surface`
- Handle visual arriba del card: línea gris centrada de 40x4px
- Título "Modificar asistencia" bold
- Subtítulo "Elegí cómo querés que figure tu asistencia" en gris
- Tres opciones como filas tocables, cada una con: ícono a la izquierda (`checkmark-circle` verde para confirmado, `time` amarillo para pendiente, `close-circle` rojo para declinado), texto principal bold, descripción secundaria en gris, y checkmark a la derecha si es la opción actualmente seleccionada
- Al tocar una opción: llamar a `onSelect(status)` inmediatamente y cerrar con animación suave
- Botón "Cancelar" al pie, ghost
- La animación de cierre debe completarse antes de llamar `onClose`

Props:

```typescript
interface ModifyAttendanceProps {
  visible: boolean;
  currentStatus: AttendanceStatus;
  onSelect: (status: AttendanceStatus) => void;
  onClose: () => void;
}
```

---

## Fix 3 — Nombres de participantes

En `MeetupDetailScreen.tsx` y `ParticipantListScreen.tsx`, los participantes muestran `@user_xxxxx` en lugar del nombre real porque el trigger de Supabase creó perfiles con `full_name` vacío.

**Parte A — En el código:** En el componente `ParticipantItem` de MeetupDetailScreen y en la lista de ParticipantListScreen, mostrá el nombre así:

```typescript
// Mostrar full_name si existe, sino el username, sino 'Usuario'
const displayName = participant.profile.fullName?.trim()
  ? participant.profile.fullName
  : participant.profile.username ?? 'Usuario';
```

**Parte B — SQL para corregir perfiles existentes:** Agregá este comentario en el código con el SQL que hay que ejecutar manualmente en Supabase:

```sql
-- Ejecutar en Supabase SQL Editor para corregir perfiles existentes:
-- UPDATE profiles
-- SET full_name = username
-- WHERE full_name = '' OR full_name IS NULL;
```

---

## Fix 4 — Botón "Modificar asistencia" en DetailScreen

En `MeetupDetailScreen.tsx`, el botón "Modificar asistencia" está mal ubicado. Debe:

- Estar dentro de la sección de participantes, debajo de la lista, con `marginTop: theme.spacing.md`
- Ser un botón ghost (borde violeta, texto violeta, fondo transparente) usando `AppButton` con `variant="ghost"`
- Solo visible si el usuario actual es participante (no organizador) y la juntada está activa
- Tener el mismo ancho que la lista de participantes

---

## Restricciones

- No instalar dependencias nuevas
- No hacer commits
- Comentar código nuevo en español
- No modificar archivos fuera de los mencionados

---

## Al finalizar reportá

- Archivos modificados
- Cómo quedó la animación del Toast
- Cómo quedó la animación del modal de asistencia
- SQL para corregir perfiles (confirmar que está como comentario en el código)
- Puntos pendientes

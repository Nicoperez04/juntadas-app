# Fixes — Bloque 3: Participantes y acciones

## Fix 1 — CRÍTICO: Unirse con código falla por RLS

Al intentar unirse a una juntada con un código válido desde otra cuenta, aparece "Juntada no encontrada o código inválido". El problema es que la política RLS de meetups solo permite ver juntadas donde el usuario ya es participante — pero para unirse necesitás poder leer la juntada antes de ser participante.

**Solución:** En Supabase SQL Editor, ejecutá:

```sql
-- Permitir que cualquier usuario autenticado busque juntadas por join_code
CREATE POLICY "meetups: select by join_code"
  ON meetups FOR SELECT
  USING (
    status = 'active'
    AND auth.uid() IS NOT NULL
  );
```

Esto permite que cualquier usuario autenticado pueda buscar una juntada activa para unirse. La política existente que restringe por participación sigue vigente para el resto de las consultas.

**Nota:** Este fix se aplica en Supabase directamente, no en el código. Documentalo en el reporte.

---

## Fix 2 — Hora con :00 extra en EditMeetupScreen

Al cargar EditMeetupScreen, la hora llega de Supabase en formato HH:MM:SS (ej: 18:15:00) pero el schema Zod espera HH:MM. Esto hace que la validación falle al intentar guardar sin cambios.

En `mobile/src/features/meetups/screens/EditMeetupScreen.tsx`, al inicializar el formulario con los datos existentes, convertí la hora antes de pasarla al defaultValues:

```typescript
// Convertir HH:MM:SS a HH:MM al cargar
const formatTimeForForm = (time: string): string => {
  if (!time) return '';
  // Si viene con segundos (HH:MM:SS), tomar solo HH:MM
  return time.length > 5 ? time.substring(0, 5) : time;
};
```

Aplicá esta función al campo `time` en los `defaultValues` del formulario.

---

## Fix 3 — Estado de juntada cancelada en DetailScreen

Cuando una juntada está cancelada o finalizada, MeetupDetailScreen debe:

- Mostrar un banner prominente al tope de la pantalla con el estado (rojo para cancelada, gris para finalizada) — texto: "Esta juntada fue cancelada" o "Esta juntada ya finalizó"
- Ocultar la sección "Compartir juntada" completamente (el código no tiene sentido en juntadas no activas)
- Ocultar el botón "Cancelar juntada"
- Ocultar los botones "Jugar" y "Recuerdos" si la juntada está cancelada
- Deshabilitar el botón "Editar" si la juntada está cancelada

---

## Fix 4 — Dialog de cancelar juntada

Reemplazá el `Alert.alert` nativo por un modal personalizado consistente con el diseño de la app. El modal debe tener:

- Fondo semitransparente oscuro
- Card centrada con border radius `theme.radius.lg`
- Ícono de advertencia en rojo
- Título "Cancelar juntada" en bold
- Subtítulo "Esta acción no se puede deshacer. Todos los participantes perderán acceso a la juntada."
- Dos botones: "No, volver" (ghost) y "Sí, cancelar" (destructivo, fondo rojo)

---

## Fix 5 — Feedback de éxito con toast

Implementá un componente Toast simple en `mobile/src/shared/components/Toast.tsx` que muestre un mensaje flotante en la parte superior de la pantalla durante 2.5 segundos. Props: `message: string`, `type: 'success' | 'error'`.

Usá este Toast en:

- **EditMeetupScreen** — al guardar cambios exitosamente: "✓ Juntada actualizada"
- **MeetupDetailScreen** — al cancelar exitosamente: "Juntada cancelada"
- **MeetupDetailScreen** — al copiar el código: "✓ Código copiado" (reemplaza el cambio de ícono actual)

---

## Restricciones

- No instalar dependencias nuevas
- No hacer commits
- Comentar código nuevo en español
- No modificar archivos fuera de los mencionados

---

## Al finalizar reportá

- Archivos modificados
- Confirmación del fix de RLS (se aplica en Supabase, no en código)
- Cómo quedó el banner de estado en DetailScreen
- Cómo quedó el Toast implementado
- Puntos pendientes de validación

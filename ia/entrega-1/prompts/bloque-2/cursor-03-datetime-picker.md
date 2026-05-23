Fix — Selectores nativos de fecha y hora en CreateMeetupScreen

## Contexto del proyecto

App móvil Juntadas, React Native + Expo SDK 55 + TypeScript. El sistema de diseño está en `mobile/src/shared/constants/theme.ts`. Los componentes base están en `mobile/src/shared/components/`.

## Problema

En `mobile/src/features/meetups/screens/CreateMeetupScreen.tsx`, los campos de fecha y hora son inputs de texto libre. El usuario no puede ingresar la barra `/` en el campo de fecha ni los dos puntos `:` en el campo de hora porque el teclado numérico no los incluye. Hay que reemplazarlos por selectores nativos.

## Solución requerida

### Paso 1 — Verificar disponibilidad de DateTimePicker

Verificá si `@react-native-community/datetimepicker` está disponible en `node_modules`. Si está disponible usalo. Si no está disponible, instalalo con:

```bash
npx expo install @react-native-community/datetimepicker
```

Este paquete es compatible con Expo SDK 55 — no contradice las restricciones del proyecto.

### Paso 2 — Implementar el selector de fecha

Reemplazá el input de texto de fecha por un botón que al tocarse abra el DateTimePicker nativo en modo `date`. El botón debe mostrar la fecha seleccionada formateada como DD/MM/YYYY o el placeholder "Seleccioná una fecha" si no hay fecha elegida.

El estado interno debe guardar un objeto `Date`, no un string. La conversión a string DD/MM/YYYY es solo para mostrar en pantalla y para enviar al servicio.

En Android el picker se muestra como diálogo modal. En iOS se muestra inline o como modal según el modo — usá `mode="date"` con `display="default"`.

La fecha mínima permitida debe ser hoy (`new Date()`).

### Paso 3 — Implementar el selector de hora

Igual que la fecha pero con `mode="time"`. El botón debe mostrar la hora formateada como HH:MM o el placeholder "Seleccioná una hora".

En Android usar `display="default"` que muestra el reloj nativo. En iOS usar `display="spinner"`.

### Paso 4 — Integrar con React Hook Form

Los campos `date` y `time` del formulario siguen siendo strings en el schema de Zod (`createMeetupSchema`). Al seleccionar una fecha u hora del picker, convertí el objeto Date a string y llamá a `setValue('date', formattedDate)` y `setValue('time', formattedTime)` del hook form para mantener la integración con la validación.

Los errores de validación deben seguir mostrándose debajo del botón selector si el campo está vacío al intentar enviar.

### Paso 5 — Diseño de los botones selectores

Los botones deben seguir el sistema de diseño del proyecto (`theme.ts`). Deben verse como los inputs existentes — mismo alto (`theme.components.inputHeight`: 52px), mismo borde (`theme.colors.border`), mismo border radius (`theme.radius.md`), con el ícono a la izquierda y el texto a la derecha. Si hay un error de validación, el borde debe cambiar a `theme.colors.error` igual que los inputs.

## Restricciones

- No modificar `app.json`, `tsconfig.json` sin avisar
- No modificar `AppNavigator.tsx`, `client.ts`, `env.ts`
- No hacer commits
- Comentar el código nuevo en español explicando el por qué
- Usar siempre `StyleSheet.create`
- Si necesitás instalar `@react-native-community/datetimepicker`, informalo en el reporte

## Al finalizar reportá

- Si fue necesario instalar la dependencia y con qué comando
- Archivos modificados
- Cómo quedó el manejo del estado de fecha y hora internamente
- Cualquier diferencia de comportamiento entre Android e iOS que el equipo deba conocer
- Puntos pendientes de validación

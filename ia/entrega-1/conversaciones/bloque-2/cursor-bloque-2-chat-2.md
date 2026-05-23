# Conversación Bloque 2 — Juntadas (Chat 2: DateTime Picker)

**Herramienta:** Cursor Agent
**Fecha:** 23/05/2026
**Rama:** feature/bloque-2-meetups

---

## Resumen

Fix del selector de fecha y hora en `CreateMeetupScreen`.

### Lo que se implementó

- Reemplazo de `TextInput` por `DateTimePicker` nativo (`@react-native-community/datetimepicker`)
- `TouchableOpacity` que abre el picker al tocar
- Integración con React Hook Form vía `setValue` y `watch`
- Comportamiento diferenciado Android/iOS (`display="default"` en ambos; `is24Hour` en hora)
- Instalación de `@react-native-community/datetimepicker@8.6.0` y plugin en `app.json` (automático por Expo)

### Problemas encontrados y resueltos

- Primera implementación con subcomponentes (`DatePickerField` / `TimePickerField`) no abría el picker en dispositivo — reemplazada por estado inline en la pantalla principal
- Logs de diagnóstico temporales agregados y removidos tras confirmar el fix

---

## Sesión 1 — Selectores nativos de fecha y hora

### Prompt

→ [`prompts/bloque-2/cursor-03-datetime-picker.md`](../../prompts/bloque-2/cursor-03-datetime-picker.md)

Reemplazar inputs de texto por `DateTimePicker` nativo con botones estilo input, integración Zod/RHF y fecha mínima hoy.

### Respuesta

Se instaló `@react-native-community/datetimepicker` con `npx expo install`. Se implementaron componentes con `TouchableOpacity` + picker condicional. Estado interno en objetos `Date`, strings DD/MM/YYYY y HH:MM para el formulario.

**Archivo modificado:** `mobile/src/features/meetups/screens/CreateMeetupScreen.tsx`

---

## Sesión 2 — Fix: picker no se abría al tocar

### Prompt

→ [`prompts/bloque-2/cursor-04-datetime-picker-fix.md`](../../prompts/bloque-2/cursor-04-datetime-picker-fix.md)

Los campos seguían comportándose como inputs de texto. Reimplementar con estado `showDatePicker` / `showTimePicker` directamente en `CreateMeetupScreen`, handlers `handleDateChange` / `handleTimeChange` y estilos `dateButton`.

### Respuesta

Se eliminaron los subcomponentes encapsulados. La pantalla usa:

```typescript
const [showDatePicker, setShowDatePicker] = useState(false);
const [showTimePicker, setShowTimePicker] = useState(false);
const [selectedDate, setSelectedDate] = useState<Date>(new Date());
const [selectedTime, setSelectedTime] = useState<Date>(new Date());
```

`TouchableOpacity` + `{showDatePicker && <DateTimePicker ... />}` con `watch('date')` / `watch('time')` para el texto del botón.

**Archivo modificado:** `mobile/src/features/meetups/screens/CreateMeetupScreen.tsx`

---

## Sesión 3 — Limpieza de logs de diagnóstico

Tras confirmar que el picker y el home funcionaban, se removieron los `console.log` temporales (`// TODO: remover`) de `useMeetups.ts` y `meetupService.ts`.

---

## Conversación completa

La evidencia consolidada de este chat está en este archivo y en los prompts referenciados arriba (`cursor-03`, `cursor-04`).

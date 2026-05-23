Fix — Selectores nativos de fecha y hora no funcionan

## Problema

En `mobile/src/features/meetups/screens/CreateMeetupScreen.tsx` los campos de fecha y hora siguen siendo inputs de texto (`TextInput`) que abren el teclado numérico. El picker nativo no se abre al tocarlos.

## Lo que necesito

Mostrá el contenido actual completo de `CreateMeetupScreen.tsx` antes de hacer cualquier cambio. Específicamente necesito ver cómo están implementados actualmente los campos de fecha y hora.

Luego implementá el fix correcto siguiendo exactamente esta estructura:

```tsx
// Estado para controlar visibilidad del picker
const [showDatePicker, setShowDatePicker] = useState(false);
const [showTimePicker, setShowTimePicker] = useState(false);
const [selectedDate, setSelectedDate] = useState<Date>(new Date());
const [selectedTime, setSelectedTime] = useState<Date>(new Date());

// Handler para cuando el usuario selecciona una fecha
const handleDateChange = (event: any, date?: Date) => {
  setShowDatePicker(false); // cerrar siempre en Android
  if (date) {
    setSelectedDate(date);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    setValue('date', `${day}/${month}/${year}`, { shouldValidate: true });
  }
};

// Handler para cuando el usuario selecciona una hora
const handleTimeChange = (event: any, time?: Date) => {
  setShowTimePicker(false);
  if (time) {
    setSelectedTime(time);
    const hours = String(time.getHours()).padStart(2, '0');
    const minutes = String(time.getMinutes()).padStart(2, '0');
    setValue('time', `${hours}:${minutes}`, { shouldValidate: true });
  }
};
```

El JSX de los campos debe ser así — `TouchableOpacity` que abre el picker, NO `TextInput`:

```tsx
{/* Botón selector de fecha */}
<TouchableOpacity
  style={[styles.dateButton, errors.date && styles.dateButtonError]}
  onPress={() => setShowDatePicker(true)}
  activeOpacity={0.7}
>
  <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
  <Text style={[styles.dateButtonText, !watch('date') && styles.dateButtonPlaceholder]}>
    {watch('date') || 'Seleccioná una fecha'}
  </Text>
</TouchableOpacity>
{errors.date && <Text style={styles.errorText}>{errors.date.message}</Text>}

{/* Picker nativo — solo se renderiza cuando showDatePicker es true */}
{showDatePicker && (
  <DateTimePicker
    value={selectedDate}
    mode="date"
    display="default"
    minimumDate={new Date()}
    onChange={handleDateChange}
  />
)}

{/* Botón selector de hora */}
<TouchableOpacity
  style={[styles.dateButton, errors.time && styles.dateButtonError]}
  onPress={() => setShowTimePicker(true)}
  activeOpacity={0.7}
>
  <Ionicons name="time-outline" size={20} color={theme.colors.textSecondary} />
  <Text style={[styles.dateButtonText, !watch('time') && styles.dateButtonPlaceholder]}>
    {watch('time') || 'Seleccioná una hora'}
  </Text>
</TouchableOpacity>
{errors.time && <Text style={styles.errorText}>{errors.time.message}</Text>}

{showTimePicker && (
  <DateTimePicker
    value={selectedTime}
    mode="time"
    display="default"
    is24Hour={true}
    onChange={handleTimeChange}
  />
)}
```

Los estilos necesarios:

```typescript
dateButton: {
  flexDirection: 'row',
  alignItems: 'center',
  height: theme.components.inputHeight,
  borderWidth: theme.components.borderWidth,
  borderColor: theme.colors.border,
  borderRadius: theme.radius.md,
  paddingHorizontal: theme.spacing.md,
  gap: theme.spacing.sm,
  backgroundColor: theme.colors.surface,
},
dateButtonError: {
  borderColor: theme.colors.error,
},
dateButtonText: {
  fontSize: theme.typography.sizes.md,
  color: theme.colors.textPrimary,
  flex: 1,
},
dateButtonPlaceholder: {
  color: theme.colors.textDisabled,
},
```

## Restricciones

- Reemplazá completamente los campos de fecha y hora actuales por esta implementación
- No tocar ningún otro campo del formulario
- No hacer commits
- Comentar el código en español

## Al finalizar

- Mostrá el bloque de código de fecha y hora **antes** y **después** del cambio
- Confirmá que `DateTimePicker` está importado desde `@react-native-community/datetimepicker`
- Confirmá que no quedan `TextInput` para fecha ni hora

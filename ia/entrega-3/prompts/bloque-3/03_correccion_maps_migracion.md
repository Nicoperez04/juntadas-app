# Bloque 3 — Corrección maps: migración 029 y eliminación de deuda técnica

**Fecha:** 25/07/2026  
**Rama:** `feature/bloque-3-maps`

---

## 1. Contexto

En la implementación inicial del RF-40 (ciclo completo de coordenadas) se introdujeron dos parches temporales para hacer que el código pudiera ejecutarse en Expo Go sin compilación nativa:

| Parche | Archivo | Impacto |
|---|---|---|
| Payload condicional (`...spread`) | `meetupService.ts` | Las coordenadas no se enviaban si eran `null`, ocultando el error de columna inexistente |
| Detección de entorno (`Constants.appOwnership`) + placeholder visual | `LocationPicker.tsx` | En Android + Expo Go se reemplazaba el `MapView` por un mensaje de texto |

Estos parches eran deuda técnica: enmascaraban el estado real del sistema (DB sin migrar, app sin compilar nativamente).

---

## 2. Cambios realizados

### Tarea 1 — Migración `029_meetup_coordinates.sql` (NUEVA)

**Ruta:** `supabase/migrations/029_meetup_coordinates.sql`

```sql
ALTER TABLE meetups
  ADD COLUMN IF NOT EXISTS latitude  DOUBLE PRECISION DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION DEFAULT NULL;
```

- Tipo `DOUBLE PRECISION` (IEEE 754, 64-bit): estándar para coordenadas GPS en PostgreSQL
- `DEFAULT NULL`: retrocompatible — juntadas existentes y nuevas sin mapa no se ven afectadas
- `IF NOT EXISTS`: idempotente; puede ejecutarse múltiples veces sin error

**Cómo aplicarla en Supabase:**
1. Dashboard → SQL Editor
2. Pegar el contenido del archivo y ejecutar
3. Verificar en Table Editor → `meetups` que aparecen las nuevas columnas

---

### Tarea 2 — Limpieza de `meetupService.ts`

**Antes (parche condicional):**
```typescript
...(formData.latitude != null && formData.longitude != null
  ? { latitude: formData.latitude, longitude: formData.longitude }
  : {})
```

**Después (limpio):**
```typescript
latitude: formData.latitude ?? null,
longitude: formData.longitude ?? null,
```

El servicio envía las coordenadas directamente en todo momento. Asume que las columnas existen tras la migración 029.

---

### Tarea 3 — Limpieza de `LocationPicker.tsx`

**Eliminado:**
- `import Constants from 'expo-constants'`
- Constante `esExpoGoAndroid`
- Lógica condicional `{esExpoGoAndroid ? <Placeholder> : <MapView>}`
- Placeholder visual "Mapa no disponible en Expo Go"
- Estilos asociados a los placeholders (~60 líneas)
- Miniatura condicional en `MiniMapa`

**Resultado:**
- `MapView` con `PROVIDER_GOOGLE` en ambas instancias (modal y minipreview)
- `SafeAreaView` se mantiene (fix legítimo para el header en Android)
- Componente ~170 líneas más corto

---

## 3. Prerrequisitos para que la funcionalidad opere correctamente

```
1. Ejecutar migración 029 en Supabase
         ↓
2. Generar build nativo con EAS
   eas build -p android --profile preview
         ↓
3. Instalar APK en dispositivo físico
   adb install ronda-app.apk
         ↓
4. La API key EXPO_PUBLIC_GOOGLE_MAPS_API_KEY debe estar configurada
   en EAS Secrets o en el dashboard de Expo
```

---

## 4. Comportamiento en Expo Go tras esta limpieza

Al correr `npx expo start` en Android, el `MapView` aparecerá en blanco o sin tiles (comportamiento nativo de Google Maps sin API key embebida). Esto es el comportamiento correcto y esperado — no es un bug. El flujo de testing de este RF-40 requiere build nativo.

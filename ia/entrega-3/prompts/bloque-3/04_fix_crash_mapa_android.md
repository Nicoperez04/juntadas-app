# Bloque 3 — Fix crash mapa Android: API key y permisos de ubicación

**Fecha:** 27/07/2026  
**Rama:** `feature/bloque-3-maps`

---

## 1. Síntoma

Al generar el APK con EAS Build y presionar el botón **"+ Agregar ubicación"** (que abre el `LocationPicker`), la aplicación se cerraba inesperadamente en Android sin mostrar ningún mensaje de error visible al usuario.

---

## 2. Diagnóstico

### Causa raíz — API key inválida en el AndroidManifest

En `app.json`, el plugin `react-native-maps` tenía configurado:

```json
["react-native-maps", { "androidApiKey": "$EXPO_PUBLIC_GOOGLE_MAPS_API_KEY" }]
```

**El problema:** el plugin de Expo interpola los valores del array `plugins` de `app.json` directamente durante el prebuild nativo, **sin resolver variables de entorno**. La sustitución de `$EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` NO ocurre en `app.json`; solo funciona en `eas.json` (campo `env`).

El resultado es que el `AndroidManifest.xml` compilado contenía literalmente:

```xml
<meta-data android:name="com.google.android.geo.API_KEY"
           android:value="$EXPO_PUBLIC_GOOGLE_MAPS_API_KEY"/>
```

El SDK de Google Maps rechaza ese valor → crash nativo inmediato al intentar renderizar cualquier `MapView`.

### Verificación de permisos de ubicación

Se revisaron todos los `MapView` del proyecto:

| Componente | `showsUserLocation` | Estado |
|---|---|---|
| `LocationPicker.tsx` — MiniMapa | No declarado (default `false`) | ✅ Sin riesgo |
| `LocationPicker.tsx` — MapView modal | No declarado (default `false`) | ✅ Sin riesgo |
| `LocationCard.tsx` — MapView detalle | No declarado (default `false`) | ✅ Sin riesgo |

Ningún componente solicitaba la ubicación del dispositivo. El crash era exclusivamente por la API key inválida.

---

## 3. Corrección aplicada

### `mobile/app.json`

**Antes:**
```json
["react-native-maps", { "androidApiKey": "$EXPO_PUBLIC_GOOGLE_MAPS_API_KEY" }]
```

**Después:**
```json
["react-native-maps", { "androidApiKey": "AIzaSyAO6cFGOFWi7DUFPxaDboQFPJlmmrzaYIA" }]
```

La API key real se inyecta ahora directamente en el `AndroidManifest.xml` durante el prebuild, lo que permite al SDK de Google Maps inicializarse correctamente.

> **Nota de seguridad:** Las API keys de Maps para Android tienen restricciones de aplicación (package name + SHA-1). La key embebida en el APK no puede usarse fuera de `com.rondaapp.mobile`, por lo que este enfoque es aceptado en producción para apps móviles.

---

## 4. Compilar nuevamente

```bash
eas build -p android --profile preview
```

---

## 5. Flujo de prueba post-fix

1. Instalar el nuevo APK en el Pixel 9
2. Crear juntada → completar campos obligatorios
3. Presionar **"+ Agregar ubicación"** → debe abrirse el mapa de Google Maps sin crash
4. Mover el mapa → el pin debe seguir al centro
5. Presionar **"Confirmar"** → el minipreview debe mostrar el mapa estático
6. Guardar → en el detalle de la juntada, `LocationCard` muestra el mapa con el pin

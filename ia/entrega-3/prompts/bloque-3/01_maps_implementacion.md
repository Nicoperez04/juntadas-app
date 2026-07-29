# RF-40 · Mapa interactivo en el detalle de juntada

## Contexto

**Rama**: `feature/bloque-3-maps`  
**Fecha**: 25/07/2026  
**Herramienta**: Antigravity (Claude Sonnet 4.6 Thinking)  
**Bloque**: Bloque 3 — Mapas

---

## Prompt enviado

> Implementar el RF-40: visualizar la ubicación exacta de la juntada a través de un mapa interactivo (react-native-maps) dentro de la pantalla de detalle del evento.
>
> **Tarea 1** — Análisis previo: analizar app.json, MeetupDetailScreen.tsx y el mockup de Figma adjunto.
> **Tarea 2** — Instalación y configuración: instalar react-native-maps, configurar el plugin en app.json con API key vía variable de entorno.
> **Tarea 3** — UI: crear LocationCard.tsx con MapView + Marker, skeleton/shimmer e empty state; integrar en MeetupDetailScreen sin alterar código existente.
> **Tarea 4** — Documentación: crear este archivo y actualizar indice_ia.md.
>
> Reglas: comentarios en español, sin `any`, sin commits.

---

## Análisis previo (Tarea 1)

### app.json
- Plugin `react-native-maps` añadido con `androidApiKey` que lee la variable de entorno `$EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`.
- La clave se inyecta en tiempo de build por EAS — nunca se hardcodea en el repositorio.

### MeetupDetailScreen.tsx
- La pantalla es puramente orquestadora: los datos viven en `useMeetupDetail`.
- Punto de inserción elegido: **inmediatamente después de `<MeetupDetailHeader>`** y antes del banner "juntada ya ocurrió" — posición idéntica a la del mockup de Figma.
- Se respetaron todas las secciones existentes: header, actionsRow, participantes, reseñas, compartir, acciones organizador, zona destructiva.

### Mockup de Figma (imagen adjunta)
| Elemento visual          | Token aplicado                                      |
|--------------------------|-----------------------------------------------------|
| Card contenedora         | `surface`, `radius.lg`, `shadows.md`                |
| Encabezado "Ubicación"   | Ícono `location` + `textSecondary`, `xs`, uppercase |
| Mapa                     | `MapView` 170 px alto, `PROVIDER_GOOGLE`            |
| Marker                   | `pinColor: primary` (#7C3AED)                       |
| Dirección texto          | `textPrimary`, `sm`, `semibold`                     |
| Subtexto distancia       | `textSecondary`, `xs`                               |
| Botón "Cómo llegar"      | `primary` bg, `surface` texto, `radius.full`        |
| Shimmer skeleton         | `expo-linear-gradient` con `border → background`    |
| Empty state ícono        | `map-outline`, `background` circle, `textDisabled`  |

---

## Archivos modificados / creados

### `mobile/app.json` — [MODIFICADO]
```json
[
  "react-native-maps",
  {
    "androidApiKey": "$EXPO_PUBLIC_GOOGLE_MAPS_API_KEY"
  }
]
```

### `mobile/src/features/meetups/types.ts` — [MODIFICADO]
Campos opcionales añadidos a `interface Meetup` (retrocompatibles):
```typescript
latitude?: number | null;
longitude?: number | null;
```

### `mobile/src/features/meetups/components/LocationCard.tsx` — [NUEVO]
Componente funcional tipado. Tres estados:
1. **Empty state** — cuando `latitude == null || longitude == null`
2. **Carga (shimmer)** — `LinearGradient` superpuesto mientras `onMapReady` no se dispara
3. **Mapa activo** — `MapView` + `Marker` + botón de navegación nativa

### `mobile/src/features/meetups/screens/MeetupDetailScreen.tsx` — [MODIFICADO]
- Import de `LocationCard` agregado
- `<LocationCard locationText={meetup.location} latitude={meetup.latitude} longitude={meetup.longitude} />` insertado después de `<MeetupDetailHeader>`, sin alterar ninguna sección preexistente

---

## Instalación de dependencia

```bash
# Ejecutar siempre desde /mobile
cd mobile
npx expo install react-native-maps
```

`expo install` seleccionó automáticamente la versión compatible con SDK 55.

---

## Configuración de la API Key (Android)

1. Crear (o agregar) en `mobile/.env`:
   ```
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...tu_clave_aqui
   ```
2. En EAS Build, configurar el secret en el dashboard de Expo (`eas secret:create`) o en `eas.json` bajo `env`:
   ```json
   {
     "build": {
       "preview": {
         "env": {
           "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY": "@google_maps_key"
         }
       }
     }
   }
   ```
3. El plugin `react-native-maps` en `app.json` inyecta la clave en `AndroidManifest.xml` durante el build nativo.

---

## Comando para generar APK (Android — Pixel 9)

```bash
# Desde la raíz del monorepo o desde /mobile
eas build -p android --profile preview
```

Una vez finalizado, EAS imprime un link de descarga del `.apk`. Instalar con:

```bash
# Conectar Pixel 9 en modo desarrollador con USB debugging activo
adb install ronda-app.apk
```

O bien escanear el QR del dashboard de Expo en el dispositivo.

---

## Decisiones de diseño

| Decisión | Razón |
|---|---|
| Card separada de `MeetupDetailHeader` | Siguiendo el mockup: el mapa ocupa su propia card, no está embebido en la del detalle de datos. Además, facilita ocultar la card en el futuro si no hay coordenadas. |
| `scrollEnabled={false}` en MapView | El mapa vive dentro de un ScrollView; deshabilitar el scroll del mapa evita conflictos de gestos. |
| `PROVIDER_GOOGLE` explícito | Garantiza Google Maps en Android. En iOS, si no se configura la API key de iOS, Mapkit es el fallback automático. |
| Shimmer sobre el mapa (no spinner) | El patrón de shimmer ya existe en `MeetupCardSkeleton.tsx` — coherencia visual. |
| `latitude`/`longitude` opcionales en `Meetup` | Retrocompatibilidad total: ningún código existente que no pase esas props se rompe. |
| Botón abre app nativa (no WebView) | Mejor UX: navega con la app de mapas preferida del usuario (Google Maps, Waze, etc.) usando el esquema `geo:` en Android y `maps://` en iOS. |

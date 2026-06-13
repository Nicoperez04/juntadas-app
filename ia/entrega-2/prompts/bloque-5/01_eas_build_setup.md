# Bloque 5a — EAS Build setup + APK de E2

## Contexto
Rama actual: feature/bloque-5-notificaciones
El objetivo es configurar EAS Build y generar el APK de E2
para cumplir con el requisito de entrega.

El usuario ya está logueado en EAS CLI con la cuenta nicoperez04.
Todos los comandos se ejecutan desde mobile/.

## Tu tarea
Realizá las siguientes tareas en orden.
Completá y reportá cada una antes de pasar a la siguiente.

---

### Tarea 1 — Actualizar app.json

En app.json realizar los siguientes cambios:

1. Agregar android.package:
   "android": {
     "package": "com.rondaapp.mobile",
     "adaptiveIcon": { ... },  // mantener existente
     "predictiveBackGestureEnabled": false  // mantener existente
   }

2. Agregar expo.version actualizada a "2.0.0"
   (estamos en E2, el build debe reflejarlo)

3. Agregar expo.android.versionCode: 2
   (código de versión interno para Android)

4. NO tocar ningún otro campo existente

Archivos esperados:
- app.json (modificado)

---

### Tarea 2 — Crear eas.json

Crear eas.json en la raíz de mobile/ con el siguiente contenido:

{
  "cli": {
    "version": ">= 16.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}

Explicación de perfiles:
- development: para desarrollo con expo-dev-client (futuro)
- preview: APK instalable para pruebas y entrega — este es el que usamos ahora
- production: AAB para Google Play Store (futuro)

Archivos esperados:
- eas.json (nuevo)

---

### Tarea 3 — Verificar y preparar el proyecto

Antes de lanzar el build verificar:

1. Ejecutar npx tsc --noEmit y confirmar que no hay errores TypeScript
2. Verificar que no hay imports rotos o archivos faltantes
3. Confirmar que babel.config.js tiene el plugin de Reanimated
   como último plugin (ya debería estar del Bloque 3)

Reportar resultado de cada verificación.
No continuar si hay errores TypeScript.

---

### Tarea 4 — Lanzar el build de preview

Ejecutar el build desde mobile/:

npx eas build --platform android --profile preview

Durante el proceso:
- Si pregunta si querés crear un nuevo proyecto EAS: responder Yes
- Si pregunta por el android.package: confirmar com.rondaapp.mobile
- Si pregunta por credenciales: elegir que EAS las maneje
  automáticamente (opción recomendada)
- Copiar y reportar la URL del build que aparece en la consola
  (formato: https://expo.dev/accounts/nicoperez04/projects/...)

IMPORTANTE: el build se ejecuta en la nube de EAS, no localmente.
Tarda entre 10 y 20 minutos. No cancelar el proceso.
Una vez lanzado, el build corre en background —
se puede cerrar la terminal y monitorear desde
https://expo.dev

Reportar:
- URL del build en expo.dev
- Si hubo algún error al lanzarlo

---

### Tarea 5 — Documentar este prompt

Crear ia/entrega-2/prompts/bloque-5/01_eas_build_setup.md
con el contenido completo de este prompt.

Actualizar ia/entrega-2/indice_ia.md agregando:
[número siguiente] - EAS Build setup: eas.json, android.package,
  perfil preview, APK E2

No hacer:
- No tocar archivos de código fuera de app.json y eas.json
- No hacer commits

Archivos esperados:
- app.json (modificado)
- eas.json (nuevo)
- ia/entrega-2/prompts/bloque-5/01_eas_build_setup.md
- ia/entrega-2/indice_ia.md (actualizado)

---

## Reglas generales
- No hacer commits
- Reportar cada tarea antes de pasar a la siguiente
- Si algo es ambiguo o EAS pregunta algo no cubierto
  en este prompt, detenerse y reportar antes de continuar

## Al finalizar
Resumen con:
1. Cambios en app.json
2. Contenido final de eas.json
3. URL del build o error encontrado
4. Próximos pasos para descargar e instalar el APK

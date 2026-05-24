# Guía de onboarding — Juntadas App

Guía para que cualquier integrante del equipo pueda configurar el entorno y empezar a desarrollar sin ayuda externa.

**Repositorio:** https://github.com/Nicoperez04/juntadas-app  
**Rama de trabajo:** `entrega-1`

---

## 1. Requisitos previos

Antes de clonar el proyecto, asegurate de tener lo siguiente instalado y configurado:

| Requisito | Detalle |
|-----------|---------|
| **Node.js** | Versión **20.x LTS** (mínimo recomendado: 20.19.4). Verificá con `node -v`. |
| **Git** | Instalado y configurado con tu nombre y email. Verificá con `git --version`. |
| **Expo Go** (celular) | Versión compatible con **SDK 55**. La versión de la tienda (App Store / Play Store) suele ser SDK 54 y **no funciona** con este proyecto. |
| **Cuenta en Supabase** | Solo lectura para consultar datos. Las credenciales de conexión las provee el líder del equipo. |

### Expo Go SDK 55 — instalación manual

La app usa Expo SDK 55. No uses la versión de la tienda.

1. Abrí https://expo.dev/go en el navegador del celular (o en la PC y transferí el archivo).
2. Seleccioná **SDK 55**.
3. Descargá e instalá el **APK** (Android) o **IPA** (iOS) manualmente.
4. Si ya tenés Expo Go de la tienda, desinstalalo antes de instalar la versión SDK 55.

### Verificaciones rápidas

```bash
node -v    # debe mostrar v20.x.x
npm -v
git --version
```

---

## 2. Configuración inicial

Pasos exactos desde cero:

```bash
git clone https://github.com/Nicoperez04/juntadas-app.git
cd juntadas-app
git checkout entrega-1
cd mobile
npm install
cp .env.example .env
```

> **Windows (PowerShell):** en lugar de `cp`, usá `copy .env.example .env`

Completá el archivo `.env` con las credenciales de Supabase que te pase el líder del equipo (ver sección 9).

> **Importante:** todos los comandos de npm y Expo se ejecutan desde la carpeta `mobile/`, no desde la raíz del repositorio.

---

## 3. Cómo correr la app

```bash
cd mobile
npx expo start --tunnel
```

Escaneá el código QR con **Expo Go SDK 55** instalado manualmente.

### ¿Por qué siempre `--tunnel`?

El script `npm start` usa `--lan` y **falla en redes con firewall** (común en facultad, oficinas o redes corporativas). Siempre usá túnel:

```bash
npx expo start --tunnel
```

Alternativa equivalente (también desde `mobile/`):

```bash
npm run start:tunnel
```

**No uses** `npm start` a menos que estés en una red local sin restricciones y sepas que funciona.

---

## 4. Estructura del proyecto

```
juntadas-app/
├── mobile/                  # App React Native + Expo
│   └── src/
│       ├── features/        # Módulos por feature (auth, meetups, participants, impostor, memories)
│       ├── shared/          # Componentes y utilidades compartidas
│       ├── navigation/      # Navegación (React Navigation, no Expo Router)
│       ├── config/          # Configuración de la app y variables de entorno
│       └── lib/             # Cliente Supabase y utilidades de infraestructura
├── supabase/
│   └── migrations/          # Historial de cambios en la base de datos
├── ia/
│   └── entrega-1/           # Evidencia de uso de IA (prompts, conversaciones, scripts)
└── docs/                    # Documentación del proyecto
```

### Carpetas clave

| Carpeta | Contenido |
|---------|-----------|
| `mobile/src/features/` | Cada feature tiene `screens/`, `services/`, `hooks/`, `schemas/` y `types.ts`. Ejemplos: `auth`, `meetups`, `participants`, `impostor`. |
| `mobile/src/shared/` | Componentes reutilizables (`AppButton`, `AppInput`, etc.) y utilidades compartidas. |
| `mobile/src/navigation/` | Navegadores, rutas tipadas y constantes en `routes.ts`. |
| `supabase/migrations/` | SQL versionado. Referencia de lo ya aplicado en la base de datos. |
| `ia/entrega-1/` | Prompts usados con Cursor, conversaciones exportadas y documentación de IA. |

---

## 5. Flujo de trabajo con Git

### Ramas

| Rama | Uso |
|------|-----|
| `main` | Producción / entrega final. **No trabajar directo acá.** |
| `entrega-1` | Rama principal de desarrollo del equipo. **No commitear directo acá.** |
| `feature/nombre-del-bloque` | Cada feature nueva va en su propia rama. Ejemplo: `feature/bloque-5-memorias`. |

### Flujo recomendado

1. Actualizá `entrega-1` localmente.
2. Creá tu rama desde `entrega-1`.
3. Trabajá, commiteá y pusheá tu rama.
4. Abrí un PR hacia `entrega-1` (o pedí revisión al líder).

```bash
git checkout entrega-1
git pull origin entrega-1
git checkout -b feature/mi-bloque
# ... trabajar ...
git add .
git commit -m "feat(scope): descripción"
git push -u origin feature/mi-bloque
```

### Convención de commits

| Tipo | Cuándo usarlo | Ejemplo |
|------|---------------|---------|
| `feat(scope)` | Nueva funcionalidad | `feat(meetups): agregar pantalla de historial` |
| `fix(scope)` | Corrección de bug | `fix(auth): resolver error de sesión expirada` |
| `chore(scope)` | Tareas de mantenimiento | `chore(docs): actualizar guía de onboarding` |

### Traer cambios de compañeros

Antes de empezar a trabajar o si necesitás sincronizar tu rama:

```bash
git fetch origin
git merge origin/entrega-1
```

---

## 6. Supabase — qué pueden y qué no pueden hacer

### Sí pueden

- Usar las credenciales del `.env` para conectar la app en desarrollo.
- Consultar datos en el **Table Editor** del dashboard (si tienen acceso de lectura).
- Revisar las migraciones en `supabase/migrations/` para entender el esquema.
- Pedir al líder que ejecute SQL específico si lo necesitan.

### No pueden (sin permiso del líder)

- Subir el `.env` al repositorio. **Nunca commitear credenciales.**
- Ejecutar cambios en el **SQL Editor** del dashboard (solo quien tiene acceso admin).
- Crear o modificar tablas, políticas RLS o triggers directamente en producción.
- Compartir la `anon key` o la URL del proyecto fuera del equipo.

### Si necesitás ejecutar algo en SQL

Enviá al líder el **SQL exacto** que querés ejecutar y el motivo. El líder lo revisa y lo aplica desde el SQL Editor si corresponde.

### Migraciones

Los archivos en `supabase/migrations/` son la referencia del historial de la base de datos. **No los ejecutes manualmente** salvo indicación del líder — ya están aplicados en el proyecto compartido.

---

## 7. Cómo trabajar con IA (Cursor + Claude)

El equipo usa Cursor con Claude para acelerar el desarrollo. Seguí estas reglas para evitar problemas.

### Antes de pedir algo a Cursor

1. Leé el prompt anterior del mismo bloque en `ia/entrega-1/prompts/` para entender el contexto.
2. Revisá las rules del proyecto en `.cursor/rules/project.mdc` — Cursor las aplica automáticamente.
3. Definí el alcance: qué archivos puede tocar y qué no.

### Reglas importantes

| Regla | Motivo |
|-------|--------|
| **Nunca** pedirle que haga commits | Los commits los hace cada integrante manualmente. |
| **Nunca** pedirle que instale dependencias sin revisar | Nuevas dependencias requieren acuerdo del equipo. |
| Si hace algo incorrecto, revertí antes de commitear | `git checkout -- .` descarta cambios no commiteados. |
| Reportá qué archivos modificó | Cursor debe listar los cambios al finalizar. |

### Dónde está la documentación de IA

| Recurso | Ubicación |
|---------|-----------|
| Prompts por bloque | `ia/entrega-1/prompts/` |
| Conversaciones exportadas | `ia/entrega-1/conversaciones/` |
| Índice general | `ia/entrega-1/indice_ia.md` |
| Rules de Cursor | `.cursor/rules/project.mdc` |

---

## 8. Problemas frecuentes y soluciones

| Problema | Solución |
|----------|----------|
| **"Failed to download remote update"** al escanear QR | Usá `npx expo start --tunnel` en lugar de `npm start`. |
| **Expo Go no conecta** | Verificá que la versión de Expo Go sea **SDK 55** (no la de la tienda). Reinstalá desde https://expo.dev/go si hace falta. |
| **"Email not confirmed"** al iniciar sesión | La confirmación de email está desactivada en desarrollo. Si el error persiste, pedile al líder que ejecute en Supabase: `UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'tu@email.com';` |
| **"email rate limit exceeded"** al registrarse | Esperá 1 hora o pedile al líder que desactive temporalmente el límite en Supabase Auth. |
| **Error de TypeScript** al compilar | Corré `npx tsc --noEmit` desde `mobile/` para ver los errores exactos. |
| **La app muestra pantalla en blanco** | Cerrá Expo Go, corré `npx expo start --tunnel --clear` y volvé a escanear el QR. |
| **Cambios no se reflejan en el celular** | Sacudí el celular con Expo Go abierto → **Reload**, o presioná `r` en la terminal de Expo. |
| **Errores de módulos faltantes** después de un pull | Desde `mobile/`: borrá `node_modules` y corré `npm install` de nuevo. |
| **Puerto 8081 ocupado** | Cerrá otras instancias de Metro/Expo o matá el proceso que usa el puerto. |

---

## 9. Variables de entorno necesarias

El archivo `mobile/.env` debe contener:

```env
EXPO_PUBLIC_SUPABASE_URL=https://[proyecto].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Estas las provee el líder del equipo. **Nunca las commitees** al repositorio.

El archivo `mobile/.env.example` muestra las variables requeridas sin valores reales — usalo como plantilla.

---

## 10. Contacto

Si hay dudas técnicas que no se resuelven con esta guía, consultá con **Nico** (líder técnico del proyecto).

Antes de escribirle, intentá:

1. Revisar esta guía y la sección de problemas frecuentes.
2. Buscar el error en `ia/entrega-1/conversaciones/` (es posible que ya se haya resuelto).
3. Correr `npx tsc --noEmit` si es un error de TypeScript.

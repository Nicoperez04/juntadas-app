# 🍻 Juntadas App

Aplicación móvil para organizar juntadas entre amigos. 
**Trabajo Integrador 2026 - Entrega 1 (MVP Básico)**

## 🚀 Tecnologías Principales
- **Framework:** React Native + Expo (SDK 55)
- **Lenguaje:** TypeScript (Strict Mode)
- **Backend & Auth:** Supabase (PostgreSQL, RLS, Triggers)
- **Estado Global:** Zustand (Módulo Impostor)
- **Navegación:** React Navigation (Native Stack)
- **Formularios y Validación:** React Hook Form + Zod

## 📋 Prerrequisitos
- Node.js (v18.0.0 o superior)
- Administrador de paquetes `npm` (incluido con Node)
- Aplicación **Expo Go** instalada en tu dispositivo físico móvil (Android/iOS) para pruebas en tiempo real.

## ⚙️ Configuración e Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Nicoperez04/juntadas-app.git
   cd juntadas-app/mobile
   ```

2. **Instalar dependencias del proyecto:**
   ```bash
   npm install
   ```

3. **Variables de Entorno:**
   El proyecto requiere conexión con la instancia de Supabase. Copia el archivo de ejemplo para crear tu entorno local:
   ```bash
   cp .env.example .env
   ```
   Abre el archivo `.env` en la raíz de la carpeta `mobile/` y completa los siguientes valores con las credenciales de tu proyecto:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=tu_supabase_url_aqui
   EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key_aqui
   ```
   *Nota: El archivo `.env` se encuentra excluido en el `.gitignore` por razones estrictas de seguridad para evitar la filtración de claves API en el repositorio remoto.*

## 📱 Ejecución del Proyecto

Para inicializar el servidor local de desarrollo de Expo, ejecuta:

```bash
npx expo start
```

**Métodos de visualización y pruebas:**
- **Dispositivo Físico (Recomendado):** Abre la cámara de tu teléfono móvil (en iOS) o la aplicación **Expo Go** (en Android) y escanea el código QR que se despliega en la terminal. Asegúrate de que el dispositivo móvil y la computadora estén conectados a la misma red de Wi-Fi local.
- **Emulador Android:** Presiona la tecla `a` en la terminal con un dispositivo virtual previamente iniciado en Android Studio.
- **Simulador iOS:** Presiona la tecla `i` en la terminal si estás desarrollando sobre macOS con Xcode configurado.

## 📁 Estructura del Módulo de Código (`src/`)
El proyecto implementa una arquitectura modular segmentada por características funcionales de dominio (`features`):
- `src/navigation/`: Orquestación y tipado de los flujos de navegación (`Native Stack`).
- `src/lib/supabase/`: Inicialización del cliente centralizado de Supabase.
- `src/config/`: Centralización de variables de entorno globales y tokens del sistema de diseño.
- `src/shared/`: Componentes, hooks, utilidades y tipos transversales reutilizables por múltiples módulos.
- `src/features/`: Encapsulamiento modular del negocio:
  - `auth/`: Registro, inicio de sesión y perfiles.
  - `meetups/`: Flujo de creación, edición e historial de juntadas.
  - `participants/`: Listados y control de estados de asistencia.
  - `impostor/`: Lógica del juego offline administrada mediante estados de Zustand.

## 👥 Equipo de Desarrollo
- Egüen Agustina Pilar 
- Pascucci Agostina
- Perez Nicolas Agustin
- Smith Justina
- Talavera Santiago Ariel

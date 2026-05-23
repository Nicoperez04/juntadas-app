# Skills instaladas para Bitácora de Juntadas

**Fecha:** 23 de mayo de 2026  
**Alcance:** Cursor (instalación global con `-g`)  
**Ubicación en disco:** `~/.agents/skills/`

---

## Resumen

Se instalaron 5 agent skills oficiales o mantenidas por los equipos de Vercel, Supabase, Expo y Sleek. Cada una extiende las capacidades del asistente de IA con guías especializadas alineadas al stack del proyecto: **React Native + Expo SDK 55 + Supabase + TypeScript**.

> **Nota sobre el comando:** Los comandos originales usaban la sintaxis `owner/repo/skill`. El CLI de skills requiere `@` en lugar de `/`. Los comandos que funcionaron fueron:
>
> ```bash
> npx skills add vercel-labs/agent-skills@vercel-react-native-skills -g -y
> npx skills add supabase/agent-skills@supabase-postgres-best-practices -g -y
> npx skills add supabase/agent-skills@supabase -g -y
> npx skills add expo/skills@building-native-ui -g -y
> npx skills add sleekdotdesign/agent-skills@sleek-design-mobile-apps -g -y
> ```

---

## 1. vercel-react-native-skills

| Campo | Valor |
|-------|-------|
| **Comando** | `npx skills add vercel-labs/agent-skills@vercel-react-native-skills` |
| **Fuente** | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) |
| **Instalaciones** | ~124K |
| **Estado** | Instalada |

### Qué hace

Guía de mejores prácticas de React Native y Expo mantenida por Vercel. Cubre rendimiento de listas (FlashList, memoización), animaciones con Reanimated, navegación nativa, patrones de UI (`expo-image`, `Pressable`, safe areas), gestión de estado y configuración de monorepos.

### Por qué conviene instalarla

- El proyecto es **React Native + Expo SDK 55**; esta skill codifica decisiones que el equipo de Vercel ya validó en producción.
- Ayuda a evitar errores comunes de rendimiento (listas sin virtualizar, callbacks inestables, animaciones costosas).
- Complementa las Cursor Rules del repo con reglas concretas y priorizadas por impacto (CRITICAL → LOW).
- Es la skill de React Native más instalada del ecosistema open skills.

### Cuándo se activa

Al construir componentes, optimizar scrolls/listas, implementar animaciones, trabajar con módulos nativos o resolver problemas de performance móvil.

---

## 2. supabase-postgres-best-practices

| Campo | Valor |
|-------|-------|
| **Comando** | `npx skills add supabase/agent-skills@supabase-postgres-best-practices` |
| **Fuente** | [supabase/agent-skills](https://github.com/supabase/agent-skills) |
| **Instalaciones** | ~184K |
| **Estado** | Instalada |

### Qué hace

Guía de optimización de Postgres mantenida por Supabase. Incluye reglas sobre queries, índices, diseño de esquema, connection pooling, concurrencia, RLS y monitoreo, con ejemplos SQL correctos e incorrectos.

### Por qué conviene instalarla

- Bitácora de Juntadas usa **Supabase (PostgreSQL)** con tablas, enums, triggers, índices y **políticas RLS** definidas en `supabase/migrations/`.
- Evita diseños de esquema lentos o inseguros antes de que lleguen a producción.
- Es especialmente útil al revisar migraciones, agregar índices o depurar queries lentas desde los servicios del feature.
- Es la skill de Postgres más popular del catálogo (~184K instalaciones).

### Cuándo se activa

Al escribir o revisar SQL, diseñar esquemas, optimizar queries, configurar RLS o diagnosticar problemas de base de datos.

---

## 3. supabase

| Campo | Valor |
|-------|-------|
| **Comando** | `npx skills add supabase/agent-skills@supabase` |
| **Fuente** | [supabase/agent-skills](https://github.com/supabase/agent-skills) |
| **Instalaciones** | ~83K |
| **Estado** | Instalada |

### Qué hace

Skill general de Supabase para **cualquier tarea** que involucre la plataforma: Auth, Database, Storage, Realtime, Edge Functions, CLI, migraciones y `supabase-js`. Incluye checklist de seguridad (RLS, JWT, `service_role`, views, Storage) y exige verificar la documentación actual antes de implementar.

### Por qué conviene instalarla

- Cubre el **stack completo de Supabase** que usa el proyecto: autenticación, PostgreSQL, Storage para fotos y políticas RLS.
- Detecta trampas de seguridad silenciosas (p. ej. usar `user_metadata` en RLS, views sin `security_invoker`, UPDATE sin política SELECT).
- Obliga a consultar el changelog y docs actuales — importante porque Supabase cambia con frecuencia.
- Complementa a `supabase-postgres-best-practices`: una es producto/plataforma, la otra es rendimiento SQL puro.

### Cuándo se activa

Auth (login, sesiones, JWT), migraciones, Storage, configuración del cliente, auditorías de seguridad o cualquier integración con Supabase.

---

## 4. building-native-ui

| Campo | Valor |
|-------|-------|
| **Comando** | `npx skills add expo/skills@building-native-ui` |
| **Fuente** | [expo/skills](https://github.com/expo/skills) |
| **Instalaciones** | ~43K |
| **Estado** | Instalada |

### Qué hace

Guía oficial de Expo para construir interfaces nativas: estilos, componentes, animaciones (Reanimated), controles nativos iOS, efectos visuales (blur, glass), almacenamiento, media y preferencias de librerías del ecosistema Expo.

### Por qué conviene instalarla

- Proviene del **equipo oficial de Expo**; refleja las APIs y convenciones de SDK 55.
- Aporta criterio sobre cuándo usar Expo Go vs builds nativos, elección de librerías y patrones de UI móvil.
- Las secciones de animaciones, `expo-image`, safe areas y controles nativos aplican directamente al diseño violeta/rosa del proyecto.
- **Matiz importante:** parte de la skill asume **Expo Router** (`app/`). Este proyecto usa **React Navigation** con `src/navigation/` (decisión explícita del repo). Al usarla, tomar las guías de UI/estilos/animaciones y **ignorar** las de routing por carpetas `app/`.

### Cuándo se activa

Al diseñar pantallas, estilizar componentes, implementar animaciones, elegir librerías Expo o resolver dudas de UI nativa.

---

## 5. sleek-design-mobile-apps

| Campo | Valor |
|-------|-------|
| **Comando** | `npx skills add sleekdotdesign/agent-skills@sleek-design-mobile-apps` |
| **Fuente** | [sleekdotdesign/agent-skills](https://github.com/sleekdotdesign/agent-skills) |
| **Instalaciones** | ~163K |
| **Estado** | Instalada |

### Qué hace

Integración con [sleek.design](https://sleek.design), herramienta de diseño móvil con IA. Permite crear proyectos, describir pantallas en lenguaje natural, listar componentes y obtener screenshots vía API REST.

### Por qué conviene instalarla

- En la entrega 1 ya se trabajó con **mockups y wireframes en Figma**; Sleek ofrece un flujo alternativo/complementario para prototipar pantallas rápidamente con IA.
- Útil para iterar diseño antes de implementar en código (login, listado de juntadas, juego del impostor, recuerdos).
- Tiene alto adoption (~163K installs) y API documentada con scopes granulares.
- **Requisito opcional:** necesita `SLEEK_API_KEY` (plan Pro+) solo si se usa la API; la skill sigue siendo referencia de flujo de diseño sin la key.

### Cuándo se activa

Al pedir diseñar una app, crear pantallas, listar proyectos Sleek o generar screenshots de UI móvil.

---

## Alineación con el stack del proyecto

| Capa del proyecto | Skills relevantes |
|-------------------|-------------------|
| React Native + Expo SDK 55 | `vercel-react-native-skills`, `building-native-ui` |
| Supabase (Auth, DB, Storage, RLS) | `supabase`, `supabase-postgres-best-practices` |
| UI / diseño de pantallas | `building-native-ui`, `sleek-design-mobile-apps` |
| Migraciones SQL (`001_initial_schema.sql`) | `supabase-postgres-best-practices`, `supabase` |

---

## Comandos útiles post-instalación

```bash
# Ver skills instaladas
npx skills list

# Buscar más skills
npx skills find <tema>

# Actualizar todas
npx skills update

# Verificar actualizaciones
npx skills check
```

---

## Referencias

- Catálogo general: https://skills.sh/
- Documentación del CLI: https://skills.sh/docs

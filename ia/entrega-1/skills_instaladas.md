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

# Skills instaladas — Claude Code CLI

**Fecha:** 25 de mayo de 2026  
**Alcance:** Claude Code CLI (instalación local del proyecto)  
**Ubicación en disco:** `~/.claude/skills/` (gestionadas por Claude Code)  
**Herramienta:** Claude Code CLI (`claude` en terminal)

---

## Resumen

Se instalaron 2 skills nativas de Claude Code CLI orientadas a debugging estructurado y toma de decisiones técnicas. A diferencia de las skills de Cursor (que se instalan con `npx skills add`), las skills de Claude Code se activan automáticamente en cada sesión de terminal — no requieren instalación manual por proyecto.

Complementan el archivo `mobile/CLAUDE.md`, que actúa como contexto permanente del proyecto para el agente (equivalente a las Cursor Rules pero para Claude Code CLI).

> **Nota sobre compatibilidad:** Las skills de Cursor y las de Claude Code CLI son sistemas completamente independientes. Las de Cursor viven en `~/.agents/skills/` y se activan en el agente de Cursor. Las de Claude Code viven en el entorno de Claude Code CLI y se activan en cada sesión de terminal. No son intercambiables.

---

## 1. diagnose

| Campo | Valor |
|-------|-------|
| **Activación** | Automática al iniciar sesión de Claude Code CLI, o explícita con `/diagnose` |
| **Fuente** | Skill nativa de Claude Code — equipo de Anthropic |
| **Tipo** | Debugging estructurado |
| **Estado** | Instalada y activa |

### Qué hace

Implementa un loop disciplinado de debugging en 6 fases secuenciales que el agente debe completar antes de tocar código:

1. **Construir un feedback loop** — reproductor determinístico del bug (test, script, harness, curl, etc.)
2. **Reproducir** — confirmar que el bug se manifiesta exactamente como describe el usuario
3. **Hipotizar** — generar 3-5 hipótesis falsificables rankeadas antes de probar ninguna
4. **Instrumentar** — probar una variable a la vez con logs o debugger, nunca "log everything"
5. **Fix + regression test** — escribir el test antes del fix cuando existe un seam correcto
6. **Cleanup + post-mortem** — remover instrumentación, documentar causa raíz, recomendar mejoras

Cada fase tiene criterios de salida obligatorios. El agente no puede pasar a la siguiente sin completar la anterior.

### Por qué conviene instalarla

- El proyecto tiene bugs de estado complejo (Zustand + useFocusEffect + React Navigation) donde los cambios ciegos generan regresiones — exactamente el patrón que esta skill previene.
- Durante el debugging del B3 (impostor), la falta de un proceso estructurado llevó a múltiples intentos fallidos, un revert con `git checkout` y tiempo perdido. Con `/diagnose` ese ciclo se evita.
- La fase de hipótesis rankeadas es especialmente valiosa para bugs de re-render y estado asíncrono, donde la causa no es obvia.
- El post-mortem obliga a documentar la causa raíz — lo que encaja directamente con los requerimientos de documentación de la cátedra.

### Cuándo se activa

Al reportar cualquier bug, comportamiento inesperado, error en consola o regresión de navegación. Invocar explícitamente con `/diagnose` al inicio del prompt para forzar el proceso estructurado.

### Ejemplo de uso para este proyecto

```
/diagnose

Bug: al modificar asistencia, la animación de éxito aparece duplicada
y vuelve al modal de asistencia en lugar de cerrar.

Pantalla: ModifyAttendanceScreen o componente Modal relacionado.
Plataforma: Android físico.
Frecuencia: 100% reproducible.
```

---

## 2. grill-me

| Campo | Valor |
|-------|-------|
| **Activación** | Explícita con `/grill-me` al inicio del prompt |
| **Fuente** | Skill nativa de Claude Code — equipo de Anthropic |
| **Tipo** | Stress-testing de decisiones técnicas y de diseño |
| **Estado** | Instalada y activa |

### Qué hace

Convierte al agente en un entrevistador técnico que hace preguntas una por una, recorre cada rama del árbol de decisiones y no da por cerrado un tema hasta que cada dependencia entre decisiones esté resuelta. Para cada pregunta que hace, también provee su respuesta recomendada como referencia.

Si una pregunta puede responderse explorando el codebase, el agente lo explora en lugar de preguntar — lo que reduce el tiempo de sesión y evita preguntas sobre cosas que ya están decididas en el código.

### Por qué conviene instalarla

- Antes de implementar Memories (RF-13/14/15, el módulo más complejo que resta), hay decisiones de diseño abiertas: ¿galería con grid o lista? ¿upload optimístico o bloqueante? ¿cómo asociar fotos a juntadas si el usuario sale en medio del upload? ¿qué pasa si Supabase Storage falla?
- En proyectos académicos, la cátedra evalúa que el equipo comprenda las decisiones — `/grill-me` fuerza esa reflexión antes de que el agente empiece a generar código.
- Evita el patrón de "implementar y después descubrir que la arquitectura no encajaba", que genera deuda técnica y refactors costosos.
- Es especialmente útil al inicio de un bloque nuevo o cuando hay ambigüedad entre varias opciones de implementación válidas.

### Cuándo se activa

Antes de implementar una feature nueva, al tomar decisiones de arquitectura de estado, al elegir entre varias estrategias de UX, o antes de cualquier cambio que afecte múltiples archivos o features. No se usa para bugs ni para cambios pequeños.

### Ejemplo de uso para este proyecto

```
/grill-me

Voy a implementar el módulo de Memories (fotos de juntadas).
Necesito que me hagas preguntas sobre el diseño antes de empezar
para asegurarme de que las decisiones son correctas.

Contexto: RF-13, RF-14, RF-15 están en scope de E1.
El módulo tiene pantalla de galería y upload de fotos a Supabase Storage.
Ya existe src/features/memories/types.ts vacío.
```

---

## Alineación con el stack del proyecto (Claude Code CLI)

| Situación de uso | Skill recomendada |
|-----------------|-------------------|
| Bug de estado, re-render, navegación | `diagnose` (`/diagnose`) |
| Antes de implementar Memories o cualquier feature nueva | `grill-me` (`/grill-me`) |
| Debugging de Supabase RLS o Storage | `diagnose` + contexto del `CLAUDE.md` |
| Decisión entre varias estrategias de UX o arquitectura | `grill-me` |

---

## CLAUDE.md — contexto permanente del proyecto

Además de las skills, se creó el archivo `mobile/CLAUDE.md` que actúa como
contexto permanente del proyecto para Claude Code CLI en cada sesión de terminal.

Contiene: stack tecnológico, arquitectura modular, reglas de capas, sistema de diseño
(`theme.ts`), decisiones de navegación (tab bar custom, sin BottomTabNavigator),
decisiones del juego Impostor (estado en Zustand sin persistencia), reglas de Supabase,
restricciones permanentes y formato del reporte final esperado.

Este archivo cumple para Claude Code la misma función que las Cursor Rules del repo
para el agente de Cursor — provee contexto sin necesidad de repetirlo en cada prompt.

**Ubicación:** `mobile/CLAUDE.md`  
**Mantenimiento:** actualizar si cambian decisiones arquitectónicas o se agregan features.

---

## Referencias (Claude Code CLI)

- Documentación oficial: https://docs.anthropic.com/en/docs/claude-code/overview
- Skills de Claude Code: disponibles automáticamente en cada sesión
- Catálogo de skills públicas: accesible desde dentro de una sesión de Claude Code
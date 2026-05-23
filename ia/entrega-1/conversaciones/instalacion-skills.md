# Instalación de agent skills

### Prompt

Instala estas 5 skills y listalas en un archivo dentro de la carpeta de IA/entrega 1: npx skills add vercel-labs/agent-skills/vercel-react-native-skills
npx skills add supabase/agent-skills/supabase-postgres-best-practices
npx skills add supabase/agent-skills/supabase
npx skills add expo/skills/building-native-ui
npx skills add sleekdotdesign/agent-skills/sleek-design-mobile-apps. Menciona el porque de cada una y porque estan buenas para instalar

### Respuesta

Las 5 skills quedaron instaladas globalmente y documentadas.

## Instalación completada

Los comandos con `/` no funcionaron; el CLI requiere `@`. Se usó:

```bash
npx skills add vercel-labs/agent-skills@vercel-react-native-skills -g -y
npx skills add supabase/agent-skills@supabase-postgres-best-practices -g -y
npx skills add supabase/agent-skills@supabase -g -y
npx skills add expo/skills@building-native-ui -g -y
npx skills add sleekdotdesign/agent-skills@sleek-design-mobile-apps -g -y
```

Ubicación: `~/.agents/skills/`

## Archivos creados/actualizados

- **`juntadas-app/ia/entrega-1/skills_instaladas.md`** — listado completo con descripción, motivo y alineación al stack
- **`juntadas-app/ia/entrega-1/indice_ia.md`** — entrada 13 (Claude) y 04 (Cursor)

## Resumen de cada skill

| Skill | Por qué conviene |
|-------|------------------|
| **vercel-react-native-skills** (~124K) | Mejores prácticas de RN/Expo de Vercel: listas, Reanimated, UI nativa. Encaja con React Native + Expo SDK 55. |
| **supabase-postgres-best-practices** (~184K) | Optimización SQL, índices, RLS y esquema. Directo para tus migraciones y queries en Supabase. |
| **supabase** (~83K) | Guía general de Auth, Storage, CLI y seguridad. Evita errores silenciosos en RLS y JWT. |
| **building-native-ui** (~43K) | Guía oficial de Expo para UI, animaciones y componentes nativos. Ojo: parte asume Expo Router; tu proyecto usa React Navigation. |
| **sleek-design-mobile-apps** (~163K) | Prototipado de pantallas móviles con IA vía sleek.design. Complementa el trabajo con Figma. Requiere `SLEEK_API_KEY` solo si usás la API. |

El detalle completo está en `skills_instaladas.md`.

---

### Archivos modificados

- `juntadas-app/ia/entrega-1/skills_instaladas.md` — editado
- `juntadas-app/ia/entrega-1/indice_ia.md` — editado


---

### Prompt

Tienes acceso a mi figma?

### Respuesta

Sí, **tengo acceso a Figma a través del plugin MCP de Figma en Cursor**, y está conectado a tu cuenta.

Verifiqué la sesión activa:

- **Usuario:** Nicolas Perez  
- **Email:** nicolas.perez@frlp.utn.edu.ar  
- **Plan:** Student (Full seat, Expert)

## Qué puedo hacer

Con esa conexión puedo, entre otras cosas:

- **Leer diseños** (Figma → código): contexto de pantallas, screenshots, metadata, variables
- **Escribir/editar** en Figma (código → Figma): crear pantallas, componentes, diagramas en FigJam
- **Code Connect**: mapear componentes de Figma con los del repo

## Qué necesito de vos

No tengo acceso automático a **todos** tus archivos de Figma como un explorador. Para trabajar sobre un diseño concreto necesito una de estas cosas:

1. **La URL del archivo** de Figma (ej. `https://figma.com/design/...`)
2. O que tengas **seleccionado un frame/nodo** en Figma Desktop (en algunos flujos de escritura)

En el repo no encontré guardada ninguna URL de Figma del proyecto Bitácora de Juntadas; solo referencias en la documentación de la entrega 1.

## Cómo seguimos

Si me pasás el link del mockup de Juntadas, puedo por ejemplo:

- Revisar las pantallas y compararlas con el código
- Extraer tokens (colores, tipografía, espaciado)
- Implementar una pantalla en React Native según el diseño
- Crear o actualizar frames en Figma desde el código

¿Tenés el link del archivo de Figma del proyecto?

---

---

### Prompt

Con esto https://www.figma.com/design/Iu9DQtttfYfcuWrFqmJuwb/Dise%C3%B1o-de-Wireframes---MockUps---DAM?node-id=73-23&t=esaJqdW2s16efUrA-1 pueden?

### Respuesta

Sí, **con ese link puedo acceder al archivo sin problema**. Lo acabo de probar y funciona.

## Archivo conectado

**Diseño de Wireframes - MockUps - DAM**  
`fileKey`: `Iu9DQtttfYfcuWrFqmJuwb`  
El nodo `73:23` apunta a la página **MockUps**.

## Qué pude leer

En esa página hay **19 mockups** del proyecto, por ejemplo:

| Pantalla |
|----------|
| Mockup - Bienvenida |
| Mockup - Iniciar Sesión |
| Mockup - Crear Cuenta |
| Mockup - Completar Perfil |
| Mockup - Olvidaste tu contraseña |
| Mockup - Crear Juntada |
| Mockup - Unirse a Juntada |
| Mockup - Detalle Juntada |
| Mockup - Perfil |
| Mockup - Historial de Juntadas |
| Mockup - Juegos |
| Mockup - Impostor |
| Mockup - Rol: No impostor / Impostor |
| Mockup - Recuerdos |
| …y variantes (código inválido, participantes, etc.) |

También pude extraer el diseño de **Bienvenida** con colores, textos y estructura (badge “Nueva experiencia social”, título “Tus juntadas, organizadas”, features, botones “Comenzar gratis” / “Ya tengo cuenta”).

## Qué puedo hacer con esto

- Implementar pantallas en **React Native + Expo** según los mockups
- Extraer tokens de diseño (colores, tipografía, espaciado)
- Comparar diseño vs código actual
- Revisar pantalla por pantalla si me pasás el `node-id` de cada una

**Tip:** Para una pantalla concreta, conviene mandar la URL con el frame seleccionado (ej. `node-id=73-24` para Bienvenida). Con la URL de la página entera también funciona, pero a veces hay que apuntar al frame hijo.

¿Querés que empiece por implementar la pantalla de **Bienvenida** en el proyecto mobile?

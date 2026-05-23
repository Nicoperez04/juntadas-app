# Índice de temas consultados con IA — Entrega 1

## Claude (claude.ai)

01 - Contextualización del proyecto y revisión de documentos técnicos
02 - Análisis y revisión del diseño en Figma (mockups y wireframes)
03 - Planificación general del flujo de trabajo y fases de desarrollo
04 - Estructura del repositorio GitHub y convenciones de commits
05 - Inicialización del proyecto Expo con template blank-typescript
06 - Instalación y alineación de dependencias SDK 55
07 - Análisis y diseño del modelo de datos en Supabase
08 - Creación de tablas, enums, triggers, índices y políticas RLS
09 - Configuración del cliente de Supabase y variables de entorno
10 - Esqueleto de navegación con React Navigation
11 - Resolución de conflicto entre Expo Router y React Navigation
12 - Configuración de Cursor Rules para el proyecto
13 - Instalación de agent skills para React Native, Expo, Supabase y diseño móvil (ver `skills_instaladas.md`)

## Cursor

### Sesiones de prueba (sin numeración)

- Diagnóstico Expo Router y renombrado a src/navigation → [`conversaciones/expo-router-navigation.md`](conversaciones/expo-router-navigation.md) · [`prompts/expo-router-navigation.md`](prompts/expo-router-navigation.md)
- Instalación de agent skills → [`conversaciones/instalacion-skills.md`](conversaciones/instalacion-skills.md) · [`prompts/instalacion-skills.md`](prompts/instalacion-skills.md)
- Exportación de conversaciones con SpecStory → [`conversaciones/exportacion-conversaciones.md`](conversaciones/exportacion-conversaciones.md) · [`prompts/exportacion-conversaciones.md`](prompts/exportacion-conversaciones.md)
- Cursor Rules, migración Supabase e índice IA → [`conversaciones/cursor-rules-migracion-indice.md`](conversaciones/cursor-rules-migracion-indice.md) · [`prompts/cursor-rules-migracion-indice.md`](prompts/cursor-rules-migracion-indice.md)

### Bloque 1 — Autenticación (23/05/2026)

- **01** · Implementación del módulo de auth (tipos, schemas, servicio, hook, componentes y pantallas) → [`conversaciones/bloque-1/cursor-bloque-1-completo.md`](conversaciones/bloque-1/cursor-bloque-1-completo.md) · [`prompts/bloque-1/cursor-01-auth-implementacion.md`](prompts/bloque-1/cursor-01-auth-implementacion.md)
- **02** · Revisión, comentarios profesionales y sistema de diseño (theme.ts) → [`prompts/bloque-1/cursor-02-auth-revision-comentarios.md`](prompts/bloque-1/cursor-02-auth-revision-comentarios.md)
- **03** · Documentación y cierre del Bloque 1 → [`prompts/bloque-1/cursor-03-documentar-bloque-1.md`](prompts/bloque-1/cursor-03-documentar-bloque-1.md)

### Sesiones numeradas (desde el próximo chat)

La numeración (`01-`, `02-`, …) empieza en el **siguiente chat nuevo**, no en el de corrección de exports.

---

## Cómo mantener actualizado

1. SpecStory guarda el export crudo (con timestamp) en `.specstory/history/`.
2. Para sesiones **numeradas** (desde el próximo chat):
   ```bash
   node juntadas-app/ia/entrega-1/scripts/organize-ia-exports.mjs --add-numbered mi-slug "Título descriptivo" 2026-05-24_...md
   node juntadas-app/ia/entrega-1/scripts/organize-ia-exports.mjs
   ```
3. Para sesiones de prueba, agregar entrada en `export-mapping.json` → sección `trial` (sin número).
4. El script genera versiones **limpias**: prompt + respuesta final + archivos modificados (sin tool calls ni proceso intermedio).
5. Actualizar este índice con los links correspondientes.

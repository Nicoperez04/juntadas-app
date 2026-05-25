#!/usr/bin/env node
/**
 * Genera conversaciones completas de bloques desde agent transcripts (JSONL).
 * Formato: prompt completo + respuesta final completa + archivos modificados.
 *
 * Uso: node juntadas-app/ia/entrega-1/scripts/build-block-conversations.mjs
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENTREGA_DIR = join(__dirname, '..');
const PROMPTS_DIR = join(ENTREGA_DIR, 'prompts');
const CONVERSACIONES_DIR = join(ENTREGA_DIR, 'conversaciones');
const WORKSPACE_ROOT = join(ENTREGA_DIR, '..', '..', '..');

const TRANSCRIPTS_CANDIDATES = [
  join(
    process.env.USERPROFILE ?? '',
    '.cursor',
    'projects',
    'c-Users-nicop-OneDrive-Escritorio-Facultad-4toA-o-Electivas-4to-Desarrollo-de-Aplicaciones-Moviles-1C-Juntadas-App',
    'agent-transcripts',
  ),
  join(WORKSPACE_ROOT, '.cursor', 'projects', 'c-Users-nicop-OneDrive-Escritorio-Facultad-4toA-o-Electivas-4to-Desarrollo-de-Aplicaciones-Moviles-1C-Juntadas-App', 'agent-transcripts'),
];

const TRANSCRIPTS_DIR =
  TRANSCRIPTS_CANDIDATES.find((dir) => existsSync(dir)) ?? TRANSCRIPTS_CANDIDATES[0];

const SYSTEM_MARKERS = [
  '<system_notification>',
  'Briefly inform the user about the task result',
];

const isSystemPrompt = (text) =>
  SYSTEM_MARKERS.some((marker) => text.includes(marker));

const extractUserQuery = (raw) => {
  const match = raw.match(/<user_query>\s*([\s\S]*?)\s*<\/user_query>/i);
  if (match) {
    return match[1].trim();
  }

  return raw
    .replace(/<plugin_info[\s\S]*?<\/plugin_info>/gi, '')
    .replace(/<timestamp>[\s\S]*?<\/timestamp>/gi, '')
    .replace(/<open_and_recently_viewed_files>[\s\S]*?<\/open_and_recently_viewed_files>/gi, '')
    .replace(/<agent_transcripts>[\s\S]*?<\/agent_transcripts>/gi, '')
    .replace(/<agent_skills>[\s\S]*?<\/agent_skills>/gi, '')
    .replace(/<mcp_file_system>[\s\S]*?<\/mcp_file_system>/gi, '')
    .trim();
};

const getTextParts = (content) =>
  (content ?? [])
    .filter((part) => part.type === 'text' && part.text)
    .map((part) => part.text.replace(/\[REDACTED\]/g, '').trim())
    .filter(Boolean);

const isSubstantiveResponse = (text) =>
  text.length >= 40 ||
  /^#{1,3}\s/m.test(text) ||
  /^\*\*[^*]+\*\*/m.test(text) ||
  /^-\s/m.test(text) ||
  /^\|/m.test(text);

const normalizePath = (rawPath) => {
  const cleaned = String(rawPath).trim().replace(/\\/g, '/');
  const rel = relative(WORKSPACE_ROOT, cleaned.replace(/\//g, '\\')).replace(
    /\\/g,
    '/',
  );

  if (!rel.startsWith('..')) {
    return rel;
  }

  const match = cleaned.match(/juntadas-app\/[^\s`]+/i);
  return match ? match[0] : cleaned.split('/').slice(-4).join('/');
};

const extractFileChanges = (assistantLines) => {
  const changes = new Map();

  for (const line of assistantLines) {
    let parsed;

    try {
      parsed = JSON.parse(line);
    } catch {
      continue;
    }

    if (parsed.role !== 'assistant') {
      continue;
    }

    for (const part of parsed.message?.content ?? []) {
      if (part.type !== 'tool_use') {
        continue;
      }

      const tool = part.name;
      const path = part.input?.path;

      if (!path || typeof path !== 'string') {
        continue;
      }

      const normalized = normalizePath(path);

      if (normalized.includes('ia/entrega-1/')) {
        continue;
      }

      if (tool === 'Read' || tool === 'Grep' || tool === 'Glob') {
        continue;
      }

      let action = 'modificado';

      if (tool === 'Write') {
        action = existsSync(join(WORKSPACE_ROOT, normalized)) ? 'modificado' : 'creado';
      }

      if (tool === 'Delete') {
        action = 'eliminado';
      }

      if (!changes.has(normalized)) {
        changes.set(normalized, action);
      }
    }
  }
  return [...changes.entries()].map(([path, action]) => ({ path, action }));
};

const parseTranscript = (uuid) => {
  const filePath = join(TRANSCRIPTS_DIR, uuid, `${uuid}.jsonl`);

  if (!existsSync(filePath)) {
    throw new Error(`Transcript no encontrado: ${filePath}`);
  }

  const lines = readFileSync(filePath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  const exchanges = [];
  let current = null;

  for (const entry of lines) {
    if (entry.role === 'user') {
      if (current) {
        exchanges.push(current);
      }

      const raw = getTextParts(entry.message?.content).join('\n\n');
      const prompt = extractUserQuery(raw);

      current = {
        prompt,
        assistantLines: [],
        responses: [],
      };
      continue;
    }

    if (entry.role === 'assistant' && current) {
      current.assistantLines.push(JSON.stringify(entry));
      const texts = getTextParts(entry.message?.content);
      const joined = texts.join('\n\n').trim();

      if (joined) {
        current.responses.push(joined);
      }
    }
  }

  if (current) {
    exchanges.push(current);
  }

  return exchanges
    .filter((exchange) => exchange.prompt && !isSystemPrompt(exchange.prompt))
    .map((exchange) => {
      const fileChanges = extractFileChanges(exchange.assistantLines);
      let response =
        exchange.responses.length > 0
          ? exchange.responses.join('\n\n---\n\n')
          : '';

      if (!response && fileChanges.length > 0) {
        response =
          '_(El agente ejecutó cambios sin mensaje de cierre textual en el transcript. Ver sección **Archivos modificados**.)_';
      }

      if (!response) {
        response = '_(Sin respuesta final detectada en el transcript)_';
      }

      return {
        prompt: exchange.prompt,
        response,
        fileChanges,
      };
    });
};

const readPromptFile = (relativePath) => {
  const fullPath = join(ENTREGA_DIR, relativePath.replace(/\//g, '\\'));

  if (!existsSync(fullPath)) {
    return null;
  }

  const content = readFileSync(fullPath, 'utf8').trim();
  return content.replace(/^#\s[^\n]+\n+/m, '').trim() || content;
};

const formatFileChanges = (fileChanges) => {
  if (fileChanges.length === 0) {
    return '';
  }

  const lines = fileChanges.map(
    ({ path, action }) => `- \`${path}\` — ${action}`,
  );

  return `\n\n### Archivos modificados\n\n${lines.join('\n')}\n`;
};

const deriveTitle = (prompt) => {
  const line =
    prompt
      .split('\n')
      .map((entry) => entry.trim())
      .find(Boolean) ?? 'Intercambio';

  return line.length > 110 ? `${line.slice(0, 107)}...` : line;
};

const matchPromptFile = (prompt, matchers = []) => {
  for (const matcher of matchers) {
    if (matcher.test.test(prompt)) {
      return matcher;
    }
  }

  return null;
};

const transcriptCache = new Map();

const getTranscriptExchanges = (uuid) => {
  if (!transcriptCache.has(uuid)) {
    transcriptCache.set(uuid, parseTranscript(uuid));
  }

  return transcriptCache.get(uuid);
};

const buildSessionsFromTranscripts = (transcriptConfigs) => {
  const sessions = [];
  let sessionNumber = 1;

  for (const config of transcriptConfigs) {
    const exchanges = getTranscriptExchanges(config.id);

    exchanges.forEach((exchange, exchangeIndex) => {
      const matcher = matchPromptFile(exchange.prompt, config.matchers);
      const title =
        matcher?.title ??
        `Intercambio ${sessionNumber} — ${deriveTitle(exchange.prompt)}`;

      sessions.push({
        title: `Sesión ${sessionNumber} — ${title}`,
        promptFile: matcher?.file ?? null,
        promptFromTranscript: exchange.prompt,
        response: exchange.response,
        fileChanges: exchange.fileChanges,
        transcriptId: config.id,
        exchangeIndex,
      });

      sessionNumber += 1;
    });
  }

  return sessions;
};

const formatExchange = (session) => {
  const savedPrompt = session.promptFile
    ? readPromptFile(session.promptFile)
    : null;

  const promptSections = [];

  if (savedPrompt) {
    promptSections.push(`### Prompt (archivo guardado: \`${session.promptFile}\`)\n\n${savedPrompt}`);
  }

  if (!savedPrompt || savedPrompt.trim() !== session.promptFromTranscript.trim()) {
    promptSections.push(`### Prompt (mensaje en chat)\n\n${session.promptFromTranscript}`);
  }

  return `## ${session.title}

${promptSections.join('\n\n')}

### Respuesta

${session.response}${formatFileChanges(session.fileChanges)}

<details>
<summary>Metadatos del intercambio</summary>

- **Transcript:** \`${session.transcriptId}\`
- **Índice:** ${session.exchangeIndex}

</details>`;
};

const buildDocument = (config) => {
  const sections = config.sessions.map((session) => formatExchange(session));

  return `${config.header}

---

${config.summary}

---

${sections.join('\n\n---\n\n')}

---

## Conversación completa

Este documento consolida **prompts y respuestas finales completas** extraídas de los agent transcripts de Cursor. No incluye tool calls ni razonamiento intermedio.

**Transcripts fuente:** ${config.transcriptIds.map((id) => `\`${id}\``).join(', ')}
`;
};

const BLOCKS = [
  {
    output: join(CONVERSACIONES_DIR, 'bloque-1', 'cursor-bloque-1-completo.md'),
    header: `# Conversación Bloque 1 — Autenticación

**Herramienta:** Cursor Agent
**Fecha:** 23/05/2026
**Rama:** entrega-1`,
    summary: `## Resumen

En este bloque se implementó el módulo completo de autenticación de la app Juntadas, seguido de revisión de calidad con sistema de diseño centralizado.

### Lo que se implementó
- Tipos, schemas Zod, servicio, hook y pantallas de auth
- Componentes compartidos: \`AppButton\`, \`AppInput\`, \`AppLogo\`
- Sistema de diseño centralizado en \`theme.ts\`
- Actualización de \`AuthNavigator\` con pantallas reales

### Decisiones tomadas
- \`mapAuthError\` traduce errores de Supabase Auth al español
- \`useAuth\` retorna \`{ error }\` por operación para evitar race conditions
- \`useCallback\` en todas las funciones del hook
- \`theme.ts\` como única fuente de verdad visual

### Puntos pendientes
- Verificar trigger de Supabase para \`full_name\` y \`username\` null
- Verificar URL Configuration para forgot password en desarrollo
- Evaluar verificación de username duplicado con debounce`,
    transcriptIds: ['6a1d9500-e86b-40c7-8580-1ccd03f250d2', '33f39f0b-1864-4ed0-9fd1-c1a756dd4546'],
    transcriptConfigs: [
      {
        id: '6a1d9500-e86b-40c7-8580-1ccd03f250d2',
        matchers: [
          {
            test: /Implementación — Bloque 1: Autenticación/i,
            file: 'prompts/bloque-1/cursor-01-auth-implementacion.md',
            title: 'Implementación del módulo de autenticación',
          },
          {
            test: /Revisión — Bloque 1: Comentarios, calidad y consistencia visual/i,
            file: 'prompts/bloque-1/cursor-02-auth-revision-comentarios.md',
            title: 'Revisión: comentarios, calidad y consistencia visual',
          },
          {
            test: /Cannot find module '@expo\/vector-icons'/i,
            title: 'Fix: dependencia @expo/vector-icons',
          },
          {
            test: /Documentación — Cierre del Bloque 1/i,
            file: 'prompts/bloque-1/cursor-03-documentar-bloque-1.md',
            title: 'Documentación y cierre del Bloque 1',
          },
        ],
      },
      {
        id: '33f39f0b-1864-4ed0-9fd1-c1a756dd4546',
        matchers: [
          {
            test: /Diagnóstico — Error "Invalid path specified in request URL"/i,
            file: 'prompts/bloque-1/cursor-04-diagnostico-supabase-url.md',
            title: 'Diagnóstico error Supabase URL',
          },
          {
            test: /Fixes — Cierre del Bloque 1/i,
            file: 'prompts/bloque-1/cursor-05-fixes-cierre-bloque-1.md',
            title: 'Fixes de cierre del Bloque 1',
          },
        ],
      },
    ],
  },
  {
    output: join(CONVERSACIONES_DIR, 'bloque-2', 'cursor-bloque-2-chat-1.md'),
    header: `# Conversación Bloque 2 — Juntadas (Chat 1)

**Herramienta:** Cursor Agent
**Fecha:** 23/05/2026
**Rama:** feature/bloque-2-meetups`,
    summary: `## Resumen

Implementación completa del módulo de juntadas y fixes previos al test.

### Lo que se implementó
- Tipos, schemas, servicio, hook y pantallas del módulo meetups
- Fix de RLS circular en \`meetup_participants\`
- Fix de formato de fecha DD/MM/YYYY ↔ YYYY-MM-DD
- Fix de refresh con \`useFocusEffect\`

### Problemas encontrados y resueltos
- RLS circular en \`meetup_participants\`
- Pantalla en blanco en home (\`isLoading\` inicial)
- Juntadas no aparecían al volver (refresh + caché Metro)`,
    transcriptIds: ['d437a364-f990-4d5b-a564-e835952021eb', 'f46fd390-1e41-4a47-96ca-aee7d8346e87'],
    transcriptConfigs: [
      {
        id: 'd437a364-f990-4d5b-a564-e835952021eb',
        matchers: [
          {
            test: /Implementación — Bloque 2: Gestión de Juntadas|Implementación — Bloque 2/i,
            file: 'prompts/bloque-2/cursor-01-meetups-implementacion.md',
            title: 'Implementación del módulo de juntadas',
          },
        ],
      },
      {
        id: 'f46fd390-1e41-4a47-96ca-aee7d8346e87',
        matchers: [
          {
            test: /Fixes previos al test — Bloque 2/i,
            file: 'prompts/bloque-2/cursor-02-meetups-fixes-previos-test.md',
            title: 'Fixes previos al test',
          },
          {
            test: /Pantalla en blanco en MeetupHomeScreen/i,
            title: 'Diagnóstico y fix pantalla en blanco',
          },
          {
            test: /getUserMeetups/i,
            title: 'Fix error en getUserMeetups',
          },
        ],
      },
    ],
  },
  {
    output: join(CONVERSACIONES_DIR, 'bloque-2', 'cursor-bloque-2-chat-2.md'),
    header: `# Conversación Bloque 2 — Juntadas (Chat 2: DateTime Picker y cierre)

**Herramienta:** Cursor Agent
**Fecha:** 23/05/2026
**Rama:** feature/bloque-2-meetups`,
    summary: `## Resumen

Fix del selector de fecha y hora, refresh del home, documentación y limpieza de logs.

### Lo que se implementó
- \`DateTimePicker\` nativo con \`TouchableOpacity\`
- Integración con React Hook Form
- \`useFocusEffect\` para refresh del home
- Documentación del Bloque 2

### Problemas encontrados y resueltos
- Picker no se abría con subcomponentes encapsulados
- Juntadas no aparecían al volver al home
- Logs temporales removidos tras confirmar el fix`,
    transcriptIds: ['434cdfd7-6aa1-4cf7-aebf-8af94c996e6f'],
    transcriptConfigs: [
      {
        id: '434cdfd7-6aa1-4cf7-aebf-8af94c996e6f',
        matchers: [
          {
            test: /Selectores nativos de fecha y hora/i,
            file: 'prompts/bloque-2/cursor-03-datetime-picker.md',
            title: 'Selectores nativos de fecha y hora',
          },
          {
            test: /inputs de texto, no botones que abren el picker/i,
            file: 'prompts/bloque-2/cursor-04-datetime-picker-fix.md',
            title: 'Fix: picker no se abría al tocar',
          },
          {
            test: /cursor-05-meetups-refresh/i,
            file: 'prompts/bloque-2/cursor-05-meetups-refresh.md',
            title: 'Fix refresh al volver al home',
          },
          {
            test: /cursor-06-documentar-bloque-2/i,
            file: 'prompts/bloque-2/cursor-06-documentar-bloque-2.md',
            title: 'Documentación del Bloque 2',
          },
        ],
      },
    ],
  },
  {
    output: join(CONVERSACIONES_DIR, 'bloque-3', 'cursor-bloque-3-completo.md'),
    header: `# Conversación Bloque 3 — Participantes y acciones sobre juntadas

**Herramienta:** Cursor Agent
**Fecha:** 23–24/05/2026
**Rama:** feature/bloque-3-participantes`,
    summary: `## Resumen

### Lo que se implementó
- Servicio, hook y pantallas del módulo de participantes
- \`EditMeetupScreen\`, \`MeetupHistoryScreen\`, Toast rediseñado
- Banner de estado, modal de cancelación, soft delete en \`leaveMeetup\`

### Decisiones tomadas
- \`ModifyAttendance\` como bottom sheet modal
- \`ModifyAttendanceLink\` y \`getParticipantDisplayName()\`
- Políticas RLS corregidas para join por código

### Problemas encontrados y resueltos
- RLS circular y RLS de join por código
- Overlay negro en modal asistencia
- Hora HH:MM:SS en editar
- Botón Editar activo en juntadas finalizadas

### Pendientes para bloques futuros
- Colores hardcodeados en badges/avatares
- \`getSession\` fuera de servicios
- Tipado genérico en navigator
- Errores RLS genéricos en \`translateError\``,
    transcriptIds: [
      '7af78798-869f-4827-9261-20830212f502',
      '6ec0dfa5-19d0-43a2-8893-d21b6043f0be',
      '4b48349f-050f-41a8-a6e7-f9ee7cd90d55',
    ],
    transcriptConfigs: [
      {
        id: '7af78798-869f-4827-9261-20830212f502',
        matchers: [
          {
            test: /Implementación — Bloque 3: Participantes/i,
            file: 'prompts/bloque-3/cursor-01-participantes-implementacion.md',
            title: 'Implementación del módulo de participantes',
          },
          {
            test: /Implementa lo que te pase en el prompt/i,
            file: 'prompts/bloque-3/cursor-01-participantes-implementacion.md',
            title: 'Ejecución de la implementación del Bloque 3',
          },
          {
            test: /Error de TypeScript en CreateMeetupScreen/i,
            title: 'Fix TypeScript en CreateMeetupScreen y EditMeetupScreen',
          },
        ],
      },
      {
        id: '6ec0dfa5-19d0-43a2-8893-d21b6043f0be',
        matchers: [
          {
            test: /Fixes — Bloque 3: Participantes y acciones/i,
            file: 'prompts/bloque-3/cursor-02-fixes-bloque-3.md',
            title: 'Fixes RLS, hora y estado de juntada',
          },
          {
            test: /Fixes UX — Bloque 3/i,
            file: 'prompts/bloque-3/cursor-03-ux-fixes.md',
            title: 'Fixes UX: Toast, modal asistencia y nombres',
          },
          {
            test: /Revisión — Bloque 3/i,
            file: 'prompts/bloque-3/cursor-04-revision-bloque-3.md',
            title: 'Revisión completa del Bloque 3',
          },
        ],
      },
      {
        id: '4b48349f-050f-41a8-a6e7-f9ee7cd90d55',
        matchers: [
          {
            test: /Fixes finales — Bloque 3 antes de commitear/i,
            file: 'prompts/bloque-3/cursor-05-fixes-finales-bloque-3.md',
            title: 'Fixes finales antes de commitear',
          },
          {
            test: /Documentación — Cierre del Bloque 3/i,
            file: 'prompts/bloque-3/cursor-06-documentar-bloque-3.md',
            title: 'Documentación y cierre del Bloque 3',
          },
          {
            test: /Borra las conversaciones hechas con el spec story/i,
            title: 'Eliminar exports crudos de SpecStory',
          },
          {
            test: /conversaciones de los bloques al no utilizar spec history/i,
            title: 'Completar conversaciones desde agent transcripts',
          },
        ],
      },
    ],
  },
  {
    output: join(CONVERSACIONES_DIR, 'bloque-4', 'cursor-bloque-4-completo.md'),
    header: `# Conversación Bloque 4 — Juego Impostor

**Herramienta:** Cursor Agent
**Rama:** feature/bloque-4-impostor`,
    summary: `## Lo que se implementó

- GamesScreen independiente accesible desde el tab bar
- ImpostorStartScreen con meetupId opcional
- ImpostorRoleScreen con flip animado, dots de progreso y contador
- Dataset de 600 palabras en 20 categorías
- Dos modos de palabra: todas las categorías o categoría específica
- La palabra siempre es aleatoria — el organizador nunca la ve
- Historial de palabras usadas para evitar repetición en la sesión
- Rediseño integrado al sistema de diseño de la app
- impostorTheme.ts para tokens específicos del juego

## Decisiones tomadas

- Modo un solo celular — se pasa de mano en mano
- meetupId opcional para jugar sin juntada creada
- Fondo claro en GamesScreen e ImpostorStartScreen, fondo oscuro solo en revelación
- Zustand para compartir estado de sesión entre pantallas`,
    transcriptIds: [
      '2628f302-44de-49ef-a3b5-60118adcc749',
      '05ad3d82-072a-4b3c-8188-47b0166ba77a',
    ],
    transcriptConfigs: [
      {
        id: '2628f302-44de-49ef-a3b5-60118adcc749',
        matchers: [
          {
            test: /Implementación — Bloque 4: Juego Impostor/i,
            file: 'prompts/bloque-4/cursor-01-impostor-implementacion.md',
            title: 'Implementación del juego Impostor',
          },
          {
            test: /Rediseño y correcciones — Bloque 4/i,
            file: 'prompts/bloque-4/cursor-03-impostor-redesign.md',
            title: 'Rediseño y correcciones del Impostor',
          },
          {
            test: /categoria especifica|categoría específica|pista para el impostor/i,
            title: 'Fix categoría específica y selector de pista',
          },
        ],
      },
      {
        id: '05ad3d82-072a-4b3c-8188-47b0166ba77a',
        matchers: [
          {
            test: /guía completa para el resto de mis compañeros/i,
            title: 'Guía de onboarding para el equipo (ONBOARDING.md)',
          },
        ],
      },
    ],
  },
  {
    output: join(CONVERSACIONES_DIR, 'bloque-5', 'cursor-bloque-5-completo.md'),
    header: `# Conversación Bloque 5 — Recuerdos (Galería de fotos)

**Herramienta:** Cursor Agent
**Rama:** feature/bloque-5-recuerdos
**Transcript ID:** \`88514432-4ce7-4010-a15b-d856d8c58521\``,
    summary: `## Resumen

### Lo que se implementó

- Tipos, servicio (\`memoriesService\`) y hook (\`useMemories\`) del módulo \`memories\`
- \`MemoriesGalleryScreen\` con grid 3 columnas, empty state, skeleton, subida múltiple y FAB
- \`MemoryViewerScreen\` con vista ampliada, swipe horizontal y swipe down para cerrar
- Eliminación desde galería (long press) y desde viewer (botón papelera + modal)
- Sincronización galería ↔ viewer al eliminar (\`memoryGallerySync.ts\`)
- Tooltip de primera visita + modal de ayuda (\`?\`) con instrucciones
- Migración \`004_memories_storage.sql\` con políticas RLS de Storage
- Skill propia \`.cursor/rules/photo-gallery-patterns.mdc\`

### Decisiones tomadas

- Subida solo en juntadas activas o finalizadas (\`isActive\` en navegación)
- Selección múltiple con \`expo-image-picker\` (\`allowsMultipleSelection: true\`)
- Sin caption; orden por \`created_at DESC\`
- Path Storage: \`{meetupId}/{userId}/{timestamp}.jpg\` con \`upsert: false\`
- \`AsyncStorage\` para tooltip de primera visita (\`memories_delete_tip_shown\`)
- Sincronización post-delete vía \`memoryGallerySync\` (no callbacks en \`route.params\`)

### Skills intentadas instalar

- \`pbakaus/impeccable/delight\` — falló
- \`emilkowalski/skill/emil-design-eng\` — falló
- \`expo/skills/native-data-fetching\` — falló

### Problemas encontrados y resueltos

- Galería no se actualizaba al eliminar desde viewer — \`onDelete\` en params, luego \`memoryGallerySync\`
- Warning \`Non-serializable values... onDelete (Function)\` — registro efímero fuera del navigation state
- RLS de Storage para bucket \`memories\` — migración \`004_memories_storage.sql\`
- Figma MCP no disponible — UI según \`theme.ts\` y pantallas existentes

### Pendientes para validación

- Ejecutar \`004_memories_storage.sql\` en Supabase si no se aplicó via CLI
- Probar subida múltiple y eliminación en dispositivo real
- Verificar tooltip de primera visita (borrar clave \`memories_delete_tip_shown\` para reprobar)`,
    transcriptIds: ['88514432-4ce7-4010-a15b-d856d8c58521'],
    transcriptConfigs: [
      {
        id: '88514432-4ce7-4010-a15b-d856d8c58521',
        matchers: [
          {
            test: /Implementación — Bloque 5: Recuerdos/i,
            file: 'prompts/bloque-5/cursor-01-recuerdos-implementacion.md',
            title: 'Implementación del módulo de recuerdos',
          },
          {
            test: /Guardaste el prompt\?/i,
            title: 'Guardado del prompt de implementación',
          },
          {
            test: /Fixes — Bloque 5: Recuerdos/i,
            file: 'prompts/bloque-5/cursor-02-memories-fixes.md',
            title: 'Fixes: refresh al eliminar y modal de ayuda',
          },
          {
            test: /Non-serializable|onDelete \(Function\)|Revisemo el siguiente warning/i,
            title: 'Fix warning React Navigation: memoryGallerySync',
          },
          {
            test: /Documentación — Cierre del Bloque 5/i,
            file: 'prompts/bloque-5/cursor-03-documentar-bloque-5.md',
            title: 'Documentación y cierre del Bloque 5',
          },
          {
            test: /script de export del bloque 5/i,
            title: 'Actualización del script build-block-conversations',
          },
        ],
      },
    ],
  },
];

const main = () => {
  console.log(`Transcripts: ${TRANSCRIPTS_DIR}\n`);
  console.log('Generando conversaciones completas desde agent transcripts...\n');

  for (const block of BLOCKS) {
    const sessions = buildSessionsFromTranscripts(block.transcriptConfigs);

    const markdown = buildDocument({
      ...block,
      sessions,
    });

    writeFileSync(block.output, markdown, 'utf8');
    console.log(`✓ ${relative(ENTREGA_DIR, block.output)} (${sessions.length} sesiones)`);
  }

  console.log('\nListo.');
};

main();

#!/usr/bin/env node
/**
 * Exporta conversaciones E2 desde agent transcripts (JSONL) de Cursor.
 * Conserva el contenido existente hasta "## Conversación exportada" y
 * reemplaza esa sección con sesiones completas (prompt + respuesta).
 *
 * Uso: node juntadas-app/ia/entrega-2/scripts/build-block-conversations.mjs
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENTREGA_DIR = join(__dirname, '..');
const CONVERSACIONES_DIR = join(ENTREGA_DIR, 'conversaciones');
const WORKSPACE_ROOT = join(ENTREGA_DIR, '..', '..');

const TRANSCRIPTS_DIR = join(
  process.env.USERPROFILE ?? '',
  '.cursor',
  'projects',
  'c-Users-nicop-OneDrive-Escritorio-Facultad-4toA-o-Electivas-4to-Desarrollo-de-Aplicaciones-Moviles-1C-Juntadas-App',
  'agent-transcripts',
);

const SYSTEM_MARKERS = [
  '<system_notification>',
  'Briefly inform the user about the task result',
];

const isSystemPrompt = (text) => SYSTEM_MARKERS.some((marker) => text.includes(marker));

const extractUserQuery = (raw) => {
  const match = raw.match(/<user_query>\s*([\s\S]*?)\s*<\/user_query>/i);
  if (match) return match[1].trim();
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

const normalizePath = (rawPath) => {
  const cleaned = String(rawPath).trim().replace(/\\/g, '/');
  const rel = relative(WORKSPACE_ROOT, cleaned.replace(/\//g, '\\')).replace(/\\/g, '/');
  if (!rel.startsWith('..')) return rel;
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
    if (parsed.role !== 'assistant') continue;
    for (const part of parsed.message?.content ?? []) {
      if (part.type !== 'tool_use') continue;
      const tool = part.name;
      const path = part.input?.path;
      if (!path || typeof path !== 'string') continue;
      const normalized = normalizePath(path);
      if (normalized.includes('ia/entrega-')) continue;
      if (tool === 'Read' || tool === 'Grep' || tool === 'Glob') continue;
      let action = 'modificado';
      if (tool === 'Write') action = existsSync(join(WORKSPACE_ROOT, normalized)) ? 'modificado' : 'creado';
      if (tool === 'Delete') action = 'eliminado';
      if (!changes.has(normalized)) changes.set(normalized, action);
    }
  }
  return [...changes.entries()].map(([path, action]) => ({ path, action }));
};

const parseTranscript = (uuid) => {
  const filePath = join(TRANSCRIPTS_DIR, uuid, `${uuid}.jsonl`);
  if (!existsSync(filePath)) throw new Error(`Transcript no encontrado: ${filePath}`);

  const lines = readFileSync(filePath, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line));
  const exchanges = [];
  let current = null;

  for (const entry of lines) {
    if (entry.role === 'user') {
      if (current) exchanges.push(current);
      const raw = getTextParts(entry.message?.content).join('\n\n');
      current = { prompt: extractUserQuery(raw), assistantLines: [], responses: [] };
      continue;
    }
    if (entry.role === 'assistant' && current) {
      current.assistantLines.push(JSON.stringify(entry));
      const joined = getTextParts(entry.message?.content).join('\n\n').trim();
      if (joined) current.responses.push(joined);
    }
  }
  if (current) exchanges.push(current);

  return exchanges
    .filter((exchange) => exchange.prompt && !isSystemPrompt(exchange.prompt))
    .map((exchange) => {
      const fileChanges = extractFileChanges(exchange.assistantLines);
      let response = exchange.responses.length > 0 ? exchange.responses.join('\n\n---\n\n') : '';
      if (!response && fileChanges.length > 0) {
        response = '_(El agente ejecutó cambios sin mensaje de cierre textual en el transcript. Ver **Archivos modificados**.)_';
      }
      if (!response) response = '_(Sin respuesta final detectada en el transcript)_';
      return { prompt: exchange.prompt, response, fileChanges };
    });
};

const readPromptFile = (relativePath) => {
  const fullPath = join(ENTREGA_DIR, relativePath.replace(/\//g, '\\'));
  if (!existsSync(fullPath)) return null;
  return readFileSync(fullPath, 'utf8').trim();
};

const formatFileChanges = (fileChanges) => {
  if (fileChanges.length === 0) return '';
  const lines = fileChanges.map(({ path, action }) => `- \`${path}\` — ${action}`);
  return `\n\n### Archivos modificados\n\n${lines.join('\n')}\n`;
};

const deriveTitle = (prompt) => {
  const line = prompt.split('\n').map((entry) => entry.trim()).find(Boolean) ?? 'Intercambio';
  return line.length > 110 ? `${line.slice(0, 107)}...` : line;
};

const matchPromptFile = (prompt, matchers = []) => {
  for (const matcher of matchers) {
    if (matcher.test.test(prompt)) return matcher;
  }
  return null;
};

const transcriptCache = new Map();
const getTranscriptExchanges = (uuid) => {
  if (!transcriptCache.has(uuid)) transcriptCache.set(uuid, parseTranscript(uuid));
  return transcriptCache.get(uuid);
};

const buildSessionsFromTranscripts = (transcriptConfigs) => {
  const sessions = [];
  let sessionNumber = 1;
  for (const config of transcriptConfigs) {
    const exchanges = getTranscriptExchanges(config.id);
    exchanges.forEach((exchange, exchangeIndex) => {
      const matcher = matchPromptFile(exchange.prompt, config.matchers);
      const title = matcher?.title ?? deriveTitle(exchange.prompt);
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
  const savedPrompt = session.promptFile ? readPromptFile(session.promptFile) : null;
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

const buildExportSection = (transcriptIds, sessions) => {
  const sections = sessions.map((session) => formatExchange(session));
  return `## Conversación exportada de Cursor

Este documento incluye **prompts y respuestas finales completas** extraídas de los agent transcripts de Cursor (JSONL local). No incluye tool calls ni razonamiento intermedio.

**Transcripts fuente:** ${transcriptIds.map((id) => `\`${id}\``).join(', ')}

---

${sections.join('\n\n---\n\n')}
`;
};

const BLOCKS = [
  {
    output: join(CONVERSACIONES_DIR, 'bloque-0', 'cursor-bloque-0-completo.md'),
    transcriptIds: ['1ada3be1-84a6-464b-9dbd-ee632feaee3d'],
    transcriptConfigs: [
      {
        id: '1ada3be1-84a6-464b-9dbd-ee632feaee3d',
        matchers: [
          { test: /Bloque 0 — Refactor base/i, file: 'prompts/bloque-0/01_refactor_base.md', title: 'Refactor base y setup E2' },
          { test: /dESACTIVA el spec story/i, title: 'Desactivar SpecStory auto-export' },
          { test: /Documentación — Cierre del Bloque 0/i, file: 'prompts/bloque-0/02_documentar_bloque-0.md', title: 'Documentación cierre Bloque 0' },
        ],
      },
    ],
  },
  {
    output: join(CONVERSACIONES_DIR, 'bloque-1', 'cursor-bloque-1-completo.md'),
    transcriptIds: ['6984a3e7-9dd4-4473-a8ce-6f6f24af87f8', '2225c026-f428-442e-b8df-f1bd9a1cbe51'],
    transcriptConfigs: [
      {
        id: '6984a3e7-9dd4-4473-a8ce-6f6f24af87f8',
        matchers: [
          { test: /Bloque 1 — Mejoras de Juntada/i, file: 'prompts/bloque-1/01_mejoras_juntada.md', title: 'Mejoras de Juntada' },
          { test: /Con que comando y desde donde corria/i, title: 'Consulta: comando para correr la app' },
        ],
      },
      {
        id: '2225c026-f428-442e-b8df-f1bd9a1cbe51',
        matchers: [
          { test: /Bloque 1 — Prompt correctivo/i, file: 'prompts/bloque-1/02_correctivo_mejoras_juntada.md', title: 'Correctivo mejoras juntada' },
          { test: /cargo el qr y no me hace el bundle/i, title: 'Diagnóstico: bundle no actualiza en Expo Go' },
          { test: /no me aparece Ninguna juntada/i, title: 'Diagnóstico: juntadas desaparecidas tras update_expired' },
          { test: /Corrección de update_expired_meetups/i, file: 'prompts/bloque-1/03_correctivo_expired_meetups.md', title: 'Descartar finalización automática + historial empty state' },
          { test: /Documentación — Cierre del Bloque 1: Mejoras/i, file: 'prompts/bloque-1/04_documentar_bloque-1.md', title: 'Documentación cierre Bloque 1' },
        ],
      },
    ],
  },
  {
    output: join(CONVERSACIONES_DIR, 'bloque-2', 'cursor-bloque-2-completo.md'),
    transcriptIds: ['c7ea03c3-b939-4524-866d-72a6afc41a41'],
    transcriptConfigs: [
      {
        id: 'c7ea03c3-b939-4524-866d-72a6afc41a41',
        matchers: [
          { test: /Bloque 2 — Reseñas post-juntada/i, file: 'prompts/bloque-2/01_resumen_post_juntada.md', title: 'Reseñas post-juntada' },
        ],
      },
    ],
  },
  {
    output: join(CONVERSACIONES_DIR, 'bloque-3', 'cursor-bloque-3-completo.md'),
    transcriptIds: ['22176298-395c-43e0-89f3-d8c68ded461d', 'bd983e7a-9dcd-412d-9373-3faaec31bb7a'],
    transcriptConfigs: [
      {
        id: '22176298-395c-43e0-89f3-d8c68ded461d',
        matchers: [
          { test: /Bloque 3 — Historial mejorado/i, file: 'prompts/bloque-3/01_historial_mejorado.md', title: 'Historial mejorado' },
          { test: /sale el siguiente error/i, title: 'Diagnóstico error Reanimated/Worklets' },
        ],
      },
      {
        id: 'bd983e7a-9dcd-412d-9373-3faaec31bb7a',
        matchers: [
          { test: /Corrección de diseño y UX del historial/i, title: 'Correctivo diseño historial (iteración 1)' },
          { test: /Corrección 2: diseño, buscador, bottom sheet/i, file: 'prompts/bloque-3/02_correctivo_diseno_historial.md', title: 'Correctivo diseño historial (iteración 2)' },
          { test: /botones en el bottom-sheet pero los filtros se ven muy pegados/i, title: 'Ajuste espaciado bottom sheet' },
          { test: /Documentación — Cierre del Bloque 3/i, file: 'prompts/bloque-3/03_documentar_bloque-3.md', title: 'Documentación cierre Bloque 3' },
        ],
      },
    ],
  },
  {
    output: join(CONVERSACIONES_DIR, 'bloque-4', 'cursor-bloque-4-completo.md'),
    transcriptIds: [
      '0e37d013-2287-4be4-be88-1e17f15fbdc0',
      '458ceb8c-00d0-4667-a359-dffe4521acdc',
      '85f87138-cec5-4df4-8fb7-bab3fe82ab3d',
    ],
    transcriptConfigs: [
      {
        id: '0e37d013-2287-4be4-be88-1e17f15fbdc0',
        matchers: [
          { test: /Bloque 4a — Herramientas/i, file: 'prompts/bloque-4/01_herramientas.md', title: 'Herramientas: Timer y Equipos' },
          { test: /agrega los ms a la vista/i, file: 'prompts/bloque-4/02_correctivo_cronometro_ms.md', title: 'Correctivo milisegundos cronómetro' },
          { test: /cuantos equipos/i, file: 'prompts/bloque-4/03_correctivo_equipos_division.md', title: 'Correctivo input división equipos' },
          { test: /quinto participante|tercer participante|tercero/i, file: 'prompts/bloque-4/04_correctivo_equipos_scroll.md', title: 'Correctivo scroll participantes' },
        ],
      },
      {
        id: '458ceb8c-00d0-4667-a359-dffe4521acdc',
        matchers: [
          { test: /Consulta de estructura — Pantalla de juegos/i, title: 'Consulta estructura juegos (solo lectura)' },
          { test: /Bloque 4b — Rediseño/i, file: 'prompts/bloque-4/02_rediseno_pantalla_juegos.md', title: 'Rediseño GamesScreen' },
          { test: /git add y nombre del commit/i, title: 'Consulta mensaje de commit' },
          { test: /Bloque 4c — Juego: ¿Qué soy\?/i, file: 'prompts/bloque-4/03_que_soy.md', title: 'Juego ¿Qué soy?' },
          { test: /Bloque 4d — Juego: Preguntas/i, file: 'prompts/bloque-4/04_preguntas_grupo.md', title: 'Preguntas para el grupo' },
        ],
      },
      {
        id: '85f87138-cec5-4df4-8fb7-bab3fe82ab3d',
        matchers: [
          { test: /Bloque 4e — Anotador/i, file: 'prompts/bloque-4/05_anotador_generico.md', title: 'Anotador genérico' },
          { test: /permite poner letras/i, title: 'Correctivo UX input puntaje anotador' },
          { test: /Consulta de estructura — Juegos desde juntada/i, title: 'Consulta juegos desde juntada' },
          { test: /Corrección: juegos desde juntada/i, file: 'prompts/bloque-4/06_correctivo_juegos_desde_juntada.md', title: 'Juegos desde juntada con meetupId' },
          { test: /Documentación — Cierre del Bloque 4/i, file: 'prompts/bloque-4/07_documentar_bloque-4.md', title: 'Documentación cierre Bloque 4' },
        ],
      },
    ],
  },
  {
    output: join(CONVERSACIONES_DIR, 'bloque-5', 'cursor-bloque-5-completo.md'),
    transcriptIds: [
      '841f1af8-03bd-4b0c-b23d-31adefc9efaf',
      '0b14cc6f-af86-4d6c-b4cb-bed2716f2f10',
      'e98c56a3-4383-4f72-83a2-f726d3acd3ac',
    ],
    transcriptConfigs: [
      {
        id: '841f1af8-03bd-4b0c-b23d-31adefc9efaf',
        matchers: [
          { test: /Análisis — Estado actual para implementación de notificaciones/i, title: 'Análisis pre-implementación notificaciones' },
          { test: /Análisis — Estado actual para EAS Build/i, title: 'Análisis pre-EAS Build' },
          { test: /Bloque 5a — EAS Build/i, file: 'prompts/bloque-5/01_eas_build_setup.md', title: 'EAS Build setup' },
        ],
      },
      {
        id: '0b14cc6f-af86-4d6c-b4cb-bed2716f2f10',
        matchers: [
          { test: /Bloque 5b — Backend de notificaciones/i, file: 'prompts/bloque-5/02_backend_notificaciones.md', title: 'Backend de notificaciones' },
          { test: /Diagnóstico — Registro de push token/i, title: 'Diagnóstico push_token' },
          { test: /Corrección — Registro de push token/i, title: 'Corrección push_token / Firebase' },
        ],
      },
      {
        id: 'e98c56a3-4383-4f72-83a2-f726d3acd3ac',
        matchers: [
          { test: /expo-notifications compatible con Expo Go/i, file: 'prompts/bloque-5/03_fix_expo_go_notifications.md', title: 'Fix Expo Go (guard isExpoGo)' },
          { test: /lazy import para Expo Go/i, title: 'Fix Expo Go (imports dinámicos)' },
          { test: /Bloque 5c — Frontend de notificaciones/i, file: 'prompts/bloque-5/04_frontend_notificaciones.md', title: 'Frontend de notificaciones' },
          { test: /Documentación — Cierre del Bloque 5/i, file: 'prompts/bloque-5/05_documentar_bloque-5.md', title: 'Documentación cierre Bloque 5' },
        ],
      },
    ],
  },
];

const main = () => {
  if (!existsSync(TRANSCRIPTS_DIR)) {
    console.error(`No se encontró carpeta de transcripts: ${TRANSCRIPTS_DIR}`);
    process.exit(1);
  }

  console.log(`Transcripts: ${TRANSCRIPTS_DIR}\n`);

  for (const block of BLOCKS) {
    const sessions = buildSessionsFromTranscripts(block.transcriptConfigs);
    const exportSection = buildExportSection(block.transcriptIds, sessions);

    let prefix = '';
    if (existsSync(block.output)) {
      const existing = readFileSync(block.output, 'utf8');
      const marker = '## Conversación exportada de Cursor';
      const idx = existing.indexOf(marker);
      prefix = idx >= 0 ? existing.slice(0, idx).trimEnd() : existing.trimEnd();
    }

    const markdown = `${prefix}\n\n${exportSection}`;
    writeFileSync(block.output, markdown, 'utf8');
    console.log(`✓ ${relative(ENTREGA_DIR, block.output)} (${sessions.length} sesiones exportadas)`);
  }

  console.log('\nListo.');
};

main();

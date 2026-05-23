#!/usr/bin/env node
/**
 * Procesa exports de SpecStory:
 * - Genera conversaciones limpias (prompt + respuesta final + archivos modificados)
 * - Genera prompts sin ruido intermedio
 * - Sesiones trial: sin numeración (slug descriptivo)
 * - Sesiones numbered: prefijo 01-, 02-, etc. (desde export-state.json)
 *
 * Uso:
 *   node juntadas-app/ia/entrega-1/scripts/organize-ia-exports.mjs
 *   node juntadas-app/ia/entrega-1/scripts/organize-ia-exports.mjs --add-numbered slug titulo source.md
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENTREGA_DIR = join(__dirname, '..');
const CONVERSACIONES_DIR = join(ENTREGA_DIR, 'conversaciones');
const PROMPTS_DIR = join(ENTREGA_DIR, 'prompts');
const MAPPING_PATH = join(ENTREGA_DIR, 'export-mapping.json');
const STATE_PATH = join(ENTREGA_DIR, 'export-state.json');
const WORKSPACE_ROOT = join(ENTREGA_DIR, '..', '..', '..');
const RAW_SOURCES_DIR = join(WORKSPACE_ROOT, '.specstory', 'history');

const SYSTEM_MESSAGE_MARKERS = [
  '<system_notification>',
  'Briefly inform the user about the task result',
  '<user_query>Briefly inform',
];

const FILE_TOOL_PATTERNS = [
  /edit_file_v2\*\* • Edit file: ([^\n<]+)/gi,
  /write\*\* • Write file: ([^\n<]+)/gi,
  /write\*\* • Create file: ([^\n<]+)/gi,
  /Apply Patch\*\* • Edit file: ([^\n<]+)/gi,
  /Read file: ([^\n<]+)/gi,
];

const isSystemMessage = (text) =>
  SYSTEM_MESSAGE_MARKERS.some((marker) => text.includes(marker));

const normalizePath = (rawPath) => {
  const cleaned = rawPath.trim().replace(/\\/g, '/');
  const workspaceRelative = relative(WORKSPACE_ROOT, cleaned.replace(/\//g, '\\'))
    .replace(/\\/g, '/');

  if (!workspaceRelative.startsWith('..')) {
    return workspaceRelative;
  }

  const juntadasMatch = cleaned.match(/juntadas-app\/[^\s`]+/i);
  if (juntadasMatch) {
    return juntadasMatch[0];
  }

  return cleaned.split('/').slice(-4).join('/');
};

const inferFileAction = (matchText, path) => {
  const lower = matchText.toLowerCase();
  if (lower.includes('create file')) {
    return 'creado';
  }
  if (lower.includes('read file')) {
    return 'leído';
  }
  if (lower.includes('edit file') || lower.includes('apply patch')) {
    return 'editado';
  }
  return 'modificado';
};

const extractFileChanges = (section) => {
  const changes = new Map();

  for (const pattern of FILE_TOOL_PATTERNS) {
    pattern.lastIndex = 0;
    let match = pattern.exec(section);

    while (match !== null) {
      const path = normalizePath(match[1]);
      const action = inferFileAction(match[0], path);

      if (action === 'leído') {
        match = pattern.exec(section);
        continue;
      }

      if (!changes.has(path)) {
        changes.set(path, action);
      }

      match = pattern.exec(section);
    }
  }

  const archivosLinePattern = /\*\*Archivos? modificados?\*\*[\s\S]*?(?=\n\n|$)/gi;
  const archivosBlock = section.match(archivosLinePattern)?.[0] ?? '';
  const bulletPaths = archivosBlock.match(/`([^`]+)`/g) ?? [];

  for (const bullet of bulletPaths) {
    const path = normalizePath(bullet.replace(/`/g, ''));
    if (!changes.has(path)) {
      changes.set(path, 'modificado');
    }
  }

  return [...changes.entries()].map(([path, action]) => ({ path, action }));
};

const stripAgentNoise = (text) =>
  text
    .replace(/<think>[\s\S]*?<\/redacted_thinking>/gi, '')
    .replace(/<tool-use[\s\S]*?<\/tool-use>/gi, '')
    .replace(/<details>[\s\S]*?<\/details>/gi, '')
    .replace(/^_\*\*Agent[^*]*\*\*_\s*/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const getFinalAgentResponse = (agentSection) => {
  const blocks = agentSection.split(/(?=_\*\*Agent[^*]*\*\*_)/);
  const texts = [];

  for (const block of blocks) {
    const cleaned = stripAgentNoise(block);
    if (cleaned.length > 0) {
      texts.push(cleaned);
    }
  }

  for (let index = texts.length - 1; index >= 0; index -= 1) {
    const candidate = texts[index];
    const isSubstantive =
      candidate.length >= 120 ||
      /^#{1,3}\s/m.test(candidate) ||
      /^\*\*[^*]+\*\*/m.test(candidate) ||
      /^-\s/m.test(candidate);

    if (isSubstantive) {
      return candidate;
    }
  }

  return texts[texts.length - 1] ?? '';
};

const splitExchanges = (markdown) => {
  const chunks = markdown.split(/(?=_\*\*User\*\*_)/).slice(1);
  const exchanges = [];

  for (const chunk of chunks) {
    const userMatch = chunk.match(
      /^_\*\*User\*\*_\n\n([\s\S]*?)\n\n---\n\n([\s\S]*)$/,
    );

    if (!userMatch) {
      continue;
    }

    const prompt = userMatch[1].trim();
    const agentSection = userMatch[2];

    if (!prompt || isSystemMessage(prompt)) {
      continue;
    }

    exchanges.push({
      prompt,
      response: getFinalAgentResponse(agentSection),
      fileChanges: extractFileChanges(agentSection),
    });
  }

  return exchanges;
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

const formatCleanConversation = (title, exchanges) => {
  const sections = exchanges.map(
    (exchange) => `### Prompt

${exchange.prompt}

### Respuesta

${exchange.response || '_(Sin respuesta final detectada)_'}${formatFileChanges(exchange.fileChanges)}`,
  );

  return `# ${title}\n\n${sections.join('\n\n---\n\n')}\n`;
};

const formatPromptFile = (title, exchanges) => {
  if (exchanges.length === 0) {
    return `# ${title}\n\n_(Sin prompts de usuario detectados)_\n`;
  }

  if (exchanges.length === 1) {
    return `# ${title}\n\n${exchanges[0].prompt}\n`;
  }

  const sections = exchanges.map(
    (exchange) => `${exchange.prompt}\n\n---\n`,
  );

  return `# ${title}\n\n${sections.join('\n')}`;
};

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

const writeJson = (path, data) => {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};

const buildTargetBasename = (item, state) => {
  if (item.numbered) {
    const number = String(item.number).padStart(2, '0');
    return `${number}-${item.slug}`;
  }

  return item.slug;
};

const resolveSourcePath = (source) => {
  const rawPath = join(RAW_SOURCES_DIR, source);
  if (existsSync(rawPath)) {
    return rawPath;
  }

  const localPath = join(CONVERSACIONES_DIR, source);
  if (existsSync(localPath)) {
    return localPath;
  }

  return null;
};

const purgeGeneratedFiles = () => {
  if (existsSync(CONVERSACIONES_DIR)) {
    for (const file of readdirSync(CONVERSACIONES_DIR)) {
      if (file.endsWith('.md')) {
        unlinkSync(join(CONVERSACIONES_DIR, file));
        console.log(`✗ Eliminado conversación: ${file}`);
      }
    }
  }

  if (existsSync(PROMPTS_DIR)) {
    for (const file of readdirSync(PROMPTS_DIR)) {
      if (file.endsWith('.md')) {
        unlinkSync(join(PROMPTS_DIR, file));
        console.log(`✗ Eliminado prompt: ${file}`);
      }
    }
  }
};

const processItem = (item) => {
  const sourcePath = resolveSourcePath(item.source);

  if (!sourcePath) {
    console.warn(`⚠ Fuente no encontrada: ${item.source}`);
    return null;
  }

  const markdown = readFileSync(sourcePath, 'utf8');
  const exchanges = splitExchanges(markdown);
  const basename = buildTargetBasename(item, readJson(STATE_PATH));
  const conversationPath = join(CONVERSACIONES_DIR, `${basename}.md`);
  const promptPath = join(PROMPTS_DIR, `${basename}.md`);

  writeFileSync(
    conversationPath,
    formatCleanConversation(item.title, exchanges),
    'utf8',
  );
  writeFileSync(promptPath, formatPromptFile(item.title, exchanges), 'utf8');

  console.log(`✓ ${basename}.md (${exchanges.length} intercambio(s))`);

  return basename;
};

const addNumberedEntry = (slug, title, source) => {
  const mapping = readJson(MAPPING_PATH);
  const state = readJson(STATE_PATH);
  const number = state.nextNumber;

  mapping.numbered.push({
    numbered: true,
    number,
    title,
    source,
    slug,
  });

  state.nextNumber += 1;
  writeJson(MAPPING_PATH, mapping);
  writeJson(STATE_PATH, state);

  return { number, slug, title, source, numbered: true };
};

const main = () => {
  const args = process.argv.slice(2);

  if (args[0] === '--add-numbered') {
    const [, slug, title, source] = args;

    if (!slug || !title || !source) {
      console.error(
        'Uso: node organize-ia-exports.mjs --add-numbered slug "Título" source.md',
      );
      process.exit(1);
    }

    addNumberedEntry(slug, title, source);
    console.log(`Entrada numerada registrada: ${slug}`);
    return;
  }

  mkdirSync(PROMPTS_DIR, { recursive: true });

  console.log('Eliminando archivos generados anteriores...\n');
  purgeGeneratedFiles();
  console.log('');

  const mapping = readJson(MAPPING_PATH);
  const allItems = [...mapping.trial, ...mapping.numbered];

  console.log('Regenerando exports de IA (formato limpio)...\n');

  for (const item of allItems) {
    processItem(item);
  }

  console.log('\nListo.');
};

main();

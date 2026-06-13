#!/usr/bin/env node
/**
 * Arma cursor-bloque-7-completo.md desde los agent transcripts de Cursor.
 * Uso: node ia/entrega-2/scripts/build-bloque-7-conversacion.mjs
 */
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENTREGA2 = join(__dirname, '..');
const OUT = join(ENTREGA2, 'conversaciones/bloque-7/cursor-bloque-7-completo.md');
const EXPORT_TEMP = join(ENTREGA2, 'conversaciones/bloque-7/_export-temp.md');

const TRANSCRIPTS = [
  'C:/Users/nicop/.cursor/projects/c-Users-nicop-OneDrive-Escritorio-Facultad-4toA-o-Electivas-4to-Desarrollo-de-Aplicaciones-Moviles-1C-Juntadas-App/agent-transcripts/47516808-057c-4089-96d7-f5c430eb6a87/47516808-057c-4089-96d7-f5c430eb6a87.jsonl',
  'C:/Users/nicop/.cursor/projects/c-Users-nicop-OneDrive-Escritorio-Facultad-4toA-o-Electivas-4to-Desarrollo-de-Aplicaciones-Moviles-1C-Juntadas-App/agent-transcripts/339b4a84-64f1-48c2-acde-2a3b5655f601/339b4a84-64f1-48c2-acde-2a3b5655f601.jsonl',
  'C:/Users/nicop/.cursor/projects/c-Users-nicop-OneDrive-Escritorio-Facultad-4toA-o-Electivas-4to-Desarrollo-de-Aplicaciones-Moviles-1C-Juntadas-App/agent-transcripts/413755bb-cf06-4973-9161-00bfcfb0cf7a/413755bb-cf06-4973-9161-00bfcfb0cf7a.jsonl',
];

const extractText = (line) => {
  try {
    const obj = JSON.parse(line);
    const parts = obj.message?.content ?? [];
    return parts.filter((p) => p.type === 'text').map((p) => p.text).join('\n');
  } catch {
    return '';
  }
};

const buildExport = () => {
  if (existsSync(EXPORT_TEMP)) {
    return readFileSync(EXPORT_TEMP, 'utf8').replace(/<plugin_info[\s\S]*?<\/plugin_info>\n\n/g, '');
  }

  let out = '';
  for (const file of TRANSCRIPTS) {
    const id = file.split('/').pop()?.replace('.jsonl', '') ?? file;
    out += `\n---\n## Sesión ${id}\n\n`;
    const lines = readFileSync(file, 'utf8').trim().split('\n');
    let n = 0;
    for (const line of lines) {
      const obj = JSON.parse(line);
      let text = extractText(line);
      if (!text || text.includes('<system_notification>')) continue;
      text = text.replace(/<\/?user_query>/g, '').trim();
      if (text.includes('[REDACTED]') && text.length < 200) continue;
      text = text.replace(/\[REDACTED\]/g, '').trim();
      if (!text) continue;
      n += 1;
      const label = obj.role === 'user' ? 'Usuario' : 'Agente';
      out += `### ${label} (${n})\n\n${text.slice(0, 12000)}${text.length > 12000 ? '\n\n[... truncado ...]' : ''}\n\n`;
    }
  }
  return out.replace(/<plugin_info[\s\S]*?<\/plugin_info>\n\n/g, '');
};

const HEADER = `# Conversación Bloque 7 — Animaciones y correcciones UX

**Herramienta:** Cursor Agent
**Rama:** feature/bloque-7-animaciones-ux

## Resumen

### Lo que se implementó

**7a — Correcciones funcionales:**
- "Cortar" revertido: allowsEditing: true restaurado en foto
  de perfil y portada de juntada (texto nativo de Android,
  no modificable)
- Recuerdos: modal cámara/galería igual que foto de perfil
- Portada de juntada: modal cámara/galería en Create y Edit
- Foto de perfil: se guarda solo al presionar Guardar en header
- Organizador puede eliminar fotos de cualquier participante
  (UI + servicio listos; RLS pendiente de migración)
- Haptic en long press de fotos de recuerdos
- Fix refresh innecesario al salir de modificar asistencia
  sin cambios (parámetro wasUpdated)
- ProfileScreen: botones Cerrar sesión (outlined) vs
  Eliminar cuenta (rojo sólido) con distintos pesos visuales
- "Notificaciones push" → "Notificaciones"
- Ícono de editar perfil: pencil de MaterialCommunityIcons 22dp
- Accesibilidad WCAG AA: fontSize mínimo 14sp en texto de cuerpo,
  áreas táctiles mínimo 48dp en campana, chips, tab bar, headers
- Footer del home corregido (inconsistencia de tamaño vs otros tabs)

**7b — Animaciones y visual:**
- SuccessAnimation: componente nuevo con 6 fases animadas
  (círculo rotatorio violeta/rosa, checkmark bounce, destellos
  radiales, texto, espera 1s, fade out) — reemplaza todos
  los toasts de éxito en 15 pantallas
- ErrorAnimation: idéntico a SuccessAnimation con X roja,
  gradiente rojo, haptic de error — reemplaza todos los
  toasts de error en 12 pantallas
- Íconos actualizados: icon.png, android-icon-foreground.png,
  splash-icon.png reemplazados con logo real de Ronda App
- TeamRandomizer: slide horizontal entre pasos,
  fade + scale al mezclar equipos

### Decisiones tomadas
- Texto "Cortar" no modificable — viene del SO Android,
  se acepta el comportamiento nativo
- Gradiente en SuccessAnimation sin expo-linear-gradient:
  capas violeta + rosa superpuestas
- ErrorAnimation encapsula triggerErrorHaptic con
  mismo patrón de fallback silencioso que el de éxito
- Toast.tsx se mantiene en el proyecto pero sin imports
  de error activos
- Foto de perfil: URI local en pendingAvatarUri hasta
  que el usuario confirma con Guardar

### Problemas encontrados y resueltos
- allowsEditing: false eliminó el editor de recorte —
  revertido, se acepta el texto "Cortar" del SO
- Footer del home más chico tras cambios de accesibilidad
  en AppTabBar — corregido con estilos consistentes
- Avatar del header estirado por minWidth/minHeight 48 —
  corregido con tamaño fijo 38×38 + hitSlop en MeetupHomeScreen
- Texto de SuccessAnimation invisible por duración corta —
  extendida a 2.5s con 1s de espera visible

### Deuda técnica documentada
- RLS para que organizador elimine fotos de otros
  participantes (política en storage.objects pendiente)
- ParticipantListScreen usa Alert.alert para errores
  (no Toast, quedó fuera del alcance)
- Íconos requieren nuevo build EAS para verse en el APK
- MeetupHomeScreen usa tab bar inline duplicado (no AppTabBar);
  unificar sería cambio aparte

## Prompts y respuestas

### Prompt 1 — 01_correcciones_funcionales_ux.md

Implementación del Bloque 7a en 8 tareas:

1. **"Cortar":** inicialmente \`allowsEditing: false\` en pickers de perfil y portada (evitar texto nativo Android).
2. **Recuerdos:** modal cámara/galería en \`MemoriesGalleryScreen\` replicando patrón de perfil.
3. **Organizador elimina fotos:** \`canDeleteAnyMemory\` + \`deleteMemoryForOrganizer\` en servicio/hook.
4. **Haptic long press** en galería de recuerdos.
5. **Fix refresh asistencia:** parámetro \`wasUpdated\` en \`ModifyAttendanceScreen\` → \`ParticipantListScreen\` / \`MeetupDetailScreen\`.
6. **ProfileScreen:** botones Cerrar sesión vs Eliminar cuenta diferenciados; "Notificaciones push" → "Notificaciones"; ícono pencil 22dp.
7. **Accesibilidad WCAG AA:** fontSize mínimo 14sp, áreas táctiles 48dp en campana, chips, headers, tab bar.
8. **Documentación:** prompt e índice IA (ítems 70–71).

**Archivos principales:** ProfileScreen, CreateMeetupScreen, EditMeetupScreen, MemoriesGalleryScreen, memoriesService, useMemories, ModifyAttendanceScreen, MeetupDetailScreen, AppTabBar, MeetupHomeScreen, MeetupHistoryScreen, JoinMeetupScreen, ReviewFormScreen.

---

### Prompt 2 — Fix avatar header Home (sesión ad hoc)

Tras el 7a, el avatar del header en Home se veía estirado verticalmente.

**Causa:** \`minWidth/minHeight: 48\` en el avatar con imagen al \`100%\` sin contenedor de tamaño fijo.

**Fix en MeetupHomeScreen:** avatar \`38×38\` fijo, \`hitSlop\` 5px para mantener ~48dp táctiles, botón campana \`48×48\` fijo.

---

### Prompt 3 — 02_correctivo_7a.md

Cinco correcciones:

1. **allowsEditing: true** restaurado en perfil y portada (se acepta "Cortar" nativo).
2. **Portada cámara/galería** en Create y Edit con bottom sheet igual a recuerdos.
3. **Avatar pendiente:** \`pendingAvatarUri\` — upload solo al Guardar.
4. **Tab bar:** revertidos estilos de accesibilidad que achicaban footer del Home en AppTabBar.
5. **Documentación** del prompt.

---

### Prompt 4 — 03_animaciones_visual.md

Implementación del Bloque 7b inicial:

1. **app.json:** verificado — íconos y splash ya apuntaban a assets actualizados.
2. **SuccessAnimation.tsx:** componente nuevo (~1.5s, 5 fases) con círculo violeta/rosa, checkmark, destellos, mensaje.
3. **Reemplazo toasts éxito** en 15 pantallas/componentes.
4. **TeamRandomizer:** slide horizontal entre pasos + fade/scale al mezclar.
5. **Documentación** del prompt e índice.

**Nota:** en esta fase los toasts de error siguieron usando \`Toast type="error"\`.

---

### Prompt 5 — 04_correctivo_animaciones.md

Cuatro correcciones:

1. **SuccessAnimation:** duración extendida a ~2.5s con pausa de 1s legible antes del fade out.
2. **ErrorAnimation.tsx:** variante roja con X, mismo timing, haptic de error.
3. **Reemplazo toasts error** en 12 pantallas/componentes.
4. **Documentación** del prompt.

---

### Prompt 6 — Documentación cierre Bloque 7 (este archivo)

Organización de evidencia en \`ia/entrega-2/\` y actualización del índice.

## Conversación completa

Exportada automáticamente desde los agent transcripts de Cursor
(sesiones del Bloque 7). Tool calls omitidos; solo mensajes Usuario/Agente.

| Sesión | UUID | Prompts cubiertos |
|--------|------|-------------------|
| 1 | \`47516808-057c-4089-96d7-f5c430eb6a87\` | 7a, fix avatar, correctivo 7a |
| 2 | \`339b4a84-64f1-48c2-acde-2a3b5655f601\` | 03_animaciones_visual |
| 3 | \`413755bb-cf06-4973-9161-00bfcfb0cf7a\` | 04_correctivo_animaciones, cierre |

`;

const FOOTER = `
## Archivos de código tocados en el bloque (referencia)

| Área | Archivos |
|------|----------|
| Pickers / fotos | \`ProfileScreen.tsx\`, \`CreateMeetupScreen.tsx\`, \`EditMeetupScreen.tsx\`, \`MemoriesGalleryScreen.tsx\` |
| Recuerdos / RLS | \`memoriesService.ts\`, \`useMemories.ts\` |
| Asistencia | \`ModifyAttendanceScreen.tsx\`, \`ParticipantListScreen.tsx\`, \`MeetupDetailScreen.tsx\` |
| Accesibilidad / tabs | \`AppTabBar.tsx\`, \`MeetupHomeScreen.tsx\`, headers varios |
| Animaciones | \`SuccessAnimation.tsx\`, \`ErrorAnimation.tsx\`, \`TeamRandomizerScreen.tsx\` |
| Assets | \`assets/icon.png\`, \`android-icon-foreground.png\`, \`splash-icon.png\` |
| Documentación | \`ia/entrega-2/prompts/bloque-7/*\`, \`ia/entrega-2/indice_ia.md\` |
`;

const exportMd = buildExport();
writeFileSync(OUT, HEADER + exportMd + FOOTER);
if (existsSync(EXPORT_TEMP)) unlinkSync(EXPORT_TEMP);
console.log(`Escrito: ${OUT} (${readFileSync(OUT, 'utf8').length} chars)`);

# Fix cursor-12 — Auditoria de indice, statistics y documentacion IA

## Contexto

App Juntadas, entrega 1. La carpeta `ia/entrega-1` registra prompts,
conversaciones y decisiones tomadas con Cursor, Claude y ChatGPT.

## Prompt

Necesito que revises el `statistics.json` y `indice_ia.md` en busqueda de
inconsistencias entre la carpeta `entrega-1` y todo su contenido y lo que dicen
estos archivos.

Luego: Documenta el prompt y tu respuesta como venimos haciendo, y luego aplica
las correcciones, considerando a `statistics.json` como global, eliminando las
referencias a UX fixes y documentando la skill faltante. Esto tambien
documentalo como venimos haciendo.

Aclaro que la carpeta `.cursor` no la crearemos, es propio del desarrollador
que utilizo Cursor. El resto si. Tambien debemos reflejar que no solo se uso
Cursor, sino que se uso Claude tambien.

## Restricciones asumidas

- No crear ni versionar `.cursor/`.
- Mantener `statistics.json` como inventario global de uso IA de la entrega.
- Corregir enlaces rotos del indice.
- Documentar el uso de Claude junto con Cursor.
- No instalar dependencias nuevas.
- No hacer commits.

## Archivos modificados

- `ia/entrega-1/conversaciones/statistics.json`
- `ia/entrega-1/indice_ia.md`
- `ia/entrega-1/skills_instaladas.md`
- `ia/entrega-1/prompts/exportacion-conversaciones.md`
- `ia/entrega-1/prompts/bloque-debugging/cursor-12-auditoria-indice-statistics.md` (este archivo)
- `ia/entrega-1/conversaciones/bloque-debugging/claude-bloque-debugging-completo.md`

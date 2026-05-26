# Resumen de uso de IA — Entrega 1

## Herramientas utilizadas

### Claude (claude.ai)
Utilizado como arquitecto técnico, pair programmer y revisor de código.
Rol principal: razonamiento profundo, diseño de arquitectura, análisis de decisiones técnicas, planificación de bloques de desarrollo y revisión de código antes de commitear.
Modelos utilizados: Claude Sonnet (agente de razonamiento y planificación).

### Cursor (Agent + Composer, Sonnet, Codex)
Utilizado como ejecutor de implementación.
Rol principal: generación de código, aplicación de prompts de implementación, debugging guiado y refactors puntuales.
Modelos utilizados: Claude Sonnet y OpenAI Codex como agentes de ejecución dentro de Cursor, junto con el compose nuevo 2.5.

### ChatGPT
Utilizado en la etapa inicial del proyecto para exploración de ideas, definición del alcance y primeras decisiones técnicas antes de migrar el flujo principal a Claude.

### GitHub Copilot
Utilizado para autocompletado inline durante el desarrollo.

## Forma de trabajo

El flujo de trabajo establecido fue:
1. Análisis y planificación en Claude — se definía la arquitectura, decisiones técnicas y el prompt exacto antes de implementar
2. Implementación en Cursor — se ejecutaba el prompt generado por Claude
3. Revisión del resultado en Claude — se analizaba el reporte de Cursor y se decidía si continuar o corregir
4. Commit solo después de revisión y prueba en dispositivo real

## Bloques desarrollados con IA

| Bloque | Herramienta principal | Prompts generados |
|---|---|---|
| Setup y configuración | Claude + Cursor | 5 |
| Bloque 1 — Auth | Claude + Cursor | 5 |
| Bloque 2 — Juntadas | Claude + Cursor | 6 |
| Bloque 3 — Participantes | Claude + Cursor | 6 |
| Bloque 4 — Impostor | Claude + Cursor | 3 |
| Bloque 5 — Recuerdos | Claude + Cursor | 3 |
| Bloque 6 — Perfil | Claude + Cursor | 2 |
| Debugging y fixes | Claude + Cursor | 10 |

## Skills de Cursor utilizadas

Ver archivo `ia/entrega-1/skills_instaladas.md` para el detalle completo.

## Reflexión sobre el uso de IA

El uso de IA como asistente de desarrollo permitió acelerar significativamente la implementación sin perder el entendimiento del código generado. La clave fue usar Claude para pensar y Cursor para ejecutar — nunca al revés. Cada decisión arquitectónica fue analizada antes de implementarse, y cada bloque de código generado fue revisado y probado en dispositivo real antes de ser commiteado.

El principal aprendizaje fue que la IA es más efectiva cuando se le da contexto completo y restricciones claras. Los prompts vagos generan código genérico; los prompts específicos con arquitectura, restricciones y ejemplos generan código que se integra correctamente al proyecto.

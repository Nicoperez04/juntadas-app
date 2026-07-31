# Conversación Bloque 5 — Juegos nuevos (Truco, Generala, Sorteador, Ligas y Torneos)

**Herramienta:** Cursor Agent
**Rama:** feature/bloque-5-juegos

## Resumen

### Lo que se implementó
- **Prompt 01: Anotador de Truco:**
  - Configuración del límite de puntos (15 o 30).
  - Componente visual de la "fosforera" (`TrucoFosforera.tsx`) que dibuja dinámicamente fósforos clásicos de madera y cabezas rojas con componentes `View` nativos sin librerías externas.
  - Gestión de puntuación interactiva por equipos (sumar, restar, visualización de buenas/malas a 30 puntos) y registro del resultado final en Supabase si se asocia a una juntada.
- **Prompt 02: Anotador de Generala:**
  - Configuración de múltiples jugadores y carga opcional desde la juntada en curso.
  - Grilla interactiva de puntuación (`GeneralaGameScreen.tsx`) que permite registrar puntos de categorías numéricas (1 al 6) y juegos mayores (Escalera, Full, Póker, Generala y Doble Generala), incluyendo la opción de tachar.
  - Cálculo automático de totales en tiempo real y pantalla final con ranking de posiciones.
- **Prompt 03: Sorteador (Raffle):**
  - Carga manual de participantes o importación desde los participantes de la juntada activa.
  - Opción mediante Switch para "Excluir ganadores (sin repeticiones)".
  - Animación dinámica con efecto carrusel de suspenso durante 1.6 segundos para revelar al ganador y guardado de un historial de sorteos de la sesión.
- **Prompt 04: Generador de Ligas (League):**
  - Configuración de equipos (mínimo 3) y pre-carga desde la juntada.
  - Generación automática de fixture Round Robin (todos contra todos) de ida simple mediante el Algoritmo Berger, incluyendo soporte para "Fecha Libre" si la cantidad de equipos es impar.
  - Carga interactiva de marcadores y cálculo dinámico de la Tabla de Posiciones en tiempo real con criterios detallados de puntos y diferencia de goles/tantos.
- **Prompt 05: Generador de Torneos (Tournament):**
  - Setup de participantes (mínimo 4) y pre-carga desde la juntada.
  - Generación automática de llaves de eliminación directa basadas en potencias de 2.
  - Asignación aleatoria de Byes para balancear el cuadro si la cantidad de jugadores no es una potencia de 2 exacta, avanzando de forma automática a la siguiente ronda.
  - Registro interactivo del ganador de cada llave hasta definir al campeón del torneo y modal de éxito para el guardado.

### Decisiones tomadas
- **Enrutamiento y Tipado Centralizado:** Se agregaron todas las rutas nuevas (Setup y Game correspondientes) en `routes.ts`, `types.ts` y `MainNavigator.tsx`, manteniendo la consistencia del hub en `GamesScreen.tsx`.
- **Fosforera Nativa Estilizada:** Para evitar agregar dependencias pesadas, los fósforos de Truco se simularon con elementos CSS de React Native combinando bordes finos, fondos de color beige/madera y puntas redondeadas rojas.
- **Flexibilidad de Participantes:** En todos los setups se dio la doble opción de cargar a los presentes en la juntada (mediante `impostorService.getParticipantsForGame`) o de ingresar nombres manualmente de forma libre.
- **Control de Estado Robusto:** Se encapsuló la lógica compleja de fixtures y playoffs en hooks customizados de React (`useTrucoGame`, `useGeneralaGame`, `useLeagueGame`, `useTournamentGame`), separando la lógica del algoritmo de la capa de componentes UI.

### Problemas encontrados y resueltos
- **Distribución de Byes Dinámicos:** Cuando un torneo se inicia con un número de participantes impar o que no es potencia de 2 (por ejemplo, 5 jugadores), el algoritmo `buildTournamentTree` calcula `power - n` (siendo `power` la siguiente potencia de 2 superior, ej. 8) y distribuye de forma balanceada y aleatoria los partidos con "BYE". A esos jugadores se les da pase automático a la siguiente fase y se bloquea la interacción del partido correspondiente en la UI.
- **Algoritmo Berger de Rotación:** Para el fixture de liga con un número impar de competidores se introdujo un participante virtual "Fecha Libre" para rotar correctamente la matriz del algoritmo de emparejamientos Round Robin sin descuadres.

### Deuda técnica pendiente
- Ninguna. Las cinco herramientas solicitadas para el Bloque 5 se encuentran 100% integradas, probadas y funcionales en el flujo normal de la aplicación.

---

## Verificá estructura de prompts del Bloque 5

```
ia/entrega-3/prompts/bloque-5/
├── 01_anotador_truco.md ✓
├── 02_anotador_generala.md ✓
├── 03_sorteador.md ✓
├── 04_generador_ligas.md ✓
└── 05_generador_torneos.md ✓
```

Verificar que todos existen. Si falta alguno, reportarlo.

## Actualizá ia/entrega-3/indice_ia.md

Verificar que todos los ítems del bloque 5 existen y agregar al final de la sección del Bloque 5 la referencia a este archivo de conversación:
- `ia/entrega-3/conversaciones/bloque-5/cursor-bloque-5-completo.md`

## Restricciones
- No tocar ningún archivo de código
- No hacer commits
- Solo crear o modificar archivos dentro de ia/entrega-3/

## Al finalizar reportar
1. Archivos creados o modificados
2. Prompts faltantes si los hay
3. Cualquier inconsistencia encontrada en el índice

### Respuesta

Documentación del Bloque 5 organizada en ia/entrega-3/: conversación completa, verificación de prompts, índice actualizado con el link correspondiente al cierre del bloque.

---

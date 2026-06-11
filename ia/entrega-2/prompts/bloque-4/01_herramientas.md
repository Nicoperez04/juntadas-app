# Bloque 4a — Herramientas: Temporizador y Equipos aleatorios

## Contexto general
Continuamos con la Entrega 2 (E2) del proyecto Juntadas.
Bloques 0, 1, 2 y 3 completos y mergeados a entrega-2.
Rama actual: feature/bloque-4-juegos

Stack relevante:
- React Native + Expo SDK 55 + TypeScript
- React Navigation (stack navigator)
- Tipado centralizado en src/navigation/types.ts y routes.ts
- Design tokens en src/shared/constants/theme.ts
- @expo/vector-icons ya instalado
- Sin TypeScript any, comentarios en español

## Contexto de juegos
- Los juegos viven en src/features/games/
- La pantalla principal de juegos es JuegosScreen
- El Impostor ya está implementado — NO tocar nada de Impostor
- Las herramientas son utilidades (no juegos): Temporizador y Equipos aleatorios
- Por ahora NO rediseñar JuegosScreen — eso va en el sub-prompt 4b

## Tu tarea
Realizá las siguientes tareas en orden.
Completá y reportá cada una antes de pasar a la siguiente.

---

### Tarea 1 — Temporizador

Crear src/features/games/screens/TimerScreen.tsx

**Comportamiento:**
Dos modos en la misma pantalla seleccionables con tabs o toggle:
- Modo Cuenta regresiva: el usuario define minutos y segundos,
  al iniciar cuenta hacia 0, al llegar a 0 vibra y muestra alerta visual
- Modo Cronómetro: cuenta desde 0:00 hacia arriba sin límite

**Controles comunes a ambos modos:**
- Botón Iniciar / Pausar (alterna entre los dos estados)
- Botón Reiniciar: vuelve al estado inicial del modo actual
- En cuenta regresiva: inputs para configurar MM:SS antes de iniciar;
  una vez iniciado los inputs se ocultan y se muestra el tiempo restante
- En cronómetro: muestra el tiempo transcurrido

**Display del tiempo:**
- Número grande y legible en el centro de la pantalla
- Formato MM:SS
- En cuenta regresiva, cuando quedan 10 segundos o menos:
  el color del display cambia a rojo para indicar urgencia

**Al llegar a 0 (solo cuenta regresiva):**
- Vibración con Haptics (expo-haptics, ya instalado)
- Display parpadea o cambia visualmente
- Botón Reiniciar se activa automáticamente

**UI:**
- Pantalla limpia y minimalista
- Toggle o tabs para cambiar de modo en la parte superior
- Display del tiempo centrado y grande (mínimo 72sp)
- Controles en la parte inferior
- Seguir tokens de theme.ts

No hacer:
- No instalar librerías adicionales
- No persistir el estado del timer en DB ni AsyncStorage
- No tocar JuegosScreen todavía

Archivos esperados:
- src/features/games/screens/TimerScreen.tsx

---

### Tarea 2 — Equipos aleatorios

Crear src/features/games/screens/TeamRandomizerScreen.tsx

**Flujo completo:**

Paso 1 — Configuración:
- Campo para agregar nombres uno por uno (input + botón "Agregar")
- Lista de nombres agregados con botón X para quitar cada uno
- Mínimo 2 nombres para poder continuar
- Selector de modo:
  * "Cantidad de equipos" (define cuántos equipos, la app calcula personas por equipo)
  * "Personas por equipo" (define cuántas por equipo, la app calcula cantidad de equipos)
- Input numérico para el valor del modo seleccionado
- Botón "Formar equipos" — deshabilitado si hay menos de 2 nombres

Paso 2 — Resultado:
- Muestra los equipos formados en cards
- Cada card tiene: nombre del equipo (Equipo 1, Equipo 2, etc.)
  y lista de integrantes
- Si la división no es exacta, los sobrantes se distribuyen
  de a uno empezando por el primer equipo
- Botón "Mezclar de nuevo" — redistribuye aleatoriamente
  con los mismos nombres y configuración
- Botón "Copiar equipos" — copia al portapapeles el resultado
  en formato texto plano:
  "Equipo 1: Juan, María
   Equipo 2: Pedro, Ana
   ..."
- Botón "Volver a configurar" — vuelve al Paso 1

**UI:**
- Dos pasos claramente diferenciados (no tabs, sino navegación interna)
- En el paso 1: lista de nombres con scroll si hay muchos
- En el paso 2: cards de equipos con scroll si hay muchos
- Seguir tokens de theme.ts
- Animación suave de transición entre paso 1 y paso 2
  usando Animated de React Native

No hacer:
- No instalar librerías adicionales
- No persistir nada en DB ni AsyncStorage
- No tocar JuegosScreen todavía

Archivos esperados:
- src/features/games/screens/TeamRandomizerScreen.tsx

---

### Tarea 3 — Navegación

Alcance:
1. Agregar en src/navigation/routes.ts:
   - Routes.Timer
   - Routes.TeamRandomizer

2. Agregar en src/navigation/types.ts en MainStackParamList:
   - Timer: undefined
   - TeamRandomizer: undefined

3. Registrar TimerScreen y TeamRandomizerScreen en MainNavigator.tsx

4. En JuegosScreen agregar dos botones/cards provisorias
   (sin diseño final — eso va en 4b) que naveguen a cada herramienta:
   - "Temporizador" → Routes.Timer
   - "Equipos aleatorios" → Routes.TeamRandomizer
   Pueden ser botones simples por ahora, sin diseño elaborado

No hacer:
- No rediseñar JuegosScreen
- No modificar las rutas existentes del Impostor

Archivos esperados:
- src/navigation/routes.ts (modificado)
- src/navigation/types.ts (modificado)
- src/navigation/MainNavigator.tsx (modificado)
- src/features/games/screens/JuegosScreen.tsx (botones provisorios)

---

### Tarea 4 — Documentar este prompt

Crear ia/entrega-2/prompts/bloque-4/01_herramientas.md
con el contenido completo de este prompt.

Actualizar ia/entrega-2/indice_ia.md agregando:
28 - TimerScreen: temporizador con cuenta regresiva y cronómetro
29 - TeamRandomizerScreen: equipos aleatorios con configuración flexible
30 - Navegación: rutas Timer y TeamRandomizer

No hacer:
- No tocar archivos de código
- No hacer commits

Archivos esperados:
- ia/entrega-2/prompts/bloque-4/01_herramientas.md
- ia/entrega-2/indice_ia.md (actualizado)

---

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- Seguir tokens de src/shared/constants/theme.ts
- No hacer commits
- Reportar archivos modificados y decisiones al finalizar cada tarea
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar todo
Resumen con:
1. Archivos creados y modificados
2. Decisiones tomadas
3. Cómo probarlo en dispositivo

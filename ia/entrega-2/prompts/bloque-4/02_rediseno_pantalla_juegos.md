# Bloque 4b — Rediseño de la pantalla de juegos

## Contexto
Rama actual: feature/bloque-4-juegos
El bloque 4a está completo (Timer y TeamRandomizer funcionando).

Situación actual:
- GamesScreen.tsx vive en src/features/impostor/screens/ — mal ubicada
- Solo tiene el Impostor + botones provisorios de Timer y TeamRandomizer
- Hay que moverla a src/features/games/screens/ y rediseñarla completamente

Juegos y herramientas que existirán al final del Bloque 4
(no todos están implementados todavía — las cards de los no implementados
se muestran pero con estado "Próximamente" o deshabilitadas):

JUEGOS:
- Impostor ✓ (implementado)
- ¿Qué soy? (próximamente)
- Preguntas para el grupo (próximamente)
- Anotador genérico (próximamente)

HERRAMIENTAS:
- Temporizador ✓ (implementado)
- Equipos aleatorios ✓ (implementado)

## Tu tarea
Realizá las siguientes tareas en orden.

---

### Tarea 1 — Mover GamesScreen a features/games/

Alcance:
1. Crear src/features/games/screens/GamesScreen.tsx
   (el contenido lo vas a reemplazar completamente en Tarea 2)
2. Eliminar src/features/impostor/screens/GamesScreen.tsx
3. Actualizar el import en MainNavigator.tsx para apuntar
   a la nueva ubicación
4. Verificar que la app compila sin errores (tsc --noEmit)

No hacer:
- No cambiar el nombre del componente ni la ruta
- No tocar ningún otro archivo de impostor

Archivos esperados:
- src/features/games/screens/GamesScreen.tsx (nuevo)
- src/features/impostor/screens/GamesScreen.tsx (eliminado)
- src/navigation/MainNavigator.tsx (import actualizado)

---

### Tarea 2 — Rediseño completo de GamesScreen

Contexto de diseño:
La pantalla de juegos debe ser visualmente distintiva y atractiva.
Es una de las pantallas más importantes de la app — debe transmitir
diversión y energía sin perder la consistencia con theme.ts.
Las cards deben tener animaciones de entrada y estados de hover/press
claros y modernos.

Alcance:

**Layout general:**
- Header con título "Juegos" 
- Dos secciones claramente separadas con título de sección:
  "Juegos" y "Herramientas"
- ScrollView para toda la pantalla

**Grid de cards:**
- 2 columnas para Juegos
- 2 columnas para Herramientas
- Cards cuadradas o ligeramente rectangulares (aspect ratio ~1:1.1)
- Spacing consistente con theme.spacing

**Diseño de cada card:**
- Ícono grande centrado (de @expo/vector-icons, mínimo 40dp)
- Nombre del juego/herramienta debajo del ícono
- Descripción corta (1 línea máximo) debajo del nombre
- Fondo con color sutil diferente por juego/herramienta
  (no todos el mismo color — usar variantes del tema o colores
  complementarios que no rompan la identidad visual)
- Border radius generoso (16dp o más)
- Sombra suave

**Cards de juegos no implementados ("próximamente"):**
- Mismo diseño pero con opacidad reducida (0.5-0.6)
- Badge "Próximamente" en la esquina superior derecha
- No navegables (onPress no hace nada o muestra toast informativo)

**Animaciones:**
- Animación de entrada de las cards al montar la pantalla:
  cada card hace FadeIn + SlideUp con un pequeño delay escalonado
  (la primera aparece primero, luego la segunda, etc.)
  Usar Animated de React Native, sin librerías externas
- Al presionar una card: escala ligeramente hacia abajo (scale 0.96)
  y vuelve, dando sensación de "press" físico
- Transición suave de opacidad al navegar

**Íconos sugeridos por juego/herramienta:**
- Impostor: 'eye-off' o 'spy' (MaterialCommunityIcons)
- ¿Qué soy?: 'help-circle' o 'account-question' (MaterialCommunityIcons)
- Preguntas para el grupo: 'chat-question' o 'comment-question' (MaterialCommunityIcons)
- Anotador genérico: 'scoreboard' o 'counter' (MaterialCommunityIcons)
- Temporizador: 'timer' (MaterialCommunityIcons)
- Equipos aleatorios: 'account-group' (MaterialCommunityIcons)

Si algún ícono no existe en la versión instalada,
elegir el más cercano disponible.

**Colores de fondo sugeridos por card:**
Usar variantes sutiles — no colores puros, sino versiones
desaturadas o con opacidad sobre el fondo del tema:
- Impostor: tono violeta/morado (color primario del tema)
- ¿Qué soy?: tono azul suave
- Preguntas: tono naranja suave
- Anotador: tono verde suave
- Temporizador: tono rojo suave
- Equipos: tono amarillo/dorado suave

No hacer:
- No instalar librerías de animación
- No usar colores que rompan la identidad visual del theme.ts
- No hacer cards demasiado complejas — el ícono y el nombre
  deben ser los protagonistas

Archivos esperados:
- src/features/games/screens/GamesScreen.tsx (rediseñado)

---

### Tarea 3 — Verificación de navegación

Alcance:
Verificar que toda la navegación desde GamesScreen funciona:
- Impostor → Routes.ImpostorStart ✓
- Temporizador → Routes.Timer ✓
- Equipos aleatorios → Routes.TeamRandomizer ✓
- ¿Qué soy? → toast "Próximamente" o deshabilitado
- Preguntas para el grupo → toast "Próximamente" o deshabilitado
- Anotador genérico → toast "Próximamente" o deshabilitado

Si algo no está conectado correctamente, corregirlo.

Archivos esperados:
- src/features/games/screens/GamesScreen.tsx (navegación verificada)

---

### Tarea 4 — Documentar este prompt

Crear ia/entrega-2/prompts/bloque-4/02_rediseno_pantalla_juegos.md
con el contenido completo de este prompt.

Actualizar ia/entrega-2/indice_ia.md agregando:
31 - Migración GamesScreen de features/impostor a features/games
32 - Rediseño GamesScreen: grid 2 col, cards animadas, secciones Juegos/Herramientas

No hacer:
- No tocar archivos de código fuera de los indicados
- No hacer commits

Archivos esperados:
- ia/entrega-2/prompts/bloque-4/02_rediseno_pantalla_juegos.md
- ia/entrega-2/indice_ia.md (actualizado)

---

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- Seguir tokens de src/shared/constants/theme.ts
- No hacer commits
- Reportar archivos modificados y decisiones al finalizar cada tarea
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar
Resumen con:
1. Archivos creados/modificados/eliminados
2. Decisiones de diseño tomadas
3. Íconos elegidos para cada card
4. Cómo probarlo en dispositivo

# Bloque 4c — Juego: ¿Qué soy?

## Contexto
Rama actual: feature/bloque-4-juegos
Bloques 4a y 4b completos.
GamesScreen ya tiene la card de ¿Qué soy? con toast "Próximamente".
Hay que implementar el juego completo y conectar la navegación.

Stack relevante:
- React Native + Expo SDK 55 + TypeScript
- @expo/vector-icons (MaterialCommunityIcons)
- Design tokens en src/shared/constants/theme.ts
- Sin TypeScript any, comentarios en español

---

### Tarea 1 — Dataset

Crear src/features/games/data/whoAmIData.ts

Estructura:
- Exportar un objeto WHO_AM_I_CATEGORIES con las categorías y sus palabras
- Exportar un tipo WhoAmICategory con los nombres de las categorías
- Exportar una función getShuffledCards(category: WhoAmICategory | 'todas')
  que retorna el array barajado aleatoriamente

Categorías y palabras:

POLÍTICOS:
Obama, Trump, Milei, Macri, Kirchner, Lula, Maduro, Putin,
Zelensky, Xi Jinping, Biden, Merkel, Thatcher, Churchill,
Mao, Hitler, Napoleón, Lincoln, Bolsonaro, Trudeau

DEPORTISTAS:
Messi, Ronaldo, Maradona, Federer, Nadal, LeBron James,
Michael Jordan, Usain Bolt, Muhammad Ali, Tiger Woods,
Pelé, Neymar, Mbappé, Djokovic, Serena Williams,
Michael Phelps, Tyson, Schumacher, Valentino Rossi, Manu Ginóbili

ACTORES:
Brad Pitt, Leonardo DiCaprio, Scarlett Johansson, Angelina Jolie,
Tom Hanks, Meryl Streep, Johnny Depp, Morgan Freeman,
Jennifer Aniston, Will Smith, Robert Downey Jr, Keanu Reeves,
Dwayne Johnson, Margot Robbie, Tom Cruise, Cate Blanchett,
Jack Nicholson, Denzel Washington, Julia Roberts, Ryan Reynolds

CANTANTES:
Michael Jackson, Madonna, Freddie Mercury, Beyoncé, Taylor Swift,
Lady Gaga, Elvis Presley, Adele, Rihanna, Shakira, Bad Bunny,
Bizarrap, Tini, Paulo Londra, The Weeknd, Eminem,
David Bowie, Amy Winehouse, Billie Eilish, Justin Bieber

PERSONAJES DE FICCIÓN:
Batman, Superman, Harry Potter, Hermione, Darth Vader,
Spiderman, Iron Man, Sherlock Holmes, James Bond, Indiana Jones,
Frodo, Gandalf, Jack Sparrow, El Joker, Walter White,
Homer Simpson, Mickey Mouse, Shrek, Buzz Lightyear, Katniss Everdeen

FAMOSOS ARGENTINOS:
Susana Giménez, Mirtha Legrand, Marcelo Tinelli, Fantino,
Jorge Lanata, Guido Kaczka, Lizy Tagliani, Wanda Nara,
Pampita, Nicole Neumann, Flor de la V, Andy Kusnetzoff,
Jey Mammón, Fer Dente, Roberto Moldavsky

Categoría especial "Todas": mezcla todas las palabras de todas
las categorías antes de barajar.

Al agotar todas las cartas de una categoría:
barajar de nuevo y empezar desde el principio (sin mensaje de fin).

No hacer:
- No crear pantallas todavía
- No hacer commits

Archivos esperados:
- src/features/games/data/whoAmIData.ts

---

### Tarea 2 — Pantalla de selección de categoría

Crear src/features/games/screens/WhoAmISetupScreen.tsx

Comportamiento:
- Pantalla vertical (portrait) estándar
- Título "¿Qué soy?" con subtítulo explicativo corto:
  "Mostrá el teléfono a los demás. ¡Ellos saben quién sos vos!"
- Grid o lista de cards de categorías:
  Políticos, Deportistas, Actores, Cantantes,
  Personajes de ficción, Famosos argentinos, Todas mezcladas
- Cada card muestra el nombre de la categoría y un ícono representativo
  (usar MaterialCommunityIcons)
- Al tocar una categoría navega a WhoAmIGameScreen
  pasando la categoría seleccionada como parámetro

UI:
- Cards con el mismo estilo visual que GamesScreen
  (border radius generoso, sombra, color de fondo sutil por categoría)
- Animación de entrada escalonada igual que GamesScreen
- Seguir tokens de theme.ts

No hacer:
- No instalar librerías adicionales
- No hacer commits

Archivos esperados:
- src/features/games/screens/WhoAmISetupScreen.tsx

---

### Tarea 3 — Pantalla de juego

Crear src/features/games/screens/WhoAmIGameScreen.tsx

Parámetros de navegación: { category: WhoAmICategory | 'todas' }

Comportamiento:
- Forzar orientación landscape al montar la pantalla
  usando expo-screen-orientation (verificar si está instalado;
  si no está, indicármelo antes de continuar)
- Al desmontar la pantalla, volver a portrait

Estado interno:
- Lista de cartas barajadas obtenida de getShuffledCards(category)
- Índice de la carta actual (empieza en 0)
- Al llegar al final: barajar de nuevo y reiniciar índice

UI en landscape:
- Fondo de color cálido y vibrante (no blanco)
  usar el color primario del tema con buena saturación,
  o un gradiente suave si es posible sin librerías extra
- Nombre del personaje/palabra centrado en pantalla,
  tipografía muy grande (mínimo 48sp, bold),
  color blanco o de alto contraste sobre el fondo
- Nombre de la categoría en la esquina superior izquierda
  en texto pequeño
- Contador de carta "X / total" en la esquina superior derecha
- Dos botones en la parte inferior centrados horizontalmente:
  * "Pasar" (skip sin adivinar) — borde blanco, texto blanco
  * "¡Adivinó! Siguiente" — fondo blanco, texto del color del fondo
- Ambos botones avanzan a la siguiente carta
- Botón X o "Salir" en la esquina superior izquierda
  para volver a WhoAmISetupScreen

Animación al cambiar carta:
- La carta actual sale hacia arriba con fade out
- La nueva carta entra desde abajo con fade in
- Usar Animated de React Native, sin librerías externas

No hacer:
- No instalar librerías adicionales salvo expo-screen-orientation
  si ya viene con Expo SDK 55
- No persistir estado en DB ni AsyncStorage
- No hacer commits

Archivos esperados:
- src/features/games/screens/WhoAmIGameScreen.tsx

---

### Tarea 4 — Navegación

Alcance:
1. Agregar en routes.ts:
   - Routes.WhoAmISetup
   - Routes.WhoAmIGame

2. Agregar en navigation/types.ts en MainStackParamList:
   - WhoAmISetup: undefined
   - WhoAmIGame: { category: WhoAmICategory | 'todas' }
   Para el tipo WhoAmICategory importarlo desde whoAmIData.ts

3. Registrar WhoAmISetupScreen y WhoAmIGameScreen en MainNavigator.tsx

4. En GamesScreen reemplazar el toast "Próximamente" de la card
   ¿Qué soy? por navegación a Routes.WhoAmISetup

No hacer:
- No tocar otras rutas
- No modificar el flujo del Impostor

Archivos esperados:
- src/navigation/routes.ts (modificado)
- src/navigation/types.ts (modificado)
- src/navigation/MainNavigator.tsx (modificado)
- src/features/games/screens/GamesScreen.tsx (navegación conectada)

---

### Tarea 5 — Documentar este prompt

Crear ia/entrega-2/prompts/bloque-4/03_que_soy.md
con el contenido completo de este prompt.

Actualizar ia/entrega-2/indice_ia.md agregando:
33 - Dataset whoAmIData.ts: 6 categorías + todas mezcladas
34 - WhoAmISetupScreen: selección de categoría
35 - WhoAmIGameScreen: juego en landscape con animación de cartas
36 - Navegación: rutas WhoAmISetup y WhoAmIGame

No hacer:
- No tocar archivos de código fuera de los indicados
- No hacer commits

Archivos esperados:
- ia/entrega-2/prompts/bloque-4/03_que_soy.md
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
1. Archivos creados y modificados
2. Decisiones tomadas
3. Cómo probarlo en dispositivo

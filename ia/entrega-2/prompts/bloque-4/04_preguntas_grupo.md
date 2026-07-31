# Bloque 4d — Juego: Preguntas para el grupo

## Contexto
Rama actual: feature/bloque-4-juegos
Bloques 4a, 4b y 4c completos.
GamesScreen tiene la card "Preguntas para el grupo" con toast "Próximamente".
Hay que implementar el juego completo y conectar la navegación.

Stack relevante:
- React Native + Expo SDK 55 + TypeScript
- @expo/vector-icons (MaterialCommunityIcons)
- expo-haptics ya instalado
- Design tokens en src/shared/constants/theme.ts
- Sin TypeScript any, comentarios en español

---

### Tarea 1 — Dataset

Crear src/features/games/data/groupQuestionsData.ts

Estructura:
- Exportar un array GROUP_QUESTIONS: string[] con las 100 preguntas
- Exportar una función getShuffledQuestions() que retorna el array
  barajado aleatoriamente
- Al agotar todas las preguntas: barajar de nuevo y empezar desde el principio

Preguntas a incluir (copiar exactamente):

// ¿Quién del grupo...?
"¿Quién del grupo terminaría siendo el líder de una secta sin haberlo planeado?",
"¿Quién del grupo sobreviviría más tiempo si los abandonan en la selva?",
"¿Quién del grupo sería el primero en colaborar con el enemigo para salvar su propio futuro?",
"¿Quién del grupo se casaría con alguien que acaba de conocer en un viaje?",
"¿Quién del grupo tiene más posibilidades de terminar involucrado en algo turbio sin querer?",
"¿Quién del grupo lloraría primero en una película de animación?",
"¿Quién del grupo es el que más se convence a sí mismo de sus propias mentiras?",
"¿Quién del grupo aguantaría más tiempo completamente desconectado del celular?",
"¿Quién del grupo gastaría todo su dinero en algo que en dos semanas ya no le importa?",
"¿Quién del grupo sería el peor compañero de cuarto pero el mejor amigo fuera de casa?",
"¿Quién del grupo tiene más probabilidades de aparecer en un documental de Netflix?",
"¿Quién del grupo es el que más exagera sus historias cada vez que las cuenta?",
"¿Quién del grupo sería el primero en rendirse si hay que escalar una montaña?",
"¿Quién del grupo terminaría viviendo en otro país sin haber planeado nada?",
"¿Quién del grupo es el que más guarda rencor aunque diga que no?",
"¿Quién del grupo sería el último en enterarse de algo que ya sabe todo el mundo?",
"¿Quién del grupo se quedaría dormido en su propia fiesta de cumpleaños?",
"¿Quién del grupo tiene el historial del celular más comprometedor?",
"¿Quién del grupo tomaría la peor decisión posible bajo presión?",
"¿Quién del grupo terminaría siendo famoso por algo completamente ridículo?",

// ¿Qué preferirías?
"¿Tener siempre frío o siempre calor sin poder regularlo nunca?",
"¿Saber exactamente lo que piensan de ti o no poder saber nada jamás?",
"¿Que tu ex lea todos tus chats o que tu jefe los lea?",
"¿Perder todos tus recuerdos hasta los 15 años o los últimos 5 años?",
"¿Poder volar pero solo a 30 km/h o ser invisible pero solo cuando nadie te mira?",
"¿Que cada vez que mientes se te caiga un diente o que cada vez que dices la verdad te duela la cabeza?",
"¿Que todos sepan exactamente cuánto ganas o que todos puedan ver tu historial médico completo?",
"¿Tener un superpoder inútil que nadie más tiene o ningún superpoder pero ser el mejor del mundo en algo concreto?",
"¿Que tu vida tenga banda sonora audible para todos o que todos puedan ver tus notificaciones en tiempo real?",
"¿Saber cuándo vas a morir pero no cómo, o saber cómo pero no cuándo?",
"¿Reírte sin control cada vez que alguien llora o llorar sin control cada vez que alguien se ríe?",
"¿Que cada vez que entras a un lugar suene música dramática o que cada vez que te quedas en silencio alguien pregunte en qué estás pensando?",
"¿Que tus pensamientos se publiquen solos cada tanto en redes sociales o que tus sueños los puedan ver tus contactos?",
"¿Poder pausar el tiempo pero no retrocederlo o poder retroceder 10 minutos pero solo tres veces en la vida?",
"¿Que cada mentira que digas huela a algo podrido o que cada vez que te enamoras lo sepa todo el mundo al instante?",
"¿Envejecer solo físicamente o solo mentalmente?",
"¿Que tu peor enemigo sea completamente feliz o que tu mejor amigo sea un poco menos feliz de lo que podría ser?",
"¿Poder hablar con los animales pero no entender lo que te responden o entenderlos perfectamente pero no poder hablarles?",
"¿Que cada foto que te sacan salga perfecta pero no recuerdes ese momento o recordar todo perfectamente pero las fotos siempre salgan mal?",
"¿Vivir 200 años con la salud que tienes hoy o vivir 70 años pero con plena consciencia de cada momento?",
"¿Tener memoria perfecta de absolutamente todo o poder borrar cualquier recuerdo que quieras?",
"¿Ser el más gracioso del mundo pero que nadie te tome en serio nunca o ser muy serio pero que todos te respeten demasiado?",
"¿Que tu crush sepa exactamente lo que sientes o que nunca lo sepa pero tampoco sufras por eso?",
"¿Poder hablar todos los idiomas del mundo o tocar todos los instrumentos a la perfección?",
"¿Descubrir que el universo es una simulación pero no poder contárselo a nadie o no saberlo nunca?",

// Situaciones extremas
"Si tuvieras que huir del país en 24 horas, ¿qué llevarías y a quién llamarías primero?",
"Si descubres que tu mejor amigo te estuvo mintiendo durante años sobre algo importante, ¿cómo reaccionas?",
"Si pudieras borrarte un año entero de tu vida sin dolor ni consecuencias, ¿cuál elegirías?",
"Si mañana te dijeran que eres famoso sin saber por qué, ¿cuál sería la razón más probable?",
"Si tuvieras que vivir un mes en el cuerpo de alguien del grupo, ¿a quién elegirías y por qué?",
"Si el mundo termina en 48 horas y no hay nada que hacer, ¿cómo pasas las últimas horas?",
"Si te dieran un millón de dólares pero tienes que gastarlo en 48 horas, ¿qué harías?",
"Si pudieras meterte en la mente de alguien durante 5 minutos sin que lo sepa, ¿a quién elegirías?",
"Si te hackearan el teléfono y publicaran todo sin filtro, ¿cuál sería el mayor escándalo?",
"Si descubrieras que toda tu vida fue grabada como un reality show sin saberlo, ¿cuál sería la escena más vergonzosa?",
"Si tuvieras que elegir entre salvar a un desconocido o a tu mascota, ¿qué harías honestamente?",
"Si pudieras mandarle un mensaje anónimo a alguien de tu pasado, ¿qué le dirías?",
"Si te quedas atrapado en un ascensor con alguien del grupo por 12 horas, ¿a quién elegirías que fuera?",
"Si supieras que en 10 años vas a ser completamente diferente a como eres hoy, ¿cambiarías algo ahora?",
"Si tuvieras que sobrevivir un año en una isla con solo tres personas del grupo, ¿a quiénes elegirías y por qué?",
"Si te dijeran que puedes resetear tu vida desde los 18 pero perderías todo lo que tienes ahora, ¿lo harías?",
"Si pudieras saber una sola cosa del futuro con certeza absoluta, ¿qué preguntarías?",
"Si tuvieras que vivir con la misma energía que tienes a las 3am o a las 3pm para siempre, ¿cuál elegirías?",
"Si te dieran la posibilidad de conocer la opinión real que tiene de ti cada persona que conoces, ¿lo querrías saber?",
"Si pudieras elegir el momento exacto en que la gente te recuerda cuando ya no estás, ¿cuál sería?",

// Verdades incómodas
"¿Cuál es la mentira más creativa que dijiste para salir de una situación difícil?",
"¿Hay alguien en este grupo al que le debas una disculpa que nunca le diste?",
"¿Cuándo fue la última vez que hiciste algo solo para que otros te vieran bien?",
"¿Qué es lo que más te molesta de alguien del grupo pero nunca dijiste en voz alta?",
"¿Alguna vez fingiste no haber visto un mensaje para no tener que responder?",
"¿Cuál es el plan que prometiste hacer con alguien y sabes que nunca vas a cumplir?",
"¿Cuál fue la decisión más impulsiva que tomaste de la que no te arrepientes para nada?",
"¿Hay algo que haces solo cuando estás completamente solo que nunca admitirías?",
"¿Cuál es la historia que cuentas siempre pero que exageras cada vez más con el tiempo?",
"¿Alguna vez hablaste mal de alguien de este grupo con otra persona del mismo grupo?",
"¿Cuál es el mayor malentendido que tuviste con alguien y nunca aclaraste del todo?",
"¿Qué harías diferente si supieras que nadie te va a juzgar por eso?",
"¿Cuál es la opinión que tienes sobre algo importante que nunca te animarías a decir en voz alta?",
"¿A quién del grupo llamarías a las 4am si estuvieras en un problema serio y por qué a esa persona?",
"¿Cuál fue el momento en que te diste cuenta de que alguien no era quien creías que era?",

// Absurdas y filosóficas
"Si la gravedad fuera opcional por 10 minutos al día, ¿cuál sería el primer accidente masivo que ocurriría?",
"Si los humanos hubieran evolucionado con dos cerebros independientes, ¿cómo serían las discusiones internas?",
"¿Qué pasaría con la economía mundial si de repente todos pudieran ver el precio real de las cosas antes de que les digan el precio?",
"Si el aburrimiento fuera visible como una nube sobre la cabeza de las personas, ¿cuál sería el lugar más nublado del mundo?",
"Si pudieras diseñar el infierno para una sola persona específica, ¿qué características tendría ese infierno?",
"¿Qué animal, si tuviera el tamaño de un elefante, haría colapsar completamente la civilización tal como la conocemos?",
"Si los recuerdos fueran objetos físicos que pudieras perder o que te robaran, ¿cómo cambiaría la forma en que vivimos?",
"Si descubrieras que el color que ves cuando dices 'rojo' es completamente diferente al que ve cualquier otra persona, ¿cambiaría algo en tu vida?",
"¿Qué profesión, si desapareciera de un día para otro, haría que el mundo colapsara en formas que nadie anticipó?",
"Si los sueños fueran considerados evidencia legal, ¿cuántas personas estarían presas ahora mismo?",
"Si pudieras patentar una emoción y cobrar regalías cada vez que alguien la siente, ¿cuál elegirías?",
"¿Qué pasaría si todas las personas del mundo supieran exactamente cuánto tiempo de vida les queda, al segundo?",
"Si el universo tuviera términos y condiciones que hubiera que aceptar al nacer, ¿cuál sería la cláusula más perturbadora?",
"Si pudieras hacer que una mentira colectiva que cree toda la humanidad fuera verdad, ¿cuál elegirías y por qué?",
"¿Qué pasaría si los humanos tuvieran que renovar su licencia para existir cada 10 años con un examen?",
"Si la consciencia pudiera transferirse a objetos inanimados, ¿qué objeto sería el más traumatizado de la historia?",
"¿Qué cambiaría en las relaciones humanas si todos supieran exactamente cuánto le importas a cada persona en una escala del 1 al 10?",
"Si pudieras borrar un concepto abstracto de la mente humana para siempre, como el ego o la envidia, ¿cuál elegirías y qué consecuencias no anticipadas tendría?",
"Si el tiempo fuera un recurso que se puede comprar y vender como el dinero, ¿cómo sería el mundo en 50 años?",
"Si descubrieras que cada decisión que tomaste en tu vida fue la única posible dadas las circunstancias, ¿cambiaría la forma en que te juzgas a ti mismo?"

No hacer:
- No crear pantallas todavía
- No hacer commits

Archivos esperados:
- src/features/games/data/groupQuestionsData.ts

---

### Tarea 2 — Pantalla de juego

Crear src/features/games/screens/GroupQuestionsScreen.tsx

Parámetros de navegación: ninguno (Routes.GroupQuestions: undefined)

Estado interno:
- Lista de preguntas barajadas obtenida de getShuffledQuestions()
- Índice de la pregunta actual (empieza en 0)
- Al llegar al final: barajar de nuevo y reiniciar índice

UI:
- Pantalla vertical (portrait)
- Fondo de color vibrante y cálido, consistente con el estilo
  de WhoAmIGameScreen pero con identidad propia
  (usar un color diferente al de ¿Qué soy? — naranja cálido
  o similar disponible en theme.ts o complementario)
- Número de pregunta en la parte superior (ej: "Pregunta 12")
  en texto pequeño y con opacidad reducida
- Texto de la pregunta centrado vertical y horizontalmente,
  tipografía grande (mínimo 22sp, bold), color blanco
  o de alto contraste sobre el fondo
- La pregunta debe tener padding generoso para que no
  quede pegada a los bordes
- Si el texto es muy largo debe wrappear correctamente
  sin cortarse

Controles:
- Botón "Siguiente pregunta" en la parte inferior centrado
  — fondo blanco, texto del color del fondo
- Botón X o "Salir" en la esquina superior izquierda
  para volver a la pantalla de juegos

Animación al cambiar pregunta:
- La pregunta actual sale hacia un lado con fade out
- La nueva pregunta entra desde el lado contrario con fade in
- Usar Animated de React Native, sin librerías externas

No hacer:
- No instalar librerías adicionales
- No persistir estado en DB ni AsyncStorage
- No hacer commits

Archivos esperados:
- src/features/games/screens/GroupQuestionsScreen.tsx

---

### Tarea 3 — Navegación

Alcance:
1. Agregar en routes.ts:
   - Routes.GroupQuestions

2. Agregar en navigation/types.ts en MainStackParamList:
   - GroupQuestions: undefined

3. Registrar GroupQuestionsScreen en MainNavigator.tsx

4. En GamesScreen reemplazar el toast "Próximamente" de la card
   "Preguntas para el grupo" por navegación a Routes.GroupQuestions

No hacer:
- No tocar otras rutas
- No modificar otros juegos

Archivos esperados:
- src/navigation/routes.ts (modificado)
- src/navigation/types.ts (modificado)
- src/navigation/MainNavigator.tsx (modificado)
- src/features/games/screens/GamesScreen.tsx (navegación conectada)

---

### Tarea 4 — Documentar este prompt

Crear ia/entrega-2/prompts/bloque-4/04_preguntas_grupo.md
con el contenido completo de este prompt.

Actualizar ia/entrega-2/indice_ia.md agregando:
37 - Dataset groupQuestionsData.ts: 100 preguntas en 4 categorías
38 - GroupQuestionsScreen: juego de preguntas con animación lateral
39 - Navegación: ruta GroupQuestions

No hacer:
- No tocar archivos de código fuera de los indicados
- No hacer commits

Archivos esperados:
- ia/entrega-2/prompts/bloque-4/04_preguntas_grupo.md
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

# Fix — Fondo gris visible durante animación de mezclar en TeamRandomizer

## Problema identificado
El código de la animación es correcto. El cuadrado gris que
aparece al mezclar equipos es el backgroundColor de stepPanel
y stepsRow que queda expuesto cuando las cards hacen fadeOut
a opacity 0.

## Solución
En TeamRandomizerScreen.tsx, en el StyleSheet:

1. Cambiar backgroundColor de stepPanel de theme.colors.background
   a 'transparent'

2. Cambiar backgroundColor de stepsRow de theme.colors.background
   a 'transparent'

3. Asegurarse que stepViewport también tenga
   backgroundColor: 'transparent' en lugar de theme.colors.background

El fondo blanco/claro de la pantalla lo provee el contenedor
raíz de la pantalla (el View más externo), no los paneles
intermedios. Los paneles intermedios deben ser transparentes
para que el fondo real se vea en todo momento, incluyendo
durante el fade.

No tocar ninguna lógica ni ningún otro estilo.
No hacer commits.

Archivos esperados:
- src/features/games/screens/TeamRandomizerScreen.tsx

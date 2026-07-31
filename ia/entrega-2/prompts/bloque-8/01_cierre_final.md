# Bloque 8 — Cierre y correcciones finales

## Contexto
Rama actual: feature/bloque-8-cierre
Este es el bloque de cierre de la Entrega 2. El objetivo es
resolver correcciones pendientes, limpiar deuda técnica menor
y dejar el proyecto listo para el APK final y el tag de entrega.

Stack relevante:
- React Native + Expo SDK 55 + TypeScript
- Animated de React Native (sin librerías externas)
- Design tokens en src/shared/constants/theme.ts
- Sin TypeScript any, comentarios en español

---

### Tarea 1 — Remover console.log de debug en notificationService

Buscar en src/features/notifications/services/notificationService.ts
todos los console.log relacionados con debugging de push token
y notificaciones (marcados con TODO o similares) y eliminarlos.

No eliminar logs de error reales (console.error) si los hubiera.
No tocar ninguna otra lógica del archivo.

Archivos esperados:
- src/features/notifications/services/notificationService.ts

---

### Tarea 2 — Sincronizar versión a 2.0.0

En package.json cambiar "version" de "1.0.0" a "2.0.0".
En src/config/appConfig.ts cambiar version de "1.0.0" a "2.0.0"
si existe ese campo.

Verificar que app.json ya tiene "version": "2.0.0" (no tocar si
ya está correcto).

Archivos esperados:
- mobile/package.json
- src/config/appConfig.ts (si tiene campo de versión)

---

### Tarea 3 — Fix animación "Mezclar de nuevo" en TeamRandomizer

Problema:
La animación al presionar "Mezclar de nuevo" comprime todos los
elementos hacia el centro, los pone grises y se ve brusca.

Alcance:
En src/features/games/screens/TeamRandomizerScreen.tsx,
reemplazar la animación actual del botón "Mezclar de nuevo" por:
- Fade out suave de la lista de equipos (opacity 1 → 0, 200ms)
- Los equipos se actualizan mientras están invisibles
- Fade in suave de la nueva lista (opacity 0 → 1, 200ms)
- Sin scale, sin compresión, sin cambio de color
- Duración total: 400ms

No tocar las animaciones de slide entre paso 1 y paso 2
(esas están bien). Solo la animación de "Mezclar de nuevo".

Archivos esperados:
- src/features/games/screens/TeamRandomizerScreen.tsx

---

### Tarea 4 — Impostor: opciones al terminar partida

Problema:
El botón "Terminar" en la pantalla del Impostor cierra
completamente el juego, perdiendo la configuración de jugadores
y categoría. Si el usuario quiere jugar otra ronda con los
mismos jugadores tiene que configurar todo de vuelta.

Alcance:
En la pantalla de resultado/final del Impostor
(ImpostorRoleScreen o donde esté el botón "Terminar"),
reemplazar el comportamiento actual por un modal de confirmación
con dos opciones:

- "Nueva ronda": mantiene los jugadores y la categoría actuales,
  reinicia la partida y vuelve a repartir roles. El usuario
  vuelve a la primera pantalla de revelación de roles.
- "Terminar": sale al hub de juegos (comportamiento actual).

El modal debe seguir el estilo de otros modales de la app:
fondo semitransparente, card centrada, dos botones apilados
(Nueva ronda en violeta sólido, Terminar en outlined neutro).

Buscar primero cómo está implementado el flujo del Impostor
(ImpostorStartScreen, ImpostorRoleScreen, useImpostor)
para entender dónde aplicar el cambio sin romper la lógica
existente.

No hacer:
- No cambiar la lógica de asignación de roles
- No cambiar el diseño de las pantallas existentes
- No hacer commits

Archivos esperados:
- src/features/impostor/screens/ImpostorRoleScreen.tsx
  (o donde esté el botón Terminar)
- src/features/impostor/hooks/useImpostor.ts
  (si necesita un método resetRound)

---

### Tarea 5 — Home: skeleton de carga completo

Problema:
Al entrar al Home, las secciones aparecen de a pedazos
a medida que cada query resuelve, generando una experiencia
de carga poco limpia.

Alcance:
En src/features/meetups/screens/MeetupHomeScreen.tsx:

1. Identificar todas las queries que usa la pantalla
   (juntadas, reseñas pendientes, notificaciones, stats)
2. Mientras CUALQUIERA de esas queries esté en estado loading
   (isLoading true), mostrar un skeleton completo de la pantalla
   en lugar del contenido parcial
3. El skeleton debe tener:
   - Placeholder del header (barra gris clarita donde va el saludo)
   - Dos placeholders de card de acción rápida (Crear/Unirse)
   - Tres placeholders de card de juntada apilados verticalmente
   - Mismo alto y layout que el contenido real
   - Animación de shimmer suave (opacity pulsante 0.4 → 0.8)
     usando Animated de React Native
4. Una vez que TODAS las queries resolvieron, mostrar el
   contenido real con un fade in suave (opacity 0 → 1, 300ms)

No usar librerías externas de skeleton.
El shimmer debe ser una animación en loop con Animated.loop.

No hacer:
- No cambiar la lógica de datos ni las queries
- No cambiar el diseño del Home cuando ya cargó
- No hacer commits

Archivos esperados:
- src/features/meetups/screens/MeetupHomeScreen.tsx

---

### Tarea 6 — Revisión de mensajes de animaciones

Buscar en todos los archivos de src/ donde se usan
SuccessAnimation y ErrorAnimation, y verificar que:

1. Cada llamada tiene un mensaje claro, en español, en primera
   o segunda persona, que describe qué acción se completó
   o qué error ocurrió. Ejemplos correctos:
   - "✓ Juntada creada" / "✓ Asistencia actualizada"
   - "No se pudo guardar. Intentá de nuevo."

2. No haya mensajes genéricos como "Error", "Success",
   "Operación completada" o mensajes vacíos.

3. No haya mensajes en inglés.

Corregir los que no cumplan estos criterios.
Reportar todos los archivos revisados y los cambios aplicados.

No hacer:
- No cambiar la lógica de cuándo se muestran las animaciones
- No hacer commits

---

### Tarea 7 — Documentar este prompt

Crear ia/entrega-2/prompts/bloque-8/01_cierre_final.md
con el contenido completo de este prompt.

Actualizar ia/entrega-2/indice_ia.md agregando:
[número siguiente] - Bloque 8: cierre final (debug logs,
versión, ícono, animación Mezclar, Impostor nueva ronda,
skeleton Home, revisión mensajes)

No hacer commits.

---

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- Seguir tokens de src/shared/constants/theme.ts
- No hacer commits
- Reportar archivos modificados y decisiones al finalizar
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar
Resumen con:
1. Archivos creados y modificados
2. Decisiones tomadas
3. Cómo probarlo en Expo Go

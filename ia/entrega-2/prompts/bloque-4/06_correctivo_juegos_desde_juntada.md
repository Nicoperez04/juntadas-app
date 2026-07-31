# Bloque 4 — Corrección: juegos desde juntada

## Contexto
Rama actual: feature/bloque-4-juegos
El botón "Jugar" en MeetupDetailScreen navega directo a ImpostorStart.
Hay que cambiarlo para que vaya a GamesScreen y que los juegos con
jugadores puedan prellenar participantes desde la juntada.

Patrón de referencia: ImpostorStartScreen ya implementa esto correctamente.
Usar impostorService.getParticipantsForGame(meetupId) como fuente de datos.
Ese servicio retorna participantes con attendanceStatus === 'confirmed'.

---

### Tarea 1 — Actualizar tipos de navegación

En src/navigation/types.ts:
- Cambiar Games: undefined por Games: { meetupId?: string }
- Agregar meetupId?: string a TeamRandomizer: undefined
  → TeamRandomizer: { meetupId?: string }
- Agregar meetupId?: string a ScorerSetup: undefined
  → ScorerSetup: { meetupId?: string }

No tocar otras rutas.

Archivos esperados:
- src/navigation/types.ts (modificado)

---

### Tarea 2 — Actualizar MeetupDetailScreen

En MeetupDetailScreen.tsx cambiar la navegación del botón "Jugar":
- Antes: navigation.navigate(Routes.ImpostorStart, { meetupId })
- Después: navigation.navigate(Routes.Games, { meetupId })

No tocar nada más en MeetupDetailScreen.

Archivos esperados:
- src/features/meetups/screens/MeetupDetailScreen.tsx (modificado)

---

### Tarea 3 — Actualizar GamesScreen

En GamesScreen.tsx:
1. Recibir meetupId desde route.params (puede ser undefined)
2. Al navegar a Routes.ImpostorStart: pasar { meetupId } si existe
3. Al navegar a Routes.TeamRandomizer: pasar { meetupId } si existe
4. Al navegar a Routes.ScorerSetup: pasar { meetupId } si existe
5. El resto de rutas (WhoAmISetup, GroupQuestions, Timer)
   no reciben meetupId — no cambiar nada en ellas

No tocar el diseño ni las animaciones de GamesScreen.

Archivos esperados:
- src/features/games/screens/GamesScreen.tsx (modificado)

---

### Tarea 4 — Prellenar participantes en TeamRandomizerScreen

En TeamRandomizerScreen.tsx replicar exactamente el patrón
de ImpostorStartScreen para cargar participantes:

1. Recibir meetupId? desde route.params
2. Al montar la pantalla (useFocusEffect):
   - Si hay meetupId: llamar a
     impostorService.getParticipantsForGame(meetupId)
   - Si retorna participantes: prellenar la lista de nombres
     con los nombres de esos participantes
   - Si retorna error: mostrar toast de error, lista vacía
   - Si no hay meetupId: lista vacía (flujo manual actual)
3. Los participantes prellenados se pueden eliminar
   pero no se pueden agregar nuevos desde la juntada
   — esto ya es el comportamiento actual del juego,
   no hay que cambiarlo
4. Mostrar indicador de carga mientras se obtienen
   los participantes

Importar impostorService desde su ubicación actual.
No duplicar la lógica — reutilizar el servicio existente.

Archivos esperados:
- src/features/games/screens/TeamRandomizerScreen.tsx (modificado)

---

### Tarea 5 — Prellenar participantes en ScorerSetupScreen

En ScorerSetupScreen.tsx replicar el mismo patrón:

1. Recibir meetupId? desde route.params
2. Al montar la pantalla (useFocusEffect):
   - Si hay meetupId: llamar a
     impostorService.getParticipantsForGame(meetupId)
   - Si retorna participantes: prellenar la lista de jugadores
   - Si retorna error: toast de error, lista vacía
   - Si no hay meetupId: lista vacía (flujo manual actual)
3. Los jugadores prellenados se pueden eliminar individualmente
4. Mostrar indicador de carga mientras se obtienen

Archivos esperados:
- src/features/games/screens/ScorerSetupScreen.tsx (modificado)

---

### Tarea 6 — Documentar este prompt

Crear ia/entrega-2/prompts/bloque-4/06_correctivo_juegos_desde_juntada.md
con el contenido completo de este prompt.

Actualizar ia/entrega-2/indice_ia.md agregando:
[número siguiente] - Corrección: juegos desde juntada con prellenado
  de participantes en TeamRandomizer y ScorerSetup

No hacer:
- No tocar archivos de código fuera de los indicados
- No hacer commits

Archivos esperados:
- ia/entrega-2/prompts/bloque-4/06_correctivo_juegos_desde_juntada.md
- ia/entrega-2/indice_ia.md (actualizado)

---

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- No hacer commits
- Reportar archivos modificados y decisiones al finalizar
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar
Resumen con:
1. Archivos modificados
2. Decisiones tomadas
3. Cómo probarlo en dispositivo

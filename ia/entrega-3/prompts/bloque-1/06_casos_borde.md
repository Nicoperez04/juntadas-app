# Prompt 06 — Bloque 1: Casos borde confirmados

## Contexto
Rama actual: feature/bloque-1-deuda-tecnica
Relevamiento previo identificó estos bugs concretos
en flujos existentes que hay que resolver:

1. Error de participantes silencioso en MeetupDetailScreen:
   Si falla la carga de participantes, la lista aparece
   vacía sin ningún aviso al usuario.

2. Feedback inconsistente en subida parcial de fotos:
   Si se suben X de Y fotos, el hook puede disparar
   toast de éxito y error simultáneamente →
   feedback contradictorio.

3. Juntada con fecha pasada pero estado activo:
   No hay indicador visual cuando el organizador
   no finalizó una juntada cuya fecha ya pasó.

4. maxParticipants en appConfig: el valor 12 es
   arbitrario y nunca fue una decisión de negocio
   real. Hay que eliminarlo para que no confunda.

Stack relevante:
- React Native + Expo SDK 55 + TypeScript
- TanStack Query v5
- Sin TypeScript any, comentarios en español

## Tarea 1 — Análisis previo
Sin tocar ningún archivo, reportá:

1. En MeetupDetailScreen y useMeetupDetail:
   a. ¿useMeetupDetail expone algún campo de error
      de participantes (isErrorParticipants o similar)?
   b. ¿La sección de participantes tiene algún
      estado de error o vacío hoy?
   c. ¿Qué función dispara el refetch solo de
      participantes?

2. En useMemories o MemoriesGalleryScreen:
   a. ¿Cuándo se considera éxito y cuándo error
      en una subida múltiple? ¿Qué valor tiene
      count en subida parcial?
   b. ¿Dónde exactamente se dispara el toast de
      éxito y dónde el de error?
   c. ¿El error de upload reemplaza el grid entero
      o solo muestra un toast?

3. En MeetupCard y MeetupDetailScreen:
   a. ¿Existe hasMeetupStarted u función similar
      para determinar si la fecha ya pasó?
   b. ¿Qué campos tiene el objeto meetup para
      calcular si la fecha ya ocurrió?
      (date, time, timezone?)

4. En appConfig.ts:
   a. ¿Dónde está definido maxParticipants?
   b. ¿En qué otros archivos se referencia
      appConfig.meetups.maxParticipants?
      Buscar en todo el proyecto.

No tocar ningún archivo, solo reportar.

## Tarea 2 — Surfacear error de participantes
En MeetupDetailScreen y useMeetupDetail:

1. Si useMeetupDetail no expone el error de
   participantes, agregarlo:
   - Exponer isErrorParticipants y
     refetchParticipants desde useMeetupDetail

2. En MeetupDetailScreen, en la sección de
   participantes, si isErrorParticipants:
   - Mostrar mensaje de error con ícono y texto:
     "No se pudieron cargar los participantes"
   - Agregar botón "Reintentar" que llame a
     refetchParticipants()
   - No mostrar lista vacía silenciosa

3. Mantener el comportamiento actual cuando
   los participantes cargan correctamente

No hacer commits.
Archivos esperados:
- mobile/src/features/meetups/hooks/useMeetupDetail.ts
- mobile/src/features/meetups/screens/MeetupDetailScreen.tsx

## Tarea 3 — Fix feedback subida parcial de fotos
En useMemories y/o MemoriesGalleryScreen:

Definir criterio claro y único:
- 0 fotos subidas de Y → solo error, sin éxito
- X fotos subidas de Y (parcial, X > 0) →
  toast de error "Se subieron X de Y fotos",
  sin disparar toast de éxito
- Y fotos subidas de Y → solo éxito, sin error

Asegurarse de que en ningún caso se disparen
ambos toasts simultáneamente.

Si el error de upload hoy reemplaza el grid entero,
cambiar para que muestre ErrorAnimation toast
manteniendo el grid visible con las fotos que
sí se subieron exitosamente.

No modificar la lógica de subida en sí.
No hacer commits.
Archivos esperados:
- El archivo de useMemories
- MemoriesGalleryScreen si maneja los toasts

## Tarea 4 — Indicador visual de fecha pasada
En MeetupCard (MeetupHomeScreen) y
MeetupDetailScreen:

1. Crear función helper isPastMeetup(date, time):
   - Retorna true si la combinación date + time
     ya ocurrió respecto a now()
   - Usar el mismo patrón que hasMeetupStarted
     si existe (encontrado en Tarea 1)
   - Si no existe, construir combinando date +
     time como string ISO y comparar con new Date()

2. En MeetupCard en Home:
   Si isPastMeetup && meetup.status === 'active':
   Mostrar texto pequeño debajo de la fecha:
   "Esta juntada ya ocurrió"
   Color: theme.colors.textSecondary
   Tamaño: 12sp

3. En MeetupDetailScreen:
   Si isPastMeetup && isActive:
   Mostrar el mismo aviso cerca de la fecha
   con color theme.colors.textSecondary

4. Solo indicador visual informativo.
   No cambiar ninguna lógica de negocio.

No hacer commits.
Archivos esperados:
- mobile/src/features/meetups/screens/MeetupHomeScreen.tsx
- mobile/src/features/meetups/screens/MeetupDetailScreen.tsx

## Tarea 5 — Limpiar maxParticipants de appConfig
En appConfig.ts:

1. Eliminar la propiedad maxParticipants del
   objeto meetups (o del lugar donde esté definida)
2. Si hay referencias a appConfig.meetups.maxParticipants
   en otros archivos (encontradas en Tarea 1),
   eliminarlas también
3. Si no hay referencias en ningún otro archivo,
   solo eliminar de appConfig.ts

No hacer commits.
Archivos esperados:
- mobile/src/shared/constants/appConfig.ts
  (verificar ruta exacta en Tarea 1)
- Cualquier archivo que referencie maxParticipants

## Tarea 6 — Documentar este prompt
Crear el archivo:
ia/entrega-3/prompts/bloque-1/06_casos_borde.md
con el contenido completo de este prompt.
Actualizar ia/entrega-3/indice_ia.md agregando:
06 - Casos borde: error participantes silencioso,
     subida parcial fotos, indicador fecha pasada,
     limpieza maxParticipants

No hacer commits.

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- No hacer commits
- Si algo es ambiguo, preguntar antes de asumir
- No modificar lógica de negocio existente,
  solo agregar validaciones y feedback faltantes

## Al finalizar reportar
1. Archivos modificados
2. Decisiones tomadas, especialmente:
   - Cómo quedó el criterio éxito/error en
     subida de fotos
   - Cómo se implementó isPastMeetup
   - Si maxParticipants tenía referencias en
     otros archivos
3. Cómo probarlo en Expo Go:
   - Error participantes: con red lenta o
     forzando error, verificar que aparece
     mensaje con "Reintentar" en vez de
     lista vacía
   - Subida parcial: subir fotos y simular
     fallo parcial → solo toast de error,
     grid visible con fotos subidas
   - Fecha pasada: juntada activa con fecha
     anterior → aviso visible en Home y Detalle

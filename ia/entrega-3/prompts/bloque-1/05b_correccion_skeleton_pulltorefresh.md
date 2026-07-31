# Prompt 05b — Corrección skeleton y pull-to-refresh

## Contexto
Rama actual: feature/bloque-1-deuda-tecnica
El Prompt 05 implementó skeleton, pull-to-refresh y auto-refresh.
Auto-refresh funciona correctamente. Hay dos bugs a corregir:

Bug 1 — Skeleton ocupa toda la pantalla:
isPageLoading reemplaza todo el contenido incluyendo el header
("Mis juntadas", botones Crear/Unirse). El skeleton debería
aparecer solo en el área de lista de cards ("Próximas juntadas"),
mostrando el mismo número de skeletons que juntadas hay
o 3 como máximo si aún no se sabe cuántas hay.
El header y los botones deben ser visibles siempre.

Bug 2 — Pull-to-refresh tarda más de lo esperado:
El spinner permanece visible más tiempo del necesario.
Probablemente handleRefresh no resuelve el await
correctamente o setIsRefreshing(false) se llama tarde.

## Tarea 1 — Análisis previo
Sin tocar ningún archivo, reportá:

1. En MeetupHomeScreen.tsx:
   a. ¿Cómo está estructurado el condicional isPageLoading
      hoy exactamente? ¿Qué elementos envuelve?
      Incluir número de líneas.
   b. ¿El header ("Mis juntadas", botones Crear/Unirse)
      está dentro o fuera del condicional isPageLoading?
   c. ¿Dónde exactamente en el JSX se renderiza la lista
      de cards de "Próximas juntadas"? ¿Está dentro de
      un bloque separado o mezclado con el resto?
   d. ¿Cómo está implementado handleRefresh exactamente?
      ¿Usa Promise.all, await secuencial, o algo distinto?
      Incluir el código completo con número de líneas.

2. ¿isPageLoading incluye el estado de carga de
   ['meetups', userId] específicamente, o solo depende
   de otras queries?

No tocar ningún archivo, solo reportar.

## Tarea 2 — Fix Bug 1: skeleton solo en área de cards
En MeetupHomeScreen.tsx:

1. Sacar los skeletons del condicional isPageLoading
   global que envuelve toda la pantalla

2. El header (saludo, título "Mis juntadas", botones
   Crear/Unirse) debe renderizarse siempre,
   independientemente de isPageLoading

3. En el área de "Próximas juntadas", reemplazar
   el condicional así:
   - Si isLoading (solo la query de meetups carga
     por primera vez, sin datos previos):
     mostrar 3 MeetupCardSkeleton
   - Si !isLoading y hay juntadas: mostrar las cards
   - Si !isLoading y no hay juntadas: mostrar el
     estado vacío actual

4. Las otras queries (pendingReviews, notifications,
   profile) no deben bloquear la visualización
   del skeleton ni de las cards

No modificar la lógica de negocio ni otros estados.
No hacer commits.
Archivos esperados:
- mobile/src/features/meetups/screens/MeetupHomeScreen.tsx

## Tarea 3 — Fix Bug 2: pull-to-refresh resuelve rápido
En MeetupHomeScreen.tsx, función handleRefresh:

1. Usar Promise.all para invalidar las queries
   en paralelo en vez de secuencial:
   await Promise.all([
     queryClient.invalidateQueries({
       queryKey: ['meetups', userId]
     }),
     queryClient.invalidateQueries({
       queryKey: ['pendingReviews', userId]
     }),
   ])
2. Llamar setIsRefreshing(false) en el bloque finally
   para garantizar que siempre se llama aunque falle
3. No esperar a que los datos terminen de fetchearse
   para resolver — invalidateQueries dispara el refetch
   y resuelve inmediatamente, lo cual es el
   comportamiento correcto

No modificar ninguna otra lógica.
No hacer commits.
Archivos esperados:
- mobile/src/features/meetups/screens/MeetupHomeScreen.tsx

## Tarea 4 — Documentar este prompt
Crear el archivo:
ia/entrega-3/prompts/bloque-1/05b_correccion_skeleton_pulltorefresh.md
con el contenido completo de este prompt.
Actualizar ia/entrega-3/indice_ia.md agregando:
05b - Corrección skeleton: solo en área de cards,
      pull-to-refresh resuelve con Promise.all

No hacer commits.

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- No hacer commits
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar reportar
1. Archivos modificados
2. Cómo quedó la estructura del JSX en el área
   de "Próximas juntadas" exactamente
3. Cómo quedó handleRefresh exactamente
4. Cómo probarlo en Expo Go:
   - Carga inicial: header visible siempre,
     skeletons solo en el área de cards
   - Pull-to-refresh: spinner aparece y desaparece
     rápido (menos de 1 segundo)
   - Datos reales aparecen después del skeleton

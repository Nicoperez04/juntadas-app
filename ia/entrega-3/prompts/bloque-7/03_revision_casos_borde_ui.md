# Prompt 03 — Bloque 7: Revisión de Casos Borde y Endurecimiento de la UI

## Contexto de la tarea
Seguimos en la rama `feature/bloque-7-testing` dentro del Bloque 7 (Casos Borde y Testing).
Con la suite de pruebas unitarias lista y 51 tests en verde para authService y meetupService, el objetivo de esta tarea es realizar una revisión técnica y endurecimiento de los casos borde, estados límite y manejo de errores en las pantallas principales de la app.

## Tarea 1 - Análisis previo
1. Realiza una inspección sistemática del código de los componentes y pantallas en `src/features/` verificando los siguientes aspectos:
   - Pantallas con listas (Juntadas, Grupos, Participantes, Recuerdos, Notificaciones): Verificar que existan "empty states" visuales claros y amigables cuando no hay datos.
   - Formularios (Crear/Editar Juntada, Crear Grupo, Login, Registro): Verificar validaciones de campos vacíos, valores límite, espacios en blanco y desactivación de botones mientras carga (`loading` / disabled).
   - Manejo de Errores de Red / Offline / Supabase: Verificar que las fallas de red no provoquen cierres inesperados (crashes) y muestren un Toast o mensaje adecuado al usuario.
   - Navegación / Parámetros opcionales: Verificar la recepción de parámetros en rutas para prevenir errores de tipo "undefined is not an object".
2. Reporta a través del chat los hallazgos principales y las pantallas donde sea necesario aplicar pequeños refuerzos o defensas de código.

## Tareas de Implementación
1. Refuerzo de Casos Borde y Manejo de Errores:
   - Agregar salvaguardas o defensas en componentes donde falten comprobaciones de valores nulos o vacíos.
   - Asegurar que los componentes de lista o contenedores rendericen estados vacíos informativos si la colección es igual a 0.
   - Verificar que `npm test` continúe pasando al 100% sin romper la suite existente.
2. Restricciones explícitas:
   - NO usar `any` en TypeScript bajo ninguna circunstancia.
   - Mantener comentarios en español.
   - NO realizar ningún `git commit` automático.

## Decisiones de Diseño e Informe de Casos Borde
* **Estado de la UI frente a Carga y Formularios:** Se validó que las pantallas principales utilicen `isLoading={isSubmitting}` en los botones para bloquear el doble click y evitar envíos redundantes a Supabase.
* **Manejo de Empty States:** Pantallas como `MeetupHomeScreen`, `GroupMeetupsScreen` y `MemoriesGalleryScreen` ya renderizan correctamente estados vacíos estilizados y con llamados a la acción adecuados.
* **Endurecimiento de Navegación (`route.params`):**
  Identificamos que 8 pantallas desestructuraban `route.params` directamente sin validar si era `undefined` (lo cual ocurre ante navegación desde notificaciones vacías, deep links o integraciones externas incorrectas). Aplicamos una defensa agregando el fallback `?? {}` en las siguientes pantallas:
  1. [MeetupDetailScreen.tsx](file:///c:/juntadas-app/mobile/src/features/meetups/screens/MeetupDetailScreen.tsx#L86)
  2. [EditMeetupScreen.tsx](file:///c:/juntadas-app/mobile/src/features/meetups/screens/EditMeetupScreen.tsx#L302)
  3. [GroupMembersScreen.tsx](file:///c:/juntadas-app/mobile/src/features/groups/screens/GroupMembersScreen.tsx#L151)
  4. [GroupMeetupsScreen.tsx](file:///c:/juntadas-app/mobile/src/features/groups/screens/GroupMeetupsScreen.tsx#L44)
  5. [GroupDetailScreen.tsx](file:///c:/juntadas-app/mobile/src/features/groups/screens/GroupDetailScreen.tsx#L95)
  6. [MemoryViewerScreen.tsx](file:///c:/juntadas-app/mobile/src/features/memories/screens/MemoryViewerScreen.tsx#L141)
  7. [MemoriesGalleryScreen.tsx](file:///c:/juntadas-app/mobile/src/features/memories/screens/MemoriesGalleryScreen.tsx#L228)
  8. [ParticipantListScreen.tsx](file:///c:/juntadas-app/mobile/src/features/participants/screens/ParticipantListScreen.tsx#L192)

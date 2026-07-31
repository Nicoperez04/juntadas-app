# Prompt 02 — Bloque 7: Pruebas Unitarias para meetupService.ts

## Contexto de la tarea
Seguimos en la rama `feature/bloque-7-testing` dentro del Bloque 7 (Casos Borde y Testing).
Una vez completados los tests de authService.ts y resuelto el entorno de tipos de Jest y Supabase, el objetivo de esta tarea es desarrollar la suite de pruebas unitarias automatizadas para `src/features/meetups/services/meetupService.ts` utilizando la infraestructura de Jest y los mocks de Supabase ya creados.

## Tarea 1 - Análisis previo
1. Inspecciona el archivo `src/features/meetups/services/meetupService.ts` y reporta la lista de todos los métodos exportados (ej. getMeetups, getMeetupById, createMeetup, updateMeetup, cancelMeetup, finishMeetup, joinByCode, leaveMeetup, transferOrganizerRole, hideMeetupFromHistory, etc.).
2. Revisa el mock de Supabase existente en `src/lib/supabase/__mocks__/client.ts` para verificar si hace falta agregar o ajustar algún comportamiento específico necesario para `meetupService`.

## Tareas de Implementación
1. Implementación de Tests Unitarios:
   - Crear el archivo de test `src/features/meetups/services/__tests__/meetupService.test.ts`.
   - Cobertura completa de casos de éxito y de error para los métodos principales de `meetupService.ts`:
     * Obtención e historial de juntadas (`getMeetups`, `getMeetupById`, filtros por estado/rol).
     * Creación y edición de juntadas (`createMeetup`, `updateMeetup` con y sin `cover_url`).
     * Control de ciclo de vida (`cancelMeetup`, `finishMeetup` con/sin reseñas, `reactivateMeetup`).
     * Participación y uniones (`joinByCode`, `leaveMeetup`, `rejoinMeetup`).
     * Gestión de roles y moderación (`transferOrganizerRole`, `hideMeetupFromHistory`, `deleteMeetupForEveryone`).
2. Restricciones explícitas:
   - NO usar `any` en TypeScript bajo ninguna circunstancia.
   - Mantener comentarios en español.
   - NO realizar ningún `git commit` automático.

## Detalles Técnicos Acordados y Decisiones de Diseño
* **Expansión del Mock de Supabase:** Se expandió `mobile/src/lib/supabase/__mocks__/client.ts` incorporando la interfaz `QueryBuilder` extendiendo `PromiseLike` para evitar fallos de tipado con `jest.Mock`. Se agregaron los mocks para `.in()`, `.order()`, `.insert()`, `.delete()` y `supabase.rpc()`.
* **Estrategia mockThen:** Para evitar que las llamadas a promesas en consultas intermedias rompan el encadenamiento del builder, implementamos un mock centralizado `mockThen` invocado por el método `then()` de `queryBuilder` que se resuelve secuencialmente en el orden en que las consultas son awaitadas por el servicio.
* **Resolución de Condiciones de Carrera:** Identificamos que las consultas asíncronas libres (como notificaciones fire-and-forget ejecutadas dentro de un bloque `void (async () => { ... })()`) consumían los mocks de la cola fuera de orden en tests subsecuentes. Se solucionó configurando resoluciones por defecto (`mockSingle.mockResolvedValue({ data: {}, error: null })`) en el mock general y removiendo las llamadas `mockResolvedValueOnce` en los tests para flujos asíncronos en segundo plano.

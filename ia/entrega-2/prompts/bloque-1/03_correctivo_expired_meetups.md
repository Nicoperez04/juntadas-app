# Bloque 1 — Corrección de update_expired_meetups y bug de historial

## Contexto
Estamos en la rama `feature/bloque-1-mejoras-juntada`.
Se identificaron dos problemas a corregir antes de mergear el bloque.

## Corrección 1 — Eliminar lógica de finalización automática

Decisión de producto: el estado de una juntada (finished/cancelled)
debe ser siempre manual, accionado por el organizador.
Automatizarlo por hora es incorrecto porque la juntada puede estar
en curso más allá de la hora estimada.

Alcance:
1. En meetupService.ts eliminar la llamada a supabase.rpc('update_expired_meetups')
   que se agregó en el correctivo anterior, incluyendo su comentario
2. Reemplazar el contenido de supabase/migrations/006_update_expired_meetups.sql
   con un comentario que documente la decisión:
   -- Migración 006: descartada
   -- Decisión: la finalización automática de juntadas por hora fue eliminada.
   -- El estado finished/cancelled es exclusivamente manual (acción del organizador).
   -- Razón: una juntada puede estar en curso más allá de su hora estimada.

No hacer:
- No tocar ninguna otra parte de meetupService
- No eliminar el archivo SQL, solo reemplazar su contenido

Archivos esperados:
- src/features/meetups/services/meetupService.ts (llamada RPC eliminada)
- supabase/migrations/006_update_expired_meetups.sql (reemplazado con comentario)

---

## Corrección 2 — Botón "Ver historial" en empty state

Problema:
Cuando el usuario no tiene juntadas activas, el home muestra el empty state
pero no hay forma de navegar al historial desde ahí.
El botón "Ver historial" solo se renderiza cuando hay juntadas activas.

Alcance:
En MeetupHomeScreen.tsx, dentro de la función renderEmptyState():
- Agregar un botón o link "Ver historial" que navegue a Routes.MeetupHistory
- El estilo debe ser consistente con el link de historial que ya existe
  cuando hay juntadas activas (mismo estilo, mismo texto)
- El botón va debajo del texto del empty state, con spacing adecuado

No hacer:
- No cambiar el diseño del empty state existente
- No tocar otros componentes ni pantallas

Archivos esperados:
- src/features/meetups/screens/MeetupHomeScreen.tsx (modificado)

---

## Reglas generales
- No instalar dependencias
- No tocar android/ ni ios/
- No hacer commits
- Comentarios en español
- Sin TypeScript any
- Reportar archivos modificados al finalizar

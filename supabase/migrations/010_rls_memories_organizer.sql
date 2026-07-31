-- ============================================================
-- JUNTADAS — RLS Storage memories: DELETE para organizador
-- Bloque 1 E3 — Deuda técnica
-- ============================================================
--
-- Path de archivos en el bucket: {meetupId}/{userId}/{timestamp}.jpg
--   split_part(name, '/', 1) = meetupId
--   split_part(name, '/', 2) = userId
--   split_part(name, '/', 3) = timestamp.jpg
--
-- Ejecutar en Supabase SQL Editor si la migración no se aplicó via CLI.
--
-- Verificación previa:
-- SELECT * FROM pg_policies
--   WHERE tablename = 'objects'
--   AND (qual LIKE '%memories%' OR with_check LIKE '%memories%');

-- ------------------------------------------------------------
-- Auditoría: políticas existentes que se mantienen sin cambios
-- (definidas en 004_memories_storage.sql)
-- ------------------------------------------------------------
--
-- 1) "memories: select as participant" — SELECT
--    Participante activo de la juntada puede leer fotos del path.
--    Equivalente funcional a memories_select_participants.
--
-- 2) "memories: upload as participant" — INSERT
--    Participante activo sube solo en su carpeta (userId del path).
--    Equivalente funcional a memories_insert_participants.
--
-- 3) "memories: delete own" — DELETE
--    Solo el dueño (userId en posición 2 del path) puede borrar.
--    Equivalente funcional a memories_delete_owner.
--
-- UPDATE: no hay política (nadie puede actualizar objetos) — correcto.
--
-- Lo que falta: DELETE para el organizador de la juntada.

-- ------------------------------------------------------------
-- memories_delete_organizer
-- El organizador (meetups.created_by) puede eliminar cualquier
-- foto de su juntada, identificada por el meetupId del path.
-- ------------------------------------------------------------
CREATE POLICY "memories_delete_organizer"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'memories'
    AND EXISTS (
      SELECT 1 FROM meetups
      WHERE id::text = split_part(name, '/', 1)
        AND created_by = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- memories_delete_organizer_record
-- Complementa la política de Storage anterior: ambas deben
-- existir para que el organizador elimine fotos ajenas por
-- completo (archivo en bucket + fila en tabla memories).
-- Sin esta política, Storage borra el archivo pero el registro
-- queda huérfano porque "memories: delete own" solo permite
-- al uploaded_by.
-- ------------------------------------------------------------
CREATE POLICY "memories_delete_organizer_record"
  ON memories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM meetups
      WHERE meetups.id = memories.meetup_id
        AND meetups.created_by = auth.uid()
    )
  );

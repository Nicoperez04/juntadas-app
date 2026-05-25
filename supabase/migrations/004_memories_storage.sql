-- ============================================================
-- JUNTADAS — Bucket de recuerdos (fotos de juntadas)
-- Bloque 5 — Galería de fotos
-- ============================================================
--
-- Ejecutar en Supabase SQL Editor si la migración no se aplicó via CLI.
-- Requiere la función is_active_meetup_member de 002_fix_rls_circular.sql.
--
-- Verificación previa:
-- SELECT * FROM storage.buckets WHERE id = 'memories';
-- SELECT * FROM pg_policies
--   WHERE tablename = 'objects'
--   AND (qual LIKE '%memories%' OR with_check LIKE '%memories%');

-- Crear bucket público para URLs de fotos de recuerdos
INSERT INTO storage.buckets (id, name, public)
VALUES ('memories', 'memories', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas RLS para storage.objects

-- INSERT: participante activo sube en su carpeta dentro de la juntada
-- Path: {meetupId}/{userId}/{timestamp}.jpg
CREATE POLICY "memories: upload as participant"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'memories'
    AND auth.uid()::text = (storage.foldername(name))[2]
    AND is_active_meetup_member((storage.foldername(name))[1]::uuid)
  );

-- SELECT: participante activo puede ver fotos de la juntada
CREATE POLICY "memories: select as participant"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'memories'
    AND is_active_meetup_member((storage.foldername(name))[1]::uuid)
  );

-- DELETE: solo quien subió la foto (userId en el path)
CREATE POLICY "memories: delete own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'memories'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

-- MEJORA OPCIONAL: INSERT en tabla memories más estricto
-- DROP POLICY IF EXISTS "memories: insert" ON memories;
-- CREATE POLICY "memories: insert"
--   ON memories FOR INSERT
--   WITH CHECK (
--     uploaded_by = auth.uid()
--     AND is_active_meetup_member(meetup_id)
--   );

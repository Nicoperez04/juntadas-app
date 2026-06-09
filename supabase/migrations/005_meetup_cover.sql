-- ============================================================
-- JUNTADAS — Foto de portada de juntadas
-- Bloque 1 (E2) — Mejoras de juntada
-- ============================================================
--
-- Ejecutar en Supabase Dashboard → SQL Editor → Run.
-- Requiere la función is_active_meetup_member de 002_fix_rls_circular.sql.
--
-- Verificación previa:
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'meetups' AND column_name = 'cover_url';
-- SELECT * FROM storage.buckets WHERE id = 'meetup-covers';
-- SELECT * FROM pg_policies
--   WHERE tablename = 'objects'
--   AND (qual LIKE '%meetup-covers%' OR with_check LIKE '%meetup-covers%');

-- ------------------------------------------------------------
-- 1. Columna cover_url en meetups
-- ------------------------------------------------------------
-- Guarda la URL pública del archivo de portada; NULL si la juntada
-- no tiene portada configurada.
ALTER TABLE meetups
  ADD COLUMN IF NOT EXISTS cover_url TEXT NULL;

-- ------------------------------------------------------------
-- 2. Bucket de Storage para portadas
-- ------------------------------------------------------------
-- DECISIÓN: el bucket se crea como público (public = true), igual que
-- 'avatars' y 'memories', porque la app renderiza la portada con la URL
-- pública en <Image> y React Native no envía el token de autenticación.
-- Con public = false las imágenes nunca cargarían. El control de escritura
-- queda garantizado por las políticas RLS de INSERT/UPDATE/DELETE.
INSERT INTO storage.buckets (id, name, public)
VALUES ('meetup-covers', 'meetup-covers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ------------------------------------------------------------
-- 3. Políticas RLS para storage.objects
-- ------------------------------------------------------------
-- Convención de path de los archivos: {meetupId}/{userId}/{timestamp}.jpg
--   (storage.foldername(name))[1] → meetupId
--   (storage.foldername(name))[2] → userId del que sube

-- SELECT: solo usuarios autenticados que sean miembros activos de la
-- juntada pueden leer vía la API de Storage. Reutiliza la función
-- SECURITY DEFINER existente para evitar recursión de RLS.
CREATE POLICY "meetup-covers: select as member"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'meetup-covers'
    AND is_active_meetup_member((storage.foldername(name))[1]::uuid)
  );

-- INSERT: solo el organizador activo de la juntada puede subir la portada.
-- Se verifica role = 'organizer' en meetup_participants y que el path
-- pertenezca al propio usuario para evitar suplantaciones.
CREATE POLICY "meetup-covers: insert as organizer"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'meetup-covers'
    AND auth.uid()::text = (storage.foldername(name))[2]
    AND EXISTS (
      SELECT 1
      FROM meetup_participants
      WHERE meetup_id = (storage.foldername(name))[1]::uuid
        AND user_id = auth.uid()
        AND role = 'organizer'
        AND left_at IS NULL
    )
  );

-- UPDATE: solo el organizador activo puede reemplazar archivos de portada.
CREATE POLICY "meetup-covers: update as organizer"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'meetup-covers'
    AND EXISTS (
      SELECT 1
      FROM meetup_participants
      WHERE meetup_id = (storage.foldername(name))[1]::uuid
        AND user_id = auth.uid()
        AND role = 'organizer'
        AND left_at IS NULL
    )
  );

-- DELETE: solo el organizador activo puede eliminar la portada.
CREATE POLICY "meetup-covers: delete as organizer"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'meetup-covers'
    AND EXISTS (
      SELECT 1
      FROM meetup_participants
      WHERE meetup_id = (storage.foldername(name))[1]::uuid
        AND user_id = auth.uid()
        AND role = 'organizer'
        AND left_at IS NULL
    )
  );

-- ------------------------------------------------------------
-- 4. Ajuste de política UPDATE en meetups (transferencia de organizador)
-- ------------------------------------------------------------
-- PROBLEMA: la política "meetups: update own" de 001 no define WITH CHECK,
-- por lo que Postgres reutiliza el USING (created_by = auth.uid()) para
-- validar también la fila NUEVA. Eso impide cambiar created_by a otro
-- usuario y bloquearía la transferencia de organización de este bloque.
--
-- SOLUCIÓN: recrear la política con WITH CHECK explícito. El USING sigue
-- exigiendo que solo el organizador actual pueda iniciar el UPDATE; el
-- WITH CHECK permite que el nuevo created_by sea un miembro activo de la
-- juntada (caso de transferencia) o el propio usuario (ediciones normales).
DROP POLICY IF EXISTS "meetups: update own" ON meetups;

CREATE POLICY "meetups: update own"
  ON meetups FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM meetup_participants mp
      WHERE mp.meetup_id = meetups.id
        AND mp.user_id = meetups.created_by
        AND mp.left_at IS NULL
    )
  );

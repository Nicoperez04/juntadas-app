-- ============================================================
-- JUNTADAS — Bucket de avatares para fotos de perfil
-- Bloque 6 — Perfil de usuario
-- ============================================================
--
-- Ejecutar en Supabase SQL Editor si la migración no se aplicó via CLI.
-- Requiere que la extensión storage esté habilitada (viene por defecto en Supabase).

-- Crear bucket público para URLs de avatar
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas RLS para storage.objects

-- Insertar/actualizar propio avatar
CREATE POLICY "avatars: upload own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars: update own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Leer avatares — público para todos los autenticados
CREATE POLICY "avatars: select public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

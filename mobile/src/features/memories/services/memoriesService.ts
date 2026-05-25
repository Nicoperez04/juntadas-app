/**
 * Servicio de recuerdos — única capa que interactúa con Supabase Storage
 * y la tabla `memories` para este módulo.
 *
 * Todas las funciones siguen el patrón `{ data, error }` para que los callers
 * nunca necesiten capturar excepciones directamente.
 */
import { supabase } from '@/lib/supabase/client';
import type { Memory, UploadMemoryData } from '../types';

/** Contrato de retorno uniforme de todas las operaciones del servicio */
interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

/** Nombre del bucket de Storage donde se guardan las fotos de recuerdos */
const MEMORIES_BUCKET = 'memories';

/**
 * SQL para verificar bucket y políticas RLS — ejecutar en Supabase SQL Editor:
 *
 * -- Ver bucket
 * SELECT * FROM storage.buckets WHERE id = 'memories';
 *
 * -- Ver políticas existentes del bucket memories
 * SELECT * FROM pg_policies
 *   WHERE tablename = 'objects'
 *   AND (qual LIKE '%memories%' OR with_check LIKE '%memories%');
 *
 * ESTADO ACTUAL (según verificación del proyecto):
 * - El bucket `memories` existe y es público (public = true).
 * - NO hay migración ni políticas RLS en storage.objects para `memories`
 *   (solo existe 003_avatars_storage.sql para avatares).
 * - La tabla `memories` tiene RLS vía migraciones 001/002:
 *   SELECT con is_active_meetup_member, INSERT solo uploaded_by = auth.uid(),
 *   DELETE solo uploaded_by = auth.uid().
 *
 * SQL NECESARIO si faltan políticas de Storage (ejecutar manualmente):
 *
 * -- Asegurar bucket público
 * INSERT INTO storage.buckets (id, name, public)
 * VALUES ('memories', 'memories', true)
 * ON CONFLICT (id) DO UPDATE SET public = true;
 *
 * -- INSERT: participante activo sube en su carpeta dentro de la juntada
 * -- Path: {meetupId}/{userId}/{timestamp}.jpg
 * CREATE POLICY "memories: upload as participant"
 *   ON storage.objects FOR INSERT
 *   WITH CHECK (
 *     bucket_id = 'memories'
 *     AND auth.uid()::text = (storage.foldername(name))[2]
 *     AND is_active_meetup_member((storage.foldername(name))[1]::uuid)
 *   );
 *
 * -- SELECT: participante activo puede ver fotos de la juntada
 * CREATE POLICY "memories: select as participant"
 *   ON storage.objects FOR SELECT
 *   USING (
 *     bucket_id = 'memories'
 *     AND is_active_meetup_member((storage.foldername(name))[1]::uuid)
 *   );
 *
 * -- DELETE: solo quien subió la foto (userId en el path)
 * CREATE POLICY "memories: delete own"
 *   ON storage.objects FOR DELETE
 *   USING (
 *     bucket_id = 'memories'
 *     AND auth.uid()::text = (storage.foldername(name))[2]
 *   );
 *
 * MEJORA OPCIONAL en tabla memories (INSERT más estricto):
 * DROP POLICY IF EXISTS "memories: insert" ON memories;
 * CREATE POLICY "memories: insert"
 *   ON memories FOR INSERT
 *   WITH CHECK (
 *     uploaded_by = auth.uid()
 *     AND is_active_meetup_member(meetup_id)
 *   );
 */

/** Fila de la tabla `memories` con perfil anidado tal como la retorna Supabase */
interface MemoryRow {
  id: string;
  meetup_id: string;
  uploaded_by: string;
  file_url: string;
  file_path: string;
  media_type: string;
  created_at: string;
  profiles: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
}

/**
 * Construye la ruta del archivo en Storage.
 * Formato: {meetupId}/{userId}/{timestamp}.jpg
 */
const buildFilePath = (meetupId: string, userId: string): string =>
  `${meetupId}/${userId}/${Date.now()}.jpg`;

/**
 * Mapea una fila de Supabase al modelo de dominio Memory.
 */
const mapMemoryRow = (row: MemoryRow): Memory => ({
  id: row.id,
  meetupId: row.meetup_id,
  uploadedBy: row.uploaded_by,
  fileUrl: row.file_url,
  filePath: row.file_path,
  mediaType: 'photo',
  createdAt: row.created_at,
  uploaderName: row.profiles.full_name,
  uploaderUsername: row.profiles.username,
  uploaderAvatarUrl: row.profiles.avatar_url,
});

export const memoriesService = {
  /**
   * Obtiene todas las fotos de una juntada con datos del perfil del autor,
   * ordenadas de más reciente a más antigua.
   *
   * @param meetupId - UUID de la juntada
   */
  async getMemories(meetupId: string): Promise<ServiceResult<Memory[]>> {
    try {
      const { data, error } = await supabase
        .from('memories')
        .select(
          `
          id,
          meetup_id,
          uploaded_by,
          file_url,
          file_path,
          media_type,
          created_at,
          profiles:uploaded_by (
            full_name,
            username,
            avatar_url
          )
        `,
        )
        .eq('meetup_id', meetupId)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: 'No se pudieron cargar los recuerdos' };
      }

      const rows = (data ?? []) as unknown as MemoryRow[];
      return { data: rows.map(mapMemoryRow), error: null };
    } catch {
      return { data: null, error: 'Error inesperado al cargar los recuerdos' };
    }
  },

  /**
   * Sube una imagen a Storage, inserta el registro en `memories` y retorna
   * la memoria creada con datos del perfil del autor.
   *
   * @param data - meetupId, imageUri local y userId del uploader
   */
  async uploadMemory(data: UploadMemoryData): Promise<ServiceResult<Memory>> {
    try {
      const response = await fetch(data.imageUri);
      const arrayBuffer = await response.arrayBuffer();
      const filePath = buildFilePath(data.meetupId, data.userId);

      const { error: uploadError } = await supabase.storage
        .from(MEMORIES_BUCKET)
        .upload(filePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        return { data: null, error: 'No se pudo subir la foto' };
      }

      const { data: publicUrlData } = supabase.storage
        .from(MEMORIES_BUCKET)
        .getPublicUrl(filePath);

      const { data: inserted, error: insertError } = await supabase
        .from('memories')
        .insert({
          meetup_id: data.meetupId,
          uploaded_by: data.userId,
          file_url: publicUrlData.publicUrl,
          file_path: filePath,
          media_type: 'photo',
        })
        .select(
          `
          id,
          meetup_id,
          uploaded_by,
          file_url,
          file_path,
          media_type,
          created_at,
          profiles:uploaded_by (
            full_name,
            username,
            avatar_url
          )
        `,
        )
        .single();

      if (insertError || !inserted) {
        // Rollback manual: eliminar archivo huérfano si falla el insert en DB
        await supabase.storage.from(MEMORIES_BUCKET).remove([filePath]);
        return { data: null, error: 'No se pudo registrar la foto' };
      }

      return {
        data: mapMemoryRow(inserted as unknown as MemoryRow),
        error: null,
      };
    } catch {
      return { data: null, error: 'Error inesperado al subir la foto' };
    }
  },

  /**
   * Elimina una foto verificando que el usuario sea quien la subió.
   * Primero borra el archivo de Storage y luego el registro de la tabla.
   *
   * @param memoryId - UUID del registro en `memories`
   * @param userId - UUID del usuario autenticado (debe coincidir con uploaded_by)
   * @param filePath - Ruta del archivo en Storage
   */
  async deleteMemory(
    memoryId: string,
    userId: string,
    filePath: string,
  ): Promise<ServiceResult<null>> {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('memories')
        .select('uploaded_by')
        .eq('id', memoryId)
        .single();

      if (fetchError || !existing) {
        return { data: null, error: 'No se encontró la foto' };
      }

      if (existing.uploaded_by !== userId) {
        return { data: null, error: 'No tenés permiso para eliminar esta foto' };
      }

      const { error: storageError } = await supabase.storage
        .from(MEMORIES_BUCKET)
        .remove([filePath]);

      if (storageError) {
        return { data: null, error: 'No se pudo eliminar el archivo' };
      }

      const { error: deleteError } = await supabase
        .from('memories')
        .delete()
        .eq('id', memoryId);

      if (deleteError) {
        return { data: null, error: 'No se pudo eliminar el registro' };
      }

      return { data: null, error: null };
    } catch {
      return { data: null, error: 'Error inesperado al eliminar la foto' };
    }
  },

  /**
   * Sube múltiples fotos en paralelo invocando uploadMemory por cada URI.
   *
   * @param meetupId - UUID de la juntada
   * @param userId - UUID del usuario autenticado
   * @param imageUris - URIs locales de las imágenes seleccionadas
   */
  async uploadMultipleMemories(
    meetupId: string,
    userId: string,
    imageUris: string[],
  ): Promise<ServiceResult<Memory[]>> {
    try {
      const results = await Promise.all(
        imageUris.map((imageUri) =>
          this.uploadMemory({ meetupId, imageUri, userId }),
        ),
      );

      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        const uploaded = results
          .filter((r) => r.data)
          .map((r) => r.data as Memory);

        if (uploaded.length === 0) {
          return {
            data: null,
            error: errors[0].error ?? 'No se pudieron subir las fotos',
          };
        }

        return {
          data: uploaded,
          error: `Se subieron ${uploaded.length} de ${imageUris.length} fotos`,
        };
      }

      return {
        data: results.map((r) => r.data as Memory),
        error: null,
      };
    } catch {
      return { data: null, error: 'Error inesperado al subir las fotos' };
    }
  },
};

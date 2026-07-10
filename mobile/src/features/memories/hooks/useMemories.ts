/**
 * Hook de recuerdos para una juntada específica.
 *
 * Encapsula la carga, subida múltiple y eliminación de fotos delegando
 * toda la lógica de Supabase al memoriesService.
 *
 * @param meetupId - UUID de la juntada cuyas fotos se gestionan
 * @param currentUserId - UUID del usuario autenticado; null mientras carga la sesión
 * @param isOrganizer - true si el usuario es organizador de la juntada
 */
import { useState, useEffect, useCallback } from 'react';
import { memoriesService } from '../services/memoriesService';
import type { Memory } from '../types';

/** Progreso de subida múltiple para el overlay de la galería */
export interface UploadProgress {
  current: number;
  total: number;
}

/** Resultado de una subida múltiple para decidir feedback en la UI */
export interface UploadPhotosResult {
  uploadedCount: number;
  total: number;
  /** success = todas; partial = algunas; failure = ninguna */
  outcome: 'success' | 'partial' | 'failure';
  /** Mensaje para toast de error; null cuando outcome es success */
  message: string | null;
}

export const useMemories = (
  meetupId: string,
  currentUserId: string | null,
  isOrganizer = false,
) => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  /**
   * Recarga la lista de fotos desde Supabase.
   * Expuesto como refresh para pull-to-refresh o recargas post-acción.
   */
  const refresh = useCallback(async () => {
    setError(null);
    const result = await memoriesService.getMemories(meetupId);

    if (result.error) {
      setError(result.error);
      return { success: false as const, count: 0 };
    }

    setMemories(result.data ?? []);
    return { success: true as const, count: result.data?.length ?? 0 };
  }, [meetupId]);

  // Carga inicial al montar o cuando cambia la juntada
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setIsLoading(true);
      await refresh();
      if (mounted) setIsLoading(false);
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [refresh]);

  /**
   * Sube las URIs locales seleccionadas (desde cámara o galería) y recarga la lista.
   * Los fallos de subida no alteran `error` del hook (reservado a la carga inicial);
   * el resultado estructurado permite a la pantalla elegir toast de éxito o error.
   *
   * @param imageUris - URIs locales obtenidas con expo-image-picker
   * @returns Resultado con outcome y mensaje, o null si no hay URIs o sesión
   */
  const uploadPhotosFromUris = useCallback(
    async (imageUris: string[]): Promise<UploadPhotosResult | null> => {
      if (!currentUserId) {
        return {
          uploadedCount: 0,
          total: imageUris.length,
          outcome: 'failure',
          message: 'Tenés que iniciar sesión para subir fotos',
        };
      }

      if (imageUris.length === 0) {
        return null;
      }

      setIsUploading(true);
      setUploadProgress({ current: 0, total: imageUris.length });

      // Subimos en paralelo pero actualizamos progreso conforme terminan
      let completed = 0;
      const uploadTasks = imageUris.map(async (imageUri) => {
        const result = await memoriesService.uploadMemory({
          meetupId,
          imageUri,
          userId: currentUserId,
        });
        completed += 1;
        setUploadProgress({ current: completed, total: imageUris.length });
        return result;
      });

      const results = await Promise.all(uploadTasks);
      setIsUploading(false);
      setUploadProgress(null);

      const uploaded = results.filter((r) => r.data);
      const failed = results.filter((r) => r.error);

      await refresh();

      if (uploaded.length === 0) {
        return {
          uploadedCount: 0,
          total: imageUris.length,
          outcome: 'failure',
          message: failed[0]?.error ?? 'No se pudieron subir las fotos',
        };
      }

      if (failed.length > 0) {
        return {
          uploadedCount: uploaded.length,
          total: imageUris.length,
          outcome: 'partial',
          message: `Se subieron ${uploaded.length} de ${imageUris.length} fotos`,
        };
      }

      return {
        uploadedCount: uploaded.length,
        total: imageUris.length,
        outcome: 'success',
        message: null,
      };
    },
    [currentUserId, meetupId, refresh],
  );

  /**
   * Elimina una foto propia o cualquier foto si el usuario es organizador.
   *
   * @param memory - Memoria a eliminar
   */
  const deletePhoto = useCallback(
    async (memory: Memory): Promise<boolean> => {
      if (!currentUserId) {
        setError('Tenés que iniciar sesión para eliminar fotos');
        return false;
      }

      setError(null);
      const result = await memoriesService.deleteMemory(
        memory.id,
        currentUserId,
        memory.filePath,
        { meetupId, isOrganizer },
      );

      if (result.error) {
        setError(result.error);
        return false;
      }

      await refresh();
      return true;
    },
    [currentUserId, isOrganizer, meetupId, refresh],
  );

  return {
    memories,
    isLoading,
    isUploading,
    uploadProgress,
    error,
    uploadPhotosFromUris,
    deletePhoto,
    refresh,
  };
};

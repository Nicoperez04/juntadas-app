/**
 * Hook de recuerdos para una juntada específica.
 *
 * Encapsula la carga, subida múltiple y eliminación de fotos delegando
 * toda la lógica de Supabase al memoriesService.
 *
 * @param meetupId - UUID de la juntada cuyas fotos se gestionan
 * @param currentUserId - UUID del usuario autenticado; null mientras carga la sesión
 */
import { useState, useEffect, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { memoriesService } from '../services/memoriesService';
import type { Memory } from '../types';

/** Progreso de subida múltiple para el overlay de la galería */
export interface UploadProgress {
  current: number;
  total: number;
}

export const useMemories = (meetupId: string, currentUserId: string | null) => {
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
   * Abre el selector de galería con selección múltiple, sube las fotos
   * en paralelo y recarga la lista al finalizar.
   *
   * @returns Cantidad de fotos subidas exitosamente o null si se canceló
   */
  const uploadPhotos = useCallback(async (): Promise<number | null> => {
    if (!currentUserId) {
      setError('Tenés que iniciar sesión para subir fotos');
      return null;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Necesitamos acceso a tu galería para subir fotos');
      return null;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (pickerResult.canceled || pickerResult.assets.length === 0) {
      return null;
    }

    const imageUris = pickerResult.assets.map((asset) => asset.uri);
    setIsUploading(true);
    setUploadProgress({ current: 0, total: imageUris.length });
    setError(null);

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
      setError(failed[0]?.error ?? 'No se pudieron subir las fotos');
      return 0;
    }

    if (failed.length > 0) {
      setError(`Se subieron ${uploaded.length} de ${imageUris.length} fotos`);
    }

    return uploaded.length;
  }, [currentUserId, meetupId, refresh]);

  /**
   * Elimina una foto propia y recarga la lista.
   *
   * @param memory - Memoria a eliminar (debe ser del usuario actual)
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
      );

      if (result.error) {
        setError(result.error);
        return false;
      }

      await refresh();
      return true;
    },
    [currentUserId, refresh],
  );

  return {
    memories,
    isLoading,
    isUploading,
    uploadProgress,
    error,
    uploadPhotos,
    deletePhoto,
    refresh,
  };
};

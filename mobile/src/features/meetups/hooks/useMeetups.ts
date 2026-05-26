/**
 * Hook principal del módulo de juntadas.
 *
 * Centraliza el estado de carga y error para que las pantallas no
 * necesiten manejar lógica asíncrona directamente. Expone funciones
 * para crear juntadas, unirse, obtener detalles y refrescar la lista.
 *
 * El userId se obtiene automáticamente de la sesión activa de Supabase
 * al montar el hook, por lo que las pantallas no necesitan manejarlo.
 * La lista de juntadas se carga automáticamente en cuanto el userId
 * está disponible.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { meetupService } from '../services/meetupService';
import type {
  MeetupWithRole,
  MeetupParticipant,
  CreateMeetupFormData,
  Meetup,
} from '../types';
interface OperationResult<T> {
  data: T | null;
  error: string | null;
}

export const useMeetups = () => {
  const [meetups, setMeetups] = useState<MeetupWithRole[]>([]);
  /**
   * Arranca en true para que el skeleton se muestre inmediatamente al montar,
   * evitando el flash de empty state antes de que los datos terminen de cargarse.
   */
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** ID del usuario autenticado; se obtiene de la sesión al montar el hook */
  const [userId, setUserId] = useState<string | null>(null);

  // Obtener el userId de la sesión activa al montar el hook
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session?.user?.id) {
          setUserId(session.user.id);
        } else {
          // Sin sesión activa no hay datos que buscar; se oculta el spinner
          setIsLoading(false);
        }
      })
      .catch(() => {
        // Error de red o token inválido — evitar que el spinner quede infinito
        setIsLoading(false);
      });
  }, []);

  /**
   * Carga todas las juntadas activas del usuario desde el servicio.
   * Función interna que se reutiliza en refresh y en los efectos de carga.
   *
   * @param uid - UUID del usuario autenticado
   */
  const loadMeetups = useCallback(async (uid: string) => {
    setIsLoading(true);
    setError(null);
    const { data, error: err } = await meetupService.getUserMeetups(uid);
    if (err) {
      setError(err);
    } else {
      setMeetups(data ?? []);
    }
    setIsLoading(false);
  }, []);

  // Disparar la carga de juntadas en cuanto el userId esté disponible
  useEffect(() => {
    if (userId) {
      loadMeetups(userId);
    }
  }, [userId, loadMeetups]);

  /**
   * Recarga la lista de juntadas del usuario desde el servidor.
   * Llamar después de operaciones que modifican el estado de las juntadas.
   */
  const refresh = useCallback(() => {
    if (userId) {
      loadMeetups(userId);
    }
  }, [userId, loadMeetups]);

  /**
   * Crea una nueva juntada con los datos del formulario y recarga la lista.
   *
   * @param formData - Datos validados del formulario de creación
   * @returns La juntada creada o un mensaje de error
   */
  const createMeetup = useCallback(
    async (
      formData: CreateMeetupFormData,
    ): Promise<OperationResult<Meetup>> => {
      if (!userId) {
        return { data: null, error: 'No hay usuario autenticado' };
      }
      setIsLoading(true);
      setError(null);
      const result = await meetupService.createMeetup(userId, formData);
      if (result.error) {
        setError(result.error);
      } else {
        await loadMeetups(userId);
      }
      setIsLoading(false);
      return result;
    },
    [userId, loadMeetups],
  );

  /**
   * Une al usuario a una juntada mediante su código de ingreso y recarga la lista.
   *
   * @param joinCode - Código de 6 caracteres de la juntada
   * @returns La juntada a la que se unió o un mensaje de error
   */
  const joinMeetup = useCallback(
    async (joinCode: string): Promise<OperationResult<Meetup>> => {
      if (!userId) {
        return { data: null, error: 'No hay usuario autenticado' };
      }
      setIsLoading(true);
      setError(null);
      const result = await meetupService.joinMeetup(userId, joinCode);
      if (result.error) {
        setError(result.error);
      } else {
        await loadMeetups(userId);
      }
      setIsLoading(false);
      return result;
    },
    [userId, loadMeetups],
  );

  /**
   * Obtiene el detalle completo de una juntada por su ID.
   * No modifica el estado del hook; la pantalla que llama maneja su propio loading.
   *
   * @param meetupId - UUID de la juntada
   * @returns La juntada con todos sus campos o un mensaje de error
   */
  const getMeetupById = useCallback(
    async (meetupId: string): Promise<OperationResult<Meetup>> => {
      return meetupService.getMeetupById(meetupId);
    },
    [],
  );

  /**
   * Obtiene la lista de participantes de una juntada con sus perfiles.
   * No modifica el estado del hook; la pantalla que llama maneja su propio loading.
   *
   * @param meetupId - UUID de la juntada
   * @returns Lista de participantes con perfil o un mensaje de error
   */
  const getMeetupParticipants = useCallback(
    async (
      meetupId: string,
    ): Promise<OperationResult<MeetupParticipant[]>> => {
      return meetupService.getMeetupParticipants(meetupId);
    },
    [],
  );

  /**
   * Cancela una juntada activa. Solo el organizador puede ejecutar esta acción.
   *
   * @param meetupId - UUID de la juntada a cancelar
   * @returns La juntada cancelada o mensaje de error
   */
  const cancelMeetup = useCallback(
    async (meetupId: string): Promise<OperationResult<Meetup>> => {
      if (!userId) {
        return { data: null, error: 'No hay usuario autenticado' };
      }
      const result = await meetupService.cancelMeetup(meetupId, userId);
      if (!result.error) {
        await loadMeetups(userId);
      }
      return result;
    },
    [userId, loadMeetups],
  );

  /**
   * Finaliza una juntada activa. Solo el organizador puede ejecutar esta acción.
   *
   * @param meetupId - UUID de la juntada a finalizar
   * @returns La juntada finalizada o mensaje de error
   */
  const finishMeetup = useCallback(
    async (meetupId: string): Promise<OperationResult<Meetup>> => {
      if (!userId) {
        return { data: null, error: 'No hay usuario autenticado' };
      }
      const result = await meetupService.finishMeetup(meetupId, userId);
      if (!result.error) {
        await loadMeetups(userId);
      }
      return result;
    },
    [userId, loadMeetups],
  );

  /**
   * Edita los campos de una juntada activa. Solo el organizador puede editar.
   *
   * @param meetupId - UUID de la juntada
   * @param formData - Datos validados del formulario
   * @returns La juntada actualizada o mensaje de error
   */
  const editMeetup = useCallback(
    async (
      meetupId: string,
      formData: CreateMeetupFormData,
    ): Promise<OperationResult<Meetup>> => {
      if (!userId) {
        return { data: null, error: 'No hay usuario autenticado' };
      }
      const result = await meetupService.editMeetup(meetupId, userId, formData);
      if (!result.error) {
        await loadMeetups(userId);
      }
      return result;
    },
    [userId, loadMeetups],
  );

  /**
   * Obtiene juntadas finalizadas o canceladas del historial del usuario.
   * No modifica el estado del hook; la pantalla de historial maneja su loading.
   *
   * @returns Lista de juntadas históricas o mensaje de error
   */
  const getFinishedMeetups = useCallback(async (): Promise<
    OperationResult<MeetupWithRole[]>
  > => {
    if (!userId) {
      return { data: null, error: 'No hay usuario autenticado' };
    }
    return meetupService.getFinishedMeetups(userId);
  }, [userId]);

  return {
    meetups,
    isLoading,
    error,
    createMeetup,
    joinMeetup,
    getMeetupById,
    getMeetupParticipants,
    cancelMeetup,
    finishMeetup,
    editMeetup,
    getFinishedMeetups,
    refresh,
  };
};

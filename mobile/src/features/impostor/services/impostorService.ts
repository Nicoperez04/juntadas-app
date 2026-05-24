/**
 * Servicio Impostor — persistencia mínima en Supabase e integración con participantes.
 *
 * El estado del juego en tiempo real vive en memoria local; aquí solo se
 * registran partidas para historial y se obtienen jugadores confirmados.
 */
import { supabase } from '@/lib/supabase/client';
import { participantService } from '@/features/participants/services/participantService';
import { getParticipantDisplayName } from '@/features/participants/utils/participantDisplay';
import type { Player, SaveGameRecordData } from '../types';

/** Contrato uniforme de retorno del servicio */
interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

export const impostorService = {
  /**
   * Guarda un registro en impostor_games al iniciar la partida.
   * Solo sirve para historial futuro; no controla el flujo del juego.
   *
   * @param userId - UUID del organizador autenticado
   * @param meetupId - UUID de la juntada
   * @param data - Tema, palabras e impostor si es usuario de la app
   * @returns ID del registro creado o error legible
   */
  async saveGameRecord(
    userId: string,
    meetupId: string,
    data: SaveGameRecordData,
  ): Promise<ServiceResult<string>> {
    try {
      const { data: row, error } = await supabase
        .from('impostor_games')
        .insert({
          meetup_id: meetupId,
          created_by: userId,
          topic: data.topic,
          normal_prompt: data.normalPrompt,
          impostor_prompt: data.impostorPrompt || 'Sin pista',
          impostor_user_id: data.impostorUserId,
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) {
        return { data: null, error: 'No se pudo registrar la partida — intentá de nuevo' };
      }

      return { data: row.id, error: null };
    } catch {
      return { data: null, error: 'Error inesperado al guardar la partida' };
    }
  },

  /**
   * Obtiene participantes confirmados de la juntada para pre-cargar jugadores.
   * Los convierte al formato Player local con IDs de sesión nuevos.
   *
   * @param meetupId - UUID de la juntada
   * @returns Lista de jugadores listos para el setup o error
   */
  async getParticipantsForGame(
    meetupId: string,
  ): Promise<ServiceResult<Player[]>> {
    const { data: participants, error } =
      await participantService.getParticipants(meetupId);

    if (error || !participants) {
      return { data: null, error: error ?? 'No se pudieron cargar los participantes' };
    }

    const confirmed = participants.filter(
      (p) => p.attendanceStatus === 'confirmed',
    );

    const players: Player[] = confirmed.map((p) => ({
      id: createLocalPlayerId(),
      name: getParticipantDisplayName(p),
      isFromApp: true,
      userId: p.userId,
    }));

    return { data: players, error: null };
  },
};

/**
 * Genera un identificador local único para jugadores de la sesión.
 * No requiere dependencias externas ni acceso a crypto nativo.
 */
const createLocalPlayerId = (): string =>
  `player-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

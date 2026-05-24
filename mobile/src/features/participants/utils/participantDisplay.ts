/**
 * Utilidades de presentación para participantes en la UI.
 */
import type { MeetupParticipant } from '../types';

/**
 * Resuelve el nombre visible de un participante con fallback a username.
 *
 * @param participant - Participante con perfil anidado
 * @returns Nombre legible para mostrar en listas y modales
 */
export const getParticipantDisplayName = (
  participant: MeetupParticipant,
): string =>
  participant.profile.fullName?.trim()
    ? participant.profile.fullName
    : participant.profile.username ?? 'Usuario';

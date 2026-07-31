import { meetupService, formatDateForDB, formatDateForDisplay } from '../meetupService';
import * as supabaseClient from '@/lib/supabase/client';
import * as supabaseMock from '@/lib/supabase/__mocks__/client';
import { notificationService } from '@/features/notifications/services/notificationService';

const mockedClient = supabaseClient as unknown as typeof supabaseMock;
const {
  mockSingle,
  mockMaybeSingle,
  mockDelete,
  mockRpc,
  mockThen,
  mockUpload,
  mockGetPublicUrl,
  mockRemove,
} = mockedClient;

// Activamos el mock de Supabase
jest.mock('@/lib/supabase/client');

// Mock del servicio de notificaciones
jest.mock('@/features/notifications/services/notificationService', () => ({
  notificationService: {
    sendNotification: jest.fn<Promise<{ data: unknown; error: null }>, [unknown]>(),
  },
}));

describe('meetupService', () => {
  const mockUserId = 'user-123';
  const mockMeetupId = 'meetup-abc';
  const mockDate = '28/07/2026';
  const mockDbDate = '2026-07-28';

  beforeEach(() => {
    jest.clearAllMocks();
    // Valor por defecto para mockThen para evitar fallos si no se mockea explícitamente
    mockThen.mockResolvedValue({ data: null, error: null, count: 0 });
  });

  describe('helpers de fecha', () => {
    it('formatDateForDB debe convertir DD/MM/YYYY a YYYY-MM-DD', () => {
      expect(formatDateForDB(mockDate)).toBe(mockDbDate);
    });

    it('formatDateForDisplay debe convertir YYYY-MM-DD a DD/MM/YYYY', () => {
      expect(formatDateForDisplay(mockDbDate)).toBe(mockDate);
    });
  });

  describe('createMeetup', () => {
    const mockFormData = {
      title: 'Asado del Domingo',
      description: 'Traigan para tomar',
      date: mockDate,
      time: '13:00',
      location: 'Quincho de Juan',
      estimatedCost: '5000',
    };

    it('debe crear una juntada exitosamente', async () => {
      // 1. generateJoinCode check code (not found)
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
      // 2. insert meetup
      const mockMeetup = { id: mockMeetupId, title: mockFormData.title, join_code: 'XYZ123', created_by: mockUserId };
      mockSingle.mockResolvedValueOnce({ data: mockMeetup, error: null });
      // 3. insert participant
      mockSingle.mockResolvedValueOnce({ data: {}, error: null });

      const result = await meetupService.createMeetup(mockUserId, mockFormData);

      expect(result.data).toEqual(expect.objectContaining({
        id: mockMeetupId,
        title: mockFormData.title,
      }));
      expect(result.error).toBeNull();
    });

    it('debe hacer rollback manual si falla insertar el participante organizador', async () => {
      // 1. generateJoinCode
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
      // 2. insert meetup
      const mockMeetup = { id: mockMeetupId, title: mockFormData.title };
      mockSingle.mockResolvedValueOnce({ data: mockMeetup, error: null });
      // 3. insert participant fails
      mockThen.mockResolvedValueOnce({ data: null, error: { message: 'DB Error' }, count: null });

      const result = await meetupService.createMeetup(mockUserId, mockFormData);

      expect(mockDelete).toHaveBeenCalled();
      expect(result.data).toBeNull();
      expect(result.error).toBe('Ocurrió un error inesperado — intentá de nuevo');
    });

    it('debe invitar a los miembros del grupo si se proporciona groupId', async () => {
      // 1. generateJoinCode
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
      // 2. insert meetup
      const mockMeetup = { id: mockMeetupId, title: mockFormData.title };
      mockSingle.mockResolvedValueOnce({ data: mockMeetup, error: null });
      // 3. insert participant
      mockSingle.mockResolvedValueOnce({ data: {}, error: null });

      mockRpc.mockResolvedValueOnce({
        data: [{ invited_user_id: 'invited-user-1' }],
        error: null,
      });

      await meetupService.createMeetup(mockUserId, mockFormData, 'group-xyz');

      expect(mockRpc).toHaveBeenCalledWith('invite_group_to_meetup', { p_meetup_id: mockMeetupId });
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(notificationService.sendNotification).toHaveBeenCalled();
    });
  });

  describe('getUserMeetups', () => {
    it('debe obtener las juntadas activas del usuario con conteos', async () => {
      // 1. meetup_participants select del usuario
      mockThen.mockResolvedValueOnce({
        data: [{ meetup_id: mockMeetupId, role: 'organizer', attendance_status: 'confirmed' }],
        error: null,
        count: null,
      });

      // 2. meetups select
      mockThen.mockResolvedValueOnce({
        data: [{ id: mockMeetupId, title: 'Asado', status: 'active', date: mockDbDate }],
        error: null,
        count: null,
      });

      // 3. meetup_participants select general para conteos
      mockThen.mockResolvedValueOnce({
        data: [{ meetup_id: mockMeetupId, attendance_status: 'confirmed' }],
        error: null,
        count: null,
      });

      const result = await meetupService.getUserMeetups(mockUserId);

      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].participantCount).toBe(1);
      expect(result.error).toBeNull();
    });
  });

  describe('getMeetupByCode', () => {
    it('debe retornar la juntada activa correspondiente al código', async () => {
      const mockMeetup = { id: mockMeetupId, join_code: 'CODE12' };
      mockMaybeSingle.mockResolvedValueOnce({ data: mockMeetup, error: null });

      const result = await meetupService.getMeetupByCode('CODE12');

      expect(result.data?.id).toBe(mockMeetupId);
      expect(result.error).toBeNull();
    });
  });

  describe('getMeetupById', () => {
    it('debe retornar el detalle de la juntada', async () => {
      const mockMeetup = { id: mockMeetupId };
      mockSingle.mockResolvedValueOnce({ data: mockMeetup, error: null });

      const result = await meetupService.getMeetupById(mockMeetupId);

      expect(result.data?.id).toBe(mockMeetupId);
      expect(result.error).toBeNull();
    });
  });

  describe('joinMeetup', () => {
    it('debe unir a un participante nuevo exitosamente', async () => {
      // 1. getMeetupByCode check
      const mockMeetup = { id: mockMeetupId, created_by: 'organizer-id', status: 'active' };
      mockMaybeSingle.mockResolvedValueOnce({ data: mockMeetup, error: null });
      // 2. check existing participant (no existe)
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
      // 3. insert participant
      mockThen.mockResolvedValueOnce({ data: {}, error: null, count: null });

      const result = await meetupService.joinMeetup(mockUserId, 'CODE12');

      expect(result.data?.id).toBe(mockMeetupId);
      expect(result.error).toBeNull();
    });

    it('debe reactivar una participación abandonada', async () => {
      // 1. getMeetupByCode check
      const mockMeetup = { id: mockMeetupId, created_by: 'organizer-id', status: 'active' };
      mockMaybeSingle.mockResolvedValueOnce({ data: mockMeetup, error: null });
      // 2. check existing participant (abandonó)
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'part-999', left_at: '2026-07-28' }, error: null });
      // 3. update participant
      mockThen.mockResolvedValueOnce({ data: {}, error: null, count: null });

      const result = await meetupService.joinMeetup(mockUserId, 'CODE12');

      expect(result.data?.id).toBe(mockMeetupId);
      expect(result.error).toBeNull();
    });
  });

  describe('getMeetupParticipants', () => {
    it('debe listar los participantes activos ordenados', async () => {
      const mockData = [
        {
          id: 'p1',
          meetup_id: mockMeetupId,
          user_id: 'u1',
          role: 'organizer',
          attendance_status: 'confirmed',
          profiles: { full_name: 'Ana', username: 'ana', avatar_url: null },
        },
      ];
      mockThen.mockResolvedValueOnce({ data: mockData, error: null, count: null });

      const result = await meetupService.getMeetupParticipants(mockMeetupId);

      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].profile.fullName).toBe('Ana');
    });
  });

  describe('cancelMeetup', () => {
    it('debe cancelar la juntada si el usuario es el creador', async () => {
      // 1. select meetup
      const mockMeetup = { id: mockMeetupId, created_by: mockUserId, status: 'active' };
      mockSingle.mockResolvedValueOnce({ data: mockMeetup, error: null });
      // 2. update meetup status
      mockSingle.mockResolvedValueOnce({ data: { ...mockMeetup, status: 'cancelled' }, error: null });
      // 3. rpc get participants
      mockRpc.mockResolvedValueOnce({ data: [{ user_id: 'p2' }], error: null });

      const result = await meetupService.cancelMeetup(mockMeetupId, mockUserId);

      expect(result.data?.status).toBe('cancelled');
      expect(result.error).toBeNull();
    });

    it('debe fallar si no es el creador', async () => {
      const mockMeetup = { id: mockMeetupId, created_by: 'otro-user', status: 'active' };
      mockSingle.mockResolvedValueOnce({ data: mockMeetup, error: null });

      const result = await meetupService.cancelMeetup(mockMeetupId, mockUserId);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Solo el organizador puede cancelar la juntada');
    });
  });

  describe('finishMeetup', () => {
    it('debe finalizar la juntada y enviar notificaciones', async () => {
      const mockMeetup = { id: mockMeetupId, created_by: mockUserId, status: 'active' };
      mockSingle.mockResolvedValueOnce({ data: mockMeetup, error: null });
      mockThen.mockResolvedValueOnce({ data: {}, error: null, count: null });
      mockRpc.mockResolvedValue({ data: [{ user_id: 'p2' }], error: null });

      const result = await meetupService.finishMeetup(mockMeetupId, mockUserId, true);

      expect(result.error).toBeNull();
    });
  });

  describe('editMeetup', () => {
    it('debe actualizar los datos de la juntada', async () => {
      const mockMeetup = { id: mockMeetupId, created_by: mockUserId, status: 'active' };
      mockSingle.mockResolvedValueOnce({ data: mockMeetup, error: null });
      mockSingle.mockResolvedValueOnce({ data: { ...mockMeetup, title: 'Nuevo Título' }, error: null });

      const result = await meetupService.editMeetup(mockMeetupId, mockUserId, {
        title: 'Nuevo Título',
        date: mockDate,
        time: '14:00',
        location: 'Nueva Loc',
      });

      expect(result.data?.title).toBe('Nuevo Título');
      expect(result.error).toBeNull();
    });
  });

  describe('getFinishedMeetups', () => {
    it('debe retornar el historial de juntadas', async () => {
      // 1. myParticipations
      mockThen.mockResolvedValueOnce({ data: [{ meetup_id: mockMeetupId }], error: null, count: null });
      // 2. meetupsData
      mockThen.mockResolvedValueOnce({ data: [{ id: mockMeetupId, status: 'finished' }], error: null, count: null });
      // 3. allParticipants
      mockThen.mockResolvedValueOnce({ data: [], error: null, count: null });

      const result = await meetupService.getFinishedMeetups(mockUserId);

      expect(result.data).toHaveLength(1);
      expect(result.error).toBeNull();
    });
  });

  describe('uploadMeetupCover', () => {
    beforeEach(() => {
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        })
      ) as jest.Mock;
    });

    it('debe subir la portada y actualizar la DB', async () => {
      mockUpload.mockResolvedValueOnce({ error: null });
      mockGetPublicUrl.mockReturnValueOnce({ data: { publicUrl: 'http://img.jpg' } });
      mockThen.mockResolvedValueOnce({ data: {}, error: null, count: null });

      const result = await meetupService.uploadMeetupCover(mockMeetupId, 'file://img.jpg', mockUserId);

      expect(result.data).toBe('http://img.jpg');
      expect(result.error).toBeNull();
    });
  });

  describe('removeMeetupCover', () => {
    it('debe remover el archivo y actualizar la DB a null', async () => {
      mockRemove.mockResolvedValueOnce({ data: {}, error: null });
      mockThen.mockResolvedValueOnce({ data: {}, error: null, count: null });

      const result = await meetupService.removeMeetupCover(mockMeetupId, 'path/to/img.jpg');

      expect(result.error).toBeNull();
    });
  });

  describe('getAllUserMeetups', () => {
    it('debe obtener todas las juntadas del usuario excluyendo las ocultadas', async () => {
      // 1. hiddenRows
      mockThen.mockResolvedValueOnce({ data: [{ meetup_id: 'hidden-id' }], error: null, count: null });
      // 2. myParticipations
      mockThen.mockResolvedValueOnce({ data: [{ meetup_id: mockMeetupId }], error: null, count: null });
      // 3. meetupsData
      mockThen.mockResolvedValueOnce({ data: [{ id: mockMeetupId, status: 'active' }], error: null, count: null });
      // 4. allParticipants
      mockThen.mockResolvedValueOnce({ data: [], error: null, count: null });

      const result = await meetupService.getAllUserMeetups(mockUserId);

      expect(result.data).toHaveLength(1);
      expect(result.error).toBeNull();
    });
  });

  describe('hideMeetup', () => {
    it('debe registrar el ocultamiento en meetup_hidden', async () => {
      mockThen.mockResolvedValueOnce({ data: {}, error: null, count: null });

      const result = await meetupService.hideMeetup(mockMeetupId, mockUserId);

      expect(result.error).toBeNull();
    });
  });

  describe('deleteMeetupForAll', () => {
    it('debe eliminar la juntada de forma definitiva', async () => {
      mockThen.mockResolvedValueOnce({ data: {}, error: null, count: null });

      const result = await meetupService.deleteMeetupForAll(mockMeetupId);

      expect(result.error).toBeNull();
    });
  });

  describe('reactivateMeetup', () => {
    it('debe cambiar el estado de la juntada finalizada a activa', async () => {
      mockSingle.mockResolvedValueOnce({ data: { status: 'finished' }, error: null });
      mockThen.mockResolvedValueOnce({ data: {}, error: null, count: null });

      const result = await meetupService.reactivateMeetup(mockMeetupId);

      expect(result.error).toBeNull();
    });
  });

  describe('transferOrganizer', () => {
    it('debe transferir el rol de organizador y actualizar created_by', async () => {
      // 1. read title
      mockSingle.mockResolvedValueOnce({ data: { title: 'Fiesta' }, error: null });
      // 2. demote current organizer
      mockThen.mockResolvedValueOnce({ data: {}, error: null, count: null });
      // 3. promote new organizer
      mockThen.mockResolvedValueOnce({ data: {}, error: null, count: null });
      // 4. update created_by in meetups
      mockThen.mockResolvedValueOnce({ data: {}, error: null, count: null });

      const result = await meetupService.transferOrganizer(mockMeetupId, 'new-user', mockUserId);

      expect(result.error).toBeNull();
    });
  });
});

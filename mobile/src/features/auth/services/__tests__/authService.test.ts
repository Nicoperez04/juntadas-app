import { authService } from '../authService';
import * as supabaseClient from '@/lib/supabase/client';
import * as supabaseMock from '@/lib/supabase/__mocks__/client';

const mockedClient = supabaseClient as unknown as typeof supabaseMock;
const {
  mockSignUp,
  mockSignInWithPassword,
  mockSignOut,
  mockResetPasswordForEmail,
  mockUpdateUser,
  mockGetSession,
  mockSetSession,
  mockSingle,
  mockMaybeSingle,
  mockUpload,
  mockGetPublicUrl,
  mockInvoke,
  mockEq,
  mockIs,
} = mockedClient;

// Activamos el mock automático de Jest para el cliente de Supabase
jest.mock('@/lib/supabase/client');

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    const mockRegisterData = {
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Juan Pérez',
    };

    it('debe registrar un usuario exitosamente', async () => {
      const mockUser = { id: 'user-123', email: mockRegisterData.email };
      mockSignUp.mockResolvedValueOnce({ data: { user: mockUser }, error: null });

      const result = await authService.signUp(mockRegisterData);

      expect(mockSignUp).toHaveBeenCalledWith({
        email: mockRegisterData.email,
        password: mockRegisterData.password,
        options: {
          data: {
            full_name: mockRegisterData.fullName,
          },
        },
      });
      expect(result.data).toEqual({ user: mockUser });
      expect(result.error).toBeNull();
    });

    it('debe mapear el error de usuario ya registrado', async () => {
      mockSignUp.mockResolvedValueOnce({
        data: null,
        error: { message: 'User already registered' },
      });

      const result = await authService.signUp(mockRegisterData);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Ya existe una cuenta con ese email');
    });

    it('debe manejar errores inesperados', async () => {
      mockSignUp.mockRejectedValueOnce(new Error('Network Error'));

      const result = await authService.signUp(mockRegisterData);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Error inesperado al registrarse');
    });
  });

  describe('signIn', () => {
    const mockLoginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('debe iniciar sesión exitosamente', async () => {
      const mockSession = { user: { id: 'user-123' } };
      mockSignInWithPassword.mockResolvedValueOnce({ data: mockSession, error: null });

      const result = await authService.signIn(mockLoginData);

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: mockLoginData.email,
        password: mockLoginData.password,
      });
      expect(result.data).toEqual(mockSession);
      expect(result.error).toBeNull();
    });

    it('debe mapear error de credenciales inválidas', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid login credentials' },
      });

      const result = await authService.signIn(mockLoginData);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Email o contraseña incorrectos');
    });

    it('debe manejar errores inesperados', async () => {
      mockSignInWithPassword.mockRejectedValueOnce(new Error('Network error'));

      const result = await authService.signIn(mockLoginData);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Error inesperado al iniciar sesión');
    });
  });

  describe('signOut', () => {
    it('debe cerrar sesión exitosamente', async () => {
      mockSignOut.mockResolvedValueOnce({ error: null });

      const result = await authService.signOut();

      expect(mockSignOut).toHaveBeenCalled();
      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
    });

    it('debe manejar errores al cerrar sesión', async () => {
      mockSignOut.mockResolvedValueOnce({ error: { message: 'Signout error' } });

      const result = await authService.signOut();

      expect(result.data).toBeNull();
      expect(result.error).toBe('Signout error');
    });
  });

  describe('resetPassword', () => {
    const testEmail = 'test@example.com';

    it('debe enviar email de recuperación exitosamente', async () => {
      mockResetPasswordForEmail.mockResolvedValueOnce({ error: null });

      const result = await authService.resetPassword(testEmail);

      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(testEmail, {
        redirectTo: 'rondaapp://reset-password',
      });
      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
    });

    it('debe manejar errores al enviar email', async () => {
      mockResetPasswordForEmail.mockResolvedValueOnce({ error: { message: 'Error sending' } });

      const result = await authService.resetPassword(testEmail);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Error sending');
    });
  });

  describe('updatePassword', () => {
    const newPassword = 'newPassword123';

    it('debe actualizar la contraseña exitosamente', async () => {
      mockUpdateUser.mockResolvedValueOnce({ error: null });

      const result = await authService.updatePassword(newPassword);

      expect(mockUpdateUser).toHaveBeenCalledWith({ password: newPassword });
      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
    });
  });

  describe('changePassword', () => {
    const email = 'test@example.com';
    const currentPassword = 'currentPassword123';
    const newPassword = 'newPassword123';

    it('debe cambiar la contraseña validando la actual exitosamente', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({ data: {}, error: null });
      mockUpdateUser.mockResolvedValueOnce({ error: null });

      const result = await authService.changePassword(email, currentPassword, newPassword);

      expect(mockSignInWithPassword).toHaveBeenCalledWith({ email, password: currentPassword });
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: newPassword });
      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
    });

    it('debe fallar si la contraseña actual es incorrecta', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid credentials' },
      });

      const result = await authService.changePassword(email, currentPassword, newPassword);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Contraseña actual incorrecta');
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });
  });

  describe('deleteAccount', () => {
    const userId = 'user-123';

    it('debe eliminar la cuenta exitosamente llamando a la Edge Function', async () => {
      mockGetSession.mockResolvedValueOnce({
        data: { session: { access_token: 'token-abc' } },
        error: null,
      });
      mockInvoke.mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });
      mockSignOut.mockResolvedValueOnce({ error: null });

      const result = await authService.deleteAccount(userId);

      expect(mockGetSession).toHaveBeenCalled();
      expect(mockInvoke).toHaveBeenCalledWith('delete-account', {
        headers: { Authorization: 'Bearer token-abc' },
      });
      expect(mockSignOut).toHaveBeenCalled();
      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
    });

    it('debe fallar si no hay sesión activa', async () => {
      mockGetSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      const result = await authService.deleteAccount(userId);

      expect(result.data).toBeNull();
      expect(result.error).toBe('No hay sesión activa para eliminar la cuenta');
      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it('debe fallar si la Edge Function retorna error', async () => {
      mockGetSession.mockResolvedValueOnce({
        data: { session: { access_token: 'token-abc' } },
        error: null,
      });
      mockInvoke.mockResolvedValueOnce({
        data: { success: false, error: 'DB Error' },
        error: null,
      });

      const result = await authService.deleteAccount(userId);

      expect(result.data).toBeNull();
      expect(result.error).toBe('DB Error');
    });
  });

  describe('setSessionFromRecoveryUrl', () => {
    it('debe procesar el link de recuperación y establecer la sesión', async () => {
      const url = 'rondaapp://reset-password#access_token=abc&refresh_token=xyz&type=recovery';
      mockSetSession.mockResolvedValueOnce({ error: null });

      const result = await authService.setSessionFromRecoveryUrl(url);

      expect(mockSetSession).toHaveBeenCalledWith({
        access_token: 'abc',
        refresh_token: 'xyz',
      });
      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
    });

    it('debe ignorar URLs no relacionadas a reset-password', async () => {
      const url = 'rondaapp://other-route';
      const result = await authService.setSessionFromRecoveryUrl(url);

      expect(mockSetSession).not.toHaveBeenCalled();
      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
    });

    it('debe retornar error si no tiene tokens', async () => {
      const url = 'rondaapp://reset-password';
      const result = await authService.setSessionFromRecoveryUrl(url);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Enlace de recuperación inválido');
    });
  });

  describe('getCurrentUser', () => {
    it('debe retornar el usuario actual de la sesión', async () => {
      mockGetSession.mockResolvedValueOnce({
        data: { session: { user: { id: 'user-abc', email: 'user@example.com' } } },
        error: null,
      });

      const result = await authService.getCurrentUser();

      expect(result.data).toEqual({ id: 'user-abc', email: 'user@example.com' });
      expect(result.error).toBeNull();
    });
  });

  describe('getProfile', () => {
    it('debe retornar el perfil del usuario', async () => {
      mockGetSession.mockResolvedValueOnce({
        data: { session: { user: { id: 'user-abc', email: 'user@example.com' } } },
        error: null,
      });
      mockSingle.mockResolvedValueOnce({
        data: { id: 'user-abc', full_name: 'Juan', username: 'juan1', avatar_url: null },
        error: null,
      });

      const result = await authService.getProfile('user-abc');

      expect(result.data).toEqual({
        id: 'user-abc',
        fullName: 'Juan',
        username: 'juan1',
        avatarUrl: null,
        email: 'user@example.com',
      });
      expect(result.error).toBeNull();
    });
  });

  describe('isUsernameTaken', () => {
    it('debe indicar si un username está en uso', async () => {
      mockMaybeSingle.mockResolvedValueOnce({
        data: { id: 'other-user' },
        error: null,
      });

      const result = await authService.isUsernameTaken('juan1', 'current-user');

      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
    });

    it('debe indicar si el username no está en uso', async () => {
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await authService.isUsernameTaken('juan1', 'current-user');

      expect(result.data).toBe(false);
      expect(result.error).toBeNull();
    });
  });

  describe('uploadAvatar', () => {
    beforeEach(() => {
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        })
      ) as jest.Mock;
    });

    it('debe subir el avatar exitosamente y retornar la URL pública', async () => {
      mockUpload.mockResolvedValueOnce({ error: null });
      mockGetPublicUrl.mockReturnValueOnce({ data: { publicUrl: 'https://supabase.com/avatar.jpg' } });

      const result = await authService.uploadAvatar('user-abc', 'file://local-path.jpg');

      expect(mockUpload).toHaveBeenCalled();
      expect(result.data).toContain('https://supabase.com/avatar.jpg');
      expect(result.error).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('debe actualizar el perfil exitosamente', async () => {
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
      mockSingle.mockResolvedValueOnce({
        data: { id: 'user-abc', full_name: 'Juan Pérez', username: 'juan_perez', avatar_url: null },
        error: null,
      });
      mockGetSession.mockResolvedValueOnce({
        data: { session: { user: { id: 'user-abc', email: 'user@example.com' } } },
        error: null,
      });

      const result = await authService.updateProfile('user-abc', {
        fullName: 'Juan Pérez',
        username: 'juan_perez',
      });

      expect(result.data).toEqual({
        id: 'user-abc',
        fullName: 'Juan Pérez',
        username: 'juan_perez',
        avatarUrl: null,
        email: 'user@example.com',
      });
      expect(result.error).toBeNull();
    });

    it('debe fallar si el username ya está en uso', async () => {
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'other-user' }, error: null });

      const result = await authService.updateProfile('user-abc', {
        username: 'juan_perez',
      });

      expect(result.data).toBeNull();
      expect(result.error).toBe('Ese nombre de usuario ya está en uso');
    });
  });

  describe('getUserStats', () => {
    it('debe retornar estadísticas de participación correctamente', async () => {
      type MockStatsResult = jest.Mock<Promise<{ count: number | null; error: { message: string } | null }>>;
      (mockEq as unknown as MockStatsResult).mockResolvedValueOnce({ count: 3, error: null });
      (mockIs as unknown as MockStatsResult).mockResolvedValueOnce({ count: 5, error: null });

      const result = await authService.getUserStats('user-abc');

      expect(result.data).toEqual({
        organizedCount: 3,
        participantCount: 5,
      });
      expect(result.error).toBeNull();
    });

    it('debe manejar errores al obtener estadísticas', async () => {
      type MockStatsResult = jest.Mock<Promise<{ count: number | null; error: { message: string } | null }>>;
      (mockEq as unknown as MockStatsResult).mockResolvedValueOnce({ count: null, error: { message: 'DB error' } });

      const result = await authService.getUserStats('user-abc');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Error al cargar las estadísticas');
    });
  });
});

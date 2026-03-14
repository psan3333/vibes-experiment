import { api, LoginInput, RegisterInput } from '@/lib/api';

global.fetch = jest.fn();

describe('ApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockReset();
  });

  const createMockResponse = (data: unknown, options: { ok: boolean; status?: number } = { ok: true, status: 200 }) => ({
    ok: options.ok,
    status: options.status || 200,
    headers: {
      get: (name: string) => {
        if (name === 'content-length') return String(JSON.stringify(data).length);
        if (name === 'content-type') return 'application/json';
        return null;
      },
    },
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
  });

  describe('login', () => {
    it('should call login endpoint with correct data', async () => {
      const mockData = { user: { id: 1, email: 'test@test.com' }, token: 'token123' };
      (fetch as jest.Mock).mockResolvedValue(createMockResponse(mockData));

      const input: LoginInput = { email: 'test@test.com', password: 'password' };
      const result = await api.login(input);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(input),
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should throw error on failed login', async () => {
      (fetch as jest.Mock).mockResolvedValue(
        createMockResponse({ error: 'Invalid credentials' }, { ok: false, status: 401 })
      );

      await expect(api.login({ email: 'test@test.com', password: 'wrong' })).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should call register endpoint', async () => {
      const mockData = { user: { id: 1, email: 'new@test.com' }, token: 'newtoken' };
      (fetch as jest.Mock).mockResolvedValue(createMockResponse(mockData));

      const input: RegisterInput = {
        email: 'new@test.com',
        username: 'newuser',
        password: 'password',
        first_name: 'Test',
        last_name: 'User',
        age: 25,
        is_organizer: false,
      };
      const result = await api.register(input);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/register'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getProfile', () => {
    it('should fetch user profile', async () => {
      const mockUser = { id: 1, email: 'test@test.com', username: 'testuser' };
      (fetch as jest.Mock).mockResolvedValue(createMockResponse(mockUser));

      const result = await api.getProfile();
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/profile'), expect.any(Object));
      expect(result).toEqual(mockUser);
    });
  });

  describe('setToken', () => {
    it('should set token for subsequent requests', async () => {
      const mockUser = { id: 1 };
      (fetch as jest.Mock).mockResolvedValue(createMockResponse(mockUser));

      api.setToken('test-token');
      await api.getProfile();

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should not set Authorization when token is null', async () => {
      const mockUser = { id: 1 };
      (fetch as jest.Mock).mockResolvedValue(createMockResponse(mockUser));

      api.setToken(null);
      await api.getProfile();

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({ Authorization: expect.any(String) }),
        })
      );
    });
  });

  describe('getEvents', () => {
    it('should fetch events with pagination', async () => {
      const mockEvents: Array<{ id: number; title: string }> = [{ id: 1, title: 'Event 1' }];
      (fetch as jest.Mock).mockResolvedValue(createMockResponse(mockEvents));

      const result = await api.getEvents(10, 5);
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('limit=10'), expect.any(Object));
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('offset=5'), expect.any(Object));
      expect(result).toEqual(mockEvents);
    });
  });

  describe('searchEvents', () => {
    it('should encode search query', async () => {
      const mockEvents: Array<{ id: number; title: string }> = [];
      (fetch as jest.Mock).mockResolvedValue(createMockResponse(mockEvents));

      await api.searchEvents('test query');
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('q=test%20query'), expect.any(Object));
    });
  });

  describe('empty response handling', () => {
    it('should handle 204 No Content response', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 204,
        headers: { get: () => '0' },
        text: jest.fn().mockResolvedValue(''),
      });

      const result = await api.deleteEvent(1);
      expect(result).toBeNull();
    });
  });
});

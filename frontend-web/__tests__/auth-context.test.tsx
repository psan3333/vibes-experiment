/**
 * Test file for AuthContext
 */

import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';

// Mock the API functions
jest.mock('@/lib/api', () => ({
  api: {
    login: jest.fn(),
    register: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    updateAvatar: jest.fn(),
    searchUsers: jest.fn(),
    getFriendSuggestions: jest.fn(),
    sendFriendRequest: jest.fn(),
    acceptFriendRequest: jest.fn(),
    rejectFriendRequest: jest.fn(),
    getFriends: jest.fn(),
    removeFriend: jest.fn(),
    getEvents: jest.fn(),
    getEvent: jest.fn(),
    createEvent: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn(),
    searchEvents: jest.fn(),
    getNearbyEvents: jest.fn(),
    getMyEvents: jest.fn(),
    attendEvent: jest.fn(),
    unattendEvent: jest.fn(),
    getAttendees: jest.fn(),
    getEventGroup: jest.fn(),
    getGroupMessages: jest.fn(),
    sendMessage: jest.fn(),
    getMyConversations: jest.fn(),
    setToken: jest.fn(),
  }
}));

describe('AuthContext', () => {
  const createWrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with null user and token', () => {
    render(<></>, { wrapper: createWrapper });
    // The context is used via useAuth hook, so we need to create a component that uses it
    const TestComponent = () => {
      const { user, token } = useAuth();
      return (
        <div data-testid="auth-values">
          <span data-testid="user">{user ?? 'null'}</span>
          <span data-testid="token">{token ?? 'null'}</span>
        </div>
      );
    };

    render(<TestComponent />, { wrapper: createWrapper });
    
    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(screen.getByTestId('token')).toHaveTextContent('null');
  });

  it('should handle login', async () => {
    const mockUser = { id: 1, email: 'test@example.com', username: 'testuser' };
    const mockToken = 'fake-jwt-token';
    (api.login as jest.Mock).mockResolvedValue({ user: mockUser, token: mockToken });

    const TestComponent = () => {
      const { login, user, token, isLoading } = useAuth();
      const handleLogin = async () => {
        await login('test@example.com', 'password123');
      };
      
      return (
        <div>
          <button onClick={handleLogin} data-testid="login-button" disabled={isLoading}>
            Login
          </button>
          <div data-testid="auth-values">
            <span data-testid="user">{user?.email ?? 'null'}</span>
            <span data-testid="token">{token ?? 'null'}</span>
          </div>
        </div>
      );
    };

    render(<TestComponent />, { wrapper: createWrapper });
    
    expect(screen.getByTestId('login-button')).toBeEnabled();
    await act(async () => {
      await userEvent.click(screen.getByTestId('login-button'));
    });
    
    // Wait for login to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    expect(api.login).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
    expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    expect(screen.getByTestId('token')).toHaveTextContent('fake-jwt-token');
  });

  it('should handle logout', async () => {
    // First login
    const mockUser = { id: 1, email: 'test@example.com', username: 'testuser' };
    const mockToken = 'fake-jwt-token';
    (api.login as jest.Mock).mockResolvedValue({ user: mockUser, token: mockToken });

    const TestComponent = () => {
      const { login, logout, user, isLoading } = useAuth();
      const handleLogin = async () => {
        await login('test@example.com', 'password123');
      };
      const handleLogout = async () => {
        logout();
      };
      
      return (
        <div>
          <button onClick={handleLogin} data-testid="login-button" disabled={isLoading}>
            Login
          </button>
          <button onClick={handleLogout} data-testid="logout-button" disabled={isLoading}>
            Logout
          </button>
          <div data-testid="auth-values">
            <span data-testid="user">{user?.email ?? 'null'}</span>
          </div>
        </div>
      );
    };

    render(<TestComponent />, { wrapper: createWrapper });
    
    // Login first
    await act(async () => {
      await userEvent.click(screen.getByTestId('login-button'));
    });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    
    // Then logout
    await act(async () => {
      await userEvent.click(screen.getByTestId('logout-button'));
    });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    expect(screen.getByTestId('user')).toHaveTextContent('null');
  });
});
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from '../api/client';

interface AuthContextType {
  user: api.User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: api.RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: api.UpdateProfileInput) => Promise<void>;
  updateAvatar: (url: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<api.User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      if (storedToken) {
        api.api.setToken(storedToken);
        setToken(storedToken);
        const userData = await api.api.getProfile();
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to load auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.api.login({ email, password });
    await AsyncStorage.setItem('auth_token', response.token);
    api.api.setToken(response.token);
    setToken(response.token);
    setUser(response.user);
  };

  const register = async (data: api.RegisterInput) => {
    const response = await api.api.register(data);
    await AsyncStorage.setItem('auth_token', response.token);
    api.api.setToken(response.token);
    setToken(response.token);
    setUser(response.user);
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Failed to remove token from storage:', error);
    }
    api.api.setToken(null);
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data: api.UpdateProfileInput) => {
    const updatedUser = await api.api.updateProfile(data);
    setUser(updatedUser);
  };

  const updateAvatar = async (url: string) => {
    const updatedUser = await api.api.updateAvatar(url);
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        updateAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

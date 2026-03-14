jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { ThemeProvider, useTheme } from '../../src/context/ThemeContext';

describe('ThemeContext Logic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should provide default light theme', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    await waitFor(() => {
      expect(result.current.theme).toBe('light');
    });
  });

  test('should toggle theme from light to dark', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    await waitFor(() => {
      expect(result.current.theme).toBe('light');
    });

    await act(async () => {
      result.current.toggleTheme();
    });

    await waitFor(() => {
      expect(result.current.theme).toBe('dark');
    });
  });

  test('should have correct light colors', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    await waitFor(() => {
      expect(result.current.colors.background).toBe('#f5f5f5');
      expect(result.current.colors.card).toBe('#ffffff');
      expect(result.current.colors.text).toBe('#1a1a1a');
      expect(result.current.colors.primary).toBe('#3b82f6');
    });
  });

  test('should throw error when useTheme is used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useTheme());
    }).toThrow('useTheme must be used within a ThemeProvider');
    
    consoleError.mockRestore();
  });

  test('should have all required color properties', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    await waitFor(() => {
      expect(result.current.colors).toHaveProperty('background');
      expect(result.current.colors).toHaveProperty('card');
      expect(result.current.colors).toHaveProperty('text');
      expect(result.current.colors).toHaveProperty('primary');
      expect(result.current.colors).toHaveProperty('secondary');
      expect(result.current.colors).toHaveProperty('border');
      expect(result.current.colors).toHaveProperty('success');
      expect(result.current.colors).toHaveProperty('error');
      expect(result.current.colors).toHaveProperty('warning');
    });
  });

  test('should have warning color defined', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    await waitFor(() => {
      expect(result.current.colors.warning).toBeDefined();
    });
  });

  test('should have secondary color defined', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    await waitFor(() => {
      expect(result.current.colors.secondary).toBeDefined();
    });
  });

  test('should have success color defined', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    await waitFor(() => {
      expect(result.current.colors.success).toBe('#10b981');
    });
  });

  test('should have error color defined', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    await waitFor(() => {
      expect(result.current.colors.error).toBe('#ef4444');
    });
  });

  test('should provide toggleTheme function', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    await waitFor(() => {
      expect(result.current.toggleTheme).toBeDefined();
      expect(typeof result.current.toggleTheme).toBe('function');
    });
  });
});

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: {
    background: string;
    card: string;
    text: string;
    primary: string;
    secondary: string;
    border: string;
    success: string;
    error: string;
    warning: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const lightColors = {
  background: '#f5f5f5',
  card: '#ffffff',
  text: '#1a1a1a',
  primary: '#3b82f6',
  secondary: '#6366f1',
  border: '#e5e7eb',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
};

const darkColors = {
  background: '#1a1a1a',
  card: '#2d2d2d',
  text: '#f5f5f5',
  primary: '#3b82f6',
  secondary: '#6366f1',
  border: '#404040',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await SecureStore.getItemAsync('theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.warn('Failed to load theme from storage:', error);
    }
  };

  const toggleTheme = async () => {
    setTheme((currentTheme) => {
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      SecureStore.setItemAsync('theme', newTheme).catch((error: Error) => {
        console.warn('Failed to save theme to storage:', error);
      });
      return newTheme;
    });
  };

  const colors = theme === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { AIProviderConfig, TimePeriod, TIME_PERIODS } from '../ai/providers';
import { Todo } from '../db/schema';

const AI_CONFIG_KEY = 'ai_provider_config';
const AI_PERIOD_KEY = 'ai_analysis_period';

interface NetworkState {
  isConnected: boolean | null;
}

interface AIContextType {
  isOnline: boolean;
  isLoading: boolean;
  providerConfig: AIProviderConfig | null;
  selectedPeriod: TimePeriod;
  setProviderConfig: (config: AIProviderConfig | null) => Promise<void>;
  setSelectedPeriod: (period: TimePeriod) => Promise<void>;
  clearProviderConfig: () => Promise<void>;
  getFilteredTodos: (todos: Todo[]) => Todo[];
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export function AIProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [providerConfig, setProviderConfigState] = useState<AIProviderConfig | null>(null);
  const [selectedPeriod, setSelectedPeriodState] = useState<TimePeriod>('month');

  useEffect(() => {
    loadConfig();
    checkNetwork();
  }, []);

  const checkNetwork = async () => {
    try {
      const response = await fetch('https://www.google.com', { method: 'HEAD' });
      setIsOnline(response.ok);
    } catch {
      setIsOnline(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConfig = async () => {
    try {
      const savedConfig = await SecureStore.getItemAsync(AI_CONFIG_KEY);
      if (savedConfig) {
        setProviderConfigState(JSON.parse(savedConfig));
      }
      
      const savedPeriod = await SecureStore.getItemAsync(AI_PERIOD_KEY);
      if (savedPeriod && TIME_PERIODS.find(p => p.value === savedPeriod)) {
        setSelectedPeriodState(savedPeriod as TimePeriod);
      }
    } catch (error) {
      console.error('Failed to load AI config:', error);
    }
  };

  const setProviderConfig = async (config: AIProviderConfig | null) => {
    try {
      if (config) {
        await SecureStore.setItemAsync(AI_CONFIG_KEY, JSON.stringify(config));
      } else {
        await SecureStore.deleteItemAsync(AI_CONFIG_KEY);
      }
      setProviderConfigState(config);
    } catch (error) {
      console.error('Failed to save AI config:', error);
    }
  };

  const setSelectedPeriod = async (period: TimePeriod) => {
    try {
      await SecureStore.setItemAsync(AI_PERIOD_KEY, period);
      setSelectedPeriodState(period);
    } catch (error) {
      console.error('Failed to save AI period:', error);
    }
  };

  const clearProviderConfig = async () => {
    try {
      await SecureStore.deleteItemAsync(AI_CONFIG_KEY);
      setProviderConfigState(null);
    } catch (error) {
      console.error('Failed to clear AI config:', error);
    }
  };

  const getFilteredTodos = (todos: Todo[]): Todo[] => {
    if (selectedPeriod === 'all') {
      return todos;
    }

    const periodInfo = TIME_PERIODS.find(p => p.value === selectedPeriod);
    if (!periodInfo || periodInfo.days === 0) {
      return todos;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodInfo.days);

    return todos.filter(todo => {
      const createdAt = new Date(todo.createdAt);
      return createdAt >= cutoffDate;
    });
  };

  return (
    <AIContext.Provider
      value={{
        isOnline,
        isLoading,
        providerConfig,
        selectedPeriod,
        setProviderConfig,
        setSelectedPeriod,
        clearProviderConfig,
        getFilteredTodos,
      }}
    >
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
}

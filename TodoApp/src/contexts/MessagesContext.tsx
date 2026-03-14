import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import * as api from '../api/client';

interface MessagesContextType {
  conversations: api.EventGroup[];
  currentMessages: api.Message[];
  isLoading: boolean;
  loadConversations: () => Promise<void>;
  loadMessages: (groupId: number) => Promise<void>;
  sendMessage: (groupId: number, content: string) => Promise<void>;
  getEventGroup: (eventId: number) => Promise<api.EventGroup>;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export function MessagesProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<api.EventGroup[]>([]);
  const [currentMessages, setCurrentMessages] = useState<api.Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      const data = await api.api.getMyConversations();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }, []);

  const loadMessages = useCallback(async (groupId: number) => {
    setIsLoading(true);
    try {
      const data = await api.api.getGroupMessages(groupId);
      setCurrentMessages(data.reverse());
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (groupId: number, content: string) => {
    const message = await api.api.sendMessage(groupId, content);
    setCurrentMessages((prev) => [...prev, message]);
  }, []);

  const getEventGroup = useCallback(async (eventId: number) => {
    return api.api.getEventGroup(eventId);
  }, []);

  return (
    <MessagesContext.Provider
      value={{
        conversations,
        currentMessages,
        isLoading,
        loadConversations,
        loadMessages,
        sendMessage,
        getEventGroup,
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
}

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import * as api from '../api/client';

interface FriendsContextType {
  friends: api.User[];
  suggestions: api.User[];
  isLoading: boolean;
  loadFriends: () => Promise<void>;
  loadSuggestions: () => Promise<void>;
  sendFriendRequest: (userId: number) => Promise<void>;
  acceptFriendRequest: (requestId: number) => Promise<void>;
  rejectFriendRequest: (requestId: number) => Promise<void>;
  removeFriend: (friendId: number) => Promise<void>;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

export function FriendsProvider({ children }: { children: ReactNode }) {
  const [friends, setFriends] = useState<api.User[]>([]);
  const [suggestions, setSuggestions] = useState<api.User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadFriends = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.api.getFriends();
      setFriends(data);
    } catch (error) {
      console.error('Failed to load friends:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadSuggestions = useCallback(async () => {
    try {
      const data = await api.api.getFriendSuggestions();
      setSuggestions(data);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  }, []);

  const sendFriendRequest = useCallback(async (userId: number) => {
    await api.api.sendFriendRequest(userId);
    setSuggestions((prev) => prev.filter((u) => u.id !== userId));
  }, []);

  const acceptFriendRequest = useCallback(async (requestId: number) => {
    await api.api.acceptFriendRequest(requestId);
    await loadFriends();
    await loadSuggestions();
  }, [loadFriends, loadSuggestions]);

  const rejectFriendRequest = useCallback(async (requestId: number) => {
    await api.api.rejectFriendRequest(requestId);
  }, []);

  const removeFriend = useCallback(async (friendId: number) => {
    await api.api.removeFriend(friendId);
    setFriends((prev) => prev.filter((u) => u.id !== friendId));
  }, []);

  return (
    <FriendsContext.Provider
      value={{
        friends,
        suggestions,
        isLoading,
        loadFriends,
        loadSuggestions,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        removeFriend,
      }}
    >
      {children}
    </FriendsContext.Provider>
  );
}

export function useFriends() {
  const context = useContext(FriendsContext);
  if (!context) {
    throw new Error('useFriends must be used within a FriendsProvider');
  }
  return context;
}

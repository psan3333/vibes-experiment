'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { api } from '@/lib/api';

interface EventsContextType {
  events: any[];
  isLoading: boolean;
  loadEvents: () => Promise<void>;
  searchEvents: (query: string) => Promise<void>;
  getNearbyEvents: (lat: number, lng: number) => Promise<void>;
  createEvent: (data: any) => Promise<void>;
  attendEvent: (eventId: string) => Promise<void>;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const response = await api.getEvents(20, 0); // Get first 20 events
      setEvents(response);
    } catch (error) {
      console.error('Failed to load events:', error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const searchEvents = async (query: string) => {
    setIsLoading(true);
    try {
      const response = await api.searchEvents(query);
      setEvents(response);
    } catch (error) {
      console.error('Failed to search events:', error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getNearbyEvents = async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const response = await api.getNearbyEvents(lat, lng);
      setEvents(response);
    } catch (error) {
      console.error('Failed to get nearby events:', error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createEvent = async (data: any) => {
    setIsLoading(true);
    try {
      await api.createEvent(data);
      await loadEvents();
    } finally {
      setIsLoading(false);
    }
  };

  const attendEvent = async (eventId: string) => {
    const numericId = parseInt(eventId, 10);
    if (isNaN(numericId)) {
      throw new Error(`Invalid event ID: ${eventId}`);
    }
    setIsLoading(true);
    try {
      await api.attendEvent(numericId);
      await loadEvents();
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    events,
    isLoading,
    loadEvents,
    searchEvents,
    getNearbyEvents,
    createEvent,
    attendEvent,
  };

  return (
    <EventsContext.Provider value={value}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
}
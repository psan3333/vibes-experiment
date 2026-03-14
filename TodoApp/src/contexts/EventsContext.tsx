import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import * as api from '../api/client';

interface EventsContextType {
  events: api.Event[];
  myEvents: api.Event[];
  attendingEvents: api.Event[];
  isLoading: boolean;
  loadEvents: () => Promise<void>;
  loadMyEvents: () => Promise<void>;
  loadAttendingEvents: () => Promise<void>;
  searchEvents: (query: string) => Promise<void>;
  getNearbyEvents: (lat: number, lng: number, radius?: number) => Promise<void>;
  createEvent: (data: api.CreateEventInput) => Promise<api.Event>;
  updateEvent: (id: number, data: api.UpdateEventInput) => Promise<void>;
  deleteEvent: (id: number) => Promise<void>;
  attendEvent: (id: number) => Promise<void>;
  unattendEvent: (id: number) => Promise<void>;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<api.Event[]>([]);
  const [myEvents, setMyEvents] = useState<api.Event[]>([]);
  const [attendingEvents, setAttendingEvents] = useState<api.Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.api.getEvents();
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMyEvents = useCallback(async () => {
    try {
      const data = await api.api.getMyEvents();
      setMyEvents(data);
    } catch (error) {
      console.error('Failed to load my events:', error);
    }
  }, []);

  const loadAttendingEvents = useCallback(async () => {
    try {
      const data = await api.api.getMyAttendingEvents();
      setAttendingEvents(data);
    } catch (error) {
      console.error('Failed to load attending events:', error);
    }
  }, []);

  const searchEvents = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const data = await api.api.searchEvents(query);
      setEvents(data);
    } catch (error) {
      console.error('Failed to search events:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getNearbyEvents = useCallback(async (lat: number, lng: number, radius = 10) => {
    setIsLoading(true);
    try {
      const data = await api.api.getNearbyEvents(lat, lng, radius);
      setEvents(data);
    } catch (error) {
      console.error('Failed to load nearby events:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createEvent = useCallback(async (data: api.CreateEventInput) => {
    const event = await api.api.createEvent(data);
    setEvents((prev) => [event, ...prev]);
    return event;
  }, []);

  const updateEvent = useCallback(async (id: number, data: api.UpdateEventInput) => {
    const updated = await api.api.updateEvent(id, data);
    setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
  }, []);

  const deleteEvent = useCallback(async (id: number) => {
    await api.api.deleteEvent(id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const attendEvent = useCallback(async (id: number) => {
    await api.api.attendEvent(id);
    const event = await api.api.getEvent(id);
    setAttendingEvents((prev) => [...prev, event]);
  }, []);

  const unattendEvent = useCallback(async (id: number) => {
    await api.api.unattendEvent(id);
    setAttendingEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return (
    <EventsContext.Provider
      value={{
        events,
        myEvents,
        attendingEvents,
        isLoading,
        loadEvents,
        loadMyEvents,
        loadAttendingEvents,
        searchEvents,
        getNearbyEvents,
        createEvent,
        updateEvent,
        deleteEvent,
        attendEvent,
        unattendEvent,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
}

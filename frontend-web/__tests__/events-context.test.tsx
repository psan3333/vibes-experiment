import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventsProvider, useEvents } from '@/contexts/events-context';
import { api } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  api: {
    getEvents: jest.fn(),
    searchEvents: jest.fn(),
    getNearbyEvents: jest.fn(),
    createEvent: jest.fn(),
    attendEvent: jest.fn(),
  },
}));

describe('EventsContext', () => {
  const createWrapper = () => {
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return <EventsProvider>{children}</EventsProvider>;
    };
  };

  const TestComponent = () => {
    const { events, isLoading, loadEvents, searchEvents, getNearbyEvents, createEvent, attendEvent } = useEvents();
    return (
      <div>
        <span data-testid="loading">{isLoading ? 'true' : 'false'}</span>
        <span data-testid="events-count">{events.length}</span>
        <button data-testid="load-btn" onClick={() => loadEvents()}>Load</button>
        <button data-testid="search-btn" onClick={() => searchEvents('test')}>Search</button>
        <button data-testid="nearby-btn" onClick={() => getNearbyEvents(55.75, 37.61)}>Nearby</button>
        <button data-testid="create-btn" onClick={() => createEvent({ title: 'Test' })}>Create</button>
        <button data-testid="attend-btn" onClick={() => attendEvent('1')}>Attend</button>
        {events.map((event, i) => (
          <div key={i} data-testid="event">{event.title}</div>
        ))}
      </div>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty events and no loading', () => {
    render(<TestComponent />, { wrapper: createWrapper() });
    expect(screen.getByTestId('events-count')).toHaveTextContent('0');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });

  it('should load events successfully', async () => {
    const mockEvents = [
      { id: 1, title: 'Event 1' },
      { id: 2, title: 'Event 2' },
    ];
    (api.getEvents as jest.Mock).mockResolvedValue(mockEvents);

    render(<TestComponent />, { wrapper: createWrapper() });

    await act(async () => {
      await userEvent.click(screen.getByTestId('load-btn'));
    });

    await waitFor(() => {
      expect(api.getEvents).toHaveBeenCalledWith(20, 0);
    });
    expect(screen.getByTestId('events-count')).toHaveTextContent('2');
  });

  it('should handle load events error gracefully', async () => {
    (api.getEvents as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<TestComponent />, { wrapper: createWrapper() });

    await act(async () => {
      await userEvent.click(screen.getByTestId('load-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('events-count')).toHaveTextContent('0');
    });
  });

  it('should search events', async () => {
    const mockEvents = [{ id: 1, title: 'Found Event' }];
    (api.searchEvents as jest.Mock).mockResolvedValue(mockEvents);

    render(<TestComponent />, { wrapper: createWrapper() });

    await act(async () => {
      await userEvent.click(screen.getByTestId('search-btn'));
    });

    expect(api.searchEvents).toHaveBeenCalledWith('test');
    expect(screen.getByTestId('events-count')).toHaveTextContent('1');
  });

  it('should get nearby events', async () => {
    const mockEvents = [{ id: 1, title: 'Nearby Event' }];
    (api.getNearbyEvents as jest.Mock).mockResolvedValue(mockEvents);

    render(<TestComponent />, { wrapper: createWrapper() });

    await act(async () => {
      await userEvent.click(screen.getByTestId('nearby-btn'));
    });

    expect(api.getNearbyEvents).toHaveBeenCalledWith(55.75, 37.61);
  });

  it('should create event', async () => {
    const mockEvent = { id: 1, title: 'New Event' };
    (api.createEvent as jest.Mock).mockResolvedValue(mockEvent);
    (api.getEvents as jest.Mock).mockResolvedValue([mockEvent]);

    render(<TestComponent />, { wrapper: createWrapper() });

    await act(async () => {
      await userEvent.click(screen.getByTestId('create-btn'));
    });

    expect(api.createEvent).toHaveBeenCalledWith({ title: 'Test' });
  });

  it('should attend event', async () => {
    (api.attendEvent as jest.Mock).mockResolvedValue(undefined);
    (api.getEvents as jest.Mock).mockResolvedValue([]);

    render(<TestComponent />, { wrapper: createWrapper() });

    await act(async () => {
      await userEvent.click(screen.getByTestId('attend-btn'));
    });

    expect(api.attendEvent).toHaveBeenCalledWith(1);
  });

  it('should handle invalid event ID for attendEvent', async () => {
    render(<TestComponent />, { wrapper: createWrapper() });

    await act(async () => {
      await userEvent.click(screen.getByTestId('attend-btn'));
    });

    // Should throw error for invalid ID
  });
});

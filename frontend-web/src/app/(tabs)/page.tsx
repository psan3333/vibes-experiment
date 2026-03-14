import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useEvents } from '@/contexts/events-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

export default function MapScreen() {
  const { user } = useAuth();
  const {
    events,
    loadEvents,
    searchEvents,
    getNearbyEvents,
    createEvent,
    attendEvent,
  } = useEvents();

  const [region, setRegion] = useState({
    latitude: 55.7558,
    longitude: 37.6173,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_date: '',
    address: '',
    is_free: true,
    price: '',
    category: '',
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      await searchEvents(searchQuery);
    }
  };

  const handleMapSearch = async () => {
    if (region.latitude && region.longitude) {
      await getNearbyEvents(region.latitude, region.longitude);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.event_date) {
      alert('Please fill in required fields');
      return;
    }

    try {
      await createEvent({
        title: newEvent.title,
        description: newEvent.description,
        event_date: newEvent.event_date,
        latitude: region.latitude,
        longitude: region.longitude,
        address: newEvent.address,
        is_free: newEvent.is_free,
        price: newEvent.price ? parseFloat(newEvent.price) : 0,
        category: newEvent.category,
      });
      setShowCreateModal(false);
      setNewEvent({
        title: '',
        description: '',
        event_date: '',
        address: '',
        is_free: true,
        price: '',
        category: '',
      });
      alert('Event created successfully');
    } catch (error) {
      alert('Failed to create event');
    }
  };

  const handleAttendEvent = async (eventId: string) => {
    try {
      await attendEvent(eventId);
      alert('You are now attending this event');
    } catch (error) {
      alert('Failed to attend event');
    }
  };

  // Removed unused renderEventCard function - using inline cards now

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 min-h-screen pb-20">
      <div className="p-4">
        {/* Search Bar */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 flex rounded-xl border border-gray-300 dark:border-gray-600 overflow-hidden">
            <input
              className="flex-1 p-3 text-base border-none focus:outline-none bg-white dark:bg-gray-800"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
              className="px-4 bg-blue-500 text-white font-medium"
              onClick={handleSearch}
            >
              Search
            </button>
          </div>
          {user?.is_organizer && (
            <button 
              className="w-12 flex items-center justify-center rounded-xl bg-blue-500 text-white text-xl font-bold"
              onClick={() => setShowCreateModal(true)}
              title="Create Event"
            >
              +
            </button>
          )}
        </div>

        {/* Map Placeholder */}
        <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-64 flex flex-col items-center justify-center mb-4">
          <span className="text-4xl mb-2">🗺️</span>
          <h2 className="text-lg font-semibold">Map View</h2>
          <p className="text-sm opacity-70">
            {events.length} events in view
          </p>
          <div className="flex gap-2 mt-3">
            <button 
              className="px-3 py-1 rounded bg-white dark:bg-gray-600 text-sm shadow"
              onClick={() => setRegion({...region, latitude: region.latitude + 0.01})}
            >
              ↑
            </button>
          </div>
          <div className="flex gap-2 mt-1">
            <button 
              className="px-3 py-1 rounded bg-white dark:bg-gray-600 text-sm shadow"
              onClick={() => setRegion({...region, longitude: region.longitude - 0.01})}
            >
              ←
            </button>
            <button 
              className="px-3 py-1 rounded bg-white dark:bg-gray-600 text-sm shadow"
              onClick={() => setRegion({...region, longitude: region.longitude + 0.01})}
            >
              →
            </button>
          </div>
          <div className="flex gap-2 mt-1">
            <button 
              className="px-3 py-1 rounded bg-white dark:bg-gray-600 text-sm shadow"
              onClick={() => setRegion({...region, latitude: region.latitude - 0.01})}
            >
              ↓
            </button>
          </div>
        </div>

        {/* Nearby Events */}
        <div>
          <h3 className="text-base font-semibold mb-3">
            Nearby Events ({events.length})
          </h3>
          {events.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No events found. Try adjusting your search or create one!
            </p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4">
              {events.slice(0, 10).map((event: any) => (
                <div 
                  key={event.id}
                  className="flex-shrink-0 w-48 p-4 rounded-xl border bg-white dark:bg-gray-800 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowEventModal(true);
                  }}
                >
                  <h4 className="font-semibold text-base mb-1 truncate">{event.title}</h4>
                  <p className="text-sm opacity-70">
                    {new Date(event.event_date).toLocaleDateString()}
                  </p>
                  <p className="text-xs opacity-50 mt-1 truncate">
                    {event.address || 'Address not specified'}
                  </p>
                  <div className="mt-2">
                    <span className={`text-sm font-semibold ${event.is_free ? 'text-green-500' : 'text-blue-500'}`}>
                      {event.is_free ? 'FREE' : `${event.price}₽`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Event Details Modal */}
        <Modal 
          show={showEventModal} 
          onClose={() => setShowEventModal(false)}
          title={selectedEvent?.title || 'Event Details'}
        >
          {selectedEvent && (
            <div className="space-y-4">
              <p className="text-base">{selectedEvent.description || 'No description'}</p>
              <p className="text-sm">
                📅 {new Date(selectedEvent.event_date).toLocaleString()}
              </p>
              <p className="text-sm">
                📍 {selectedEvent.address || 'Address not specified'}
              </p>
              <p className="text-sm">
                💰 {selectedEvent.is_free ? 'FREE' : `${selectedEvent.price}₽`}
              </p>
              {selectedEvent.category && (
                <p className="text-sm">
                  🏷️ {selectedEvent.category}
                </p>
              )}
              <Button 
                variant="primary"
                onClick={() => handleAttendEvent(selectedEvent.id)}
                className="w-full"
              >
                Attend Event
              </Button>
            </div>
          )}
        </Modal>

        {/* Create Event Modal */}
        <Modal 
          show={showCreateModal} 
          onClose={() => setShowCreateModal(false)}
          title="Create Event"
        >
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <Input
              label="Title *"
              value={newEvent.title}
              onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
              required
            />
            <Input
              label="Description"
              multiline
              minRows={3}
              value={newEvent.description}
              onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
            />
            <Input
              label="Date (ISO 8601) *"
              type="datetime-local"
              value={newEvent.event_date}
              onChange={(e) => setNewEvent({...newEvent, event_date: e.target.value})}
              required
            />
            <Input
              label="Address"
              value={newEvent.address}
              onChange={(e) => setNewEvent({...newEvent, address: e.target.value})}
            />
            <Input
              label="Category"
              value={newEvent.category}
              onChange={(e) => setNewEvent({...newEvent, category: e.target.value})}
            />
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={newEvent.is_free}
                onChange={(e) => setNewEvent({...newEvent, is_free: e.target.checked})}
                className="h-4 w-4"
              />
              <label className="text-sm cursor-pointer">Free Event</label>
            </div>
            
            {!newEvent.is_free && (
              <Input
                label="Price (₽)"
                type="number"
                min={0}
                value={newEvent.price}
                onChange={(e) => setNewEvent({...newEvent, price: e.target.value})}
              />
            )}
            
            <Button 
              variant="primary"
              type="submit"
              className="w-full"
            >
              Create Event
            </Button>
          </form>
        </Modal>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Event, api, CreateEventInput } from '@/lib/api';
import { YandexMap } from '@/components/YandexMap';

interface NewEvent {
  title: string;
  description: string;
  event_date: string;
  address: string;
  is_free: boolean;
  price: string;
  category: string;
}

const CATEGORIES = [
  { id: 'music', label: 'Music', emoji: '🎵', color: 'bg-purple-100 text-purple-700' },
  { id: 'sports', label: 'Sports', emoji: '⚽', color: 'bg-green-100 text-green-700' },
  { id: 'food', label: 'Food', emoji: '🍕', color: 'bg-orange-100 text-orange-700' },
  { id: 'tech', label: 'Tech', emoji: '💻', color: 'bg-blue-100 text-blue-700' },
  { id: 'art', label: 'Art', emoji: '🎨', color: 'bg-pink-100 text-pink-700' },
  { id: 'social', label: 'Social', emoji: '👥', color: 'bg-yellow-100 text-yellow-700' },
];

export default function DiscoverPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [region, setRegion] = useState({
    latitude: 55.7558,
    longitude: 37.6173,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [newEvent, setNewEvent] = useState<NewEvent>({
    title: '',
    description: '',
    event_date: '',
    address: '',
    is_free: true,
    price: '',
    category: '',
  });

  // Query for search suggestions (debounced)
  const { data: searchSuggestions = [] } = useQuery({
    queryKey: ['search-suggestions', searchQuery],
    queryFn: () => {
      if (searchQuery.trim().length >= 2) {
        return api.searchEvents(searchQuery, 5);
      }
      return Promise.resolve([]);
    },
    enabled: searchQuery.trim().length >= 2,
  });

  // Query for events on the map (based on map search or nearby events)
  const { data: mapEvents = [] } = useQuery({
    queryKey: ['map-events', region, mapSearchQuery],
    queryFn: () => {
      if (mapSearchQuery.trim()) {
        return api.searchEvents(mapSearchQuery, 50);
      }
      return api.getNearbyEvents(region.latitude, region.longitude, 50);
    },
  });

  // Query to check if user is attending selected event
  const { data: eventAttendees = [] } = useQuery({
    queryKey: ['event-attendees', selectedEvent?.id],
    queryFn: () => api.getAttendees(selectedEvent?.id || 0),
    enabled: !!selectedEvent && !!user,
  });

  const isUserAttending = eventAttendees.some((attendee) => attendee.id === user?.id);

  // Main events query (for list view)
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', searchQuery, selectedCategory],
    queryFn: () => {
      if (searchQuery.trim()) {
        return api.searchEvents(searchQuery);
      }
      return api.getEvents(20, 0);
    },
  });

  const filteredEvents = selectedCategory
    ? events.filter(e => e.category?.toLowerCase() === selectedCategory)
    : events;

  const createEventMutation = useMutation({
    mutationFn: (data: CreateEventInput) => api.createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
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
    },
  });

  const attendEventMutation = useMutation({
    mutationFn: (eventId: number) => api.attendEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const cancelAttendanceMutation = useMutation({
    mutationFn: (eventId: number) => api.cancelAttendance(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowLeaveConfirm(false);
      setShowEventModal(false);
    },
  });

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.event_date) return;

    try {
      await createEventMutation.mutateAsync({
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
    } catch {
      // Error handled in mutation
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 md:p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Discover Events
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Find and join amazing events near you
          </p>
        </header>

        <div className="relative mb-5">
          <input
            className="input-field pl-12"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
            xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          
          {/* Search Suggestions */}
          {searchSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-border">
              {searchSuggestions.map((event) => (
                <div
                  key={event.id}
                  className="px-4 py-2 hover:bg-muted cursor-pointer"
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowEventModal(true);
                    setSearchQuery('');
                  }}
                >
                  <div className="font-medium">{event.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(event.event_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Yandex Map */}
        <div className="mb-6 h-64 rounded-xl overflow-hidden border border-border">
          <YandexMap
            center={[region.latitude, region.longitude]}
            zoom={12}
            markers={mapEvents.map((event) => ({
              id: event.id,
              coordinates: [event.latitude, event.longitude],
              title: event.title,
              onClick: () => {
                setSelectedEvent(event);
                setShowEventModal(true);
              },
            }))}
            onMapClick={(coords) => {
              setRegion({ latitude: coords[0], longitude: coords[1] });
            }}
          />
        </div>

        {/* Map Search */}
        <div className="mb-6 relative">
          <input
            className="input-field pl-12"
            placeholder="Search on map..."
            value={mapSearchQuery}
            onChange={(e) => setMapSearchQuery(e.target.value)}
          />
          <svg 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
            xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>

        <div className="mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">Categories</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === null
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Moscow Area</h3>
              <p className="text-xs text-muted-foreground">{filteredEvents.length} events available</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setRegion({...region, latitude: region.latitude + 0.01})}
              className="flex-1 py-2 bg-white/80 rounded-lg text-xs font-medium text-muted-foreground hover:bg-white transition-colors"
            >
              North
            </button>
            <button
              onClick={() => setRegion({...region, latitude: region.latitude - 0.01})}
              className="flex-1 py-2 bg-white/80 rounded-lg text-xs font-medium text-muted-foreground hover:bg-white transition-colors"
            >
              South
            </button>
            <button
              onClick={() => setRegion({...region, longitude: region.longitude - 0.01})}
              className="flex-1 py-2 bg-white/80 rounded-lg text-xs font-medium text-muted-foreground hover:bg-white transition-colors"
            >
              West
            </button>
            <button
              onClick={() => setRegion({...region, longitude: region.longitude + 0.01})}
              className="flex-1 py-2 bg-white/80 rounded-lg text-xs font-medium text-muted-foreground hover:bg-white transition-colors"
            >
              East
            </button>
          </div>
        </div>

        {user?.is_organizer && (
          <Button
            variant="primary"
            className="w-full mb-6"
            onClick={() => setShowCreateModal(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Create New Event
          </Button>
        )}

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {selectedCategory 
              ? CATEGORIES.find(c => c.id === selectedCategory)?.label + ' Events'
              : 'Nearby Events'}
          </h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <span className="text-2xl">🎉</span>
              </div>
              <p className="text-muted-foreground">No events found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="card p-4 cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5"
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowEventModal(true);
                  }}
                >
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">
                        {CATEGORIES.find(c => c.id === event.category?.toLowerCase())?.emoji || '🎉'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{event.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.event_date).toLocaleDateString('en-US', { 
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span className="text-xs text-muted-foreground truncate">
                          {event.address || 'Location TBD'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`badge ${event.is_free ? 'badge-free' : 'badge-paid'}`}>
                        {event.is_free ? 'FREE' : `${event.price}₽`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        show={showEventModal}
        onClose={() => setShowEventModal(false)}
        title={selectedEvent?.title || 'Event Details'}
        size="lg"
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div className="w-full h-32 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <span className="text-4xl">
                {CATEGORIES.find(c => c.id === selectedEvent.category?.toLowerCase())?.emoji || '🎉'}
              </span>
            </div>
            
            <p className="text-muted-foreground">
              {selectedEvent.description || 'No description provided'}
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <span className="text-foreground">
                  {new Date(selectedEvent.event_date).toLocaleString('en-US', { 
                    weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                  })}
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <span className="text-foreground">
                  {selectedEvent.address || 'Location TBD'}
                </span>
              </div>

              {selectedEvent.category && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <span>{CATEGORIES.find(c => c.id === selectedEvent.category?.toLowerCase())?.emoji}</span>
                  </div>
                  <span className="text-foreground capitalize">{selectedEvent.category}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Event Price</span>
                <span className={`text-lg font-bold ${selectedEvent.is_free ? 'text-green-600' : 'text-foreground'}`}>
                  {selectedEvent.is_free ? 'Free' : `${selectedEvent.price}₽`}
                </span>
              </div>
              
              {user ? (
                isUserAttending ? (
                  <Button
                    variant="danger"
                    className="w-full"
                    onClick={() => setShowLeaveConfirm(true)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Leave Event
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => {
                      attendEventMutation.mutate(selectedEvent.id);
                      setShowEventModal(false);
                    }}
                    loading={attendEventMutation.isPending}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Attend Event
                  </Button>
                )
              ) : (
                <Link href="/login">
                  <Button variant="primary" className="w-full">
                    Sign in to Attend
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Event"
        size="lg"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <Input
            label="Event Title *"
            placeholder="Give your event a catchy name"
            value={newEvent.title}
            onChangeText={(v) => setNewEvent({...newEvent, title: v})}
            required
          />
          
          <Input
            label="Description"
            multiline
            minRows={3}
            placeholder="What's this event about?"
            value={newEvent.description}
            onChangeText={(v) => setNewEvent({...newEvent, description: v})}
          />
          
          <Input
            label="Date & Time *"
            type="datetime-local"
            value={newEvent.event_date}
            onChangeText={(v) => setNewEvent({...newEvent, event_date: v})}
            required
          />
          
          <Input
            label="Location / Address"
            placeholder="Where will this take place?"
            value={newEvent.address}
            onChangeText={(v) => setNewEvent({...newEvent, address: v})}
          />

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setNewEvent({...newEvent, category: cat.id})}
                  className={`p-2 rounded-lg text-xs font-medium transition-all ${
                    newEvent.category === cat.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <span className="block text-lg mb-0.5">{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted">
            <input
              type="checkbox"
              checked={newEvent.is_free}
              onChange={(e) => setNewEvent({...newEvent, is_free: e.target.checked})}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label className="text-sm cursor-pointer">This is a free event</label>
          </div>

          {!newEvent.is_free && (
            <Input
              label="Price (₽)"
              type="number"
              min={0}
              placeholder="0"
              value={newEvent.price}
              onChangeText={(v) => setNewEvent({...newEvent, price: v})}
            />
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={createEventMutation.isPending}
          >
            Create Event
          </Button>
        </form>
      </Modal>

      <Modal
        show={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        title="Leave Event"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Are you sure you want to leave this event? You will need to request to join again.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowLeaveConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => {
                if (selectedEvent) {
                  cancelAttendanceMutation.mutate(selectedEvent.id);
                }
              }}
              loading={cancelAttendanceMutation.isPending}
            >
              Leave Event
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

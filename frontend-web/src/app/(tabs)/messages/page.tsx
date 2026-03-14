'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useEvents } from '@/contexts/events-context';
import { Button, Input } from '@/components/ui';

export default function MessagesScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const { 
    events: userEvents, 
    isLoading: eventsLoading,
    loadEvents: loadUserEvents
  } = useEvents();

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [groupMessages, setGroupMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadUserEvents();
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [groupMessages]);

  const loadMessagesForEvent = async (eventId: string) => {
    setSelectedEventId(eventId);
    setIsLoadingMessages(true);
    try {
      // First get the event group (we need to adjust this based on actual backend)
      // For now, we'll simulate by using the event ID as group ID
      const response = await fetch(`/api/messages/group/${eventId}?limit=50`);
      if (!response.ok) {
        throw new Error('Failed to load messages');
      }
      const messages = await response.json();
      setGroupMessages(messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setGroupMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const sendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEventId || !newMessage.trim()) {
      alert('Please select an event and enter a message');
      return;
    }

    try {
      // Send message to the event group
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          group_id: selectedEventId,
          content: newMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setNewMessage('');
      // Reload messages
      await loadMessagesForEvent(selectedEventId);
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    }
  };

  if (authLoading || eventsLoading) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <div className="flex-1 flex items-center justify-center">Please log in to view messages</div>;
  }

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>
        
        <div className="space-y-4">
          <h2 className="text-xl font-bold mb-4">Your Events</h2>
          {userEvents.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">You're not attending any events yet</p>
          ) : (
            <div className="grid gap-2">
              {userEvents.map((event: any) => (
                <button
                  key={event.id}
                  onClick={() => loadMessagesForEvent(event.id)}
                  className={`w-full text-left p-3 rounded-lg border 
                    ${selectedEventId === event.id ? 'bg-blue-50 bg-blue-100 dark:bg-blue-900 dark:bg-blue-800' : 
                            'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'}
                `}
                disabled={isLoadingMessages}
              >
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold">{event.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(event.event_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${event.is_free ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {event.is_free ? 'FREE' : `${event.price}₽`}
                  </span>
                </div>
              </button>
              ))}
            </div>
          )}

        </div>

        {selectedEventId && (
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-4">Event Messages</h2>
            {isLoadingMessages ? (
              <div className="flex h-32 items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {groupMessages.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No messages yet. Be the first to start the conversation!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {groupMessages.map((message: any, index: number) => (
                      <div key={message.id} className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'} max-w-[80%] `}>
                        <div className={`rounded-lg p-3 max-w-xs 
                          ${message.sender_id === user.id ? 'bg-blue-500 text-white ms-auto' : 'bg-gray-200 dark:bg-gray-700'}`}>
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <form onSubmit={sendMessage} className="mt-4 flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:outline-none"
                disabled={isLoadingMessages}
              />
              <button 
                type="submit"
                disabled={isLoadingMessages || !newMessage.trim()}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
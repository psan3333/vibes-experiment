'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Event, Message, api } from '@/lib/api';

export default function MessagesScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: userEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['userEvents', user?.id],
    queryFn: () => api.getUserEvents(),
    enabled: !!user,
  });

  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [groupMessages, setGroupMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [groupMessages]);

  const loadMessagesForEvent = async (eventId: number) => {
    setSelectedEventId(eventId);
    setIsLoadingMessages(true);
    try {
      const messages = await api.getGroupMessages(eventId, 50, 0);
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
    if (!selectedEventId || !newMessage.trim()) return;

    setSending(true);
    try {
      await api.sendMessage(selectedEventId, newMessage);
      setNewMessage('');
      await loadMessagesForEvent(selectedEventId);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  if (authLoading || eventsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Sign in to view messages</h2>
          <p className="text-muted-foreground mb-6">Chat with other event attendees</p>
          <Link href="/login">
            <Button variant="primary">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-5 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <p className="text-sm text-muted-foreground">Chat with other attendees</p>
      </header>

      {userEvents.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <span className="text-3xl">💬</span>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">No conversations yet</h2>
          <p className="text-muted-foreground text-sm text-center mb-6">
            Join an event to start chatting with other attendees
          </p>
          <Link href="/discover">
            <Button variant="secondary">Discover Events</Button>
          </Link>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row">
          <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-border p-4 overflow-y-auto">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">Your Events</h2>
            <div className="space-y-2">
              {userEvents.map((event: Event) => (
                <button
                  key={event.id}
                  onClick={() => loadMessagesForEvent(event.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    selectedEventId === event.id 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'hover:bg-muted border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">🎉</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm truncate">{event.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.event_date).toLocaleDateString('en-US', { 
                          month: 'short', day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            {selectedEventId ? (
              <>
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : groupMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
                        <span className="text-2xl">💭</span>
                      </div>
                      <p className="text-muted-foreground">No messages yet</p>
                      <p className="text-sm text-muted-foreground">Be the first to start the conversation!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {groupMessages.map((message: Message) => (
                        <div 
                          key={message.id} 
                          className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[75%] ${
                            message.sender_id === user.id 
                              ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md' 
                              : 'bg-muted text-foreground rounded-2xl rounded-bl-md'
                          } px-4 py-2.5`}>
                            {message.sender_id !== user.id && (
                              <p className="text-xs font-medium opacity-70 mb-1">
                                {message.sender?.first_name || 'Someone'}
                              </p>
                            )}
                            <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                            <p className={`text-xs mt-1.5 ${
                              message.sender_id === user.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}>
                              {new Date(message.created_at).toLocaleTimeString('en-US', { 
                                hour: '2-digit', minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                <form onSubmit={sendMessage} className="p-4 border-t border-border bg-card">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="input-field flex-1"
                      disabled={sending}
                    />
                    <Button 
                      type="submit"
                      variant="primary"
                      disabled={sending || !newMessage.trim()}
                      className="px-4"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <p className="text-muted-foreground text-center">Select an event to view messages</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

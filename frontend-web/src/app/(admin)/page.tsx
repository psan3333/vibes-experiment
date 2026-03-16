'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Event, api } from '@/lib/api';

export default function AdminPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);

  // Query for organized events
  const { data: organizedEvents = [], isLoading } = useQuery({
    queryKey: ['organized-events', user?.id],
    queryFn: () => api.getOrganizedEvents(),
    enabled: !!user?.is_organizer,
  });

  // Query for pending attendees for selected event
  const { data: pendingAttendees = [] } = useQuery({
    queryKey: ['pending-attendees', selectedEvent?.id],
    queryFn: () => api.getPendingAttendees(selectedEvent?.id || 0),
    enabled: !!selectedEvent,
  });

  // Mutation to accept attendee
  const acceptAttendeeMutation = useMutation({
    mutationFn: ({ eventId, attendeeId }: { eventId: number; attendeeId: number }) =>
      api.acceptAttendee(eventId, attendeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-attendees'] });
    },
  });

  // Mutation to reject attendee
  const rejectAttendeeMutation = useMutation({
    mutationFn: ({ eventId, attendeeId }: { eventId: number; attendeeId: number }) =>
      api.rejectAttendee(eventId, attendeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-attendees'] });
    },
  });

  const handleAcceptAttendee = (attendeeId: number) => {
    if (selectedEvent) {
      acceptAttendeeMutation.mutate({ eventId: selectedEvent.id, attendeeId });
    }
  };

  const handleRejectAttendee = (attendeeId: number) => {
    if (selectedEvent) {
      rejectAttendeeMutation.mutate({ eventId: selectedEvent.id, attendeeId });
    }
  };

  if (!user?.is_organizer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You need to be an event organizer to access the admin panel.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-5">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Event Organizer Panel
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your events and attendees
          </p>
        </header>

        <div className="space-y-6">
          {/* Organized Events */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Your Events ({organizedEvents.length})
            </h2>
            {organizedEvents.length === 0 ? (
              <div className="text-center py-8 bg-muted rounded-lg">
                <p className="text-muted-foreground">
                  You haven't organized any events yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {organizedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="card p-4 cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowAttendeesModal(true);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-foreground">{event.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(event.event_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                          setShowAttendeesModal(true);
                        }}
                      >
                        Manage
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attendees Modal */}
      <Modal
        show={showAttendeesModal}
        onClose={() => setShowAttendeesModal(false)}
        title={`${selectedEvent?.title} - Pending Applications`}
        size="lg"
      >
        <div className="space-y-4">
          {pendingAttendees.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No pending applications for this event.
            </p>
          ) : (
            pendingAttendees.map((attendee) => (
              <div
                key={attendee.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div>
                  <p className="font-medium">{attendee.user?.first_name} {attendee.user?.last_name}</p>
                  <p className="text-sm text-muted-foreground">@{attendee.user?.username}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectAttendee(attendee.id)}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleAcceptAttendee(attendee.id)}
                  >
                    Accept
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    const contentLength = response.headers.get('content-length');
    const contentType = response.headers.get('content-type');

    if (response.status === 204 || contentLength === '0' || !contentType?.includes('application/json')) {
      return null as T;
    }

    return response.json();
  }

  async register(data: RegisterInput): Promise<AuthResponse> {
    return this.request<AuthResponse>('/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginInput): Promise<AuthResponse> {
    return this.request<AuthResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProfile(): Promise<User> {
    return this.request<User>('/profile');
  }

  async updateProfile(data: UpdateProfileInput): Promise<User> {
    return this.request<User>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateAvatar(avatarUrl: string): Promise<User> {
    return this.request<User>('/profile/avatar', {
      method: 'PUT',
      body: JSON.stringify({ avatar_url: avatarUrl }),
    });
  }

  async searchUsers(query: string): Promise<User[]> {
    return this.request<User[]>(`/users/search?q=${encodeURIComponent(query)}`);
  }

  async getFriendSuggestions(limit = 10): Promise<User[]> {
    return this.request<User[]>(`/users/suggestions?limit=${limit}`);
  }

  async sendFriendRequest(receiverId: number): Promise<void> {
    return this.request<void>('/friends/request', {
      method: 'POST',
      body: JSON.stringify({ receiver_id: receiverId }),
    });
  }

  async acceptFriendRequest(requestId: number): Promise<void> {
    return this.request<void>(`/friends/request/${requestId}/accept`, {
      method: 'PUT',
    });
  }

  async rejectFriendRequest(requestId: number): Promise<void> {
    return this.request<void>(`/friends/request/${requestId}/reject`, {
      method: 'PUT',
    });
  }

  async getFriends(): Promise<User[]> {
    return this.request<User[]>('/friends');
  }

  async removeFriend(friendId: number): Promise<void> {
    return this.request<void>(`/friends/${friendId}`, {
      method: 'DELETE',
    });
  }

  async getEvents(limit = 20, offset = 0): Promise<Event[]> {
    return this.request<Event[]>(`/events?limit=${limit}&offset=${offset}`);
  }

  async getEvent(id: number): Promise<Event> {
    return this.request<Event>(`/events/${id}`);
  }

  async createEvent(data: CreateEventInput): Promise<Event> {
    return this.request<Event>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEvent(id: number, data: UpdateEventInput): Promise<Event> {
    return this.request<Event>(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEvent(id: number): Promise<void> {
    return this.request<void>(`/events/${id}`, {
      method: 'DELETE',
    });
  }

  async searchEvents(query: string, limit = 20): Promise<Event[]> {
    return this.request<Event[]>(`/events/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  }

  async getNearbyEvents(lat: number, lng: number, radius = 10): Promise<Event[]> {
    return this.request<Event[]>(`/events/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  }

  async getMyEvents(): Promise<Event[]> {
    return this.request<Event[]>('/events/user'); // Assuming we have this endpoint in event-service
  }

  async getUserEvents(): Promise<Event[]> {
    return this.getMyEvents();
  }

  async getOrganizedEvents(limit = 20, offset = 0): Promise<Event[]> {
    return this.request<Event[]>(`/events/organized?limit=${limit}&offset=${offset}`);
  }

  async getPendingAttendees(eventId: number): Promise<any[]> {
    return this.request<any[]>(`/events/${eventId}/pending`);
  }

  async acceptAttendee(eventId: number, attendeeId: number): Promise<void> {
    return this.request<void>(`/events/${eventId}/attendees/${attendeeId}/accept`, {
      method: 'PUT',
    });
  }

  async rejectAttendee(eventId: number, attendeeId: number): Promise<void> {
    return this.request<void>(`/events/${eventId}/attendees/${attendeeId}/reject`, {
      method: 'PUT',
    });
  }

  async cancelAttendance(eventId: number): Promise<void> {
    return this.request<void>(`/events/${eventId}/cancel`, {
      method: 'DELETE',
    });
  }

  async attendEvent(eventId: number): Promise<void> {
    return this.request<void>(`/events/${eventId}/register`, {
      method: 'POST',
    });
  }

  async unattendEvent(eventId: number): Promise<void> {
    return this.request<void>(`/events/${eventId}/unregister`, {
      method: 'DELETE',
    });
  }

  async getAttendees(eventId: number): Promise<User[]> {
    return this.request<User[]>(`/events/${eventId}/attendees`);
  }

  async getEventGroup(): Promise<EventGroup> {
    throw new Error('getEventGroup is not yet implemented - awaiting backend endpoint');
  }

  async getGroupMessages(groupId: number, limit = 50, offset = 0): Promise<Message[]> {
    return this.request<Message[]>(`/messages/group/${groupId}?limit=${limit}&offset=${offset}`);
  }

  async sendMessage(groupId: number, content: string): Promise<Message> {
    return this.request<Message>('/messages', {
      method: 'POST',
      body: JSON.stringify({ group_id: groupId, content }),
    });
  }

  async getMyConversations(): Promise<EventGroup[]> {
    throw new Error('getMyConversations is not yet implemented - awaiting backend endpoint');
  }
}

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  age: number;
  is_organizer: boolean;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  bio: string;
  avatar_url: string;
  age: number;
  is_organizer: boolean;
  created_at?: string;
}

export interface UpdateProfileInput {
  first_name?: string;
  last_name?: string;
  bio?: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  event_date: string;
  latitude: number;
  longitude: number;
  address: string;
  is_free: boolean;
  price: number;
  organizer_id: number;
  organizer?: User;
  category: string;
  max_attendees: number;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  event_date: string;
  latitude: number;
  longitude: number;
  address?: string;
  is_free: boolean;
  price?: number;
  category?: string;
  max_attendees?: number;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  event_date?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  is_free?: boolean;
  price?: number;
  category?: string;
  max_attendees?: number;
}

export interface EventGroup {
  id: number;
  event_id: number;
  event?: Event;
}

export interface Message {
  id: number;
  sender_id: number;
  group_id: number;
  content: string;
  sender?: User;
  created_at: string;
}

export const api = new ApiClient();
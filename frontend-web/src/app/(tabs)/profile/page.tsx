'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { User, Event, api } from '@/lib/api';

export default function ProfileScreen() {
  const { user, isLoading: authLoading, logout, updateProfile, updateAvatar } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: userEvents = [] } = useQuery({
    queryKey: ['userEvents', user?.id],
    queryFn: () => api.getUserEvents(),
    enabled: !!user,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<User | null>(user ? { ...user } : null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditedUser({ ...user });
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedUser || !editedUser.first_name || !editedUser.last_name) return;

    try {
      await updateProfile({
        first_name: editedUser.first_name,
        last_name: editedUser.last_name,
        bio: editedUser.bio || '',
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        updateAvatar(reader.result as string).then(() => {
          setEditedUser((prev) => prev ? { ...prev, avatar_url: reader.result as string } : null);
        });
      };
      reader.readAsDataURL(file);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !editedUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Sign in to view your profile</h2>
          <p className="text-muted-foreground mb-6">Connect with others and manage your events</p>
          <Link href="/login">
            <Button variant="primary">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-5">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        </header>

        <div className="card p-6 mb-6">
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
                {avatarPreview || user.avatar_url ? (
                  <Image 
                    src={avatarPreview || user.avatar_url} 
                    alt="Avatar" 
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-avatar.png';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">
                    {user.first_name?.[0]}{user.last_name?.[0]}
                  </div>
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 hover:bg-[#FF5252] transition-colors shadow-lg"
                title="Change avatar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
              </button>
              <input 
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            
            <h2 className="text-xl font-bold text-foreground">
              {user.first_name} {user.last_name}
            </h2>
            <p className="text-muted-foreground">@{user.username}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`badge ${user.is_organizer ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                {user.is_organizer ? '🎯 Organizer' : '👤 Attendee'}
              </span>
              <span className="badge bg-muted text-muted-foreground">
                {user.age} years old
              </span>
            </div>
          </div>
        </div>

        {!isEditing && user.bio && (
          <div className="card p-4 mb-6">
            <h3 className="font-semibold text-foreground mb-2">About</h3>
            <p className="text-muted-foreground text-sm">{user.bio}</p>
          </div>
        )}

        <div className="card p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-foreground">Account Settings</h3>
            {!isEditing && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )}
          </div>
          
          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  value={editedUser.first_name || ''}
                  onChangeText={(text) => setEditedUser((prev) => prev ? { ...prev, first_name: text } : null)}
                  required
                />
                <Input
                  label="Last Name"
                  value={editedUser.last_name || ''}
                  onChangeText={(text) => setEditedUser((prev) => prev ? { ...prev, last_name: text } : null)}
                  required
                />
              </div>
              <Input
                label="Bio"
                multiline
                minRows={2}
                value={editedUser.bio || ''}
                onChangeText={(text) => setEditedUser((prev) => prev ? { ...prev, bio: text } : null)}
                placeholder="Tell others about yourself..."
              />
              
              <div className="flex gap-2 pt-2">
                <Button variant="primary" type="submit" className="flex-1">
                  Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedUser({ ...user });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm text-foreground">{user.email}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-muted-foreground">Member since</span>
                <span className="text-sm text-foreground">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { 
                    month: 'long', year: 'numeric' 
                  }) : 'N/A'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="card p-4 mb-6">
          <h3 className="font-semibold text-foreground mb-4">
            Your Events ({userEvents.length})
          </h3>
          {userEvents.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
              <p className="text-muted-foreground text-sm">
                You&apos;re not attending any events yet
              </p>
              <Link href="/discover">
                <Button variant="secondary" size="sm" className="mt-3">
                  Discover Events
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {userEvents.slice(0, 3).map((event: Event) => (
                <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🎉</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground text-sm truncate">{event.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.event_date).toLocaleDateString('en-US', { 
                        month: 'short', day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <span className={`badge ${event.is_free ? 'badge-free' : 'badge-paid'}`}>
                    {event.is_free ? 'Free' : `${event.price}₽`}
                  </span>
                </div>
              ))}
              {userEvents.length > 3 && (
                <p className="text-center text-sm text-muted-foreground pt-2">
                  +{userEvents.length - 3} more events
                </p>
              )}
            </div>
          )}
        </div>

        <Button 
          variant="outline" 
          onClick={() => setShowLogoutModal(true)}
          className="w-full text-destructive border-destructive/20 hover:bg-destructive/10 hover:border-destructive"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Log Out
        </Button>
      </div>

      <Modal
        show={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Log Out"
        size="sm"
      >
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </div>
          <p className="text-muted-foreground mb-6">Are you sure you want to log out?</p>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowLogoutModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleLogout}
              className="flex-1"
            >
              Log Out
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

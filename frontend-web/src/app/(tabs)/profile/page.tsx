'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useEvents } from '@/contexts/events-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

export default function ProfileScreen() {
  const { user, login, register, isLoading: authLoading, logout, updateProfile, updateAvatar } = useAuth();
  const { 
    events: userEvents,
    isLoading: eventsLoading,
    loadEvents: loadUserEvents
  } = useEvents();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<any>(user ? { ...user } : null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setEditedUser({ ...user });
      loadUserEvents();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Logout failed');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedUser || !editedUser.first_name || !editedUser.last_name) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await updateProfile({
        first_name: editedUser.first_name,
        last_name: editedUser.last_name,
        bio: editedUser.bio || '',
      });
      setIsEditing(false);
      alert('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        updateAvatar(reader.result as string).then(() => {
          setEditedUser((prev: any) => prev ? { ...prev, avatar_url: reader.result as string } : null);
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (authLoading || eventsLoading) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  }

  if (!user || !editedUser) {
    return <div className="flex-1 flex items-center justify-center">Please log in to view profile</div>;
  }

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 min-h-screen pb-20">
      <div className="p-6">
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <img 
              src={avatarPreview || user.avatar_url || '/placeholder-avatar.png'} 
              alt="Avatar" 
              className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-avatar.png';
              }}
            />
            <button 
              onClick={triggerFileInput}
              className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 text-xs hover:bg-blue-600 transition-colors"
              title="Change avatar"
            >
              📷
            </button>
            <input 
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          
          <div className="text-center">
            <h2 className="text-xl font-bold">{`${user.first_name} ${user.last_name}`}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {user.age} years old • {user.is_organizer ? '🎯 Organizer' : '👤 Attendee'}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Account Information */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold mb-3">Account Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Email:</span>
                <span className="text-sm text-gray-600 dark:text-gray-300">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Member since:</span>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Edit Profile */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Profile Settings</h3>
              {!isEditing && (
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(true)}
                  className="text-sm py-1"
                >
                  Edit
                </Button>
              )}
            </div>
            
            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <Input
                  label="First Name *"
                  value={editedUser.first_name || ''}
                  onChangeText={(text) => setEditedUser((prev: any) => prev ? { ...prev, first_name: text } : null)}
                  required
                />
                <Input
                  label="Last Name *"
                  value={editedUser.last_name || ''}
                  onChangeText={(text) => setEditedUser((prev: any) => prev ? { ...prev, last_name: text } : null)}
                  required
                />
                <Input
                  label="Bio"
                  multiline
                  minRows={3}
                  value={editedUser.bio || ''}
                  onChangeText={(text) => setEditedUser((prev: any) => prev ? { ...prev, bio: text } : null)}
                />
                
                <div className="flex gap-2 pt-2">
                  <Button variant="primary" type="submit" className="flex-1">
                    Save
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
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">First Name</span>
                  <span className="text-sm">{user.first_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Last Name</span>
                  <span className="text-sm">{user.last_name}</span>
                </div>
                {user.bio && (
                  <div className="pt-2 border-t">
                    <span className="text-sm text-gray-500 block mb-1">Bio</span>
                    <p className="text-sm">{user.bio}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Your Events */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold mb-3">Your Events</h3>
            {userEvents.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-6">
                You're not attending any events yet.
              </p>
            ) : (
              <div className="space-y-3">
                {userEvents.map((event: any) => (
                  <div key={event.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold">{event.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(event.event_date).toLocaleDateString()}
                        </p>
                        {event.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${event.is_free ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {event.is_free ? 'FREE' : `${event.price}₽`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Logout Button */}
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="w-full text-red-500 border-red-200 hover:bg-red-50"
          >
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}

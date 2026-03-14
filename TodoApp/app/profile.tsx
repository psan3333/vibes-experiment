import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { useFriends } from '../src/contexts/FriendsContext';
import { useEvents } from '../src/contexts/EventsContext';

export function ProfileScreen() {
  const { colors } = useTheme();
  const { user, logout, updateProfile, updateAvatar } = useAuth();
  const { friends, suggestions, loadFriends, loadSuggestions, sendFriendRequest, removeFriend } = useFriends();
  const { myEvents, attendingEvents, loadMyEvents, loadAttendingEvents } = useEvents();

  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    bio: '',
  });

  useEffect(() => {
    if (user) {
      loadFriends();
      loadSuggestions();
      loadMyEvents();
      loadAttendingEvents();
      setEditForm({
        first_name: user.first_name,
        last_name: user.last_name,
        bio: user.bio,
      });
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user) {
      await Promise.all([loadFriends(), loadSuggestions(), loadMyEvents(), loadAttendingEvents()]);
    }
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      await updateAvatar(result.assets[0].uri);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile(editForm);
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleAddFriend = async (userId: number) => {
    try {
      await sendFriendRequest(userId);
      Alert.alert('Success', 'Friend request sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send friend request');
    }
  };

  const handleRemoveFriend = async (friendId: number) => {
    Alert.alert(
      'Remove Friend',
      'Are you sure you want to remove this friend?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeFriend(friendId) },
      ]
    );
  };

  if (!user) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg mb-5" style={{ color: colors.text }}>
            Please log in to view your profile
          </Text>
          <Pressable
            className="px-8 py-3 rounded-xl"
            style={{ backgroundColor: colors.primary }}
            onPress={() => router.push('/login')}
          >
            <Text className="text-white font-semibold">Login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        contentContainerClassName="pb-24"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="items-center pt-12 pb-5">
          <Pressable onPress={handlePickImage}>
            <View 
              className="w-24 h-24 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary }}
            >
              {user.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} className="w-24 h-24 rounded-full" />
              ) : (
                <Text className="text-white text-4xl font-semibold">
                  {user.first_name?.charAt(0) || 'U'}
                </Text>
              )}
            </View>
            <Text className="text-center mt-2 text-sm" style={{ color: colors.primary }}>
              Change Photo
            </Text>
          </Pressable>

          {isEditing ? (
            <View className="w-4/5 mt-4 gap-2">
              <TextInput
                className="p-3 rounded-lg text-base border"
                style={{ backgroundColor: colors.card, color: colors.text, borderColor: colors.border }}
                placeholder="First Name"
                placeholderTextColor={colors.text}
                value={editForm.first_name}
                onChangeText={(text) => setEditForm({ ...editForm, first_name: text })}
              />
              <TextInput
                className="p-3 rounded-lg text-base border"
                style={{ backgroundColor: colors.card, color: colors.text, borderColor: colors.border }}
                placeholder="Last Name"
                placeholderTextColor={colors.text}
                value={editForm.last_name}
                onChangeText={(text) => setEditForm({ ...editForm, last_name: text })}
              />
              <TextInput
                className="p-3 rounded-lg text-base border h-20 text-top"
                style={{ backgroundColor: colors.card, color: colors.text, borderColor: colors.border }}
                placeholder="Bio"
                placeholderTextColor={colors.text}
                value={editForm.bio}
                onChangeText={(text) => setEditForm({ ...editForm, bio: text })}
                multiline
              />
              <View className="flex-row gap-2 mt-2">
                <Pressable
                  className="flex-1 py-3 rounded-lg items-center"
                  style={{ backgroundColor: colors.primary }}
                  onPress={handleSaveProfile}
                >
                  <Text className="text-white font-semibold">Save</Text>
                </Pressable>
                <Pressable
                  className="flex-1 py-3 rounded-lg items-center border"
                  style={{ borderColor: colors.border }}
                  onPress={() => setIsEditing(false)}
                >
                  <Text className="font-semibold" style={{ color: colors.text }}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View className="items-center mt-4">
              <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                {user.first_name} {user.last_name}
              </Text>
              <Text className="text-sm opacity-70 mt-1" style={{ color: colors.text }}>@{user.username}</Text>
              {user.bio ? (
                <Text className="text-sm mt-3 text-center px-8 opacity-80" style={{ color: colors.text }}>{user.bio}</Text>
              ) : null}
              <Text className="text-sm mt-2 opacity-70" style={{ color: colors.text }}>Age: {user.age}</Text>
              <Pressable
                className="mt-4 px-5 py-2 rounded-full border"
                style={{ borderColor: colors.primary }}
                onPress={() => setIsEditing(true)}
              >
                <Text className="font-semibold" style={{ color: colors.primary }}>Edit Profile</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View className="flex-row justify-around mx-5 p-4 rounded-xl" style={{ backgroundColor: colors.card }}>
          <View className="items-center">
            <Text className="text-2xl font-bold" style={{ color: colors.primary }}>{myEvents.length}</Text>
            <Text className="text-xs mt-1" style={{ color: colors.text }}>My Events</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold" style={{ color: colors.primary }}>{attendingEvents.length}</Text>
            <Text className="text-xs mt-1" style={{ color: colors.text }}>Attending</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold" style={{ color: colors.primary }}>{friends.length}</Text>
            <Text className="text-xs mt-1" style={{ color: colors.text }}>Friends</Text>
          </View>
        </View>

        {suggestions.length > 0 && (
          <View className="mt-5 px-5">
            <Text className="text-lg font-semibold mb-3" style={{ color: colors.text }}>
              People You May Know
            </Text>
            {suggestions.slice(0, 5).map((person) => (
              <View key={person.id} className="flex-row items-center p-3 rounded-xl mb-2" style={{ backgroundColor: colors.card }}>
                <View className="w-11 h-11 rounded-full items-center justify-center" style={{ backgroundColor: colors.secondary }}>
                  <Text className="text-white font-semibold text-lg">
                    {person.first_name?.charAt(0) || 'U'}
                  </Text>
                </View>
                <View className="flex-1 ml-3">
                  <Text className="font-semibold" style={{ color: colors.text }}>
                    {person.first_name} {person.last_name}
                  </Text>
                  <Text className="text-xs opacity-70" style={{ color: colors.text }}>@{person.username}</Text>
                </View>
                <Pressable
                  className="px-4 py-2 rounded-full"
                  style={{ backgroundColor: colors.primary }}
                  onPress={() => handleAddFriend(person.id)}
                >
                  <Text className="text-white text-xs font-semibold">+ Add</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {friends.length > 0 && (
          <View className="mt-5 px-5">
            <Text className="text-lg font-semibold mb-3" style={{ color: colors.text }}>Friends</Text>
            {friends.map((friend) => (
              <View key={friend.id} className="flex-row items-center p-3 rounded-xl mb-2" style={{ backgroundColor: colors.card }}>
                <View className="w-11 h-11 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary }}>
                  <Text className="text-white font-semibold text-lg">
                    {friend.first_name?.charAt(0) || 'U'}
                  </Text>
                </View>
                <View className="flex-1 ml-3">
                  <Text className="font-semibold" style={{ color: colors.text }}>
                    {friend.first_name} {friend.last_name}
                  </Text>
                  <Text className="text-xs opacity-70" style={{ color: colors.text }}>@{friend.username}</Text>
                </View>
                <Pressable
                  className="px-3 py-1 rounded-lg border"
                  style={{ borderColor: colors.error }}
                  onPress={() => handleRemoveFriend(friend.id)}
                >
                  <Text className="text-xs font-semibold" style={{ color: colors.error }}>Remove</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <Pressable
          className="m-5 py-4 rounded-xl items-center"
          style={{ backgroundColor: colors.error }}
          onPress={handleLogout}
        >
          <Text className="text-white font-semibold text-base">Logout</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

export default ProfileScreen;

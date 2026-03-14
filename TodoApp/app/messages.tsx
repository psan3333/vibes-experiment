import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../src/context/ThemeContext';
import { useMessages } from '../src/contexts/MessagesContext';
import { useAuth } from '../src/contexts/AuthContext';
import { EventGroup, Message } from '../src/api/client';

export function MessagesScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const {
    conversations,
    currentMessages,
    loadConversations,
    loadMessages,
    sendMessage,
  } = useMessages();

  const [selectedGroup, setSelectedGroup] = useState<EventGroup | null>(null);
  const [messageText, setMessageText] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const handleSelectGroup = async (group: EventGroup) => {
    setSelectedGroup(group);
    if (group.id) {
      await loadMessages(group.id);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedGroup?.id) return;
    await sendMessage(selectedGroup.id, messageText);
    setMessageText('');
  };

  const renderConversation = ({ item }: { item: EventGroup }) => (
    <Pressable
      className="flex-row items-center p-4 rounded-xl mb-2"
      style={{ backgroundColor: colors.card }}
      onPress={() => handleSelectGroup(item)}
    >
      <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary }}>
        <Text className="text-white font-semibold text-xl">
          {item.event?.title?.charAt(0) || 'E'}
        </Text>
      </View>
      <View className="flex-1 ml-3">
        <Text className="font-semibold" style={{ color: colors.text }}>
          {item.event?.title || 'Event Chat'}
        </Text>
        <Text className="text-xs opacity-70 mt-1" style={{ color: colors.text }}>
          {item.event ? new Date(item.event.event_date).toLocaleDateString() : ''}
        </Text>
      </View>
    </Pressable>
  );

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender_id === user?.id;
    return (
      <View
        className="p-3 rounded-2xl mb-2 max-w-[80%]"
        style={
          isOwnMessage
            ? { backgroundColor: colors.primary, alignSelf: 'flex-end' }
            : { backgroundColor: colors.card, alignSelf: 'flex-start' }
        }
      >
        {!isOwnMessage && (
          <Text className="text-xs font-semibold mb-1" style={{ color: colors.text }}>
            {item.sender?.username || 'User'}
          </Text>
        )}
        <Text
          className="text-base"
          style={{ color: isOwnMessage ? '#fff' : colors.text }}
        >
          {item.content}
        </Text>
        <Text className="text-xs mt-1 opacity-70" style={{ color: isOwnMessage ? '#fff' : colors.text }}>
          {new Date(item.created_at).toLocaleTimeString()}
        </Text>
      </View>
    );
  };

  if (!user) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg mb-5" style={{ color: colors.text }}>
            Please log in to view messages
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

  if (selectedGroup) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <View className="flex-row items-center px-4 pt-12 pb-3 gap-3">
          <Pressable onPress={() => setSelectedGroup(null)}>
            <Text className="font-semibold" style={{ color: colors.primary }}>← Back</Text>
          </Pressable>
          <Text className="text-lg font-semibold" style={{ color: colors.text }}>
            {selectedGroup.event?.title || 'Chat'}
          </Text>
        </View>

        <FlatList
          data={currentMessages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          contentContainerClassName="p-3 flex-grow-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />

        <View className="flex-row items-center p-3" style={{ backgroundColor: colors.card }}>
          <TextInput
            className="flex-1 p-3 rounded-full text-base"
            style={{ backgroundColor: colors.background, color: colors.text }}
            placeholder="Type a message..."
            placeholderTextColor={colors.text}
            value={messageText}
            onChangeText={setMessageText}
          />
          <Pressable
            className="ml-3 px-5 py-3 rounded-full"
            style={{ backgroundColor: colors.primary }}
            onPress={handleSendMessage}
          >
            <Text className="text-white font-semibold">Send</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="px-5 pt-12 pb-3">
        <Text className="text-2xl font-bold" style={{ color: colors.text }}>Messages</Text>
      </View>

      {conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-lg font-semibold" style={{ color: colors.text }}>
            No conversations yet
          </Text>
          <Text className="text-sm mt-2 opacity-70" style={{ color: colors.text }}>
            Attend events to join group chats
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderConversation}
          contentContainerClassName="px-3"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}

export default MessagesScreen;

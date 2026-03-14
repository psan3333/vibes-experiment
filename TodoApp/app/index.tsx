import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Modal,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../src/context/ThemeContext';
import { useEvents } from '../src/contexts/EventsContext';
import { useAuth } from '../src/contexts/AuthContext';
import { Event, CreateEventInput } from '../src/api/client';

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export function MapScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const {
    events,
    isLoading,
    loadEvents,
    searchEvents,
    getNearbyEvents,
    createEvent,
    attendEvent,
  } = useEvents();

  const [region, setRegion] = useState<Region>({
    latitude: 55.7558,
    longitude: 37.6173,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [newEvent, setNewEvent] = useState<Partial<CreateEventInput>>({
    title: '',
    description: '',
    event_date: '',
    address: '',
    is_free: true,
    price: 0,
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

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.event_date) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    try {
      await createEvent({
        title: newEvent.title!,
        description: newEvent.description || '',
        event_date: newEvent.event_date!,
        latitude: region.latitude,
        longitude: region.longitude,
        address: newEvent.address || '',
        is_free: newEvent.is_free || true,
        price: newEvent.price || 0,
        category: newEvent.category || '',
      });
      setShowCreateModal(false);
      setNewEvent({
        title: '',
        description: '',
        event_date: '',
        address: '',
        is_free: true,
        price: 0,
        category: '',
      });
      Alert.alert('Success', 'Event created successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create event');
    }
  };

  const handleAttendEvent = async (eventId: number) => {
    try {
      await attendEvent(eventId);
      Alert.alert('Success', 'You are now attending this event');
    } catch (error) {
      Alert.alert('Error', 'Failed to attend event');
    }
  };

  const renderEventCard = ({ item }: { item: Event }) => (
    <Pressable
      className="w-52 p-4 mx-1 rounded-xl"
      style={{ backgroundColor: colors.card }}
      onPress={() => {
        setSelectedEvent(item);
        setShowEventModal(true);
      }}
    >
      <Text className="font-semibold text-base mb-1" style={{ color: colors.text }} numberOfLines={1}>
        {item.title}
      </Text>
      <Text className="text-sm" style={{ color: colors.text }}>
        {new Date(item.event_date).toLocaleDateString()}
      </Text>
      <Text className="text-xs opacity-60 mt-1" style={{ color: colors.text }} numberOfLines={1}>
        {item.address || 'Address not specified'}
      </Text>
      <View className="mt-2">
        <Text className="text-sm font-semibold" style={{ color: item.is_free ? colors.success : colors.primary }}>
          {item.is_free ? 'FREE' : `${item.price}₽`}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-1">
        <View className="p-3 flex-row gap-2">
          <View className="flex-1 flex-row rounded-xl" style={{ backgroundColor: colors.card }}>
            <TextInput
              className="flex-1 p-3 text-base"
              style={{ color: colors.text }}
              placeholder="Search events..."
              placeholderTextColor={colors.text}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
            <Pressable
              className="px-4 justify-center rounded-lg"
              style={{ backgroundColor: colors.primary }}
              onPress={handleSearch}
            >
              <Text className="text-white font-semibold">Search</Text>
            </Pressable>
          </View>
          <Pressable
            className="w-11 justify-center items-center rounded-xl"
            style={{ backgroundColor: colors.card }}
            onPress={handleMapSearch}
          >
            <Text className="text-xl">📍</Text>
          </Pressable>
          {user?.is_organizer && (
            <Pressable
              className="w-11 justify-center items-center rounded-xl"
              style={{ backgroundColor: colors.primary }}
              onPress={() => setShowCreateModal(true)}
            >
              <Text className="text-2xl text-white font-light">+</Text>
            </Pressable>
          )}
        </View>

        <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.card }}>
          <Text className="text-lg font-semibold mb-2" style={{ color: colors.text }}>
            Yandex Maps
          </Text>
          <Text className="text-sm opacity-70 px-8 text-center" style={{ color: colors.text }}>
            Map view - {events.length} events nearby
          </Text>
          <Text className="text-xs mt-2 opacity-50" style={{ color: colors.text }}>
            Lat: {region.latitude.toFixed(4)}, Lng: {region.longitude.toFixed(4)}
          </Text>
          <View className="flex-row mt-4 gap-2">
            <Pressable 
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: colors.primary }}
              onPress={() => setRegion({...region, latitude: region.latitude + 0.01})}
            >
              <Text className="text-white">N</Text>
            </Pressable>
            <Pressable 
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: colors.primary }}
              onPress={() => setRegion({...region, latitude: region.latitude - 0.01})}
            >
              <Text className="text-white">S</Text>
            </Pressable>
            <Pressable 
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: colors.primary }}
              onPress={() => setRegion({...region, longitude: region.longitude - 0.01})}
            >
              <Text className="text-white">W</Text>
            </Pressable>
            <Pressable 
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: colors.primary }}
              onPress={() => setRegion({...region, longitude: region.longitude + 0.01})}
            >
              <Text className="text-white">E</Text>
            </Pressable>
          </View>
        </View>

        <View className="absolute bottom-20 left-0 right-0">
          <Text className="text-base font-semibold px-4 mb-2" style={{ color: colors.text }}>
            Nearby Events ({events.length})
          </Text>
          <FlatList
            horizontal
            data={events.slice(0, 10)}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderEventCard}
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="px-2"
          />
        </View>

        <Modal visible={showEventModal} animationType="slide" transparent>
          <View className="flex-1 bg-black/50 justify-center items-center">
            <View className="w-[90%] max-h-[80%] rounded-2xl p-5" style={{ backgroundColor: colors.card }}>
              {selectedEvent && (
                <ScrollView>
                  <Text className="text-xl font-bold mb-3" style={{ color: colors.text }}>
                    {selectedEvent.title}
                  </Text>
                  <Text className="text-base mb-3" style={{ color: colors.text }}>
                    {selectedEvent.description || 'No description'}
                  </Text>
                  <Text className="text-sm mb-2" style={{ color: colors.text }}>📅 {new Date(selectedEvent.event_date).toLocaleString()}</Text>
                  <Text className="text-sm mb-2" style={{ color: colors.text }}>📍 {selectedEvent.address || 'Address not specified'}</Text>
                  <Text className="text-sm mb-2" style={{ color: colors.text }}>💰 {selectedEvent.is_free ? 'FREE' : `${selectedEvent.price}₽`}</Text>
                  {selectedEvent.category && (
                    <Text className="text-sm mb-4" style={{ color: colors.text }}>🏷️ {selectedEvent.category}</Text>
                  )}
                  <Pressable
                    className="p-4 rounded-xl items-center"
                    style={{ backgroundColor: colors.primary }}
                    onPress={() => handleAttendEvent(selectedEvent.id)}
                  >
                    <Text className="text-white font-semibold">Attend Event</Text>
                  </Pressable>
                  <Pressable
                    className="p-4 rounded-xl items-center mt-2 border"
                    style={{ borderColor: colors.border }}
                    onPress={() => setShowEventModal(false)}
                  >
                    <Text className="font-semibold" style={{ color: colors.text }}>Close</Text>
                  </Pressable>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        <Modal visible={showCreateModal} animationType="slide" transparent>
          <View className="flex-1 bg-black/50 justify-center items-center">
            <View className="w-[90%] max-h-[80%] rounded-2xl p-5" style={{ backgroundColor: colors.card }}>
              <ScrollView>
                <Text className="text-xl font-bold mb-4" style={{ color: colors.text }}>Create Event</Text>
                
                <TextInput
                  className="p-3 rounded-lg text-base border mb-2"
                  style={{ backgroundColor: colors.background, color: colors.text, borderColor: colors.border }}
                  placeholder="Title *"
                  placeholderTextColor={colors.text}
                  value={newEvent.title}
                  onChangeText={(text) => setNewEvent({ ...newEvent, title: text })}
                />
                
                <TextInput
                  className="p-3 rounded-lg text-base border mb-2 h-20 text-top"
                  style={{ backgroundColor: colors.background, color: colors.text, borderColor: colors.border }}
                  placeholder="Description"
                  placeholderTextColor={colors.text}
                  value={newEvent.description}
                  onChangeText={(text) => setNewEvent({ ...newEvent, description: text })}
                  multiline
                />
                
                <TextInput
                  className="p-3 rounded-lg text-base border mb-2"
                  style={{ backgroundColor: colors.background, color: colors.text, borderColor: colors.border }}
                  placeholder="Date (ISO 8601) *"
                  placeholderTextColor={colors.text}
                  value={newEvent.event_date}
                  onChangeText={(text) => setNewEvent({ ...newEvent, event_date: text })}
                />
                
                <TextInput
                  className="p-3 rounded-lg text-base border mb-2"
                  style={{ backgroundColor: colors.background, color: colors.text, borderColor: colors.border }}
                  placeholder="Address"
                  placeholderTextColor={colors.text}
                  value={newEvent.address}
                  onChangeText={(text) => setNewEvent({ ...newEvent, address: text })}
                />
                
                <TextInput
                  className="p-3 rounded-lg text-base border mb-2"
                  style={{ backgroundColor: colors.background, color: colors.text, borderColor: colors.border }}
                  placeholder="Category"
                  placeholderTextColor={colors.text}
                  value={newEvent.category}
                  onChangeText={(text) => setNewEvent({ ...newEvent, category: text })}
                />

                <View className="flex-row items-center mb-2">
                  <Pressable
                    className={`w-6 h-6 rounded mr-2 ${newEvent.is_free ? 'bg-blue-500' : 'border-2'}`}
                    style={newEvent.is_free ? { backgroundColor: colors.primary } : { borderColor: colors.border }}
                    onPress={() => setNewEvent({ ...newEvent, is_free: !newEvent.is_free })}
                  >
                    {newEvent.is_free && <Text className="text-white text-center font-bold">✓</Text>}
                  </Pressable>
                  <Text className="text-base" style={{ color: colors.text }}>Free Event</Text>
                </View>

                {!newEvent.is_free && (
                  <TextInput
                    className="p-3 rounded-lg text-base border mb-4"
                    style={{ backgroundColor: colors.background, color: colors.text, borderColor: colors.border }}
                    placeholder="Price (₽)"
                    placeholderTextColor={colors.text}
                    value={newEvent.price?.toString() || ''}
                    onChangeText={(text) => setNewEvent({ ...newEvent, price: parseFloat(text) || 0 })}
                    keyboardType="numeric"
                  />
                )}

                <Pressable
                  className="p-4 rounded-xl items-center"
                  style={{ backgroundColor: colors.primary }}
                  onPress={handleCreateEvent}
                >
                  <Text className="text-white font-semibold text-base">Create Event</Text>
                </Pressable>
                
                <Pressable
                  className="p-4 rounded-xl items-center mt-2 border"
                  style={{ borderColor: colors.border }}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text className="font-semibold" style={{ color: colors.text }}>Cancel</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

export default MapScreen;

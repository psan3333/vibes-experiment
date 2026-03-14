import React, { useEffect } from 'react';
import { View, Text, StatusBar } from 'react-native';
import { Slot, usePathname, useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { AuthProvider } from '../src/contexts/AuthContext';
import { EventsProvider } from '../src/contexts/EventsContext';
import { MessagesProvider } from '../src/contexts/MessagesContext';
import { FriendsProvider } from '../src/contexts/FriendsContext';

function CustomTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { colors } = useTheme();

  const tabs = [
    { name: '/', label: 'Map', icon: '🗺️' },
    { name: '/messages', label: 'Messages', icon: '💬' },
    { name: '/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <View className="flex-row absolute bottom-0 left-0 right-0 px-0 py-3 border-t" 
      style={{ 
        backgroundColor: colors.card, 
        borderTopColor: colors.border,
        paddingBottom: 30 
      }}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.name;
        return (
          <View key={tab.name} className="flex-1 items-center">
            <Text
              onPress={() => router.push(tab.name as any)}
              className="text-2xl"
              style={{ opacity: isActive ? 1 : 0.5 }}
            >
              {tab.icon}
            </Text>
            <Text
              className="text-xs mt-1"
              style={{ color: isActive ? colors.primary : colors.text }}
            >
              {tab.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function RootContent() {
  const { theme, colors } = useTheme();

  useEffect(() => {
    async function prepare() {
      try {
        await ScreenOrientation.unlockAsync();
      } catch (e) {
        console.error('Failed to initialize screen orientation:', e);
      }
    }
    prepare();
  }, []);

  return (
    <View className={`flex-1 ${theme === 'dark' ? 'dark bg-neutral-900' : 'bg-slate-50'}`}>
      <StatusBar
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.background}
      />
      <View className="flex-1">
        <Slot />
      </View>
      <CustomTabBar />
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <EventsProvider>
              <MessagesProvider>
                <FriendsProvider>
                  <RootContent />
                </FriendsProvider>
              </MessagesProvider>
            </EventsProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

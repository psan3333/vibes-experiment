import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useTodos } from '../context/TodoContext';
import { TodoItem } from '../components/TodoItem';
import { AddTodoModal } from '../components/AddTodoModal';
import { StatsCard, StatsCharts } from '../components/StatsComponents';

export function HomeScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  const { pendingTodos, completedTodos, addTodo, completeTodo, uncompleteTodo, deleteTodo, getStats, refreshTodos } = useTodos();
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const stats = getStats();

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshTodos();
    setRefreshing(false);
  };

  const recentTodos = [...completedTodos, ...pendingTodos]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-24"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="mb-5 flex-row items-center justify-between">
          <View>
            <Text
              className="text-xs"
              style={{ color: colors.text + 'aa' }}
            >
              Welcome back!
            </Text>
            <Text
              className="text-2xl font-bold"
              style={{ color: colors.text }}
            >
              Your Tasks
            </Text>
          </View>
          <Pressable
            className="h-11 w-11 items-center justify-center rounded-full border"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
            onPress={toggleTheme}
          >
            <Text
              className="text-xl"
              style={{ color: colors.text }}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </Text>
          </Pressable>
        </View>

        <View
          className={`flex-row gap-2 ${isLandscape ? 'flex-wrap' : ''}`}
        >
          <StatsCard
            title="Total"
            value={stats.total}
            color={colors.primary}
          />
          <StatsCard
            title="Completed"
            value={stats.completed}
            color={colors.success}
          />
          <StatsCard
            title="Pending"
            value={stats.pending}
            color={colors.warning}
          />
        </View>

        <StatsCharts stats={stats} />

        <View className="mt-2">
          <Text
            className="mb-3 text-xl font-bold"
            style={{ color: colors.text }}
          >
            Recent Tasks
          </Text>
          {recentTodos.length === 0 ? (
            <View
              className="items-center rounded-xl px-8 py-7"
              style={{ backgroundColor: colors.card }}
            >
              <Text
                className="text-base"
                style={{ color: colors.text + 'aa' }}
              >
                No tasks yet. Tap + to add one!
              </Text>
            </View>
          ) : (
            recentTodos.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onComplete={completeTodo}
                onUncomplete={uncompleteTodo}
                onDelete={deleteTodo}
              />
            ))
          )}
        </View>
      </ScrollView>

      <Pressable
        className="absolute bottom-8 right-8 h-15 w-15 items-center justify-center rounded-full shadow-lg"
        style={{ backgroundColor: colors.primary }}
        onPress={() => setModalVisible(true)}
      >
        <Text className="mt-[-2px] text-3xl font-light text-white">+</Text>
      </Pressable>

      <AddTodoModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={addTodo}
      />
    </SafeAreaView>
  );
}

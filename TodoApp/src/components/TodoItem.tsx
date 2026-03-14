import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Todo } from '../db/schema';

interface TodoItemProps {
  todo: Todo;
  onComplete: (id: number) => void;
  onUncomplete: (id: number) => void;
  onDelete: (id: number) => void;
}

export function TodoItem({ todo, onComplete, onUncomplete, onDelete }: TodoItemProps) {
  const { colors } = useTheme();

  return (
    <View
      className="mb-2 flex-row rounded-xl border bg-white shadow-sm dark:bg-neutral-900"
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
    >
      <View className="flex-1">
        <Text
          className={`text-base font-semibold ${
            todo.isCompleted ? 'line-through opacity-70' : ''
          }`}
          style={{ color: colors.text }}
        >
          {todo.title}
        </Text>
        {todo.description ? (
          <Text
            className="mt-1 text-sm"
            style={{ color: colors.text + 'aa' }}
            numberOfLines={2}
          >
            {todo.description}
          </Text>
        ) : null}
        {todo.metric ? (
          <View
            className="mt-2 self-start rounded-md px-2 py-1"
            style={{ backgroundColor: colors.secondary + '20' }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: colors.secondary }}
            >
              Target: {todo.metric}
            </Text>
          </View>
        ) : null}
        {todo.isCompleted && todo.completedAt ? (
          <Text
            className="mt-2 text-xs"
            style={{ color: colors.success }}
          >
            Completed: {new Date(todo.completedAt).toLocaleDateString()}
          </Text>
        ) : null}
      </View>
      <View className="justify-center gap-2">
        {todo.isCompleted ? (
          <Pressable
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.warning + '20' }}
            onPress={() => onUncomplete(todo.id)}
          >
            <Text
              className="text-base font-bold"
              style={{ color: colors.warning }}
            >
              ↩
            </Text>
          </Pressable>
        ) : (
          <Pressable
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.success + '20' }}
            onPress={() => onComplete(todo.id)}
          >
            <Text
              className="text-base font-bold"
              style={{ color: colors.success }}
            >
              ✓
            </Text>
          </Pressable>
        )}
        <Pressable
          className="h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.error + '20' }}
          onPress={() => onDelete(todo.id)}
        >
          <Text
            className="text-base font-bold"
            style={{ color: colors.error }}
          >
            ✕
          </Text>
        </Pressable>
      </View>
    </View>
  );
}


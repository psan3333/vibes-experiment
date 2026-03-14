import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface AddTodoModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (title: string, description?: string, metric?: string) => void;
}

export function AddTodoModal({ visible, onClose, onAdd }: AddTodoModalProps) {
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [metric, setMetric] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    onAdd(title.trim(), description.trim() || undefined, metric.trim() || undefined);
    setTitle('');
    setDescription('');
    setMetric('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setMetric('');
    setError('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 items-center justify-center bg-black/50 px-5"
      >
        <View
          className="w-full max-w-md rounded-2xl p-5 shadow-lg"
          style={{ backgroundColor: colors.card }}
        >
          <Text
            className="mb-4 text-center text-xl font-bold"
            style={{ color: colors.text }}
          >
            Add New TODO
          </Text>
          
          {error ? (
            <Text
              className="mb-2 text-sm"
              style={{ color: colors.error }}
            >
              {error}
            </Text>
          ) : null}

          <Text
            className="mt-3 text-sm font-semibold"
            style={{ color: colors.text }}
          >
            Title <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TextInput
            className="rounded-lg border px-3 py-3 text-base"
            style={{
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: colors.border,
            }}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter title"
            placeholderTextColor={colors.text + '80'}
          />

          <Text
            className="mt-3 text-sm font-semibold"
            style={{ color: colors.text }}
          >
            Description
          </Text>
          <TextInput
            className="min-h-20 rounded-lg border px-3 py-3 text-base"
            style={{
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: colors.border,
            }}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description (optional)"
            placeholderTextColor={colors.text + '80'}
            multiline
            numberOfLines={3}
          />

          <Text
            className="mt-3 text-sm font-semibold"
            style={{ color: colors.text }}
          >
            Metric of Execution
          </Text>
          <TextInput
            className="rounded-lg border px-3 py-3 text-base"
            style={{
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: colors.border,
            }}
            value={metric}
            onChangeText={setMetric}
            placeholder="e.g., 5 hours, 3 sessions (optional)"
            placeholderTextColor={colors.text + '80'}
          />

          <View className="mt-5 flex-row justify-between gap-3">
            <Pressable
              className="flex-1 items-center rounded-lg px-3 py-3"
              style={{ backgroundColor: colors.border }}
              onPress={handleClose}
            >
              <Text
                className="text-base font-semibold"
                style={{ color: colors.text }}
              >
                Cancel
              </Text>
            </Pressable>
            <Pressable
              className="flex-1 items-center rounded-lg px-3 py-3"
              style={{ backgroundColor: colors.primary }}
              onPress={handleAdd}
            >
              <Text className="text-base font-semibold text-white">Add TODO</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';

export function LoginScreen() {
  const { colors } = useTheme();
  const { login, register, isLoading } = useAuth();

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (isRegistering) {
      if (!username || !firstName || !lastName || !age) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }
      if (parseInt(age) < 18) {
        Alert.alert('Error', 'You must be 18+ to use this app');
        return;
      }
      try {
        await register({
          email,
          username,
          password,
          first_name: firstName,
          last_name: lastName,
          age: parseInt(age),
          is_organizer: false,
        });
        router.replace('/');
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Registration failed');
      }
    } else {
      try {
        await login(email, password);
        router.replace('/');
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Login failed');
      }
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerClassName="flex-grow justify-center px-5">
          <Text className="text-3xl font-bold text-center mb-2" style={{ color: colors.text }}>
            {isRegistering ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text className="text-base text-center mb-10 opacity-70" style={{ color: colors.text }}>
            {isRegistering
              ? 'Join our community of event-goers!'
              : 'Sign in to continue'}
          </Text>

          <View className="gap-3">
            <TextInput
              className="p-4 rounded-xl text-base border"
              style={{ backgroundColor: colors.card, color: colors.text, borderColor: colors.border }}
              placeholder="Email *"
              placeholderTextColor={colors.text}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {isRegistering && (
              <TextInput
                className="p-4 rounded-xl text-base border"
                style={{ backgroundColor: colors.card, color: colors.text, borderColor: colors.border }}
                placeholder="Username *"
                placeholderTextColor={colors.text}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            )}

            <TextInput
              className="p-4 rounded-xl text-base border"
              style={{ backgroundColor: colors.card, color: colors.text, borderColor: colors.border }}
              placeholder="Password *"
              placeholderTextColor={colors.text}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {isRegistering && (
              <>
                <TextInput
                  className="p-4 rounded-xl text-base border"
                  style={{ backgroundColor: colors.card, color: colors.text, borderColor: colors.border }}
                  placeholder="First Name *"
                  placeholderTextColor={colors.text}
                  value={firstName}
                  onChangeText={setFirstName}
                />
                <TextInput
                  className="p-4 rounded-xl text-base border"
                  style={{ backgroundColor: colors.card, color: colors.text, borderColor: colors.border }}
                  placeholder="Last Name *"
                  placeholderTextColor={colors.text}
                  value={lastName}
                  onChangeText={setLastName}
                />
                <TextInput
                  className="p-4 rounded-xl text-base border"
                  style={{ backgroundColor: colors.card, color: colors.text, borderColor: colors.border }}
                  placeholder="Age (18+) *"
                  placeholderTextColor={colors.text}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                />
              </>
            )}

            <Pressable
              className="p-4 rounded-xl items-center mt-2"
              style={{ backgroundColor: colors.primary }}
              onPress={handleSubmit}
            >
              <Text className="text-white text-lg font-semibold">
                {isLoading ? 'Loading...' : isRegistering ? 'Register' : 'Login'}
              </Text>
            </Pressable>

            <Pressable
              className="p-4 items-center"
              onPress={() => setIsRegistering(!isRegistering)}
            >
              <Text className="text-sm" style={{ color: colors.text }}>
                {isRegistering
                  ? 'Already have an account? Login'
                  : "Don't have an account? Register"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default LoginScreen;

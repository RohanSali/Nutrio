import React from 'react';
import { View, Text } from 'react-native';
import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-black">Welcome 👋</Text>
      <Text className="text-lg text-red-600">This is my Home Screen</Text>
    </View>
  );
}
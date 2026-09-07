import "./global.css";

import { ActivityIndicator, Pressable, StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import React, { useEffect, useState } from "react";
import {SafeAreaProvider} from 'react-native-safe-area-context';
import { cssInterop } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getAuth, onAuthStateChanged, type User } from "@react-native-firebase/auth";
import { subscribeToOnboardingStatus } from "./src/scripts/firestore_handler";

import { Dashboard } from './src/screens/Dashboard';
import { FullScreenCamera } from './src/screens/FullScreenCamera';
import { LoginScreen } from "./src/screens/LoginScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { FetchInfoScreen } from "./src/screens/FetchInfoScreen";

cssInterop(SafeAreaView, { className: 'style' });

const Stack = createNativeStackNavigator();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}


export function AppNavigator() {
  const [user, setUser] = useState<User | null>(null);
  const [authInitializing, setAuthInitializing] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [onboardingRetry, setOnboardingRetry] = useState(0);
  const uid = user?.uid;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (currentUser) => {
      setUser(currentUser);
      setAuthInitializing(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!uid) {
      setOnboardingComplete(null);
      setOnboardingError(null);
      return;
    }

    setOnboardingComplete(null);
    setOnboardingError(null);

    return subscribeToOnboardingStatus(
      uid,
      setOnboardingComplete,
      (error) => setOnboardingError(error.message)
    );
  }, [uid, onboardingRetry]);

  if (authInitializing || (user && onboardingComplete === null && !onboardingError)) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (user && onboardingError) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-center text-base text-gray-700">
          Unable to load your profile. Please check your connection and try again.
        </Text>
        <Text className="mt-2 text-center text-sm text-gray-500">
          {onboardingError}
        </Text>
        <Pressable
          className="mt-6 rounded-xl bg-black px-6 py-3"
          onPress={() => setOnboardingRetry((value) => value + 1)}
        >
          <Text className="font-semibold text-white">Try again</Text>
        </Pressable>
      </View>
    );
  }
  
  return (
    <Stack.Navigator
      key={user ? (onboardingComplete ? "dashboard" : "fetch-info") : "login"}
      screenOptions={{ headerShown: false }}
    >
      {user && onboardingComplete ? (
        <>
          <Stack.Screen name="Dashboard" component={Dashboard}/> 
          <Stack.Screen name="FullScreenCamera" component={FullScreenCamera}/>
          <Stack.Screen name="ProfileScreen" component={ProfileScreen}/>
          <Stack.Screen name="History" component={HistoryScreen}/>
        </>
      ) : user ? (
        <Stack.Screen name="FetchInfoScreen" component={FetchInfoScreen} />
      ) : (
        <>
          <Stack.Screen name="LoginScreen" component={LoginScreen}/>
        </>
      )}

    </Stack.Navigator>
  );
}

export default App;
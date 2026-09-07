import "./global.css";

import { StatusBar, useColorScheme, View, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from "react";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getAuth, onAuthStateChanged, type User } from "@react-native-firebase/auth";

import { Dashboard } from './src/screens/Dashboard';
import { FullScreenCamera } from './src/screens/FullScreenCamera';
import { LoginScreen } from "./src/screens/LoginScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";

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
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (currentUser) => {
      setUser(currentUser);

      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  if (initializing) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false}}>
      {user ? (
        <>
          <Stack.Screen name="Dashboard" component={Dashboard}/> 
          <Stack.Screen name="FullScreenCamera" component={FullScreenCamera}/>
          <Stack.Screen name="ProfileScreen" component={ProfileScreen}/>
        </>
      ) :
      (
        <Stack.Screen name="LoginScreen" component={LoginScreen}/>
      )}
    </Stack.Navigator>
  );
}

export default App;
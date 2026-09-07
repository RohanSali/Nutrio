import "./global.css";

import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import React from 'react';
import { cssInterop } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {Dashboard} from './src/screens/Dashboard';
import {FullScreenCamera} from './src/screens/FullScreenCamera';
import { HistoryScreen } from "./src/screens/HistoryScreen";

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
  return (
    <Stack.Navigator screenOptions={{ headerShown: false}}>
      <Stack.Screen name="Dashboard" component={Dashboard}/> 
      <Stack.Screen name="FullScreenCamera" component={FullScreenCamera}/>
      <Stack.Screen name="History" component={HistoryScreen}/>

    </Stack.Navigator>
  );
}

export default App;
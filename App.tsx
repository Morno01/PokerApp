import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TournamentProvider } from './src/context/TournamentContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <TournamentProvider>
        <AppNavigator />
        <StatusBar style="light" />
      </TournamentProvider>
    </SafeAreaProvider>
  );
}

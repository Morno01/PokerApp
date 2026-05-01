import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GroupProvider } from './src/context/GroupContext';
import { TournamentProvider } from './src/context/TournamentContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <GroupProvider>
        <TournamentProvider>
          <AppNavigator />
          <StatusBar style="light" />
        </TournamentProvider>
      </GroupProvider>
    </SafeAreaProvider>
  );
}

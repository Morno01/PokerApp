import React from 'react';
import { NavigationContainer, Theme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../theme/colors';
import HomeScreen from '../screens/HomeScreen';
import TournamentSetupScreen from '../screens/TournamentSetupScreen';
import ActiveTournamentScreen from '../screens/ActiveTournamentScreen';
import EndTournamentScreen from '../screens/EndTournamentScreen';
import PreviousTournamentsScreen from '../screens/PreviousTournamentsScreen';
import StatisticsScreen from '../screens/StatisticsScreen';

const AppTheme: Theme = {
  dark: true,
  colors: {
    primary: Colors.primary,
    background: Colors.bg,
    card: Colors.card,
    text: Colors.text,
    border: Colors.border,
    notification: Colors.primary,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    heavy: { fontFamily: 'System', fontWeight: '900' },
  },
};

export type GameStackParamList = {
  Home: undefined;
  TournamentSetup: undefined;
  ActiveTournament: undefined;
  EndTournament: undefined;
};

export type RootTabParamList = {
  GameTab: undefined;
  HistorikTab: undefined;
  StatistikTab: undefined;
};

const GameStack = createNativeStackNavigator<GameStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

function GameStackNavigator() {
  return (
    <GameStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.card },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: 'bold' },
        contentStyle: { backgroundColor: Colors.bg },
      }}
    >
      <GameStack.Screen name="Home" component={HomeScreen} options={{ title: 'PokerNat' }} />
      <GameStack.Screen
        name="TournamentSetup"
        component={TournamentSetupScreen}
        options={{ title: 'Ny Turnering' }}
      />
      <GameStack.Screen
        name="ActiveTournament"
        component={ActiveTournamentScreen}
        options={{ title: 'Aktiv Turnering', headerBackVisible: false }}
      />
      <GameStack.Screen
        name="EndTournament"
        component={EndTournamentScreen}
        options={{ title: 'Afslut Turnering' }}
      />
    </GameStack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer theme={AppTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Colors.card,
            borderTopColor: Colors.border,
            borderTopWidth: 1,
          },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarIcon: ({ color, size, focused }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'home';
            if (route.name === 'GameTab') iconName = focused ? 'card' : 'card-outline';
            else if (route.name === 'HistorikTab')
              iconName = focused ? 'time' : 'time-outline';
            else if (route.name === 'StatistikTab')
              iconName = focused ? 'trophy' : 'trophy-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="GameTab" component={GameStackNavigator} options={{ title: 'Spil' }} />
        <Tab.Screen
          name="HistorikTab"
          component={PreviousTournamentsScreen}
          options={{ title: 'Historik', headerShown: true, headerStyle: { backgroundColor: Colors.card }, headerTintColor: Colors.text, headerTitle: 'Tidligere Turneringer' }}
        />
        <Tab.Screen
          name="StatistikTab"
          component={StatisticsScreen}
          options={{ title: 'Statistik', headerShown: true, headerStyle: { backgroundColor: Colors.card }, headerTintColor: Colors.text, headerTitle: 'Statistik' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

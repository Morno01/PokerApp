import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { GameStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../theme/colors';
import { useTournament } from '../context/TournamentContext';

type Props = NativeStackScreenProps<GameStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { activeTournament } = useTournament();

  useEffect(() => {
    if (activeTournament) {
      navigation.replace('ActiveTournament');
    }
  }, [activeTournament]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🃏 PokerNat</Text>
        <Text style={styles.subtitle}>Vælg et spil for at starte</Text>
      </View>

      <View style={styles.gamesGrid}>
        <TouchableOpacity
          style={styles.gameCard}
          onPress={() => navigation.navigate('TournamentSetup')}
          activeOpacity={0.8}
        >
          <View style={styles.gameIconContainer}>
            <Text style={styles.gameEmoji}>♠️</Text>
          </View>
          <Text style={styles.gameName}>Poker</Text>
          <Text style={styles.gameDescription}>Texas Hold'em turnering</Text>
          <View style={styles.playButton}>
            <Text style={styles.playButtonText}>Start turnering</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.white} />
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>Flere spil kommer snart</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    padding: 24,
  },
  header: {
    marginTop: 24,
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  gamesGrid: {
    flex: 1,
    justifyContent: 'center',
  },
  gameCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  gameIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.cardAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  gameEmoji: {
    fontSize: 40,
  },
  gameName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  gameDescription: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 24,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  playButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    textAlign: 'center',
    color: Colors.textDim,
    fontSize: 13,
    marginBottom: 8,
  },
});

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { Colors } from '../theme/colors';
import { PlayerStats } from '../types';
import { loadTournaments } from '../firebase/firestoreService';
import { computePlayerStats, formatCurrency } from '../utils/calculations';

type SortKey = 'profit' | 'firsts' | 'played';

export default function StatisticsScreen() {
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('profit');
  const [refreshing, setRefreshing] = useState(false);

  async function fetchStats() {
    try {
      setError(null);
      const tournaments = await loadTournaments();
      const playerStats = computePlayerStats(tournaments);
      setStats(playerStats);
    } catch (e) {
      setError('Kunne ikke hente statistik. Tjek Firebase-opsætningen.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchStats();
    }, []),
  );

  function handleRefresh() {
    setRefreshing(true);
    fetchStats();
  }

  const sorted = [...stats].sort((a, b) => {
    if (sortKey === 'profit') return b.totalProfit - a.totalProfit;
    if (sortKey === 'firsts') return b.firsts - a.firsts;
    return b.tournamentsPlayed - a.tournamentsPlayed;
  });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Henter statistik...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => { setLoading(true); fetchStats(); }}
        >
          <Text style={styles.retryText}>Prøv igen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (stats.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyEmoji}>🏆</Text>
        <Text style={styles.emptyTitle}>Ingen statistik endnu</Text>
        <Text style={styles.emptyText}>Spil din første turnering for at se statistik her</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.primary}
        />
      }
    >
      {/* SORT TABS */}
      <View style={styles.sortRow}>
        <SortButton label="Gevinst" active={sortKey === 'profit'} onPress={() => setSortKey('profit')} />
        <SortButton label="1. pladser" active={sortKey === 'firsts'} onPress={() => setSortKey('firsts')} />
        <SortButton label="Turneringer" active={sortKey === 'played'} onPress={() => setSortKey('played')} />
      </View>

      {/* LEADERBOARD */}
      {sorted.map((player, index) => (
        <View key={player.name} style={styles.playerCard}>
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>{getRankDisplay(index)}</Text>
          </View>

          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{player.name}</Text>
            <View style={styles.medalRow}>
              <View style={styles.medalChip}>
                <Text style={styles.medalEmoji}>🥇</Text>
                <Text style={styles.medalCount}>{player.firsts}</Text>
              </View>
              <View style={styles.medalChip}>
                <Text style={styles.medalEmoji}>🥈</Text>
                <Text style={styles.medalCount}>{player.seconds}</Text>
              </View>
              <View style={styles.medalChip}>
                <Text style={styles.medalEmoji}>🥉</Text>
                <Text style={styles.medalCount}>{player.thirds}</Text>
              </View>
              <View style={styles.medalChip}>
                <Ionicons name="game-controller-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.medalCount}>{player.tournamentsPlayed}</Text>
              </View>
            </View>
          </View>

          <View style={styles.profitContainer}>
            <Text
              style={[
                styles.profitAmount,
                player.totalProfit >= 0 ? styles.profitPos : styles.profitNeg,
              ]}
            >
              {player.totalProfit >= 0 ? '+' : ''}{formatCurrency(player.totalProfit)}
            </Text>
            <Text style={styles.profitLabel}>total</Text>
          </View>
        </View>
      ))}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function SortButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.sortBtn, active && styles.sortBtnActive]}
      onPress={onPress}
    >
      <Text style={[styles.sortBtnText, active && styles.sortBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function getRankDisplay(index: number): string {
  if (index === 0) return '🥇';
  if (index === 1) return '🥈';
  if (index === 2) return '🥉';
  return `${index + 1}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16 },
  centered: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  loadingText: { color: Colors.textMuted, fontSize: 16 },
  errorText: { color: Colors.textMuted, fontSize: 15, textAlign: 'center' },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryText: { color: Colors.white, fontWeight: '600' },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { color: Colors.text, fontSize: 20, fontWeight: '700' },
  emptyText: { color: Colors.textMuted, fontSize: 15, textAlign: 'center' },
  sortRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  sortBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  sortBtnText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  sortBtnTextActive: { color: Colors.white },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rankBadge: {
    width: 36,
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: { fontSize: 20 },
  playerInfo: { flex: 1 },
  playerName: { color: Colors.text, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  medalRow: { flexDirection: 'row', gap: 8 },
  medalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardAlt,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 8,
    gap: 3,
  },
  medalEmoji: { fontSize: 12 },
  medalCount: { color: Colors.text, fontSize: 12, fontWeight: '600' },
  profitContainer: { alignItems: 'flex-end' },
  profitAmount: { fontSize: 16, fontWeight: '800' },
  profitLabel: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  profitPos: { color: Colors.success },
  profitNeg: { color: Colors.danger },
});

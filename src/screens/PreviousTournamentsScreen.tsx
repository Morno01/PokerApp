import React, { useState, useEffect, useCallback } from 'react';
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
import { CompletedTournament } from '../types';
import { loadTournaments } from '../firebase/firestoreService';
import { formatCurrency, formatDate } from '../utils/calculations';

export default function PreviousTournamentsScreen() {
  const [tournaments, setTournaments] = useState<CompletedTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchTournaments() {
    try {
      setError(null);
      const data = await loadTournaments();
      setTournaments(data);
    } catch (e) {
      setError('Kunne ikke hente turneringer. Tjek Firebase-opsætningen.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchTournaments();
    }, []),
  );

  function handleRefresh() {
    setRefreshing(true);
    fetchTournaments();
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Henter turneringer...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchTournaments(); }}>
          <Text style={styles.retryText}>Prøv igen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (tournaments.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyEmoji}>🃏</Text>
        <Text style={styles.emptyTitle}>Ingen turneringer endnu</Text>
        <Text style={styles.emptyText}>
          Afsluttede turneringer vil dukke op her
        </Text>
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
      {tournaments.map((t) => {
        const isExpanded = expandedId === t.id;
        const winner = t.results.find((r) => r.position === 1);

        return (
          <TouchableOpacity
            key={t.id}
            style={styles.card}
            onPress={() => setExpandedId(isExpanded ? null : t.id)}
            activeOpacity={0.85}
          >
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardDate}>{formatDate(t.date)}</Text>
                <Text style={styles.cardGame}>♠️ Poker • {t.playerCount} spillere</Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardPot}>{formatCurrency(t.totalPot)}</Text>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={Colors.textMuted}
                />
              </View>
            </View>

            {winner && (
              <View style={styles.winnerRow}>
                <Text style={styles.winnerText}>🥇 {winner.name}</Text>
                <Text style={styles.winnerPrize}>{formatCurrency(winner.prize)}</Text>
              </View>
            )}

            {isExpanded && (
              <View style={styles.expandedContent}>
                <View style={styles.divider} />

                <View style={styles.metaRow}>
                  <MetaChip label="Buy-in" value={formatCurrency(t.buyInPrice)} />
                  <MetaChip label="Rebuy" value={formatCurrency(t.rebuyPrice)} />
                </View>

                <Text style={styles.resultsTitle}>Resultater</Text>
                {t.results.map((r) => (
                  <View key={r.id} style={styles.resultRow}>
                    <Text style={styles.resultMedal}>{getMedal(r.position)}</Text>
                    <Text style={styles.resultName}>{r.name}</Text>
                    <View style={styles.resultRight}>
                      {r.prize > 0 && (
                        <Text style={styles.resultPrize}>{formatCurrency(r.prize)}</Text>
                      )}
                      <Text
                        style={[
                          styles.resultProfit,
                          r.profit >= 0 ? styles.profitPos : styles.profitNeg,
                        ]}
                      >
                        {r.profit >= 0 ? '+' : ''}{formatCurrency(r.profit)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        );
      })}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaChip}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function getMedal(place: number): string {
  if (place === 1) return '🥇';
  if (place === 2) return '🥈';
  if (place === 3) return '🥉';
  return `${place}.`;
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
  loadingText: { color: Colors.textMuted, fontSize: 16, marginTop: 8 },
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
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardDate: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  cardGame: { color: Colors.textMuted, fontSize: 13, marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  cardPot: { color: Colors.gold, fontSize: 16, fontWeight: '700' },
  winnerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  winnerText: { color: Colors.text, fontSize: 14 },
  winnerPrize: { color: Colors.gold, fontSize: 14, fontWeight: '600' },
  expandedContent: { marginTop: 8 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  metaRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  metaChip: {
    flex: 1,
    backgroundColor: Colors.cardAlt,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  metaLabel: { color: Colors.textMuted, fontSize: 12, marginBottom: 2 },
  metaValue: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  resultsTitle: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  resultMedal: { fontSize: 18, marginRight: 10, width: 28 },
  resultName: { flex: 1, color: Colors.text, fontSize: 14 },
  resultRight: { alignItems: 'flex-end' },
  resultPrize: { color: Colors.gold, fontSize: 14, fontWeight: '600' },
  resultProfit: { fontSize: 12, fontWeight: '600' },
  profitPos: { color: Colors.success },
  profitNeg: { color: Colors.danger },
});

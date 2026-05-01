import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { GameStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../theme/colors';
import { useTournament } from '../context/TournamentContext';
import {
  calculateTotalPot,
  calculatePrizeAmounts,
  calculateResults,
  formatCurrency,
} from '../utils/calculations';
import { Player, PlayerResult } from '../types';
import { saveTournament } from '../firebase/firestoreService';

type Props = NativeStackScreenProps<GameStackParamList, 'EndTournament'>;

export default function EndTournamentScreen({ navigation }: Props) {
  const { activeTournament, clearTournament } = useTournament();

  const [assignments, setAssignments] = useState<{ player: Player; position: number }[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerForPlace, setPickerForPlace] = useState(1);
  const [saving, setSaving] = useState(false);
  const [finalResults, setFinalResults] = useState<PlayerResult[] | null>(null);

  if (!activeTournament) return null;

  const { players, buyInPrice, rebuyPrice, prizeDistribution } = activeTournament;
  const totalPot = calculateTotalPot(players, buyInPrice, rebuyPrice);
  const prizes = calculatePrizeAmounts(totalPot, prizeDistribution);
  const assignedIds = new Set(assignments.map((a) => a.player.id));
  const unassignedPlayers = players.filter((p) => !assignedIds.has(p.id));

  function getAssignedPlayer(place: number): Player | undefined {
    return assignments.find((a) => a.position === place)?.player;
  }

  function openPicker(place: number) {
    setPickerForPlace(place);
    setPickerVisible(true);
  }

  function assignPlayer(player: Player) {
    setAssignments((prev) => {
      const filtered = prev.filter((a) => a.position !== pickerForPlace);
      return [...filtered, { player, position: pickerForPlace }];
    });
    setPickerVisible(false);
  }

  function clearAssignment(place: number) {
    setAssignments((prev) => prev.filter((a) => a.position !== place));
  }

  function canCalculate(): boolean {
    return assignments.length === prizeDistribution.length;
  }

  function handleCalculate() {
    if (!canCalculate()) {
      Alert.alert('Mangler placering', `Tildel alle ${prizeDistribution.length} præmiepladser.`);
      return;
    }
    const results = calculateResults(
      assignments,
      players,
      buyInPrice,
      rebuyPrice,
      prizeDistribution,
      totalPot,
    );
    setFinalResults(results);
  }

  async function handleSave() {
    if (!finalResults) return;
    setSaving(true);
    try {
      await saveTournament({
        game: activeTournament.game,
        date: new Date(),
        buyInPrice,
        rebuyPrice,
        totalPot,
        playerCount: players.length,
        results: finalResults,
        prizeDistribution,
      });
      clearTournament();
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (err) {
      setSaving(false);
      Alert.alert(
        'Fejl ved gemning',
        'Turneringen kunne ikke gemmes til Firebase. Tjek din internetforbindelse og Firebase-opsætning.',
        [
          {
            text: 'Afslut alligevel',
            style: 'destructive',
            onPress: () => {
              clearTournament();
              navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
            },
          },
          { text: 'Prøv igen', onPress: handleSave },
        ],
      );
    }
  }

  if (finalResults) {
    return <ResultsView results={finalResults} totalPot={totalPot} onSave={handleSave} saving={saving} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.potBanner}>
          <Text style={styles.potLabel}>Total præmiepulje</Text>
          <Text style={styles.potAmount}>{formatCurrency(totalPot)}</Text>
        </View>

        <Text style={styles.instructions}>
          Tildel den rigtige spiller til hver præmieplads
        </Text>

        {prizes.map((prize) => {
          const assigned = getAssignedPlayer(prize.place);
          return (
            <View key={prize.place} style={styles.prizeRow}>
              <View style={styles.prizeHeader}>
                <Text style={styles.prizeMedal}>{getMedal(prize.place)}</Text>
                <View style={styles.prizeInfo}>
                  <Text style={styles.prizePlace}>{prize.place}. plads</Text>
                  <Text style={styles.prizeAmount}>{formatCurrency(prize.amount)}</Text>
                </View>
              </View>

              {assigned ? (
                <View style={styles.assignedRow}>
                  <View style={styles.assignedPlayer}>
                    <Ionicons name="person" size={16} color={Colors.success} />
                    <Text style={styles.assignedName}>{assigned.name}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => clearAssignment(prize.place)}
                    style={styles.clearBtn}
                  >
                    <Ionicons name="close-circle" size={22} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.selectPlayerBtn}
                  onPress={() => openPicker(prize.place)}
                >
                  <Ionicons name="person-add-outline" size={16} color={Colors.textMuted} />
                  <Text style={styles.selectPlayerText}>Vælg spiller</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        <TouchableOpacity
          style={[styles.calculateBtn, !canCalculate() && styles.calculateBtnDisabled]}
          onPress={handleCalculate}
          disabled={!canCalculate()}
          activeOpacity={0.8}
        >
          <Ionicons name="calculator-outline" size={20} color={Colors.white} />
          <Text style={styles.calculateBtnText}>Beregn resultater</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* PLAYER PICKER MODAL */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Vælg vinder af {pickerForPlace}. plads
              </Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {unassignedPlayers.map((player) => (
                <TouchableOpacity
                  key={player.id}
                  style={styles.pickerItem}
                  onPress={() => assignPlayer(player)}
                >
                  <Ionicons name="person-outline" size={20} color={Colors.text} />
                  <Text style={styles.pickerItemText}>{player.name}</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              ))}
              {unassignedPlayers.length === 0 && (
                <Text style={styles.noPlayersText}>Ingen tilgængelige spillere</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ResultsView({
  results,
  totalPot,
  onSave,
  saving,
}: {
  results: PlayerResult[];
  totalPot: number;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.potBanner}>
        <Text style={styles.potLabel}>Total præmiepulje</Text>
        <Text style={styles.potAmount}>{formatCurrency(totalPot)}</Text>
      </View>

      <Text style={styles.instructions}>Slutresultater</Text>

      {results.map((r) => (
        <View key={r.id} style={styles.resultCard}>
          <View style={styles.resultPosition}>
            <Text style={styles.resultMedal}>{getMedal(r.position)}</Text>
          </View>
          <View style={styles.resultInfo}>
            <Text style={styles.resultName}>{r.name}</Text>
            <View style={styles.resultDetails}>
              <Text style={styles.resultDetail}>Indbetalt: {formatCurrency(r.totalInvested)}</Text>
              {r.rebuys > 0 && (
                <Text style={styles.resultDetail}>
                  {r.rebuys} rebuy{r.rebuys !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.resultRight}>
            {r.prize > 0 && (
              <Text style={styles.resultPrize}>{formatCurrency(r.prize)}</Text>
            )}
            <Text
              style={[
                styles.resultProfit,
                r.profit >= 0 ? styles.profitPositive : styles.profitNegative,
              ]}
            >
              {r.profit >= 0 ? '+' : ''}{formatCurrency(r.profit)}
            </Text>
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={onSave}
        disabled={saving}
        activeOpacity={0.8}
      >
        <Ionicons name="checkmark-circle" size={22} color={Colors.white} />
        <Text style={styles.saveButtonText}>{saving ? 'Gemmer...' : 'Gem & afslut'}</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
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
  potBanner: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  potLabel: { color: Colors.textMuted, fontSize: 14, marginBottom: 6 },
  potAmount: { color: Colors.gold, fontSize: 30, fontWeight: '800' },
  instructions: {
    color: Colors.textMuted,
    fontSize: 15,
    marginBottom: 16,
    textAlign: 'center',
  },
  prizeRow: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  prizeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  prizeMedal: { fontSize: 28, marginRight: 12 },
  prizeInfo: { flex: 1 },
  prizePlace: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  prizeAmount: { color: Colors.gold, fontSize: 14, fontWeight: '600', marginTop: 2 },
  assignedRow: { flexDirection: 'row', alignItems: 'center' },
  assignedPlayer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d2d1a',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  assignedName: { color: Colors.success, fontSize: 15, fontWeight: '600' },
  clearBtn: { marginLeft: 10 },
  selectPlayerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  selectPlayerText: { color: Colors.textMuted, fontSize: 15 },
  calculateBtn: {
    backgroundColor: Colors.success,
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  calculateBtnDisabled: { backgroundColor: Colors.textDim },
  calculateBtnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  pickerItemText: { flex: 1, color: Colors.text, fontSize: 16 },
  noPlayersText: { color: Colors.textMuted, textAlign: 'center', padding: 20 },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultPosition: { marginRight: 12 },
  resultMedal: { fontSize: 26 },
  resultInfo: { flex: 1 },
  resultName: { color: Colors.text, fontSize: 16, fontWeight: '600', marginBottom: 4 },
  resultDetails: { flexDirection: 'row', gap: 10 },
  resultDetail: { color: Colors.textMuted, fontSize: 12 },
  resultRight: { alignItems: 'flex-end' },
  resultPrize: { color: Colors.gold, fontSize: 16, fontWeight: '700' },
  resultProfit: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  profitPositive: { color: Colors.success },
  profitNegative: { color: Colors.danger },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  saveButtonDisabled: { backgroundColor: Colors.textDim },
  saveButtonText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
});

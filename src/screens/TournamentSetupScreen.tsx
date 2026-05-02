import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { GameStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../theme/colors';
import { useTournament } from '../context/TournamentContext';
import { useGroups } from '../context/GroupContext';
import { Player, PrizePlace } from '../types';

type Props = NativeStackScreenProps<GameStackParamList, 'TournamentSetup'>;

let idCounter = 0;
function genId() {
  return `setup-${Date.now()}-${++idCounter}`;
}

const DEFAULT_PRIZE_PRESETS: Record<number, number[]> = {
  2: [60, 40],
  3: [50, 30, 20],
  4: [45, 30, 15, 10],
  5: [40, 25, 20, 10, 5],
};

export default function TournamentSetupScreen({ route, navigation }: Props) {
  const { startTournament } = useTournament();
  const { groups } = useGroups();
  const groupId = route.params?.groupId;
  const group = groups.find((g) => g.id === groupId);

  const [players, setPlayers] = useState<Player[]>(() =>
    (group?.members ?? []).map((name) => ({ id: genId(), name, rebuys: 0 })),
  );
  const [playerNameInput, setPlayerNameInput] = useState('');
  const [buyInPrice, setBuyInPrice] = useState('');
  const [rebuyPrice, setRebuyPrice] = useState('');
  const [prizeCount, setPrizeCount] = useState(3);
  const [prizePercentages, setPrizePercentages] = useState<string[]>(['50', '30', '20']);
  const [blindLevelMinutes, setBlindLevelMinutes] = useState(0);
  const [startBlind, setStartBlind] = useState('25');
  const [blindIncrement, setBlindIncrement] = useState('25');

  function showError(msg: string) {
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Fejl', msg);
    }
  }

  function addPlayer() {
    const name = playerNameInput.trim();
    if (!name) return;
    if (players.find((p) => p.name.toLowerCase() === name.toLowerCase())) {
      showError('En spiller med dette navn er allerede tilføjet.');
      return;
    }
    setPlayers((prev) => [...prev, { id: genId(), name, rebuys: 0 }]);
    setPlayerNameInput('');
  }

  function removePlayer(id: string) {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }

  function handlePrizeCountChange(count: number) {
    setPrizeCount(count);
    const preset = DEFAULT_PRIZE_PRESETS[count];
    if (preset) {
      setPrizePercentages(preset.map(String));
    } else {
      const even = Math.floor(100 / count);
      const remainder = 100 - even * count;
      setPrizePercentages(
        Array.from({ length: count }, (_, i) => String(i === 0 ? even + remainder : even)),
      );
    }
  }

  function updatePercentage(index: number, value: string) {
    setPrizePercentages((prev) => prev.map((p, i) => (i === index ? value : p)));
  }

  function totalPercentage(): number {
    return prizePercentages.slice(0, prizeCount).reduce((sum, p) => sum + (parseInt(p) || 0), 0);
  }

  function validate(): string | null {
    if (players.length < 2) return 'Tilføj mindst 2 spillere.';
    if (!buyInPrice || isNaN(Number(buyInPrice)) || Number(buyInPrice) <= 0)
      return 'Angiv en gyldig buy-in pris.';
    if (!rebuyPrice || isNaN(Number(rebuyPrice)) || Number(rebuyPrice) <= 0)
      return 'Angiv en gyldig rebuy pris.';
    if (prizeCount > players.length)
      return `Du kan ikke have flere præmier (${prizeCount}) end spillere (${players.length}).`;
    if (totalPercentage() !== 100)
      return `Præmieprocenterne skal give 100% (nu: ${totalPercentage()}%).`;
    return null;
  }

  function handleStart() {
    const error = validate();
    if (error) {
      showError(error);
      return;
    }

    const prizeDistribution: PrizePlace[] = prizePercentages.slice(0, prizeCount).map((p, i) => ({
      place: i + 1,
      percentage: parseInt(p),
    }));

    startTournament({
      players,
      buyInPrice: Number(buyInPrice),
      rebuyPrice: Number(rebuyPrice),
      prizeDistribution,
      blindLevelMinutes,
      startBlind: Number(startBlind) || 0,
      blindIncrement: Number(blindIncrement) || 0,
    });

    navigation.replace('ActiveTournament');
  }

  const pctTotal = totalPercentage();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {group && (
          <View style={styles.groupBanner}>
            <Ionicons name="people" size={18} color={Colors.purple} />
            <Text style={styles.groupBannerText}>Hold: {group.name}</Text>
          </View>
        )}

        <Section title="Spillere">
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Tilføj ekstra spiller..."
              placeholderTextColor={Colors.textDim}
              value={playerNameInput}
              onChangeText={setPlayerNameInput}
              onSubmitEditing={addPlayer}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addButton} onPress={addPlayer}>
              <Ionicons name="add" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {players.length === 0 && (
            <Text style={styles.emptyHint}>Ingen spillere endnu – tilføj mindst 2</Text>
          )}

          {players.map((player) => (
            <View key={player.id} style={styles.playerRow}>
              <Text style={styles.playerIcon}>🂣</Text>
              <Text style={styles.playerName}>{player.name}</Text>
              <TouchableOpacity onPress={() => removePlayer(player.id)} style={styles.removeBtn}>
                <Ionicons name="trash-outline" size={18} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          ))}

          <Text style={styles.countLabel}>{players.length} spiller{players.length !== 1 ? 'e' : ''}</Text>
        </Section>

        <Section title="Betalinger">
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Buy-in (kr.)</Text>
              <TextInput
                style={styles.input}
                placeholder="500"
                placeholderTextColor={Colors.textDim}
                keyboardType="numeric"
                value={buyInPrice}
                onChangeText={setBuyInPrice}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Rebuy (kr.)</Text>
              <TextInput
                style={styles.input}
                placeholder="250"
                placeholderTextColor={Colors.textDim}
                keyboardType="numeric"
                value={rebuyPrice}
                onChangeText={setRebuyPrice}
              />
            </View>
          </View>
        </Section>

        <Section title="Præmiefordeling">
          <Text style={styles.label}>Antal præmiepladser</Text>
          <View style={styles.prizeCountRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.prizeCountBtn, prizeCount === n && styles.prizeCountBtnActive]}
                onPress={() => handlePrizeCountChange(n)}
              >
                <Text style={[styles.prizeCountBtnText, prizeCount === n && styles.prizeCountBtnTextActive]}>
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.prizeMedals}>
            {Array.from({ length: prizeCount }, (_, i) => (
              <View key={i} style={styles.prizeInputRow}>
                <Text style={styles.placeMedal}>{getMedal(i + 1)}</Text>
                <Text style={styles.placeLabel}>{i + 1}. plads</Text>
                <View style={styles.pctInputContainer}>
                  <TextInput
                    style={styles.pctInput}
                    keyboardType="numeric"
                    value={prizePercentages[i] ?? ''}
                    onChangeText={(v) => updatePercentage(i, v)}
                    maxLength={3}
                  />
                  <Text style={styles.pctSign}>%</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={[styles.totalRow, pctTotal !== 100 && styles.totalRowError]}>
            <Text style={[styles.totalLabel, pctTotal !== 100 && styles.totalLabelError]}>
              Total: {pctTotal}% {pctTotal === 100 ? '✓' : `(mangler ${100 - pctTotal}%)`}
            </Text>
          </View>
        </Section>

        {/* BLIND TIMER */}
        <Section title="Blind timer">
          <Text style={styles.label}>Tid per blind niveau</Text>
          <View style={styles.blindRow}>
            {[0, 1, 5, 10, 15, 20, 25, 30].map((min) => (
              <TouchableOpacity
                key={min}
                style={[styles.blindBtn, blindLevelMinutes === min && styles.blindBtnActive]}
                onPress={() => setBlindLevelMinutes(min)}
              >
                <Text style={[styles.blindBtnText, blindLevelMinutes === min && styles.blindBtnTextActive]}>
                  {min === 0 ? 'Ingen' : `${min} min`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {blindLevelMinutes > 0 && (
            <Text style={styles.blindHint}>
              ⏱ Alarm lyder hvert {blindLevelMinutes}. minut — stopper ikke før du trykker
            </Text>
          )}

          <View style={[styles.row, { marginTop: 16 }]}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Startblind (kr.)</Text>
              <TextInput
                style={styles.input}
                placeholder="25"
                placeholderTextColor={Colors.textDim}
                keyboardType="numeric"
                value={startBlind}
                onChangeText={setStartBlind}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Stiger med (kr.)</Text>
              <TextInput
                style={styles.input}
                placeholder="25"
                placeholderTextColor={Colors.textDim}
                keyboardType="numeric"
                value={blindIncrement}
                onChangeText={setBlindIncrement}
              />
            </View>
          </View>
        </Section>

        <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.8}>
          <Ionicons name="play" size={20} color={Colors.white} />
          <Text style={styles.startButtonText}>Start turnering</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
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
  scroll: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16 },
  groupBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.cardAlt, borderRadius: 12, padding: 12,
    marginBottom: 20, gap: 8, borderWidth: 1, borderColor: Colors.purple,
  },
  groupBannerText: { color: Colors.purple, fontWeight: '600', fontSize: 15 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  card: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  input: {
    backgroundColor: Colors.cardAlt, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    color: Colors.text, fontSize: 16, borderWidth: 1, borderColor: Colors.border,
  },
  addButton: {
    backgroundColor: Colors.primary, borderRadius: 10, padding: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  emptyHint: { color: Colors.textDim, fontSize: 14, marginBottom: 8, textAlign: 'center' },
  playerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  playerIcon: { fontSize: 20, marginRight: 10 },
  playerName: { flex: 1, color: Colors.text, fontSize: 16 },
  removeBtn: { padding: 4 },
  countLabel: { color: Colors.textMuted, fontSize: 13, marginTop: 10, textAlign: 'right' },
  row: { flexDirection: 'row' },
  inputGroup: { marginBottom: 4 },
  label: { color: Colors.textMuted, fontSize: 14, marginBottom: 8 },
  prizeCountRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  prizeCountBtn: {
    width: 44, height: 44, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.cardAlt, borderWidth: 1, borderColor: Colors.border,
  },
  prizeCountBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  prizeCountBtnText: { color: Colors.textMuted, fontSize: 16, fontWeight: '600' },
  prizeCountBtnTextActive: { color: Colors.white },
  prizeMedals: { gap: 10 },
  prizeInputRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  placeMedal: { fontSize: 22, width: 30 },
  placeLabel: { flex: 1, color: Colors.text, fontSize: 15 },
  pctInputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.cardAlt, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  pctInput: { color: Colors.text, fontSize: 16, minWidth: 40, textAlign: 'right' },
  pctSign: { color: Colors.textMuted, fontSize: 16, marginLeft: 4 },
  totalRow: {
    marginTop: 16, padding: 10, borderRadius: 10,
    backgroundColor: Colors.cardAlt, alignItems: 'center',
  },
  totalRowError: { backgroundColor: '#3d1515' },
  totalLabel: { color: Colors.success, fontWeight: '600', fontSize: 15 },
  totalLabelError: { color: Colors.danger },
  blindRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  blindBtn: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10,
    backgroundColor: Colors.cardAlt, borderWidth: 1, borderColor: Colors.border,
  },
  blindBtnActive: { backgroundColor: Colors.warning, borderColor: Colors.warning },
  blindBtnText: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },
  blindBtnTextActive: { color: '#1a1a1a' },
  blindHint: { color: Colors.warning, fontSize: 13, marginTop: 4 },
  startButton: {
    backgroundColor: Colors.success, borderRadius: 16, padding: 18,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 10, marginTop: 8,
  },
  startButtonText: { color: Colors.white, fontSize: 18, fontWeight: '700' },
});

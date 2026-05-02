import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Vibration,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { GameStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../theme/colors';
import { useTournament } from '../context/TournamentContext';
import { calculatePlayerInvestment, calculateTotalPot, formatCurrency } from '../utils/calculations';
import { Player } from '../types';

type Props = NativeStackScreenProps<GameStackParamList, 'ActiveTournament'>;

function webConfirm(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: 'Annuller', style: 'cancel' },
      { text: 'Bekræft', onPress: onConfirm },
    ]);
  }
}

// Returns a stop function. Plays looping beep on web, vibration on native.
function startAlarm(): () => void {
  if (Platform.OS !== 'web') {
    Vibration.vibrate([400, 300, 400, 300, 400, 300], true);
    return () => Vibration.cancel();
  }
  try {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return () => {};
    const ctx = new AudioCtx() as AudioContext;
    let stopped = false;

    const beep = (startTime: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.6, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
      osc.start(startTime);
      osc.stop(startTime + 0.35);
    };

    const schedule = () => {
      if (stopped) return;
      const now = ctx.currentTime;
      beep(now);
      beep(now + 0.45);
      beep(now + 0.90);
      setTimeout(schedule, 1600);
    };
    schedule();

    return () => {
      stopped = true;
      ctx.close();
    };
  } catch {
    return () => {};
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ActiveTournamentScreen({ navigation }: Props) {
  const { activeTournament, addPlayer, removePlayer, addRebuy } = useTournament();
  const [editMode, setEditMode] = useState(false);
  const [addPlayerModalVisible, setAddPlayerModalVisible] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');

  // Blind timer
  const blindMinutes = activeTournament?.blindLevelMinutes ?? 0;
  const totalSeconds = blindMinutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [blindLevel, setBlindLevel] = useState(1);
  const [alarmVisible, setAlarmVisible] = useState(false);
  const stopAlarmRef = useRef<(() => void) | null>(null);

  // Countdown tick
  useEffect(() => {
    if (blindMinutes === 0) return;
    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [blindLevel, blindMinutes]);

  // Fire alarm when time hits 0
  useEffect(() => {
    if (blindMinutes === 0 || secondsLeft > 0) return;
    stopAlarmRef.current = startAlarm();
    setAlarmVisible(true);
  }, [secondsLeft, blindMinutes]);

  const dismissAlarm = useCallback(() => {
    stopAlarmRef.current?.();
    stopAlarmRef.current = null;
    setAlarmVisible(false);
    setBlindLevel((l) => l + 1);
    setSecondsLeft(totalSeconds);
  }, [totalSeconds]);

  if (!activeTournament) return null;

  const { players, buyInPrice, rebuyPrice, prizeDistribution } = activeTournament;
  const totalPot = calculateTotalPot(players, buyInPrice, rebuyPrice);
  const timerProgress = blindMinutes > 0 ? secondsLeft / totalSeconds : 0;
  const timerColor = secondsLeft <= 60 ? Colors.danger : secondsLeft <= 120 ? Colors.warning : Colors.success;

  function handleAddPlayer() {
    const name = newPlayerName.trim();
    if (!name) return;
    if (players.find((p) => p.name.toLowerCase() === name.toLowerCase())) {
      if (Platform.OS === 'web') {
        window.alert('Der er allerede en spiller med dette navn.');
      } else {
        Alert.alert('Fejl', 'Der er allerede en spiller med dette navn.');
      }
      return;
    }
    addPlayer(name);
    setNewPlayerName('');
    setAddPlayerModalVisible(false);
  }

  function handleRemovePlayer(player: Player) {
    webConfirm(
      'Fjern spiller',
      `Er du sikker på at du vil fjerne ${player.name} fra turneringen?`,
      () => removePlayer(player.id),
    );
  }

  function handleRebuy(player: Player) {
    webConfirm(
      'Rebuy',
      `${player.name} rebuy for ${formatCurrency(rebuyPrice)}?`,
      () => addRebuy(player.id),
    );
  }

  function handleEndTournament() {
    if (players.length < 2) {
      if (Platform.OS === 'web') {
        window.alert('Der skal være mindst 2 spillere for at afslutte turneringen.');
      } else {
        Alert.alert('Fejl', 'Der skal være mindst 2 spillere for at afslutte turneringen.');
      }
      return;
    }
    webConfirm(
      'Afslut turnering?',
      'Er du klar til at afslutte turneringen og fordele præmierne?',
      () => navigation.navigate('EndTournament'),
    );
  }

  return (
    <View style={styles.container}>
      {/* ALARM MODAL */}
      <Modal visible={alarmVisible} transparent animationType="fade" onRequestClose={dismissAlarm}>
        <View style={styles.alarmOverlay}>
          <View style={styles.alarmBox}>
            <Text style={styles.alarmEmoji}>🔔</Text>
            <Text style={styles.alarmTitle}>Blinds stiger!</Text>
            <Text style={styles.alarmLevel}>Niveau {blindLevel + 1}</Text>
            <TouchableOpacity style={styles.alarmBtn} onPress={dismissAlarm} activeOpacity={0.8}>
              <Text style={styles.alarmBtnText}>OK — sluk alarm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* POT SUMMARY */}
      <View style={styles.potCard}>
        <View style={styles.potRow}>
          <View style={styles.potItem}>
            <Text style={styles.potLabel}>Pulje</Text>
            <Text style={styles.potAmount}>{formatCurrency(totalPot)}</Text>
          </View>
          <View style={styles.potDivider} />
          <View style={styles.potItem}>
            <Text style={styles.potLabel}>Buy-in</Text>
            <Text style={styles.potValue}>{formatCurrency(buyInPrice)}</Text>
          </View>
          <View style={styles.potDivider} />
          <View style={styles.potItem}>
            <Text style={styles.potLabel}>Rebuy</Text>
            <Text style={styles.potValue}>{formatCurrency(rebuyPrice)}</Text>
          </View>
        </View>
        <View style={styles.prizeRow}>
          {prizeDistribution.map((p) => (
            <View key={p.place} style={styles.prizePill}>
              <Text style={styles.prizePillText}>
                {getMedal(p.place)} {formatCurrency(Math.round((totalPot * p.percentage) / 100))}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* BLIND TIMER */}
      {blindMinutes > 0 && (
        <View style={styles.timerCard}>
          <View style={styles.timerRow}>
            <View>
              <Text style={styles.timerLabel}>Blind niveau {blindLevel}</Text>
              <Text style={[styles.timerTime, { color: timerColor }]}>{formatTime(secondsLeft)}</Text>
            </View>
            <View style={styles.timerRight}>
              <Text style={styles.timerNextLabel}>Næste niveau om</Text>
              <Text style={[styles.timerNextTime, { color: timerColor }]}>{formatTime(secondsLeft)}</Text>
            </View>
          </View>
          {/* Progress bar */}
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${timerProgress * 100}%` as any, backgroundColor: timerColor }]} />
          </View>
        </View>
      )}

      {/* PLAYERS HEADER */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Spillere ({players.length})</Text>
        <View style={styles.headerActions}>
          {editMode && (
            <TouchableOpacity
              style={styles.addPlayerBtn}
              onPress={() => setAddPlayerModalVisible(true)}
            >
              <Ionicons name="person-add-outline" size={18} color={Colors.white} />
              <Text style={styles.addPlayerBtnText}>Tilføj</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.editBtn, editMode && styles.editBtnActive]}
            onPress={() => setEditMode((v) => !v)}
          >
            <Ionicons
              name={editMode ? 'checkmark' : 'pencil'}
              size={16}
              color={editMode ? Colors.white : Colors.text}
            />
            <Text style={[styles.editBtnText, editMode && styles.editBtnTextActive]}>
              {editMode ? 'Færdig' : 'Rediger'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* PLAYERS LIST */}
      <ScrollView style={styles.playersList} contentContainerStyle={{ paddingBottom: 120 }}>
        {players.map((player) => {
          const invested = calculatePlayerInvestment(player, buyInPrice, rebuyPrice);
          return (
            <View key={player.id} style={styles.playerCard}>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player.name}</Text>
                <View style={styles.playerStats}>
                  <Text style={styles.investedText}>Indbetalt: {formatCurrency(invested)}</Text>
                  {player.rebuys > 0 && (
                    <View style={styles.rebuyBadge}>
                      <Text style={styles.rebuyBadgeText}>
                        {player.rebuys} rebuy{player.rebuys !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.playerActions}>
                <TouchableOpacity
                  style={styles.rebuyButton}
                  onPress={() => handleRebuy(player)}
                >
                  <Ionicons name="refresh-circle-outline" size={16} color={Colors.warning} />
                  <Text style={styles.rebuyButtonText}>Rebuy</Text>
                </TouchableOpacity>
                {editMode && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemovePlayer(player)}
                  >
                    <Ionicons name="remove-circle-outline" size={24} color={Colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* END BUTTON */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.endButton} onPress={handleEndTournament} activeOpacity={0.8}>
          <Ionicons name="flag" size={20} color={Colors.white} />
          <Text style={styles.endButtonText}>Afslut turnering</Text>
        </TouchableOpacity>
      </View>

      {/* ADD PLAYER MODAL */}
      <Modal
        visible={addPlayerModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddPlayerModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tilføj spiller</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Spillerens navn"
              placeholderTextColor={Colors.textDim}
              value={newPlayerName}
              onChangeText={setNewPlayerName}
              autoFocus
              onSubmitEditing={handleAddPlayer}
              returnKeyType="done"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setAddPlayerModalVisible(false);
                  setNewPlayerName('');
                }}
              >
                <Text style={styles.modalCancelText}>Annuller</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleAddPlayer}>
                <Text style={styles.modalConfirmText}>Tilføj</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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

  // Alarm
  alarmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  alarmBox: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    width: '100%',
    borderWidth: 2,
    borderColor: Colors.warning,
    gap: 12,
  },
  alarmEmoji: { fontSize: 64 },
  alarmTitle: { color: Colors.warning, fontSize: 28, fontWeight: '800' },
  alarmLevel: { color: Colors.textMuted, fontSize: 18, fontWeight: '600' },
  alarmBtn: {
    marginTop: 12,
    backgroundColor: Colors.warning,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
  },
  alarmBtnText: { color: '#1a1a1a', fontSize: 18, fontWeight: '800' },

  // Timer
  timerCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  timerLabel: { color: Colors.textMuted, fontSize: 12, marginBottom: 2 },
  timerTime: { fontSize: 32, fontWeight: '800', fontVariant: ['tabular-nums'] as any },
  timerRight: { alignItems: 'flex-end' },
  timerNextLabel: { color: Colors.textMuted, fontSize: 12, marginBottom: 2 },
  timerNextTime: { fontSize: 18, fontWeight: '700' },
  progressBg: { height: 6, backgroundColor: Colors.cardAlt, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },

  // Pot
  potCard: {
    margin: 16,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  potRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  potItem: { flex: 1, alignItems: 'center' },
  potDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: 8 },
  potLabel: { color: Colors.textMuted, fontSize: 12, marginBottom: 4 },
  potAmount: { color: Colors.gold, fontSize: 22, fontWeight: '800' },
  potValue: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  prizeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  prizePill: {
    backgroundColor: Colors.cardAlt,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  prizePillText: { color: Colors.text, fontSize: 13, fontWeight: '600' },

  // Players
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addPlayerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.purple,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
  },
  addPlayerBtnText: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardAlt,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editBtnActive: { backgroundColor: Colors.success, borderColor: Colors.success },
  editBtnText: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  editBtnTextActive: { color: Colors.white },
  playersList: { flex: 1, paddingHorizontal: 16 },
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
  playerInfo: { flex: 1 },
  playerName: { color: Colors.text, fontSize: 17, fontWeight: '600', marginBottom: 4 },
  playerStats: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  investedText: { color: Colors.textMuted, fontSize: 13 },
  rebuyBadge: {
    backgroundColor: '#3d2800',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  rebuyBadgeText: { color: Colors.warning, fontSize: 11, fontWeight: '600' },
  playerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rebuyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3d2800',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  rebuyButtonText: { color: Colors.warning, fontSize: 13, fontWeight: '600' },
  removeButton: { padding: 4 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  endButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  endButtonText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { color: Colors.text, fontSize: 20, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  modalInput: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 12,
    padding: 14,
    color: Colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: {
    flex: 1, padding: 14, borderRadius: 12,
    backgroundColor: Colors.cardAlt, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  modalCancelText: { color: Colors.textMuted, fontSize: 16, fontWeight: '600' },
  modalConfirmBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center' },
  modalConfirmText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
});

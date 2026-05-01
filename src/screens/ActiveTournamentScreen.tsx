import React, { useState } from 'react';
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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { GameStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../theme/colors';
import { useTournament } from '../context/TournamentContext';
import { calculatePlayerInvestment, calculateTotalPot, formatCurrency } from '../utils/calculations';
import { Player } from '../types';

type Props = NativeStackScreenProps<GameStackParamList, 'ActiveTournament'>;

export default function ActiveTournamentScreen({ navigation }: Props) {
  const { activeTournament, addPlayer, removePlayer, addRebuy } = useTournament();
  const [addPlayerModalVisible, setAddPlayerModalVisible] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');

  if (!activeTournament) return null;

  const { players, buyInPrice, rebuyPrice, prizeDistribution } = activeTournament;
  const totalPot = calculateTotalPot(players, buyInPrice, rebuyPrice);

  function handleAddPlayer() {
    const name = newPlayerName.trim();
    if (!name) return;
    if (players.find((p) => p.name.toLowerCase() === name.toLowerCase())) {
      Alert.alert('Fejl', 'Der er allerede en spiller med dette navn.');
      return;
    }
    addPlayer(name);
    setNewPlayerName('');
    setAddPlayerModalVisible(false);
  }

  function handleRemovePlayer(player: Player) {
    Alert.alert(
      'Fjern spiller',
      `Er du sikker på at du vil fjerne ${player.name} fra turneringen?`,
      [
        { text: 'Annuller', style: 'cancel' },
        { text: 'Fjern', style: 'destructive', onPress: () => removePlayer(player.id) },
      ],
    );
  }

  function handleRebuy(player: Player) {
    Alert.alert(
      'Rebuy',
      `${player.name} rebuy for ${formatCurrency(rebuyPrice)}?`,
      [
        { text: 'Annuller', style: 'cancel' },
        { text: 'Bekræft', onPress: () => addRebuy(player.id) },
      ],
    );
  }

  function handleEndTournament() {
    if (players.length < 2) {
      Alert.alert('Fejl', 'Der skal være mindst 2 spillere for at afslutte turneringen.');
      return;
    }
    Alert.alert(
      'Afslut turnering?',
      'Er du klar til at afslutte turneringen og fordele præmierne?',
      [
        { text: 'Annuller', style: 'cancel' },
        { text: 'Afslut', onPress: () => navigation.navigate('EndTournament') },
      ],
    );
  }

  return (
    <View style={styles.container}>
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

      {/* PLAYERS LIST */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Spillere ({players.length})</Text>
        <TouchableOpacity
          style={styles.addPlayerBtn}
          onPress={() => setAddPlayerModalVisible(true)}
        >
          <Ionicons name="person-add-outline" size={18} color={Colors.white} />
          <Text style={styles.addPlayerBtnText}>Tilføj</Text>
        </TouchableOpacity>
      </View>

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
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemovePlayer(player)}
                >
                  <Ionicons name="remove-circle-outline" size={20} color={Colors.danger} />
                </TouchableOpacity>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: { color: Colors.text, fontSize: 18, fontWeight: '700' },
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
    paddingBottom: 40,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
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
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.cardAlt,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalCancelText: { color: Colors.textMuted, fontSize: 16, fontWeight: '600' },
  modalConfirmBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  modalConfirmText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
});

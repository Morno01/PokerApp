import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { GameStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../theme/colors';
import { useTournament } from '../context/TournamentContext';
import { useGroups } from '../context/GroupContext';

type Props = NativeStackScreenProps<GameStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { activeTournament } = useTournament();
  const { groups, createGroup, removeGroup } = useGroups();
  const [modalVisible, setModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  React.useEffect(() => {
    if (activeTournament) {
      navigation.replace('ActiveTournament');
    }
  }, [activeTournament]);

  function handleCreateGroup() {
    const name = newGroupName.trim();
    if (!name) return;
    const group = createGroup(name);
    setNewGroupName('');
    setModalVisible(false);
    navigation.navigate('GroupDetail', { groupId: group.id });
  }

  function handleDeleteGroup(id: string, name: string) {
    if (Platform.OS === 'web') {
      if (window.confirm(`Slet holdet "${name}"?`)) removeGroup(id);
    } else {
      Alert.alert('Slet hold', `Slet holdet "${name}"?`, [
        { text: 'Annuller', style: 'cancel' },
        { text: 'Slet', style: 'destructive', onPress: () => removeGroup(id) },
      ]);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🂣 PokerNat</Text>
        <Text style={styles.subtitle}>Vælg et hold for at starte en turnering</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {groups.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={styles.emptyTitle}>Ingen hold endnu</Text>
            <Text style={styles.emptyText}>Opret dit første hold for at komme i gang</Text>
          </View>
        )}

        {groups.map((group) => (
          <View key={group.id} style={styles.groupCard}>
            <TouchableOpacity
              style={styles.groupMain}
              onPress={() => navigation.navigate('GroupDetail', { groupId: group.id })}
              activeOpacity={0.8}
            >
              <View style={styles.groupIcon}>
                <Text style={styles.groupEmoji}>♠️</Text>
              </View>
              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupMembers}>
                  {group.members.length === 0
                    ? 'Ingen medlemmer endnu'
                    : `${group.members.length} medlem${group.members.length !== 1 ? 'mer' : ''}: ${group.members.slice(0, 3).join(', ')}${group.members.length > 3 ? '...' : ''}`}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.groupActions}>
              <TouchableOpacity
                style={styles.startBtn}
                onPress={() => navigation.navigate('TournamentSetup', { groupId: group.id })}
                activeOpacity={0.8}
              >
                <Ionicons name="play" size={14} color={Colors.white} />
                <Text style={styles.startBtnText}>Start turnering</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDeleteGroup(group.id, group.name)}
              >
                <Ionicons name="trash-outline" size={16} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color={Colors.white} />
        <Text style={styles.fabText}>Opret hold</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nyt hold</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Holdets navn (f.eks. Fredagsholdet)"
              placeholderTextColor={Colors.textDim}
              value={newGroupName}
              onChangeText={setNewGroupName}
              autoFocus
              onSubmitEditing={handleCreateGroup}
              returnKeyType="done"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => { setModalVisible(false); setNewGroupName(''); }}
              >
                <Text style={styles.modalCancelText}>Annuller</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleCreateGroup}>
                <Text style={styles.modalConfirmText}>Opret</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingTop: 24, paddingBottom: 16, paddingHorizontal: 24, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: Colors.text, marginBottom: 6 },
  subtitle: { fontSize: 15, color: Colors.textMuted, textAlign: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: 15, color: Colors.textMuted, textAlign: 'center' },
  groupCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    overflow: 'hidden',
  },
  groupMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  groupIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.cardAlt,
    justifyContent: 'center', alignItems: 'center',
  },
  groupEmoji: { fontSize: 24 },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 3 },
  groupMembers: { fontSize: 13, color: Colors.textMuted },
  groupActions: {
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingHorizontal: 16, paddingVertical: 10, gap: 10,
  },
  startBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 10, gap: 6,
  },
  startBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  deleteBtn: { padding: 8 },
  fab: {
    position: 'absolute', bottom: 24, left: 24, right: 24,
    backgroundColor: Colors.purple, borderRadius: 14, padding: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  fabText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalTitle: { color: Colors.text, fontSize: 20, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  modalInput: {
    backgroundColor: Colors.cardAlt, borderRadius: 12, padding: 14,
    color: Colors.text, fontSize: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 16,
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: {
    flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.cardAlt,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  modalCancelText: { color: Colors.textMuted, fontSize: 16, fontWeight: '600' },
  modalConfirmBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center' },
  modalConfirmText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
});

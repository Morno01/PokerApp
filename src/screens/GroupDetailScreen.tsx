import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { GameStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../theme/colors';
import { useGroups } from '../context/GroupContext';

type Props = NativeStackScreenProps<GameStackParamList, 'GroupDetail'>;

export default function GroupDetailScreen({ route, navigation }: Props) {
  const { groupId } = route.params;
  const { groups, updateGroup } = useGroups();
  const group = groups.find((g) => g.id === groupId);

  const [newMember, setNewMember] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(group?.name ?? '');

  if (!group) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Hold ikke fundet.</Text>
      </View>
    );
  }

  function handleAddMember() {
    const name = newMember.trim();
    if (!name) return;
    if (group!.members.some((m) => m.toLowerCase() === name.toLowerCase())) {
      if (Platform.OS === 'web') {
        window.alert('Et medlem med dette navn er allerede tilføjet.');
      } else {
        Alert.alert('Fejl', 'Et medlem med dette navn er allerede tilføjet.');
      }
      return;
    }
    updateGroup({ ...group!, members: [...group!.members, name] });
    setNewMember('');
  }

  function handleRemoveMember(name: string) {
    updateGroup({ ...group!, members: group!.members.filter((m) => m !== name) });
  }

  function handleSaveName() {
    const name = nameInput.trim();
    if (!name) return;
    updateGroup({ ...group!, name });
    setEditingName(false);
    navigation.setOptions({ title: name });
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Holdnavn</Text>
          <View style={styles.card}>
            {editingName ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={nameInput}
                  onChangeText={setNameInput}
                  autoFocus
                  onSubmitEditing={handleSaveName}
                  returnKeyType="done"
                  placeholderTextColor={Colors.textDim}
                />
                <TouchableOpacity style={styles.saveNameBtn} onPress={handleSaveName}>
                  <Ionicons name="checkmark" size={20} color={Colors.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.nameRow} onPress={() => setEditingName(true)}>
                <Text style={styles.nameText}>{group.name}</Text>
                <Ionicons name="pencil" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medlemmer ({group.members.length})</Text>
          <View style={styles.card}>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Tilføj medlem..."
                placeholderTextColor={Colors.textDim}
                value={newMember}
                onChangeText={setNewMember}
                onSubmitEditing={handleAddMember}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.addBtn} onPress={handleAddMember}>
                <Ionicons name="add" size={22} color={Colors.white} />
              </TouchableOpacity>
            </View>

            {group.members.length === 0 ? (
              <Text style={styles.emptyHint}>Ingen medlemmer endnu — tilføj spillere til holdet</Text>
            ) : (
              group.members.map((member) => (
                <View key={member} style={styles.memberRow}>
                  <Text style={styles.memberEmoji}>👤</Text>
                  <Text style={styles.memberName}>{member}</Text>
                  <TouchableOpacity onPress={() => handleRemoveMember(member)} style={styles.removeBtn}>
                    <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => navigation.navigate('TournamentSetup', { groupId: group.id })}
          activeOpacity={0.8}
        >
          <Ionicons name="play" size={20} color={Colors.white} />
          <Text style={styles.startBtnText}>Start turnering med dette hold</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  errorText: { color: Colors.textMuted, fontSize: 16 },
  content: { padding: 16, paddingBottom: 100 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  card: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nameText: { flex: 1, fontSize: 18, fontWeight: '600', color: Colors.text },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  saveNameBtn: {
    backgroundColor: Colors.success, borderRadius: 10, padding: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  input: {
    backgroundColor: Colors.cardAlt, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    color: Colors.text, fontSize: 16, borderWidth: 1, borderColor: Colors.border,
  },
  addBtn: {
    backgroundColor: Colors.primary, borderRadius: 10, padding: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  emptyHint: { color: Colors.textDim, fontSize: 14, textAlign: 'center', paddingVertical: 8 },
  memberRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.border, gap: 10,
  },
  memberEmoji: { fontSize: 18 },
  memberName: { flex: 1, color: Colors.text, fontSize: 16 },
  removeBtn: { padding: 4 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, paddingBottom: 32,
    backgroundColor: Colors.bg, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  startBtn: {
    backgroundColor: Colors.primary, borderRadius: 14, padding: 18,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
  },
  startBtnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
});

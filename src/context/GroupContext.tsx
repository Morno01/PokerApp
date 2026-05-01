import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Group } from '../types';
import { loadGroups, saveGroup, deleteGroup } from '../firebase/localService';

let idCounter = 0;
function generateId(): string {
  return `group-${Date.now()}-${++idCounter}`;
}

interface GroupContextValue {
  groups: Group[];
  createGroup: (name: string) => Group;
  updateGroup: (group: Group) => void;
  removeGroup: (id: string) => void;
}

const GroupContext = createContext<GroupContextValue | null>(null);

export function GroupProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<Group[]>(() => loadGroups());

  function createGroup(name: string): Group {
    const group: Group = { id: generateId(), name, members: [] };
    saveGroup(group);
    setGroups((prev) => [...prev, group]);
    return group;
  }

  function updateGroup(group: Group) {
    saveGroup(group);
    setGroups((prev) => prev.map((g) => (g.id === group.id ? group : g)));
  }

  function removeGroup(id: string) {
    deleteGroup(id);
    setGroups((prev) => prev.filter((g) => g.id !== id));
  }

  return (
    <GroupContext.Provider value={{ groups, createGroup, updateGroup, removeGroup }}>
      {children}
    </GroupContext.Provider>
  );
}

export function useGroups(): GroupContextValue {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error('useGroups must be used within GroupProvider');
  return ctx;
}

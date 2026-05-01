import { CompletedTournament, Group } from '../types';

// localStorage on web, in-memory fallback on native
function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

// ── Tournaments ────────────────────────────────────────────────────────────────────────────

const TOURNAMENTS_KEY = 'pokerapp_tournaments';
let nextId = 1;

function readTournaments(): CompletedTournament[] {
  const raw = storageGet(TOURNAMENTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CompletedTournament[];
    return parsed.map((t) => ({ ...t, date: new Date(t.date) }));
  } catch {
    return [];
  }
}

function writeTournaments(list: CompletedTournament[]) {
  storageSet(TOURNAMENTS_KEY, JSON.stringify(list));
}

export async function saveLocal(tournament: Omit<CompletedTournament, 'id'>): Promise<string> {
  const id = `local-${Date.now()}-${nextId++}`;
  const list = readTournaments();
  list.unshift({ ...tournament, id });
  writeTournaments(list);
  return id;
}

export async function loadLocal(): Promise<CompletedTournament[]> {
  return readTournaments();
}

// ── Groups ────────────────────────────────────────────────────────────────────────────────

const GROUPS_KEY = 'pokerapp_groups';

function readGroups(): Group[] {
  const raw = storageGet(GROUPS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Group[];
  } catch {
    return [];
  }
}

function writeGroups(list: Group[]) {
  storageSet(GROUPS_KEY, JSON.stringify(list));
}

export function loadGroups(): Group[] {
  return readGroups();
}

export function saveGroup(group: Group): void {
  const list = readGroups();
  const idx = list.findIndex((g) => g.id === group.id);
  if (idx >= 0) {
    list[idx] = group;
  } else {
    list.push(group);
  }
  writeGroups(list);
}

export function deleteGroup(id: string): void {
  writeGroups(readGroups().filter((g) => g.id !== id));
}

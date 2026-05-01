import { CompletedTournament } from '../types';

// In-memory store – data nulstilles når appen genstartes
const localTournaments: CompletedTournament[] = [];
let nextId = 1;

export async function saveLocal(
  tournament: Omit<CompletedTournament, 'id'>,
): Promise<string> {
  const id = `local-${nextId++}`;
  localTournaments.unshift({ ...tournament, id });
  return id;
}

export async function loadLocal(): Promise<CompletedTournament[]> {
  return [...localTournaments];
}

import {
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from './config';
import { CompletedTournament, PlayerResult, PrizePlace } from '../types';

function toFirestore(tournament: Omit<CompletedTournament, 'id'>): DocumentData {
  return {
    ...tournament,
    date: Timestamp.fromDate(tournament.date),
  };
}

function fromFirestore(id: string, data: DocumentData): CompletedTournament {
  return {
    id,
    game: data.game,
    date: (data.date as Timestamp).toDate(),
    buyInPrice: data.buyInPrice,
    rebuyPrice: data.rebuyPrice,
    totalPot: data.totalPot,
    playerCount: data.playerCount,
    results: data.results as PlayerResult[],
    prizeDistribution: data.prizeDistribution as PrizePlace[],
  };
}

export async function saveTournament(
  tournament: Omit<CompletedTournament, 'id'>,
): Promise<string> {
  const docRef = await addDoc(collection(db, 'tournaments'), toFirestore(tournament));
  return docRef.id;
}

export async function loadTournaments(): Promise<CompletedTournament[]> {
  const q = query(collection(db, 'tournaments'), orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => fromFirestore(doc.id, doc.data()));
}

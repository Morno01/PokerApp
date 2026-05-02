import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ActiveTournament, Player, PrizePlace } from '../types';

let idCounter = 0;
function generateId(): string {
  return `${Date.now()}-${++idCounter}`;
}

interface TournamentContextValue {
  activeTournament: ActiveTournament | null;
  startTournament: (params: {
    players: Player[];
    buyInPrice: number;
    rebuyPrice: number;
    prizeDistribution: PrizePlace[];
    blindLevelMinutes: number;
    startBlind: number;
    blindIncrement: number;
  }) => void;
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  addRebuy: (id: string) => void;
  clearTournament: () => void;
}

const TournamentContext = createContext<TournamentContextValue | null>(null);

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [activeTournament, setActiveTournament] = useState<ActiveTournament | null>(null);

  function startTournament(params: {
    players: Player[];
    buyInPrice: number;
    rebuyPrice: number;
    prizeDistribution: PrizePlace[];
    blindLevelMinutes: number;
    startBlind: number;
    blindIncrement: number;
  }) {
    setActiveTournament({
      id: generateId(),
      game: 'poker',
      startedAt: new Date(),
      ...params,
    });
  }

  function addPlayer(name: string) {
    setActiveTournament((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        players: [...prev.players, { id: generateId(), name, rebuys: 0 }],
      };
    });
  }

  function removePlayer(id: string) {
    setActiveTournament((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        players: prev.players.filter((p) => p.id !== id),
      };
    });
  }

  function addRebuy(id: string) {
    setActiveTournament((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        players: prev.players.map((p) =>
          p.id === id ? { ...p, rebuys: p.rebuys + 1 } : p,
        ),
      };
    });
  }

  function clearTournament() {
    setActiveTournament(null);
  }

  return (
    <TournamentContext.Provider
      value={{
        activeTournament,
        startTournament,
        addPlayer,
        removePlayer,
        addRebuy,
        clearTournament,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament(): TournamentContextValue {
  const ctx = useContext(TournamentContext);
  if (!ctx) throw new Error('useTournament must be used within TournamentProvider');
  return ctx;
}

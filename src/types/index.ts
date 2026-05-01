export type GameType = 'poker';

export interface Group {
  id: string;
  name: string;
  members: string[];
}

export interface Player {
  id: string;
  name: string;
  rebuys: number;
}

export interface PrizePlace {
  place: number;
  percentage: number;
}

export interface ActiveTournament {
  id: string;
  game: GameType;
  startedAt: Date;
  buyInPrice: number;
  rebuyPrice: number;
  players: Player[];
  prizeDistribution: PrizePlace[];
}

export interface PlayerResult {
  id: string;
  name: string;
  position: number;
  prize: number;
  totalInvested: number;
  profit: number;
  rebuys: number;
}

export interface CompletedTournament {
  id: string;
  game: GameType;
  date: Date;
  buyInPrice: number;
  rebuyPrice: number;
  totalPot: number;
  playerCount: number;
  results: PlayerResult[];
  prizeDistribution: PrizePlace[];
}

export interface PlayerStats {
  name: string;
  firsts: number;
  seconds: number;
  thirds: number;
  totalProfit: number;
  tournamentsPlayed: number;
}

import { Player, PrizePlace, PlayerResult, CompletedTournament, PlayerStats } from '../types';

export function calculatePlayerInvestment(
  player: Player,
  buyInPrice: number,
  rebuyPrice: number,
): number {
  return buyInPrice + player.rebuys * rebuyPrice;
}

export function calculateTotalPot(
  players: Player[],
  buyInPrice: number,
  rebuyPrice: number,
): number {
  return players.reduce(
    (total, p) => total + calculatePlayerInvestment(p, buyInPrice, rebuyPrice),
    0,
  );
}

export function calculatePrizeAmounts(
  totalPot: number,
  prizeDistribution: PrizePlace[],
): { place: number; amount: number }[] {
  return prizeDistribution.map((p) => ({
    place: p.place,
    amount: Math.round((totalPot * p.percentage) / 100),
  }));
}

export function calculateResults(
  assignments: { player: Player; position: number }[],
  allPlayers: Player[],
  buyInPrice: number,
  rebuyPrice: number,
  prizeDistribution: PrizePlace[],
  totalPot: number,
): PlayerResult[] {
  const prizes = calculatePrizeAmounts(totalPot, prizeDistribution);

  const assignedIds = new Set(assignments.map((a) => a.player.id));
  const unassigned = allPlayers
    .filter((p) => !assignedIds.has(p.id))
    .map((p, i) => ({ player: p, position: assignments.length + 1 + i }));

  const allRanked = [...assignments, ...unassigned];
  let nextPos = assignments.length + 1;
  const results: PlayerResult[] = allRanked.map(({ player, position }) => {
    const invested = calculatePlayerInvestment(player, buyInPrice, rebuyPrice);
    const prizeEntry = prizes.find((pr) => pr.place === position);
    const prize = prizeEntry?.amount ?? 0;
    return {
      id: player.id,
      name: player.name,
      position,
      prize,
      totalInvested: invested,
      profit: prize - invested,
      rebuys: player.rebuys,
    };
  });

  return results.sort((a, b) => a.position - b.position);
}

export function computePlayerStats(tournaments: CompletedTournament[]): PlayerStats[] {
  const statsMap = new Map<string, PlayerStats>();

  for (const t of tournaments) {
    for (const r of t.results) {
      const key = r.name.toLowerCase().trim();
      if (!statsMap.has(key)) {
        statsMap.set(key, {
          name: r.name,
          firsts: 0,
          seconds: 0,
          thirds: 0,
          totalProfit: 0,
          tournamentsPlayed: 0,
        });
      }
      const s = statsMap.get(key)!;
      s.tournamentsPlayed += 1;
      s.totalProfit += r.profit;
      if (r.position === 1) s.firsts += 1;
      if (r.position === 2) s.seconds += 1;
      if (r.position === 3) s.thirds += 1;
    }
  }

  return Array.from(statsMap.values()).sort((a, b) => b.totalProfit - a.totalProfit);
}

export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('da-DK')} kr.`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('da-DK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

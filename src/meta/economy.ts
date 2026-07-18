import type { MapConfig, Rarity, SaveGame } from "../types";

export const EGG_PRICES: Record<Rarity, number> = {
  common: 200,
  rare: 600,
  legendary: 2000,
};

// PokeCoins awarded at the end of a run. Rewards persist even on a loss so
// progress always moves forward (PokePath-style).
export function runPayout(map: MapConfig, wavesCleared: number, bossKills: number): number {
  const base = wavesCleared * 8 * map.rewardMultiplier;
  const bossBonus = bossKills * 30;
  return Math.round(base + bossBonus);
}

// First-clear milestone bonus for beating a new best on a map (per 10 waves).
export function milestoneBonus(previousBest: number, newBest: number): number {
  const prevTier = Math.floor(previousBest / 10);
  const newTier = Math.floor(newBest / 10);
  return Math.max(0, newTier - prevTier) * 150;
}

// Apply a finished run's results to the save (mutates in place).
export function applyRunResult(
  save: SaveGame,
  map: MapConfig,
  wavesCleared: number,
  bossKills: number,
): { coinsEarned: number; newBest: boolean } {
  const previousBest = save.bestWaveByMap[map.id] ?? 0;
  const newBest = wavesCleared > previousBest;
  const payout = runPayout(map, wavesCleared, bossKills);
  const bonus = newBest ? milestoneBonus(previousBest, wavesCleared) : 0;
  const coinsEarned = payout + bonus;

  save.pokeCoins += coinsEarned;
  save.stats.runs += 1;
  save.stats.totalWavesCleared += wavesCleared;
  save.stats.bossesDefeated += bossKills;
  if (wavesCleared >= map.totalWaves) save.stats.victories += 1;
  if (newBest) save.bestWaveByMap[map.id] = wavesCleared;
  return { coinsEarned, newBest };
}

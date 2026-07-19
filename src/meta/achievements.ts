import type { SaveGame } from "../types";

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  isUnlocked: (save: SaveGame) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first_hatch",
    title: "First Steps",
    description: "Hatch your first Pokemon.",
    isUnlocked: (save) => save.stats.hatches >= 1,
  },
  {
    id: "wave_ten",
    title: "Holding the Line",
    description: "Clear wave 10 on any map.",
    isUnlocked: (save) => highestWave(save) >= 10,
  },
  {
    id: "first_boss",
    title: "Boss Breaker",
    description: "Defeat your first boss.",
    isUnlocked: (save) => save.stats.bossesDefeated >= 1,
  },
  {
    id: "first_clear",
    title: "Route Master",
    description: "Clear all 100 waves of a map.",
    isUnlocked: (save) => save.stats.victories >= 1 || highestWave(save) >= 100,
  },
  {
    id: "six_owned",
    title: "Full Party",
    description: "Own at least six Pokemon.",
    isUnlocked: (save) => save.collection.length >= 6,
  },
  {
    id: "hundred_waves",
    title: "Battle Tested",
    description: "Clear 100 waves across all runs.",
    isUnlocked: (save) => save.stats.totalWavesCleared >= 100,
  },
  {
    id: "plateau_champion",
    title: "Plateau Champion",
    description: "Clear wave 100 of Indigo Plateau.",
    isUnlocked: (save) => (save.bestWaveByMap.indigo_plateau ?? 0) >= 100,
  },
];

function highestWave(save: SaveGame): number {
  return Math.max(0, ...Object.values(save.bestWaveByMap));
}

export function unlockedAchievements(save: SaveGame): AchievementDef[] {
  return ACHIEVEMENTS.filter((achievement) => achievement.isUnlocked(save));
}

export function syncAchievements(save: SaveGame): AchievementDef[] {
  const stored = new Set(save.achievements);
  const newlyUnlocked = unlockedAchievements(save).filter((achievement) => !stored.has(achievement.id));
  save.achievements.push(...newlyUnlocked.map((achievement) => achievement.id));
  return newlyUnlocked;
}

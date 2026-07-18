import type { Egg, MapConfig, SaveGame } from "../types";
import { getOwned, grantRunXp } from "./collection";
import { applyRunResult } from "./economy";
import { claimMilestoneDrops } from "./eggs";

export interface CompletedRunResult {
  wavesCleared: number;
  bossKills: number;
  runXpByUid: Record<string, number>;
}

export interface AppliedRunResult {
  coinsEarned: number;
  newBest: boolean;
  eggsGranted: Egg[];
}

export function applyCompletedRun(
  save: SaveGame,
  map: MapConfig,
  result: CompletedRunResult,
): AppliedRunResult {
  const runResult = applyRunResult(save, map, result.wavesCleared, result.bossKills);
  const eggsGranted = runResult.newBest
    ? claimMilestoneDrops(save, map, result.wavesCleared)
    : [];

  for (const [uid, xp] of Object.entries(result.runXpByUid)) {
    const owned = getOwned(save, uid);
    if (owned) grantRunXp(owned, xp);
  }

  return { ...runResult, eggsGranted };
}

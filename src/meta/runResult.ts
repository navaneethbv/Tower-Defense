import type { CapturedPokemon, Egg, MapConfig, SaveGame } from "../types";
import { getOwned, grantRunXp } from "./collection";
import { applyRunResult } from "./economy";
import { applyMilestoneCaptures } from "./milestoneCaptures";

export interface CompletedRunResult {
  wavesCleared: number;
  bossKills: number;
  runXpByUid: Record<string, number>;
  runSeed: number;
}

export interface AppliedRunResult {
  coinsEarned: number;
  newBest: boolean;
  eggsGranted: Egg[];
  captures: CapturedPokemon[];
}

export function applyCompletedRun(
  save: SaveGame,
  map: MapConfig,
  result: CompletedRunResult,
  rand: () => number = Math.random,
): AppliedRunResult {
  const previousBest = save.bestWaveByMap[map.id] ?? 0;
  const runResult = applyRunResult(save, map, result.wavesCleared, result.bossKills);
  const captures = applyMilestoneCaptures(
    save,
    map,
    previousBest,
    result.wavesCleared,
    result.runSeed,
    rand,
  );

  for (const [uid, xp] of Object.entries(result.runXpByUid)) {
    const owned = getOwned(save, uid);
    if (owned) grantRunXp(owned, xp);
  }

  return { ...runResult, eggsGranted: [], captures };
}

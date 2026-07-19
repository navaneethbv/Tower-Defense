import type {
  CapturedPokemon,
  MapConfig,
  MilestoneCaptureRecord,
  SaveGame,
} from "../types";
import { makeOwned, rollIVs } from "./ivs";
import { MILESTONE_WAVES, milestoneFor } from "../waves/milestones";

export const REPEAT_CAPTURE_CHANCE = 0.2;

export function applyMilestoneCaptures(
  save: SaveGame,
  map: MapConfig,
  previousBest: number,
  wavesCleared: number,
  runSeed: number,
  rand: () => number = Math.random,
): CapturedPokemon[] {
  const records: MilestoneCaptureRecord = save.milestoneCapturesByMap;
  const claimed = records[map.id] ?? {};
  records[map.id] = claimed;
  const captures: CapturedPokemon[] = [];

  for (const wave of MILESTONE_WAVES) {
    if (wave > wavesCleared) continue;
    const wasClaimed = claimed[wave] === true;
    const guaranteed = !wasClaimed && previousBest < wave;
    claimed[wave] = true;
    if (!guaranteed && (!wasClaimed || rand() >= REPEAT_CAPTURE_CHANCE)) continue;

    const encounter = milestoneFor(map, wave, runSeed)!;
    const pokemon = makeOwned(encounter.speciesId, rollIVs(rand));
    save.collection.push(pokemon);
    captures.push({ pokemon, wave, tier: encounter.tier, guaranteed });
  }

  return captures;
}

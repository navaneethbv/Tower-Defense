import type { Egg, MapConfig, OwnedPokemon, Rarity, SaveGame } from "../types";
import { baseSpeciesByRarity } from "../data/species";
import { EGG_PRICES } from "./economy";
import { makeOwned, rollIVs } from "./ivs";

// Probability that an egg of a given rarity pulls from each species pool.
// Rows sum to 1. Rarer eggs bias toward rarer pools.
const ROLL_TABLE: Record<Rarity, { common: number; rare: number; legendary: number }> = {
  common: { common: 0.85, rare: 0.15, legendary: 0 },
  rare: { common: 0.3, rare: 0.65, legendary: 0.05 },
  legendary: { common: 0, rare: 0.6, legendary: 0.4 },
};

const TIERS: Rarity[] = ["legendary", "rare", "common"];

// Pick a species pool tier for this egg, falling back to a populated tier if the
// rolled one has no base species yet (legendaries arrive in Phase 5).
function pickTier(eggRarity: Rarity, rand: () => number): Rarity {
  const table = ROLL_TABLE[eggRarity];
  const r = rand();
  let acc = 0;
  const order: Rarity[] = ["legendary", "rare", "common"];
  for (const tier of order) {
    acc += table[tier];
    if (r < acc && baseSpeciesByRarity(tier).length > 0) return tier;
  }
  // Fallback: highest populated tier at or below the egg's rarity.
  for (const tier of TIERS) {
    if (baseSpeciesByRarity(tier).length > 0) return tier;
  }
  throw new Error("No hatchable base species defined");
}

export function rollHatch(eggRarity: Rarity, rand: () => number = Math.random): OwnedPokemon {
  const tier = pickTier(eggRarity, rand);
  const pool = baseSpeciesByRarity(tier);
  const species = pool[Math.floor(rand() * pool.length)]!;
  return makeOwned(species.id, rollIVs(rand));
}

export function canBuyEgg(save: SaveGame, rarity: Rarity): boolean {
  return save.pokeCoins >= EGG_PRICES[rarity];
}

// Purchase an egg into the inventory (hatched separately for the reveal moment).
export function buyEgg(save: SaveGame, rarity: Rarity): Egg | null {
  if (!canBuyEgg(save, rarity)) return null;
  save.pokeCoins -= EGG_PRICES[rarity];
  const egg: Egg = { uid: crypto.randomUUID(), rarity, source: "shop", obtainedAt: Date.now() };
  save.eggs.push(egg);
  return egg;
}

// Hatch an egg from inventory into a new collection member.
export function hatchEgg(save: SaveGame, eggUid: string, rand: () => number = Math.random): OwnedPokemon | null {
  const idx = save.eggs.findIndex((e) => e.uid === eggUid);
  if (idx < 0) return null;
  const egg = save.eggs[idx]!;
  save.eggs.splice(idx, 1);
  const pokemon = rollHatch(egg.rarity, rand);
  save.collection.push(pokemon);
  save.stats.hatches += 1;
  return pokemon;
}

// --- Wave-milestone egg drops (once per milestone per map) ---
export const MILESTONES = [10, 20, 30, 40, 50];

function milestoneRarity(map: MapConfig, milestone: number): Rarity {
  if (milestone >= 50) return map.id === "indigo_plateau" ? "legendary" : "rare";
  if (milestone >= 30) return "rare";
  return "common";
}

// Grant eggs for any milestones newly reached on a map. Idempotent via the
// highest-claimed marker in the save, so milestones can't be farmed.
export function claimMilestoneDrops(save: SaveGame, map: MapConfig, newBestWave: number): Egg[] {
  const claimed = save.eggDropsClaimedByMap[map.id] ?? 0;
  const granted: Egg[] = [];
  let highest = claimed;
  for (const m of MILESTONES) {
    if (m > claimed && m <= newBestWave) {
      const egg: Egg = {
        uid: crypto.randomUUID(),
        rarity: milestoneRarity(map, m),
        source: "wave_drop",
        obtainedAt: Date.now(),
      };
      save.eggs.push(egg);
      granted.push(egg);
      highest = m;
    }
  }
  if (highest > claimed) save.eggDropsClaimedByMap[map.id] = highest;
  return granted;
}

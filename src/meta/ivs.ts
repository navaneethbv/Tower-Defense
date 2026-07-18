import type { IVs, OwnedPokemon } from "../types";

// Roll a fresh set of IVs (each stat 0..15). With a small chance, one random
// stat is boosted to a perfect 15 ("lucky" hatch).
export function rollIVs(rand: () => number = Math.random): IVs {
  const r = () => Math.floor(rand() * 16);
  const ivs: IVs = { damage: r(), range: r(), attackSpeed: r() };
  if (rand() < 0.05) {
    const key = (["damage", "range", "attackSpeed"] as const)[Math.floor(rand() * 3)]!;
    ivs[key] = 15;
  }
  return ivs;
}

export function makeOwned(speciesId: string, ivs: IVs = rollIVs()): OwnedPokemon {
  return {
    uid: crypto.randomUUID(),
    speciesId,
    ivs,
    level: 1,
    xp: 0,
    hatchedAt: Date.now(),
  };
}

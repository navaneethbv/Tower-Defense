import type { OwnedPokemon, SaveGame } from "../types";
import { getSpecies } from "../data/species";

// Persistent per-level bonus is capped so veterans matter without breaking
// in-run balance. Level here is the collection level, not the in-run tower level.
export const MAX_PERSISTENT_LEVEL = 20;

export function persistentDamageBonus(pokemon: OwnedPokemon): number {
  return Math.min(0.2, (pokemon.level - 1) * 0.01);
}

export function xpToPersistentLevel(level: number): number {
  return 20 + level * 10;
}

// Feed XP earned during a run into a collection member, leveling it up.
export function grantRunXp(pokemon: OwnedPokemon, xp: number): void {
  if (pokemon.level >= MAX_PERSISTENT_LEVEL) return;
  pokemon.xp += xp;
  while (pokemon.level < MAX_PERSISTENT_LEVEL && pokemon.xp >= xpToPersistentLevel(pokemon.level)) {
    pokemon.xp -= xpToPersistentLevel(pokemon.level);
    pokemon.level += 1;
  }
}

export function getOwned(save: SaveGame, uid: string): OwnedPokemon | undefined {
  return save.collection.find((p) => p.uid === uid);
}

// Resolve the current team (skipping empty slots) into owned pokemon.
export function teamMembers(save: SaveGame): OwnedPokemon[] {
  const out: OwnedPokemon[] = [];
  for (const uid of save.team) {
    if (!uid) continue;
    const p = getOwned(save, uid);
    if (p) out.push(p);
  }
  return out;
}

export function displayName(pokemon: OwnedPokemon): string {
  return pokemon.nickname ?? getSpecies(pokemon.speciesId).name;
}

// Average IV percentage, for a quick collection-quality readout.
export function ivScore(pokemon: OwnedPokemon): number {
  const { damage, range, attackSpeed } = pokemon.ivs;
  return Math.round(((damage + range + attackSpeed) / 45) * 100);
}

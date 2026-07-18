import type { MapConfig, MilestoneEncounter, MilestoneTier, SpeciesDef } from "../types";
import { CANONICAL_POKEMON, type CanonicalPokemon } from "../data/generated/pokemon";
import { getSpecies, hasSpecies } from "../data/species";
import { makeRng, waveSeed } from "./rng";
import {
  powerExcludes,
  powerIncludes,
  rareExcludes,
  rareIncludes,
} from "./milestonePoolOverrides";

export type { MilestoneEncounter, MilestoneTier } from "../types";

export const MILESTONE_WAVES = [25, 50, 75, 100] as const;
export type MilestoneWave = (typeof MILESTONE_WAVES)[number];

const TIER_BY_WAVE: Record<MilestoneWave, MilestoneTier> = {
  25: "rare",
  50: "power",
  75: "mythical",
  100: "legendary",
};

const CANONICAL_BY_ID = new Map(CANONICAL_POKEMON.map((pokemon) => [pokemon.id, pokemon]));

function baseStatTotal(record: CanonicalPokemon): number {
  return Object.values(record.baseStats).reduce((sum, value) => sum + value, 0);
}

function assertValidOverrides(): void {
  for (const id of [...rareIncludes, ...rareExcludes, ...powerIncludes, ...powerExcludes]) {
    const record = CANONICAL_BY_ID.get(id);
    if (!record || !hasSpecies(id)) throw new Error(`Unknown milestone pool override: ${id}`);
    if (record.isLegendary || record.isMythical) {
      throw new Error(`Milestone pool override cannot reclassify special species: ${id}`);
    }
  }
}

assertValidOverrides();

function withOverrides(
  base: CanonicalPokemon[],
  includes: readonly string[],
  excludes: readonly string[],
): CanonicalPokemon[] {
  const excluded = new Set(excludes);
  const byId = new Map(base.map((record) => [record.id, record]));
  for (const id of includes) byId.set(id, CANONICAL_BY_ID.get(id)!);
  return [...byId.values()].filter((record) => !excluded.has(record.id));
}

const CANONICAL_POOLS: Record<MilestoneTier, CanonicalPokemon[]> = {
  rare: withOverrides(
    CANONICAL_POKEMON.filter(
      (record) =>
        !record.isLegendary &&
        !record.isMythical &&
        baseStatTotal(record) < 540 &&
        getSpecies(record.id).rarity === "rare",
    ),
    rareIncludes,
    rareExcludes,
  ),
  power: withOverrides(
    CANONICAL_POKEMON.filter(
      (record) =>
        !record.isLegendary &&
        !record.isMythical &&
        record.evolvesTo.length === 0 &&
        baseStatTotal(record) >= 540,
    ),
    powerIncludes,
    powerExcludes,
  ),
  mythical: CANONICAL_POKEMON.filter((record) => record.isMythical),
  legendary: CANONICAL_POKEMON.filter((record) => record.isLegendary),
};

for (const [tier, pool] of Object.entries(CANONICAL_POOLS)) {
  if (pool.length === 0) throw new Error(`Empty milestone pool: ${tier}`);
}

export function milestonePool(tier: MilestoneTier): readonly SpeciesDef[] {
  return CANONICAL_POOLS[tier].map((record) => getSpecies(record.id));
}

export function isMilestoneWave(wave: number): wave is MilestoneWave {
  return MILESTONE_WAVES.includes(wave as MilestoneWave);
}

export function milestoneFor(
  map: MapConfig,
  waveNumber: number,
  runSeed: number,
): MilestoneEncounter | undefined {
  if (!isMilestoneWave(waveNumber)) return undefined;
  const tier = TIER_BY_WAVE[waveNumber];
  const species = makeRng(waveSeed(runSeed, waveNumber, map.waveGen.seedSalt)).pick(
    milestonePool(tier),
  );
  return { wave: waveNumber, tier, speciesId: species.id };
}

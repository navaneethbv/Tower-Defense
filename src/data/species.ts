import type { SpeciesDef } from "../types";
import { CANONICAL_POKEMON } from "./generated/pokemon";
import { deriveSpecies } from "./speciesDerivation";

export { selectEvolution } from "./speciesDerivation";

// Tower species. Base stages are hatchable (rarity drives egg pools); evolutions
// are reached in-run at the `atLevel` thresholds. Phase 1-2 ships tuned starter
// lines plus a few staples; generated defaults fill the rest of the National Dex.
const CURATED_SPECIES: SpeciesDef[] = [
  // --- Bulbasaur line (grass) ---
  {
    id: "bulbasaur", dex: 1, name: "Bulbasaur", types: ["grass", "poison"], attackType: "grass",
    role: "support", rarity: "rare", base: { damage: 9, cooldown: 0.9, range: 2.6, cost: 80 },
    allowedTerrain: ["grass"], favoredTerrain: "grass", projectile: { color: "#4ade80", kind: "seed" },
    evolutions: [{ speciesId: "ivysaur", atLevel: 5 }],
    onHitStatus: { kind: "slow", chance: 0.35, duration: 1.2, magnitude: 0.3 },
    description: "Vine whips that slow enemies.",
  },
  {
    id: "ivysaur", dex: 2, name: "Ivysaur", types: ["grass", "poison"], attackType: "grass",
    role: "support", rarity: "rare", base: { damage: 16, cooldown: 0.85, range: 2.9, cost: 160 },
    allowedTerrain: ["grass"], favoredTerrain: "grass", projectile: { color: "#22c55e", kind: "seed" },
    evolutions: [{ speciesId: "venusaur", atLevel: 10 }],
    onHitStatus: { kind: "poison", chance: 0.5, duration: 3, magnitude: 4 },
    description: "Poisons and slows.",
  },
  {
    id: "venusaur", dex: 3, name: "Venusaur", types: ["grass", "poison"], attackType: "grass",
    role: "aoe", rarity: "rare", base: { damage: 28, cooldown: 0.8, range: 3.2, cost: 300 },
    allowedTerrain: ["grass"], favoredTerrain: "grass", projectile: { color: "#16a34a", kind: "petal" },
    ability: { id: "solar_beam", name: "Solar Beam", description: "Line blast of grass damage.", cooldown: 14, kind: "line_blast" },
    onHitStatus: { kind: "poison", chance: 0.6, duration: 4, magnitude: 7 },
    description: "Solar Beam and heavy poison.",
  },

  // --- Charmander line (fire) ---
  {
    id: "charmander", dex: 4, name: "Charmander", types: ["fire"], attackType: "fire",
    role: "dps", rarity: "rare", base: { damage: 12, cooldown: 0.8, range: 2.5, cost: 80 },
    allowedTerrain: ["grass", "mountain"], favoredTerrain: "mountain", projectile: { color: "#fb923c", kind: "ember" },
    evolutions: [{ speciesId: "charmeleon", atLevel: 5 }],
    onHitStatus: { kind: "burn", chance: 0.3, duration: 2, magnitude: 3 },
    description: "Embers that burn.",
  },
  {
    id: "charmeleon", dex: 5, name: "Charmeleon", types: ["fire"], attackType: "fire",
    role: "dps", rarity: "rare", base: { damage: 21, cooldown: 0.75, range: 2.8, cost: 160 },
    allowedTerrain: ["grass", "mountain"], favoredTerrain: "mountain", projectile: { color: "#f97316", kind: "flame" },
    evolutions: [{ speciesId: "charizard", atLevel: 10 }],
    onHitStatus: { kind: "burn", chance: 0.4, duration: 2.5, magnitude: 5 },
    description: "Stronger flames.",
  },
  {
    id: "charizard", dex: 6, name: "Charizard", types: ["fire", "flying"], attackType: "fire",
    role: "dps", rarity: "rare", base: { damage: 36, cooldown: 0.7, range: 3.1, cost: 300 },
    allowedTerrain: ["grass", "mountain"], favoredTerrain: "mountain", projectile: { color: "#ef4444", kind: "flame" },
    ability: { id: "inferno", name: "Inferno", description: "Ignites all enemies in range.", cooldown: 16, kind: "aoe_burn" },
    onHitStatus: { kind: "burn", chance: 0.55, duration: 3, magnitude: 9 },
    description: "Inferno wipes crowds.",
  },

  // --- Squirtle line (water) ---
  {
    id: "squirtle", dex: 7, name: "Squirtle", types: ["water"], attackType: "water",
    role: "balanced", rarity: "rare", base: { damage: 11, cooldown: 0.85, range: 2.7, cost: 80 },
    allowedTerrain: ["grass", "water"], favoredTerrain: "water", projectile: { color: "#38bdf8", kind: "bubble" },
    evolutions: [{ speciesId: "wartortle", atLevel: 5 }],
    description: "Reliable bubble shots.",
  },
  {
    id: "wartortle", dex: 8, name: "Wartortle", types: ["water"], attackType: "water",
    role: "balanced", rarity: "rare", base: { damage: 19, cooldown: 0.8, range: 3.0, cost: 160 },
    allowedTerrain: ["grass", "water"], favoredTerrain: "water", projectile: { color: "#0ea5e9", kind: "bubble" },
    evolutions: [{ speciesId: "blastoise", atLevel: 10 }],
    description: "Pressurized water.",
  },
  {
    id: "blastoise", dex: 9, name: "Blastoise", types: ["water"], attackType: "water",
    role: "aoe", rarity: "rare", base: { damage: 33, cooldown: 0.85, range: 3.3, cost: 300 },
    allowedTerrain: ["grass", "water"], favoredTerrain: "water", projectile: { color: "#2563eb", kind: "cannon" },
    ability: { id: "surf", name: "Surf", description: "Wave damages all enemies on the path.", cooldown: 15, kind: "path_wave" },
    description: "Hydro cannons and Surf.",
  },

  // --- Pikachu line (electric) ---
  {
    id: "pikachu", dex: 25, name: "Pikachu", types: ["electric"], attackType: "electric",
    role: "dps", rarity: "rare", base: { damage: 13, cooldown: 0.6, range: 2.8, cost: 90 },
    allowedTerrain: ["grass", "mountain"], favoredTerrain: "grass", projectile: { color: "#facc15", kind: "spark" },
    evolutions: [{ speciesId: "raichu", atLevel: 8 }],
    onHitStatus: { kind: "stun", chance: 0.12, duration: 0.5, magnitude: 1 },
    description: "Fast sparks that can stun.",
  },
  {
    id: "raichu", dex: 26, name: "Raichu", types: ["electric"], attackType: "electric",
    role: "dps", rarity: "rare", base: { damage: 30, cooldown: 0.55, range: 3.1, cost: 260 },
    allowedTerrain: ["grass", "mountain"], favoredTerrain: "grass", projectile: { color: "#eab308", kind: "spark" },
    ability: { id: "thunder", name: "Thunder", description: "Chain lightning across enemies.", cooldown: 12, kind: "chain" },
    onHitStatus: { kind: "stun", chance: 0.18, duration: 0.7, magnitude: 1 },
    description: "Chain lightning.",
  },

  // --- Pidgey line (flying, sniper) ---
  {
    id: "pidgey", dex: 16, name: "Pidgey", types: ["normal", "flying"], attackType: "flying",
    role: "sniper", rarity: "common", base: { damage: 10, cooldown: 1.1, range: 3.6, cost: 70 },
    allowedTerrain: ["grass", "mountain"], favoredTerrain: "mountain", projectile: { color: "#d1d5db", kind: "gust" },
    evolutions: [{ speciesId: "pidgeotto", atLevel: 5 }],
    description: "Long range, high crit.",
  },
  {
    id: "pidgeotto", dex: 17, name: "Pidgeotto", types: ["normal", "flying"], attackType: "flying",
    role: "sniper", rarity: "common", base: { damage: 18, cooldown: 1.0, range: 4.0, cost: 150 },
    allowedTerrain: ["grass", "mountain"], favoredTerrain: "mountain", projectile: { color: "#9ca3af", kind: "gust" },
    evolutions: [{ speciesId: "pidgeot", atLevel: 10 }],
    description: "Reaches across the map.",
  },
  {
    id: "pidgeot", dex: 18, name: "Pidgeot", types: ["normal", "flying"], attackType: "flying",
    role: "sniper", rarity: "common", base: { damage: 34, cooldown: 0.95, range: 4.4, cost: 280 },
    allowedTerrain: ["grass", "mountain"], favoredTerrain: "mountain", projectile: { color: "#6b7280", kind: "gust" },
    ability: { id: "hurricane", name: "Hurricane", description: "Pushes and damages enemies.", cooldown: 18, kind: "aoe_push" },
    description: "Sniper with Hurricane.",
  },

  // --- Geodude line (rock, tank killer) ---
  {
    id: "geodude", dex: 74, name: "Geodude", types: ["rock", "ground"], attackType: "rock",
    role: "tank_killer", rarity: "common", base: { damage: 16, cooldown: 1.3, range: 2.4, cost: 80 },
    allowedTerrain: ["mountain"], favoredTerrain: "mountain", projectile: { color: "#a8a29e", kind: "rock" },
    evolutions: [{ speciesId: "graveler", atLevel: 5 }],
    description: "Heavy rock throws.",
  },
  {
    id: "graveler", dex: 75, name: "Graveler", types: ["rock", "ground"], attackType: "rock",
    role: "tank_killer", rarity: "common", base: { damage: 27, cooldown: 1.25, range: 2.6, cost: 160 },
    allowedTerrain: ["mountain"], favoredTerrain: "mountain", projectile: { color: "#78716c", kind: "rock" },
    evolutions: [{ speciesId: "golem", atLevel: 10 }],
    description: "Boulders that break armor.",
  },
  {
    id: "golem", dex: 76, name: "Golem", types: ["rock", "ground"], attackType: "rock",
    role: "tank_killer", rarity: "common", base: { damage: 46, cooldown: 1.3, range: 2.9, cost: 300 },
    allowedTerrain: ["mountain"], favoredTerrain: "mountain", projectile: { color: "#57534e", kind: "boulder" },
    ability: { id: "earthquake", name: "Earthquake", description: "Stuns and damages ground enemies.", cooldown: 17, kind: "aoe_stun" },
    onHitStatus: { kind: "armorBreak", chance: 0.5, duration: 3, magnitude: 1 },
    description: "Earthquake and armor break.",
  },
];

const CANONICAL_BY_ID = new Map(CANONICAL_POKEMON.map((species) => [species.id, species]));
const CURATED_BY_ID = new Map(CURATED_SPECIES.map((species) => [species.id, species]));

export const SPECIES: SpeciesDef[] = CANONICAL_POKEMON.map((record) =>
  deriveSpecies(record, CANONICAL_BY_ID, CURATED_BY_ID.get(record.id)),
);

const BY_ID = new Map(SPECIES.map((s) => [s.id, s]));

export function getSpecies(id: string): SpeciesDef {
  const def = BY_ID.get(id);
  if (!def) throw new Error(`Unknown species id: ${id}`);
  return def;
}

export function hasSpecies(id: string): boolean {
  return BY_ID.has(id);
}

// A species is "base" (hatchable) if nothing else evolves into it. Only base
// stages come out of eggs; evolutions are reached in-run.
const EVOLVED_TARGETS = new Set(
  SPECIES.flatMap((species) => species.evolutions?.map((evolution) => evolution.speciesId) ?? []),
);

export function isBaseSpecies(s: SpeciesDef): boolean {
  return !EVOLVED_TARGETS.has(s.id);
}

export function baseSpeciesByRarity(rarity: SpeciesDef["rarity"]): SpeciesDef[] {
  return SPECIES.filter((s) => isBaseSpecies(s) && s.rarity === rarity);
}

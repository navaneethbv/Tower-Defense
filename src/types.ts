// Shared domain types. This module has no runtime logic and no dependencies.

export type TypeName =
  | "normal"
  | "fire"
  | "water"
  | "grass"
  | "electric"
  | "ice"
  | "fighting"
  | "poison"
  | "ground"
  | "flying"
  | "psychic"
  | "bug"
  | "rock"
  | "ghost"
  | "dragon"
  | "dark"
  | "steel"
  | "fairy";

export type Terrain = "grass" | "water" | "mountain";

export type Rarity = "common" | "rare" | "legendary";

export type Role = "dps" | "aoe" | "sniper" | "support" | "tank_killer" | "balanced";

export type TargetingMode =
  | "first"
  | "last"
  | "strongest"
  | "weakest"
  | "fastest"
  | "slowest"
  | "closest";

export type StatusKind =
  | "slow"
  | "poison"
  | "burn"
  | "toxic"
  | "paralysis"
  | "freeze"
  | "sleep"
  | "confusion"
  | "stun"
  | "armorBreak"
  | "curse";

// Discrete things a status did this frame, surfaced for combat feedback.
export type StatusEventKind = "toxic" | "confusion" | "thaw" | "wake" | "recover";

export interface StatusApplication {
  kind: StatusKind;
  chance: number; // 0..1
  duration: number; // seconds
  magnitude: number; // slow %, dps, etc. depending on kind
}

export interface AbilityDef {
  id: string;
  name: string;
  description: string;
  cooldown: number; // seconds
  kind: AbilityKind;
}

export type AbilityKind =
  | "line_blast"
  | "area_damage"
  | "aoe_burn"
  | "path_wave"
  | "chain"
  | "aoe_push"
  | "aoe_stun"
  | "multishot"
  | "execute"
  | "status_burst";

export interface EvolutionDef {
  speciesId: string;
  atLevel: number;
}

export interface SpeciesDef {
  id: string;
  dex: number;
  name: string;
  types: TypeName[];
  attackType: TypeName;
  role: Role;
  rarity: Rarity;
  base: { damage: number; cooldown: number; range: number; cost: number };
  allowedTerrain: Terrain[];
  favoredTerrain: Terrain;
  projectile: { color: string; kind: string };
  evolutions?: EvolutionDef[];
  ability?: AbilityDef;
  onHitStatus?: StatusApplication;
  description: string;
}

export interface EnemyDef {
  id: string;
  name: string;
  dex: number;
  types: TypeName[];
  hp: number;
  speed: number; // tiles per second (base)
  reward: number;
  heartDamage: number;
  armor: number;
  regen?: number; // hp per second
  spectral?: boolean; // only hittable by super-effective / ghost / psychic
  boss?: boolean;
}

export interface IVs {
  damage: number; // 0..15 (%)
  range: number;
  attackSpeed: number;
}

export interface OwnedPokemon {
  uid: string;
  speciesId: string;
  ivs: IVs;
  level: number;
  xp: number;
  hatchedAt: number;
  nickname?: string;
}

export interface Egg {
  uid: string;
  rarity: Rarity;
  source: "shop" | "wave_drop";
  obtainedAt: number;
}

export interface WaveGenParams {
  enemyPool: { enemyId: string; minWave: number; weight: number }[];
  bossPool: { enemyId: string; minWave: number }[];
  baseCount: number;
  countGrowth: number;
  hpBase: number;
  hpGrowth: number;
  spawnInterval: number;
  seedSalt: number;
}

export interface DeploymentPad {
  id: string;
  col: number;
  row: number;
  terrain: Terrain;
}

export interface MapTheme {
  palette: string;
  groundTile: number;
  pathTile: number;
}

export interface MapDecor {
  tile: number;
  col: number;
  row: number;
}

export interface MapConfig {
  id: string;
  name: string;
  description: string;
  cols: number;
  rows: number;
  path: { x: number; y: number }[]; // waypoints in tile coordinates
  terrain: Terrain[][]; // [row][col]
  theme: MapTheme;
  tiles: number[];
  decor: MapDecor[];
  deploymentPads: DeploymentPad[];
  totalWaves: number;
  waveGen: WaveGenParams;
  unlockRequirement: { mapId: string; wave: number } | null;
  rewardMultiplier: number;
}

export interface EnemyStatMods {
  hp: number;
  speed: number;
  armor: number;
  reward: number;
  heartDamage: number;
  boss: boolean;
}

export interface WaveSpawn {
  enemyId: string;
  delay: number; // seconds after wave start
  mods: EnemyStatMods;
}

export type MilestoneTier = "rare" | "power" | "mythical" | "legendary";

export interface MilestoneEncounter {
  wave: 25 | 50 | 75 | 100;
  tier: MilestoneTier;
  speciesId: string;
}

export type MilestoneCaptureRecord = Record<
  string,
  Partial<Record<25 | 50 | 75 | 100, boolean>>
>;

export interface CapturedPokemon {
  pokemon: OwnedPokemon;
  wave: 25 | 50 | 75 | 100;
  tier: MilestoneTier;
  guaranteed: boolean;
}

export interface WavePlan {
  waveNumber: number;
  isBoss: boolean;
  spawns: WaveSpawn[];
  goldReward: number;
  milestone?: MilestoneEncounter;
}

export interface SaveGame {
  version: number;
  createdAt: number;
  updatedAt: number;
  pokeCoins: number;
  starterChosen: string | null;
  collection: OwnedPokemon[];
  eggs: Egg[];
  team: (string | null)[];
  bestWaveByMap: Record<string, number>;
  eggDropsClaimedByMap: Record<string, number>;
  milestoneCapturesByMap: MilestoneCaptureRecord;
  settings: { speed: 1 | 2 | 3; muted: boolean; autoWave: boolean; particles: boolean };
  stats: {
    runs: number;
    totalWavesCleared: number;
    hatches: number;
    bossesDefeated: number;
    victories: number;
  };
  achievements: string[];
}

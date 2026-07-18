import type { MapConfig } from "../../types";
import { COLS, ROWS, WAVES_PER_MAP } from "../constants";
import { buildTerrain } from "./terrain";

// Indigo Plateau: the endgame map. Long winding path, mixed terrain, and the
// toughest boss rotation ending in Dragonite.
export const indigoPlateau: MapConfig = {
  id: "indigo_plateau",
  name: "Indigo Plateau",
  description: "The final gauntlet. Every archetype, every boss.",
  cols: COLS,
  rows: ROWS,
  path: [
    { x: -1, y: 1 },
    { x: 16, y: 1 },
    { x: 16, y: 4 },
    { x: 2, y: 4 },
    { x: 2, y: 7 },
    { x: 16, y: 7 },
    { x: 16, y: 10 },
    { x: -1, y: 10 },
  ],
  terrain: buildTerrain(COLS, ROWS, { mountainRows: [0, 5], waterRows: [11] }),
  totalWaves: WAVES_PER_MAP,
  waveGen: {
    enemyPool: [
      { enemyId: "rattata", minWave: 1, weight: 0.8 },
      { enemyId: "pidgey", minWave: 1, weight: 0.8 },
      { enemyId: "zubat", minWave: 4, weight: 0.9 },
      { enemyId: "machop", minWave: 8, weight: 0.9 },
      { enemyId: "geodude", minWave: 10, weight: 0.8 },
      { enemyId: "grimer", minWave: 14, weight: 0.8 },
      { enemyId: "sandshrew", minWave: 16, weight: 0.7 },
      { enemyId: "gastly", minWave: 20, weight: 0.9 },
      { enemyId: "hoothoot", minWave: 3, weight: 0.7 },
      { enemyId: "poochyena", minWave: 6, weight: 0.7 },
      { enemyId: "bidoof", minWave: 9, weight: 0.7 },
      { enemyId: "roggenrola", minWave: 12, weight: 0.7 },
      { enemyId: "fletchling", minWave: 16, weight: 0.7 },
      { enemyId: "rockruff", minWave: 22, weight: 0.7 },
      { enemyId: "skwovet", minWave: 28, weight: 0.6 },
      { enemyId: "lechonk", minWave: 34, weight: 0.6 },
    ],
    bossPool: [
      { enemyId: "onix", minWave: 10 },
      { enemyId: "gyarados", minWave: 20 },
      { enemyId: "arcanine", minWave: 30 },
      { enemyId: "mewtwo", minWave: 40 },
      { enemyId: "dragonite", minWave: 50 },
      { enemyId: "tyranitar", minWave: 20 },
      { enemyId: "garchomp", minWave: 30 },
      { enemyId: "hydreigon", minWave: 40 },
      { enemyId: "arceus", minWave: 50 },
    ],
    baseCount: 10,
    countGrowth: 1.05,
    hpBase: 46,
    hpGrowth: 1.17,
    spawnInterval: 0.55,
    seedSalt: 404,
  },
  unlockRequirement: { mapId: "granite_cave", wave: 30 },
  rewardMultiplier: 2,
};

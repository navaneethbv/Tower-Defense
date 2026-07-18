import type { MapConfig } from "../../types";
import { COLS, ROWS, WAVES_PER_MAP } from "../constants";
import { buildTerrain } from "./terrain";

// Verdant Route: the starter map. Serpentine path with a mountain ridge and a
// water channel so favored-terrain placement matters.
export const verdantRoute: MapConfig = {
  id: "verdant_route",
  name: "Verdant Route",
  description: "Rolling grassland with a mountain ridge and a river channel.",
  cols: COLS,
  rows: ROWS,
  path: [
    { x: -1, y: 2 },
    { x: 15, y: 2 },
    { x: 15, y: 6 },
    { x: 2, y: 6 },
    { x: 2, y: 9 },
    { x: 18, y: 9 },
  ],
  terrain: buildTerrain(COLS, ROWS, { mountainRows: [0, 1], waterRows: [10, 11] }),
  totalWaves: WAVES_PER_MAP,
  waveGen: {
    enemyPool: [
      { enemyId: "rattata", minWave: 1, weight: 1.0 },
      { enemyId: "pidgey", minWave: 1, weight: 0.9 },
      { enemyId: "weedle", minWave: 3, weight: 0.8 },
      { enemyId: "zubat", minWave: 6, weight: 0.9 },
      { enemyId: "sandshrew", minWave: 9, weight: 0.7 },
      { enemyId: "machop", minWave: 13, weight: 0.7 },
      { enemyId: "geodude", minWave: 16, weight: 0.7 },
      { enemyId: "grimer", minWave: 22, weight: 0.6 },
      { enemyId: "gastly", minWave: 28, weight: 0.6 },
      { enemyId: "hoothoot", minWave: 4, weight: 0.8 },
      { enemyId: "poochyena", minWave: 8, weight: 0.8 },
      { enemyId: "bidoof", minWave: 12, weight: 0.7 },
      { enemyId: "fletchling", minWave: 18, weight: 0.7 },
      { enemyId: "skwovet", minWave: 24, weight: 0.6 },
      { enemyId: "lechonk", minWave: 32, weight: 0.6 },
    ],
    bossPool: [
      { enemyId: "onix", minWave: 10 },
      { enemyId: "arcanine", minWave: 20 },
      { enemyId: "gyarados", minWave: 30 },
      { enemyId: "mewtwo", minWave: 50 },
      { enemyId: "tyranitar", minWave: 40 },
      { enemyId: "arceus", minWave: 50 },
    ],
    baseCount: 8,
    countGrowth: 0.9,
    hpBase: 30,
    hpGrowth: 1.12,
    spawnInterval: 0.62,
    seedSalt: 101,
  },
  unlockRequirement: null,
  rewardMultiplier: 1,
};

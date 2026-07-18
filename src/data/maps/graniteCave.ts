import type { MapConfig } from "../../types";
import { COLS, ROWS, WAVES_PER_MAP } from "../constants";
import { buildTerrain } from "./terrain";

// Granite Cave: mountain terrain everywhere; favors rock/fire/ground towers and
// throws armored enemies at you.
export const graniteCave: MapConfig = {
  id: "granite_cave",
  name: "Granite Cave",
  description: "Armored foes grind through a rocky labyrinth.",
  cols: COLS,
  rows: ROWS,
  path: [
    { x: -1, y: 5 },
    { x: 5, y: 5 },
    { x: 5, y: 1 },
    { x: 12, y: 1 },
    { x: 12, y: 9 },
    { x: 4, y: 9 },
    { x: 4, y: 6 },
    { x: 18, y: 6 },
  ],
  terrain: buildTerrain(COLS, ROWS, { mountainRows: [0, 1, 2, 3, 8, 9, 10, 11] }),
  totalWaves: WAVES_PER_MAP,
  waveGen: {
    enemyPool: [
      { enemyId: "geodude", minWave: 1, weight: 1.0 },
      { enemyId: "sandshrew", minWave: 1, weight: 0.9 },
      { enemyId: "machop", minWave: 5, weight: 0.9 },
      { enemyId: "rattata", minWave: 1, weight: 0.5 },
      { enemyId: "grimer", minWave: 14, weight: 0.7 },
      { enemyId: "gastly", minWave: 20, weight: 0.7 },
      { enemyId: "zubat", minWave: 26, weight: 0.6 },
      { enemyId: "aron", minWave: 6, weight: 0.9 },
      { enemyId: "roggenrola", minWave: 12, weight: 0.8 },
      { enemyId: "sableye", minWave: 18, weight: 0.7 },
      { enemyId: "carbink", minWave: 24, weight: 0.7 },
      { enemyId: "rockruff", minWave: 30, weight: 0.7 },
      { enemyId: "rolycoly", minWave: 36, weight: 0.6 },
      { enemyId: "nacli", minWave: 42, weight: 0.6 },
    ],
    bossPool: [
      { enemyId: "onix", minWave: 10 },
      { enemyId: "onix", minWave: 20 },
      { enemyId: "arcanine", minWave: 30 },
      { enemyId: "mewtwo", minWave: 50 },
      { enemyId: "tyranitar", minWave: 30 },
      { enemyId: "metagross", minWave: 40 },
      { enemyId: "garchomp", minWave: 50 },
    ],
    baseCount: 9,
    countGrowth: 1.0,
    hpBase: 40,
    hpGrowth: 1.15,
    spawnInterval: 0.58,
    seedSalt: 303,
  },
  unlockRequirement: { mapId: "river_crossing", wave: 20 },
  rewardMultiplier: 1.5,
};

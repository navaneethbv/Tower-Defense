import type { MapConfig } from "../../types";
import { COLS, ROWS, WAVES_PER_MAP } from "../constants";
import { buildTerrain } from "./terrain";

// River Crossing: water-heavy map that rewards water/electric towers.
export const riverCrossing: MapConfig = {
  id: "river_crossing",
  name: "River Crossing",
  description: "Wide waterways split the field; bring water and electric types.",
  cols: COLS,
  rows: ROWS,
  path: [
    { x: 3, y: -1 },
    { x: 3, y: 4 },
    { x: 14, y: 4 },
    { x: 14, y: 8 },
    { x: 6, y: 8 },
    { x: 6, y: 12 },
  ],
  terrain: buildTerrain(COLS, ROWS, { waterRows: [2, 3, 9, 10], mountainRows: [0] }),
  totalWaves: WAVES_PER_MAP,
  waveGen: {
    enemyPool: [
      { enemyId: "zubat", minWave: 1, weight: 1.0 },
      { enemyId: "rattata", minWave: 1, weight: 0.8 },
      { enemyId: "weedle", minWave: 4, weight: 0.8 },
      { enemyId: "grimer", minWave: 8, weight: 0.8 },
      { enemyId: "machop", minWave: 12, weight: 0.7 },
      { enemyId: "gastly", minWave: 18, weight: 0.8 },
      { enemyId: "sandshrew", minWave: 24, weight: 0.6 },
      { enemyId: "geodude", minWave: 30, weight: 0.6 },
      { enemyId: "wooper", minWave: 3, weight: 0.9 },
      { enemyId: "wingull", minWave: 6, weight: 0.8 },
      { enemyId: "buizel", minWave: 12, weight: 0.8 },
      { enemyId: "tympole", minWave: 18, weight: 0.7 },
      { enemyId: "froakie", minWave: 24, weight: 0.7 },
      { enemyId: "wishiwashi", minWave: 30, weight: 0.6 },
      { enemyId: "chewtle", minWave: 36, weight: 0.6 },
      { enemyId: "wiglett", minWave: 42, weight: 0.5 },
    ],
    bossPool: [
      { enemyId: "gyarados", minWave: 10 },
      { enemyId: "onix", minWave: 20 },
      { enemyId: "arcanine", minWave: 30 },
      { enemyId: "gyarados", minWave: 50 },
      { enemyId: "primarina", minWave: 30 },
      { enemyId: "kyogre", minWave: 40 },
      { enemyId: "palkia", minWave: 50 },
    ],
    baseCount: 9,
    countGrowth: 0.95,
    hpBase: 34,
    hpGrowth: 1.13,
    spawnInterval: 0.6,
    seedSalt: 202,
  },
  unlockRequirement: { mapId: "verdant_route", wave: 20 },
  rewardMultiplier: 1.25,
};

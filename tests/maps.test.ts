import { describe, it, expect } from "vitest";
import { MAPS } from "../src/data/maps";
import { getEnemy } from "../src/data/enemies";
import { generateWave } from "../src/waves/generator";

describe("map configs", () => {
  it("every enemy and boss id in every pool resolves", () => {
    for (const map of MAPS) {
      for (const e of map.waveGen.enemyPool) expect(() => getEnemy(e.enemyId)).not.toThrow();
      for (const b of map.waveGen.bossPool) expect(() => getEnemy(b.enemyId)).not.toThrow();
    }
  });

  it("generates all 50 waves with spawns on every map", () => {
    for (const map of MAPS) {
      expect(map.totalWaves).toBe(50);
      for (let n = 1; n <= map.totalWaves; n++) {
        const plan = generateWave(map, n, 7);
        expect(plan.spawns.length).toBeGreaterThan(0);
        // Delays are non-negative and sorted.
        let last = -1;
        for (const s of plan.spawns) {
          expect(s.delay).toBeGreaterThanOrEqual(last);
          last = s.delay;
        }
      }
    }
  });

  it("early waves only draw from pool entries already unlocked", () => {
    for (const map of MAPS) {
      const plan = generateWave(map, 1, 3);
      const unlocked = new Set(map.waveGen.enemyPool.filter((e) => e.minWave <= 1).map((e) => e.enemyId));
      for (const s of plan.spawns) expect(unlocked.has(s.enemyId)).toBe(true);
    }
  });

  it("terrain grid matches declared dimensions", () => {
    for (const map of MAPS) {
      expect(map.terrain.length).toBe(map.rows);
      for (const row of map.terrain) expect(row.length).toBe(map.cols);
    }
  });
});

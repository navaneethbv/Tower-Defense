import { describe, it, expect } from "vitest";
import { getMap, MAPS } from "../src/data/maps";
import { getEnemy } from "../src/data/enemies";
import { generateWave } from "../src/waves/generator";

describe("map configs", () => {
  it("rejects unknown route ids", () => {
    expect(() => getMap("missing_route")).toThrow("Unknown map id: missing_route");
  });

  it("defines nine authored 100-wave routes with safe habitat pads", () => {
    expect(MAPS.map((map) => map.id)).toEqual([
      "verdant_route",
      "river_crossing",
      "granite_cave",
      "ember_caldera",
      "frostbound_lake",
      "shadow_marsh",
      "skygarden_ruins",
      "ancient_sanctuary",
      "indigo_plateau",
    ]);
    expect(new Set(MAPS.map((map) => map.id)).size).toBe(9);

    for (const map of MAPS) {
      expect(map.totalWaves).toBe(100);
      expect(map.tiles).toHaveLength(map.rows * map.cols);
      expect(map.deploymentPads.length).toBeGreaterThanOrEqual(10);
      expect(new Set(map.deploymentPads.map((pad) => pad.id)).size).toBe(
        map.deploymentPads.length,
      );
      expect(new Set(map.deploymentPads.map((pad) => pad.terrain)).size).toBeGreaterThanOrEqual(
        2,
      );
      for (const pad of map.deploymentPads) {
        expect(pad.col).toBeGreaterThanOrEqual(0);
        expect(pad.col).toBeLessThan(map.cols);
        expect(pad.row).toBeGreaterThanOrEqual(0);
        expect(pad.row).toBeLessThan(map.rows);
        expect(map.terrain[pad.row]![pad.col]).toBe(pad.terrain);
      }
    }

    expect(
      new Set(MAPS.find((map) => map.id === "indigo_plateau")!.deploymentPads.map((pad) => pad.terrain)),
    ).toEqual(new Set(["grass", "water", "mountain"]));
  });

  it("every enemy and boss id in every pool resolves", () => {
    for (const map of MAPS) {
      for (const e of map.waveGen.enemyPool) expect(() => getEnemy(e.enemyId)).not.toThrow();
      for (const b of map.waveGen.bossPool) expect(() => getEnemy(b.enemyId)).not.toThrow();
    }
  });

  it("generates all configured waves with spawns on every map", () => {
    for (const map of MAPS) {
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

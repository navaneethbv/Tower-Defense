import { describe, it, expect, vi } from "vitest";
import { generateWave } from "../src/waves/generator";
import { waveHpMultiplier, waveCount, COUNT_CAP, isBossWave } from "../src/waves/scaling";
import { getMap } from "../src/data/maps";
import * as rngModule from "../src/waves/rng";

const map = getMap("verdant_route");

describe("wave generation", () => {
  it("is deterministic for a given seed", () => {
    const a = generateWave(map, 7, 12345);
    const b = generateWave(map, 7, 12345);
    expect(a).toEqual(b);
  });

  it("differs across seeds", () => {
    const a = generateWave(map, 7, 1);
    const b = generateWave(map, 7, 2);
    // Same wave number, different composition ordering is expected.
    expect(JSON.stringify(a.spawns)).not.toEqual(JSON.stringify(b.spawns));
  });

  it("puts a boss on every 10th wave", () => {
    for (const n of [10, 20, 30, 40, 50]) {
      const plan = generateWave(map, n, 999);
      expect(plan.isBoss).toBe(true);
      expect(isBossWave(n)).toBe(true);
      expect(plan.spawns.some((s) => s.mods.boss)).toBe(true);
    }
  });

  it("scales HP monotonically and caps count", () => {
    let prev = 0;
    for (let n = 1; n <= 50; n++) {
      const hp = waveHpMultiplier(map.waveGen, n);
      expect(hp).toBeGreaterThanOrEqual(prev);
      prev = hp;
      expect(waveCount(map.waveGen, n)).toBeLessThanOrEqual(COUNT_CAP);
    }
    expect(waveHpMultiplier(map.waveGen, 50)).toBeGreaterThan(20);
  });

  it("only spawns enemies unlocked by the wave number", () => {
    const plan = generateWave(map, 2, 42);
    const early = new Set(["rattata", "pidgey"]);
    for (const s of plan.spawns) expect(early.has(s.enemyId)).toBe(true);
  });

  it("handles empty pick and forces generator fallback path", () => {
    const rng = rngModule.makeRng(123);
    expect(() => rng.pick([])).toThrow("pick from empty array");

    // Mock makeRng to verify the weightedPick fallback branch
    const spy = vi.spyOn(rngModule, "makeRng").mockImplementation(() => {
      return {
        next: () => 1.5,
        int: (min, _max) => min,
        pick: (items) => {
          if (items.length === 0) throw new Error("pick from empty array");
          return items[0]!;
        },
      };
    });

    const plan = generateWave(map, 2, 42);
    expect(plan.spawns.length).toBeGreaterThan(0);

    spy.mockRestore();
  });

  it("successfully picks an item from a non-empty list", () => {
    const rng = rngModule.makeRng(12345);
    const items = ["a", "b", "c"];
    const picked = rng.pick(items);
    expect(items).toContain(picked);
  });
});

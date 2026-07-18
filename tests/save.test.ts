import { describe, it, expect, beforeEach } from "vitest";
import { freshSave, loadSave, saveSave, chooseStarter, CURRENT_VERSION } from "../src/meta/save";
import { applyRunResult, milestoneBonus, runPayout } from "../src/meta/economy";
import { unlockedSlots, isMapUnlocked } from "../src/meta/progression";
import { grantRunXp } from "../src/meta/collection";
import { getMap } from "../src/data/maps";

// jsdom-free localStorage shim for the node test environment.
class MemStore {
  private m = new Map<string, string>();
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  clear() {
    this.m.clear();
  }
}

beforeEach(() => {
  (globalThis as unknown as { localStorage: MemStore }).localStorage = new MemStore();
});

describe("save system", () => {
  it("round-trips through localStorage", () => {
    const s = freshSave();
    s.pokeCoins = 1234;
    saveSave(s);
    const loaded = loadSave();
    expect(loaded.pokeCoins).toBe(1234);
    expect(loaded.version).toBe(CURRENT_VERSION);
  });

  it("returns a fresh save when nothing is stored", () => {
    expect(loadSave().pokeCoins).toBe(0);
    expect(loadSave().starterChosen).toBeNull();
  });

  it("recovers from a corrupt save without throwing", () => {
    localStorage.setItem("ptd.save", "{not valid json");
    expect(() => loadSave()).not.toThrow();
    expect(loadSave().starterChosen).toBeNull();
  });

  it("migrates a partial older save, filling new fields", () => {
    localStorage.setItem("ptd.save", JSON.stringify({ version: 0, pokeCoins: 50 }));
    const loaded = loadSave();
    expect(loaded.pokeCoins).toBe(50);
    expect(loaded.version).toBe(CURRENT_VERSION);
    expect(loaded.team.length).toBe(6);
    expect(loaded.collection).toEqual([]);
  });

  it("grants starter coins exactly once via chooseStarter", () => {
    const s = freshSave();
    chooseStarter(s, "uid-1", "charmander");
    expect(s.pokeCoins).toBe(500);
    expect(s.starterChosen).toBe("charmander");
    expect(s.team[0]).toBe("uid-1");
  });
});

describe("economy", () => {
  it("pays out more on higher-multiplier maps", () => {
    const verdant = runPayout(getMap("verdant_route"), 20, 2);
    const plateau = runPayout(getMap("indigo_plateau"), 20, 2);
    expect(plateau).toBeGreaterThan(verdant);
  });

  it("awards milestone bonuses per 10-wave tier crossed", () => {
    expect(milestoneBonus(8, 12)).toBe(150);
    expect(milestoneBonus(0, 30)).toBe(450);
    expect(milestoneBonus(30, 35)).toBe(0);
  });

  it("records a new best wave and coins on a better run", () => {
    const s = freshSave();
    const map = getMap("verdant_route");
    const r1 = applyRunResult(s, map, 12, 1);
    expect(r1.newBest).toBe(true);
    expect(s.bestWaveByMap[map.id]).toBe(12);
    expect(s.pokeCoins).toBe(r1.coinsEarned);
    const before = s.pokeCoins;
    const r2 = applyRunResult(s, map, 8, 0); // worse run
    expect(r2.newBest).toBe(false);
    expect(s.bestWaveByMap[map.id]).toBe(12); // best unchanged
    expect(s.pokeCoins).toBeGreaterThan(before); // still earns coins
  });
});

describe("progression", () => {
  it("unlocks slots by wave milestones", () => {
    const s = freshSave();
    expect(unlockedSlots(s)).toBe(6);
    s.bestWaveByMap = { verdant_route: 40 };
    expect(unlockedSlots(s)).toBe(7);
    s.bestWaveByMap = { verdant_route: 50 };
    expect(unlockedSlots(s)).toBe(8);
    s.bestWaveByMap = { verdant_route: 40, river_crossing: 40, granite_cave: 40 };
    expect(unlockedSlots(s)).toBe(9);
    s.bestWaveByMap = { indigo_plateau: 50 };
    expect(unlockedSlots(s)).toBe(10);
  });

  it("gates maps behind previous-route progress", () => {
    const s = freshSave();
    expect(isMapUnlocked(s, getMap("verdant_route"))).toBe(true);
    expect(isMapUnlocked(s, getMap("river_crossing"))).toBe(false);
    s.bestWaveByMap = { verdant_route: 20 };
    expect(isMapUnlocked(s, getMap("river_crossing"))).toBe(true);
  });
});

describe("persistent leveling", () => {
  it("levels up a collection member from run XP and caps at 20", () => {
    const p = { uid: "x", speciesId: "charmander", ivs: { damage: 0, range: 0, attackSpeed: 0 }, level: 1, xp: 0, hatchedAt: 0 };
    grantRunXp(p, 30);
    expect(p.level).toBe(2);
    grantRunXp(p, 100000);
    expect(p.level).toBe(20);
  });
});

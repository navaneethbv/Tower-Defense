import { describe, it, expect, beforeEach, vi } from "vitest";
import { freshSave, loadSave, saveSave, chooseStarter, resetSave, CURRENT_VERSION } from "../src/meta/save";
import { applyRunResult, milestoneBonus, runPayout } from "../src/meta/economy";
import { unlockedSlots, isMapUnlocked, nextSlotHint } from "../src/meta/progression";
import { grantRunXp, persistentDamageBonus, displayName, ivScore, getOwned, teamMembers } from "../src/meta/collection";
import { applyCompletedRun } from "../src/meta/runResult";
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

  it("migrates version 1 settings and stats without losing nested values", () => {
    const collection = [
      {
        uid: "legacy",
        speciesId: "charmander",
        ivs: { damage: 1, range: 2, attackSpeed: 3 },
        level: 4,
        xp: 5,
        hatchedAt: 6,
      },
    ];
    localStorage.setItem(
      "ptd.save",
      JSON.stringify({
        version: 1,
        collection,
        team: ["legacy", null, null, null, null, null],
        settings: { speed: 3, muted: true },
        stats: { runs: 7, totalWavesCleared: 81, hatches: 4 },
      }),
    );

    const loaded = loadSave();

    expect(loaded.collection).toEqual(collection);
    expect(loaded.team[0]).toBe("legacy");
    expect(loaded.settings).toEqual({ speed: 3, muted: true, autoWave: false, particles: true });
    expect(loaded.stats).toEqual({
      runs: 7,
      totalWavesCleared: 81,
      hatches: 4,
      bossesDefeated: 0,
      victories: 0,
    });
    expect(loaded.achievements).toEqual([]);
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
    expect(s.stats.bossesDefeated).toBe(1);
    const before = s.pokeCoins;
    const r2 = applyRunResult(s, map, 8, 0); // worse run
    expect(r2.newBest).toBe(false);
    expect(s.bestWaveByMap[map.id]).toBe(12); // best unchanged
    expect(s.pokeCoins).toBeGreaterThan(before); // still earns coins
  });

  it("registers victory when full waves are cleared", () => {
    const s = freshSave();
    const map = getMap("verdant_route");
    applyRunResult(s, map, map.totalWaves, 10);
    expect(s.stats.victories).toBe(1);
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
    s.bestWaveByMap = { indigo_plateau: 100 };
    expect(unlockedSlots(s)).toBe(10);
  });

  it("gates maps behind previous-route progress", () => {
    const s = freshSave();
    expect(isMapUnlocked(s, getMap("verdant_route"))).toBe(true);
    expect(isMapUnlocked(s, getMap("river_crossing"))).toBe(false);
    s.bestWaveByMap = { verdant_route: 25 };
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
    // call again to hit early return branch
    grantRunXp(p, 10);
    expect(p.level).toBe(20);
  });

  it("calculates persistent damage bonus correctly", () => {
    const p = { uid: "x", speciesId: "charmander", ivs: { damage: 0, range: 0, attackSpeed: 0 }, level: 1, xp: 0, hatchedAt: 0 };
    expect(persistentDamageBonus(p)).toBe(0.0);
    p.level = 11;
    expect(persistentDamageBonus(p)).toBe(0.1);
    p.level = 30; // above cap
    expect(persistentDamageBonus(p)).toBe(0.2);
  });

  it("formats display name", () => {
    const p = { uid: "x", speciesId: "charmander", ivs: { damage: 0, range: 0, attackSpeed: 0 }, level: 1, xp: 0, hatchedAt: 0, nickname: "Charry" };
    expect(displayName(p)).toBe("Charry");
    const p2 = { uid: "y", speciesId: "charmander", ivs: { damage: 0, range: 0, attackSpeed: 0 }, level: 1, xp: 0, hatchedAt: 0 };
    expect(displayName(p2)).toBe("Charmander");
  });

  it("calculates ivScore correctly", () => {
    const p = { uid: "x", speciesId: "charmander", ivs: { damage: 15, range: 15, attackSpeed: 15 }, level: 1, xp: 0, hatchedAt: 0 };
    expect(ivScore(p)).toBe(100);
    p.ivs = { damage: 0, range: 0, attackSpeed: 0 };
    expect(ivScore(p)).toBe(0);
  });

  it("returns correct progression nextSlotHint", () => {
    const s = freshSave();
    expect(nextSlotHint(s)).toBe("Reach wave 40 on any map to unlock a 7th slot.");
    s.bestWaveByMap = { verdant_route: 40 };
    expect(nextSlotHint(s)).toBe("Clear wave 50 on any map to unlock an 8th slot.");
    s.bestWaveByMap = { verdant_route: 50 };
    expect(nextSlotHint(s)).toBe("Reach wave 40 on 3 maps to unlock a 9th slot.");
    s.bestWaveByMap = { verdant_route: 40, river_crossing: 40, granite_cave: 40 };
    expect(nextSlotHint(s)).toBe("Clear the Indigo Plateau to unlock a 10th slot.");
    s.bestWaveByMap = { indigo_plateau: 100 };
    expect(nextSlotHint(s)).toBeNull();
  });

  it("processes applyCompletedRun with xp distribution and egg drops", () => {
    const s = freshSave();
    const p = { uid: "x", speciesId: "charmander", ivs: { damage: 15, range: 15, attackSpeed: 15 }, level: 1, xp: 0, hatchedAt: 0 };
    s.collection.push(p);
    s.team = ["x", null, null, null, null, null];

    const map = getMap("verdant_route");
    const res = applyCompletedRun(s, map, {
      wavesCleared: 10,
      bossKills: 1,
      runXpByUid: { "x": 50, "nonexistent": 100 }
    });

    expect(res.newBest).toBe(true);
    expect(p.level).toBeGreaterThan(1);
    expect(getOwned(s, "x")).toBe(p);
    expect(teamMembers(s)).toEqual([p]);
  });

  it("resets save data correctly", () => {
    const s = resetSave();
    expect(s.pokeCoins).toBe(0);
    expect(s.starterChosen).toBeNull();
  });

  it("handles storage write errors gracefully during saveSave", () => {
    const spy = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => saveSave(freshSave())).not.toThrow();
    spy.mockRestore();
  });

  it("returns fresh save when stored value is not an object", () => {
    localStorage.setItem("ptd.save", "null");
    expect(loadSave().starterChosen).toBeNull();

    localStorage.setItem("ptd.save", "123");
    expect(loadSave().starterChosen).toBeNull();
  });
});

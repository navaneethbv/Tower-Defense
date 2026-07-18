import { beforeEach, describe, expect, it } from "vitest";
import { getMap } from "../src/data/maps";
import { getSpecies } from "../src/data/species";
import { EGG_PRICES } from "../src/meta/economy";
import { buyEgg, claimMilestoneDrops, hatchEgg, rollHatch } from "../src/meta/eggs";
import { applyCompletedRun } from "../src/meta/runResult";
import { freshSave } from "../src/meta/save";

let uid = 0;

beforeEach(() => {
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: { randomUUID: () => `test-${++uid}` },
  });
});

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

describe("egg economy", () => {
  it("deducts coins and refuses an unaffordable purchase without mutation", () => {
    const save = freshSave();
    save.pokeCoins = EGG_PRICES.common;

    expect(buyEgg(save, "common")).not.toBeNull();
    expect(save.pokeCoins).toBe(0);
    expect(save.eggs).toHaveLength(1);
    expect(buyEgg(save, "common")).toBeNull();
    expect(save.pokeCoins).toBe(0);
    expect(save.eggs).toHaveLength(1);
  });

  it("moves a hatched egg into the collection with bounded IVs", () => {
    const save = freshSave();
    save.pokeCoins = EGG_PRICES.common;
    const egg = buyEgg(save, "common")!;

    const pokemon = hatchEgg(save, egg.uid, mulberry32(7))!;

    expect(save.eggs).toHaveLength(0);
    expect(save.collection).toContain(pokemon);
    expect(Object.values(pokemon.ivs).every((value) => value >= 0 && value <= 15)).toBe(true);
  });

  it("grants each crossed map milestone once", () => {
    const save = freshSave();
    const map = getMap("verdant_route");

    expect(claimMilestoneDrops(save, map, 31).map((egg) => egg.rarity)).toEqual([
      "common",
      "common",
      "rare",
    ]);
    expect(claimMilestoneDrops(save, map, 31)).toEqual([]);
    expect(save.eggs).toHaveLength(3);
  });

  it("keeps seeded common-egg rarity results inside broad configured bands", () => {
    const rand = mulberry32(42);
    let common = 0;
    for (let index = 0; index < 10_000; index++) {
      const pokemon = rollHatch("common", rand);
      if (getSpecies(pokemon.speciesId).rarity === "common") common++;
    }

    expect(common).toBeGreaterThan(8_000);
    expect(common).toBeLessThan(9_000);
  });

  it("applies a completed run and grants milestone eggs only for a new best", () => {
    const save = freshSave();
    const map = getMap("verdant_route");

    const first = applyCompletedRun(save, map, {
      wavesCleared: 12,
      bossKills: 1,
      runXpByUid: {},
    });

    expect(first.newBest).toBe(true);
    expect(first.eggsGranted).toHaveLength(1);

    const second = applyCompletedRun(save, map, {
      wavesCleared: 11,
      bossKills: 1,
      runXpByUid: {},
    });

    expect(second.newBest).toBe(false);
    expect(second.eggsGranted).toEqual([]);
  });
});

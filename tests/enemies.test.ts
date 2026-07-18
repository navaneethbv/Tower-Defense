import { describe, expect, it } from "vitest";
import { ENEMIES } from "../src/data/enemies";
import { MAPS } from "../src/data/maps";
import { getSpecies } from "../src/data/species";

describe("expanded enemy roster", () => {
  it("uses valid unique species across reusable archetypes", () => {
    expect(ENEMIES.length).toBeGreaterThanOrEqual(40);
    expect(new Set(ENEMIES.map((enemy) => enemy.id)).size).toBe(ENEMIES.length);
    for (const enemy of ENEMIES) {
      const species = getSpecies(enemy.id);
      expect(enemy.dex).toBe(species.dex);
      expect(enemy.types).toEqual(species.types);
      expect(enemy.hp).toBeGreaterThan(0);
      expect(enemy.speed).toBeGreaterThan(0);
      expect(enemy.reward).toBeGreaterThan(0);
    }
  });

  it("represents every generation in map pools", () => {
    const pooledIds = new Set(
      MAPS.flatMap((map) => [
        ...map.waveGen.enemyPool.map((entry) => entry.enemyId),
        ...map.waveGen.bossPool.map((entry) => entry.enemyId),
      ]),
    );
    const expected = [
      "rattata",
      "hoothoot",
      "poochyena",
      "bidoof",
      "roggenrola",
      "fletchling",
      "rockruff",
      "skwovet",
      "lechonk",
    ];
    for (const id of expected) expect(pooledIds.has(id)).toBe(true);
  });

  it("gives every map deep regular and boss rotations", () => {
    for (const map of MAPS) {
      expect(map.waveGen.enemyPool.length).toBeGreaterThanOrEqual(12);
      expect(map.waveGen.bossPool.length).toBeGreaterThanOrEqual(5);
    }
  });
});

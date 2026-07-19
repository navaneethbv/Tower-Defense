import { describe, expect, it } from "vitest";
import { ENEMIES, getEnemy } from "../src/data/enemies";
import { MAPS } from "../src/data/maps";
import { getSpecies } from "../src/data/species";
import { Enemy } from "../src/engine/enemy";
import { PathGeometry } from "../src/engine/path";

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

  it("throws error for unknown enemy IDs", () => {
    expect(() => getEnemy("nonexistent")).toThrow("Unknown enemy id: nonexistent");
  });
});

describe("enemy status transitions", () => {
  function createTestEnemy(boss = false): Enemy {
    const map = MAPS[0]!;
    return new Enemy(
      getEnemy("rattata"),
      { hp: 100, speed: 1, armor: 0, reward: 5, heartDamage: 1, boss },
      new PathGeometry(map),
    );
  }

  it("wakes sleep and thaws freeze only after direct damage", () => {
    const enemy = createTestEnemy();
    enemy.applyStatus({ kind: "sleep", chance: 1, duration: 3, magnitude: 1 });
    enemy.applyStatus({ kind: "freeze", chance: 1, duration: 3, magnitude: 1 });
    expect(enemy.afterDirectHit("water")).toEqual(["wake"]);
    expect(enemy.status.has("freeze")).toBe(true);
    expect(enemy.afterDirectHit("fire")).toEqual(["thaw"]);
    expect(enemy.status.has("freeze")).toBe(false);
  });

  it("normalizes hard control when status is applied to a boss", () => {
    const boss = createTestEnemy(true);
    boss.applyStatus({ kind: "freeze", chance: 1, duration: 4, magnitude: 1 });
    expect(boss.status.get("freeze")?.remaining).toBe(2);
  });
});

import { describe, expect, it } from "vitest";
import { canHit, chooseTarget } from "../src/engine/targeting";
import { getEnemy } from "../src/data/enemies";
import { Enemy } from "../src/engine/enemy";

// Mock path for enemy setup
const mockPath = {
  points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
  cumulative: [0, 100],
  length: 100,
  positionAt(d: number) {
    return { x: d, y: 0 };
  },
  blockedTiles: new Set<string>(),
};

function createEnemy(distance: number, hp: number, speed: number, spectral = false): Enemy {
  const def = { ...getEnemy("rattata"), spectral };
  const spec = { hp, speed, armor: 0, reward: 5, heartDamage: 1, boss: false };
  const enemy = new Enemy(def, spec, mockPath);
  enemy.distance = distance;
  enemy.pos = { x: distance, y: 0 };
  enemy.hp = hp;
  return enemy;
}

describe("targeting canHit", () => {
  it("allows non-spectral enemies to be hit by default", () => {
    const enemy = createEnemy(10, 50, 1.2, false);
    expect(canHit(enemy, "normal", 1.0)).toBe(true);
    expect(canHit(enemy, "normal", 0.5)).toBe(true);
  });

  it("gates spectral enemies behind super-effective or specific types", () => {
    const enemy = createEnemy(10, 50, 1.2, true);
    // effectiveness > 1 (super effective)
    expect(canHit(enemy, "fire", 2.0)).toBe(true);
    // ghost attack type
    expect(canHit(enemy, "ghost", 0.5)).toBe(true);
    // psychic attack type
    expect(canHit(enemy, "psychic", 0.5)).toBe(true);
    // neutral / not very effective other type
    expect(canHit(enemy, "normal", 1.0)).toBe(false);
  });
});

describe("targeting chooseTarget", () => {
  const origin = { x: 0, y: 0 };
  const range = 50;

  it("returns null if no enemies are in range or alive", () => {
    const enemies = [
      createEnemy(100, 50, 1.2), // out of range
      createEnemy(20, 0, 1.2),   // dead (hp = 0)
    ];
    // make the dead enemy not alive
    const deadEnemy = enemies[1];
    if (deadEnemy) deadEnemy.alive = false;
    expect(chooseTarget(origin, range, enemies, "first")).toBeNull();
  });

  it("selects correct targets based on targeting mode", () => {
    const e1 = createEnemy(10, 100, 1.0); // closest, strongest, slowest
    const e2 = createEnemy(30, 50, 2.0);  // fastest
    const e3 = createEnemy(40, 20, 1.5);  // first, weakest, furthest
    const enemies = [e1, e2, e3];

    expect(chooseTarget(origin, range, enemies, "first")).toBe(e3);
    expect(chooseTarget(origin, range, enemies, "last")).toBe(e1);
    expect(chooseTarget(origin, range, enemies, "strongest")).toBe(e1);
    expect(chooseTarget(origin, range, enemies, "weakest")).toBe(e3);
    expect(chooseTarget(origin, range, enemies, "fastest")).toBe(e2);
    expect(chooseTarget(origin, range, enemies, "slowest")).toBe(e1);
    expect(chooseTarget(origin, range, enemies, "closest")).toBe(e1);
  });
});

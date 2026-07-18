import { describe, expect, it } from "vitest";
import { getEnemy } from "../src/data/enemies";
import { getMap } from "../src/data/maps";
import { Enemy } from "../src/engine/enemy";
import { GameSession } from "../src/engine/game";
import { Tower } from "../src/engine/tower";

const IVS = { damage: 0, range: 0, attackSpeed: 0 };

function setup(speciesId: string) {
  const game = new GameSession(getMap("verdant_route"), [], 1);
  const tower = new Tower("owner", speciesId, IVS, 1, 1, false);
  game.towers.push(tower);
  return { game, tower };
}

function addEnemy(game: GameSession, x: number, y: number, hp = 500): Enemy {
  const enemy = new Enemy(
    getEnemy("rattata"),
    { hp, speed: 0, armor: 0, reward: 5, heartDamage: 1, boss: false },
    game.path,
  );
  enemy.pos = { x, y };
  game.enemies.push(enemy);
  return enemy;
}

describe("active abilities", () => {
  it("executes a line blast and starts its cooldown", () => {
    const { game, tower } = setup("venusaur");
    const inLine = addEnemy(game, tower.pos.x + 80, tower.pos.y);
    const offLine = addEnemy(game, tower.pos.x + 80, tower.pos.y + 80);

    const result = game.activateAbility(tower);

    if (!result.ok) throw new Error(result.reason);
    expect(result.affected).toBe(1);
    expect(inLine.hp).toBeLessThan(inLine.maxHp);
    expect(offLine.hp).toBe(offLine.maxHp);
    expect(tower.abilityCooldownLeft).toBe(tower.species.ability!.cooldown);
  });

  it("applies an area burn to enemies in range", () => {
    const { game, tower } = setup("charizard");
    const nearby = addEnemy(game, tower.pos.x + 40, tower.pos.y);

    const result = game.activateAbility(tower);

    if (!result.ok) throw new Error(result.reason);
    expect(nearby.status.has("burn")).toBe(true);
    expect(nearby.hp).toBeLessThan(nearby.maxHp);
  });

  it("damages all active enemies with a path wave", () => {
    const { game, tower } = setup("blastoise");
    const first = addEnemy(game, 400, 100);
    const second = addEnemy(game, 700, 300);

    const result = game.activateAbility(tower);

    if (!result.ok) throw new Error(result.reason);
    expect(result.affected).toBe(2);
    expect(first.hp).toBeLessThan(first.maxHp);
    expect(second.hp).toBeLessThan(second.maxHp);
  });

  it("rejects activation without targets and while cooling down", () => {
    const { game, tower } = setup("raichu");

    expect(game.activateAbility(tower)).toEqual({ ok: false, reason: "No valid targets" });
    expect(tower.abilityCooldownLeft).toBe(0);

    addEnemy(game, tower.pos.x + 40, tower.pos.y);
    expect(game.activateAbility(tower).ok).toBe(true);
    expect(game.activateAbility(tower)).toEqual({ ok: false, reason: "Ability is cooling down" });
  });

  it("decrements ability cooldown during simulation updates", () => {
    const { game, tower } = setup("golem");
    addEnemy(game, tower.pos.x + 40, tower.pos.y);
    expect(game.activateAbility(tower).ok).toBe(true);
    const before = tower.abilityCooldownLeft;

    game.update(0.5);

    expect(tower.abilityCooldownLeft).toBeCloseTo(before - 0.5);
  });
});

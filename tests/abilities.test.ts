import { describe, expect, it } from "vitest";
import { getEnemy } from "../src/data/enemies";
import { getMap } from "../src/data/maps";
import { getSpecies } from "../src/data/species";
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
    { hp, speed: 1.2, armor: 0, reward: 5, heartDamage: 1, boss: false },
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

  it("executes aoe_push ability", () => {
    const { game, tower } = setup("pidgeot");
    const enemy = addEnemy(game, tower.pos.x + 20, tower.pos.y);
    enemy.distance = 100;
    enemy.pos = game.path.positionAt(100);

    const result = game.activateAbility(tower);
    expect(result.ok).toBe(true);
    expect(enemy.distance).toBe(52); // Math.max(0, 100 - 48)
  });

  it("executes aoe_stun ability", () => {
    const { game, tower } = setup("sandslash");
    const enemy = addEnemy(game, tower.pos.x + 20, tower.pos.y);

    const result = game.activateAbility(tower);
    expect(result.ok).toBe(true);
    expect(enemy.status.has("stun")).toBe(true);
  });

  it("executes multishot ability", () => {
    const { game, tower } = setup("snorlax");
    const enemy1 = addEnemy(game, tower.pos.x + 20, tower.pos.y);
    const enemy2 = addEnemy(game, tower.pos.x - 20, tower.pos.y);

    const result = game.activateAbility(tower);
    if (!result.ok) throw new Error("ability failed");
    expect(result.affected).toBe(2);
    expect(enemy1.hp).toBeLessThan(enemy1.maxHp);
    expect(enemy2.hp).toBeLessThan(enemy2.maxHp);
  });

  it("executes execute ability", () => {
    const { game, tower } = setup("umbreon");
    const enemy = addEnemy(game, tower.pos.x + 20, tower.pos.y, 100);
    // reduce HP below 30% to trigger execution
    enemy.hp = 25;

    const result = game.activateAbility(tower);
    expect(result.ok).toBe(true);
    expect(enemy.hp).toBeLessThan(25);
  });

  it("executes status_burst ability", () => {
    const { game, tower } = setup("gengar");
    const enemy = addEnemy(game, tower.pos.x + 20, tower.pos.y);

    const result = game.activateAbility(tower);
    expect(result.ok).toBe(true);
    expect(enemy.status.has("slow") || enemy.status.has("poison") || enemy.status.has("burn") || enemy.status.has("curse")).toBe(true);
  });
});

describe("game session helper methods", () => {
  it("updates targeting mode of a tower", () => {
    const { game, tower } = setup("pikachu");
    game.setTargeting(tower, "strongest");
    expect(tower.targeting).toBe("strongest");
  });

  it("calculates run XP correctly", () => {
    const { game, tower } = setup("pikachu");
    tower.runXp = 15;
    const runXp = game.runXpByUid();
    expect(runXp[tower.ownerUid]).toBe(15);
  });

  it("sells a tower and updates gold", () => {
    const { game, tower } = setup("pikachu");
    const initialGold = game.gold;
    tower.totalInvested = 100;
    
    // Sell an actual tower
    game.sellTower(tower);
    expect(game.towers).not.toContain(tower);
    expect(game.gold).toBe(initialGold + 60);

    // Try selling a non-deployed tower (should return early)
    const otherTower = new Tower("other-uid", "pikachu", IVS, 1, 1, false);
    const goldBefore = game.gold;
    game.sellTower(otherTower);
    expect(game.gold).toBe(goldBefore);
  });

  it("triggers event callbacks when defined", () => {
    let changed = false;
    let waveClearedVal = 0;
    let gameOverWon: boolean | null = null;

    const member = { uid: "uid", speciesId: "charmander", ivs: IVS, level: 1, xp: 0, hatchedAt: 0 };
    const map = getMap("verdant_route");
    const game = new GameSession(map, [member], 1, {
      onChange: () => { changed = true; },
      onWaveCleared: (w) => { waveClearedVal = w; },
      onGameOver: (won, _w) => { gameOverWon = won; }
    });

    // trigger onChange
    const pad = map.deploymentPads.find((candidate) =>
      getSpecies("charmander").allowedTerrain.includes(candidate.terrain),
    )!;
    game.placeTower("uid", pad.col, pad.row);
    expect(changed).toBe(true);

    // trigger onWaveCleared and onGameOver (won)
    game.phase = "wave";
    game.waveNumber = map.totalWaves;
    game.update(0.1);
    expect(waveClearedVal).toBe(map.totalWaves);
    expect(gameOverWon).toBe(true);

    // trigger onGameOver (lost)
    const game2 = new GameSession(getMap("verdant_route"), [], 1, {
      onGameOver: (won, _w) => { gameOverWon = won; }
    });
    game2.lives = 0;
    game2.update(0.1);
    expect(gameOverWon).toBe(false);
  });

  it("covers other GameSession state branches (abilities/upgrades/wave phase)", () => {
    const { game, tower } = setup("pikachu");
    
    // 1. activateAbility on non-deployed tower
    const nonDeployed = new Tower("other-uid", "pikachu", IVS, 1, 1, false);
    expect(game.activateAbility(nonDeployed)).toEqual({ ok: false, reason: "Tower is not deployed" });

    // 2. canUpgrade / upgradeTower returning false when lacking gold
    game.gold = 0;
    expect(game.canUpgrade(tower)).toBe(false);
    expect(game.upgradeTower(tower)).toBe(false);

    // 3. startWave returning false when already in wave phase
    game.phase = "wave";
    expect(game.startWave()).toBe(false);

    // 4. update early return when game is won or lost
    game.phase = "won";
    const initialGold = game.gold;
    game.update(1.0);
    expect(game.gold).toBe(initialGold);

    game.phase = "lost";
    game.update(1.0);
    expect(game.gold).toBe(initialGold);
  });
});

describe("redeployment lockout", () => {
  it("blocks attacks and abilities during the redeployment cooldown", () => {
    const { game, tower } = setup("charizard");
    const destination = game.map.deploymentPads.find(
      (pad) => tower.species.allowedTerrain.includes(pad.terrain) && (pad.col !== tower.col || pad.row !== tower.row),
    )!;
    expect(game.redeployTower(tower, destination.col, destination.row).ok).toBe(true);
    expect(game.activateAbility(tower)).toEqual({
      ok: false,
      reason: "Pokemon is redeploying",
    });
    game.update(5);
    expect(tower.redeployCooldownLeft).toBe(0);
  });
});

describe("status kill rewards", () => {
  it("awards status kills exactly once", () => {
    const { game, tower } = setup("charmander");
    const enemy = addEnemy(game, tower.pos.x + 20, tower.pos.y, 1);
    tower.cooldownLeft = 999;
    enemy.applyStatus({ kind: "burn", chance: 1, duration: 2, magnitude: 2 });
    const gold = game.gold;

    game.update(1);

    expect(game.gold).toBe(gold + enemy.reward);
    expect(tower.runXp).toBe(3);
    game.update(1);
    expect(game.gold).toBe(gold + enemy.reward);
  });
});

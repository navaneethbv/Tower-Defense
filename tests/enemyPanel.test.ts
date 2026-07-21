import { describe, expect, it } from "vitest";
import { getMap } from "../src/data/maps";
import { getEnemy } from "../src/data/enemies";
import { Enemy } from "../src/engine/enemy";
import { PathGeometry } from "../src/engine/path";
import type { EnemyStatMods } from "../src/types";
import { enemyAtPoint, enemyView } from "../src/ui/enemyPanel";

const path = new PathGeometry(getMap("verdant_route"));

const mods = (over: Partial<EnemyStatMods> = {}): EnemyStatMods => ({
  hp: 100,
  speed: 1,
  armor: 2,
  reward: 10,
  heartDamage: 1,
  boss: false,
  ...over,
});

describe("enemy inspection", () => {
  it("reports core stats for a plain enemy", () => {
    const view = enemyView(new Enemy(getEnemy("rattata"), mods(), path));

    expect(view.name).toBe("Rattata");
    expect(view.hpLabel).toBe("100 / 100");
    expect(view.hpPercent).toBe(1);
    expect(view.rows.find((r) => r.label === "Armor")?.value).toBe("2");
    expect(view.rows.find((r) => r.label === "Spectral")?.value).toBe("No");
    expect(view.notes).toEqual([]);
  });

  it("surfaces spectral, which decides whether a tower can connect at all", () => {
    const view = enemyView(new Enemy(getEnemy("gastly"), mods(), path));

    const spectral = view.rows.find((row) => row.label === "Spectral");
    expect(spectral?.value).toBe("Yes");
    expect(spectral?.emphasis).toBe(true);
    expect(view.notes.some((note) => note.includes("ghost, psychic"))).toBe(true);
  });

  it("surfaces regeneration and boss status-resistance", () => {
    const view = enemyView(new Enemy(getEnemy("grimer"), mods({ boss: true }), path));

    expect(view.rows.find((row) => row.label === "Regen")?.emphasis).toBe(true);
    expect(view.isBoss).toBe(true);
    expect(view.notes.some((note) => note.includes("Heals continuously"))).toBe(true);
    expect(view.notes.some((note) => note.includes("half as long"))).toBe(true);
  });

  it("shows armor as broken when armor break is active", () => {
    const enemy = new Enemy(getEnemy("aron"), mods({ armor: 9 }), path);
    enemy.status.apply("armorBreak", 5, 1);

    const view = enemyView(enemy);
    expect(view.rows.find((row) => row.label === "Armor")?.value).toContain("broken from 9");
  });

  it("clamps health display when an enemy is overkilled", () => {
    const enemy = new Enemy(getEnemy("rattata"), mods(), path);
    enemy.hp = -25;

    const view = enemyView(enemy);
    expect(view.hpPercent).toBe(0);
    expect(view.hpLabel).toBe("0 / 100");
  });

  it("picks the nearest living enemy within the grab radius", () => {
    const near = new Enemy(getEnemy("rattata"), mods(), path);
    const far = new Enemy(getEnemy("pidgey"), mods(), path);
    const dead = new Enemy(getEnemy("zubat"), mods(), path);
    near.pos = { x: 100, y: 100 };
    far.pos = { x: 140, y: 100 };
    dead.pos = { x: 101, y: 100 };
    dead.alive = false;

    expect(enemyAtPoint([far, dead, near], 102, 100, 30)).toBe(near);
    // Nothing within reach returns null rather than the closest-anywhere enemy.
    expect(enemyAtPoint([far, near], 400, 400, 30)).toBeNull();
  });
});

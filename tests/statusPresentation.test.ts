import { describe, expect, it, vi } from "vitest";
import { STATUS_PRESENTATION, statusSummary } from "../src/ui/statusPresentation";
import type { StatusKind } from "../src/types";
import { Enemy } from "../src/engine/enemy";
import { GameSession } from "../src/engine/game";
import { PathGeometry } from "../src/engine/path";
import { MAPS } from "../src/data/maps";
import { getEnemy } from "../src/data/enemies";
import { drawBoard } from "../src/engine/render/renderer";

const KINDS: StatusKind[] = [
  "slow", "poison", "burn", "toxic", "paralysis", "freeze",
  "sleep", "confusion", "stun", "armorBreak", "curse",
];

describe("status presentation", () => {
  it("defines a visible identity for every status kind", () => {
    expect(Object.keys(STATUS_PRESENTATION).sort()).toEqual([...KINDS].sort());
    for (const kind of KINDS) {
      expect(STATUS_PRESENTATION[kind].label.length).toBeGreaterThan(2);
      expect(STATUS_PRESENTATION[kind].icon.length).toBeGreaterThan(0);
      expect(STATUS_PRESENTATION[kind].color).toMatch(/^#/);
    }
  });

  it("describes chance, duration, and effect", () => {
    expect(statusSummary({ kind: "burn", chance: 0.3, duration: 4, magnitude: 7 }))
      .toBe("Burn · 30% chance · 4.0s · 7 damage per second");
  });
});

describe("status chip rendering", () => {
  it("draws one chip per active status, capped at five", () => {
    // The renderer lazily builds sprites; in node they just never become ready,
    // which exercises the fallback shape path and leaves chips unaffected.
    class StubImage {
      complete = false;
      naturalWidth = 0;
      src = "";
    }
    vi.stubGlobal("Image", StubImage);

    const enemy = new Enemy(
      getEnemy("rattata"),
      { hp: 100, speed: 1, armor: 0, reward: 5, heartDamage: 1, boss: false },
      new PathGeometry(MAPS[0]!),
    );
    const kinds: StatusKind[] = ["burn", "poison", "slow", "curse", "confusion", "toxic"];
    for (const kind of kinds) enemy.applyStatus({ kind, chance: 1, duration: 5, magnitude: 2 });

    const fills: string[] = [];
    const texts: string[] = [];
    const ctx = new Proxy(
      {
        canvas: { width: 960, height: 720 },
        fillRect() {},
        fillText(text: string) {
          texts.push(text);
        },
      } as unknown as CanvasRenderingContext2D,
      {
        get(target, prop) {
          if (prop in target) return Reflect.get(target, prop);
          return () => {};
        },
        set(target, prop, value) {
          if (prop === "fillStyle" && typeof value === "string") fills.push(value);
          return Reflect.set(target, prop, value);
        },
      },
    );

    const game = new GameSession(MAPS[0]!, [], 5);
    game.enemies.push(enemy);
    drawBoard(ctx, game, null, false, { allowedTerrain: null, hovered: null });

    const chipColors = kinds.map((kind) => STATUS_PRESENTATION[kind].color);
    const drawn = chipColors.filter((color) => fills.includes(color));
    expect(drawn.length).toBe(5);
    const icons = kinds.map((kind) => STATUS_PRESENTATION[kind].icon);
    expect(texts.filter((text) => icons.includes(text)).length).toBe(5);
  });
});

import { describe, expect, it, vi } from "vitest";
import type { MapConfig } from "../src/types";
import { PATH_WANG_BY_MATERIAL, pathVariant } from "../src/data/maps/tileCatalog";
import {
  drawMapLayers,
  pathConnectionMask,
  drawPadState,
  padVisualState,
  pathTileConnections,
  tileSourceRect,
} from "../src/engine/render/mapTiles";

describe("map tile rendering helpers", () => {
  it("maps one-based tile IDs into the eight-column atlas", () => {
    expect(tileSourceRect(1)).toEqual({ x: 0, y: 0, width: 48, height: 48 });
    expect(tileSourceRect(9)).toEqual({ x: 0, y: 48, width: 48, height: 48 });
    expect(tileSourceRect(64)).toEqual({ x: 336, y: 336, width: 48, height: 48 });
  });

  it("draws ground, connected path, and decor, but no pad base tile", () => {
    const draws: number[] = [];
    const ctx = {
      imageSmoothingEnabled: true,
      // Recover the tile id from the atlas source rect so tiles past the first
      // row are distinguishable from tiles in column zero.
      drawImage: (_image: unknown, sx: number, sy: number) =>
        draws.push((sy / 48) * 8 + sx / 48 + 1),
    } as unknown as CanvasRenderingContext2D;
    const map = {
      cols: 1,
      rows: 1,
      tiles: [1],
      pathTiles: [2],
      decor: [{ tile: 13, col: 0, row: 0 }],
      deploymentPads: [{ id: "grass-1", col: 0, row: 0, terrain: "grass", tile: 29 }],
      theme: { palette: "verdant", groundTile: 1, pathTile: 2 },
    } as MapConfig;

    drawMapLayers(ctx, map, {} as HTMLImageElement);

    expect(ctx.imageSmoothingEnabled).toBe(false);
    // A lone path cell has no neighbours, so it draws the isolated dirt variant
    // rather than the authored tile, which bakes edges into all four sides.
    // Pad tile 29 is absent: pads are marked by drawPadState, not stamped here,
    // so a water pad no longer paints a blue disc onto grass.
    expect(draws).toEqual([1, PATH_WANG_BY_MATERIAL[2]![0], 13]);
  });

  it("gives each authored path material its own connected variants", () => {
    for (const authored of [2, 4, 31, 59]) {
      const set = PATH_WANG_BY_MATERIAL[authored];
      expect(set, `material ${authored}`).toHaveLength(16);
      for (const id of set!) expect(id).toBeGreaterThan(64);
    }
    // A material without a generated set falls back to the authored tile.
    expect(pathVariant(999, 0)).toBe(999);
  });

  it("packs connections into a four-bit mask", () => {
    expect(pathConnectionMask({ north: false, east: false, south: false, west: false })).toBe(0);
    expect(pathConnectionMask({ north: true, east: false, south: false, west: false })).toBe(1);
    expect(pathConnectionMask({ north: false, east: true, south: true, west: true })).toBe(14);
    expect(pathConnectionMask({ north: true, east: true, south: true, west: true })).toBe(15);
  });

  it("connects baked-edge dirt tiles to horizontal runs and corners", () => {
    const horizontal = {
      cols: 3,
      rows: 1,
      pathTiles: [2, 2, 2],
    } as MapConfig;
    const corner = {
      cols: 3,
      rows: 3,
      pathTiles: [0, 0, 0, 2, 2, 0, 0, 2, 0],
    } as MapConfig;

    expect(pathTileConnections(horizontal, 1, 0)).toEqual({
      north: false,
      east: true,
      south: false,
      west: true,
    });
    expect(pathTileConnections(corner, 1, 1)).toEqual({
      north: false,
      east: false,
      south: true,
      west: true,
    });
  });

  it("prioritizes occupied and compatibility pad states", () => {
    expect(padVisualState({ occupied: true, selectedTerrain: null, padTerrain: "grass" })).toBe(
      "occupied",
    );
    expect(
      padVisualState({ occupied: false, selectedTerrain: ["grass"], padTerrain: "grass" }),
    ).toBe("compatible");
    expect(
      padVisualState({ occupied: false, selectedTerrain: ["water"], padTerrain: "grass" }),
    ).toBe("incompatible");
    expect(padVisualState({ occupied: false, selectedTerrain: null, padTerrain: "grass" })).toBe(
      "idle",
    );
  });

  it("gives an idle pad a habitat-distinct tint", () => {
    // pad.terrain gates which species may deploy, and the ground art beneath
    // disagrees with it on most pads in the shipped routes, so the idle marker
    // is the player's only truthful cue. Each habitat must look different.
    const strokes = (terrain: "grass" | "water" | "mountain"): string[] => {
      const seen: string[] = [];
      const ctx = {
        set strokeStyle(value: string) { seen.push(value); },
        get strokeStyle() { return ""; },
        lineWidth: 0,
        strokeRect: vi.fn(),
        fillRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        stroke: vi.fn(),
      } as unknown as CanvasRenderingContext2D;
      drawPadState(ctx, { id: `${terrain}-pad`, col: 1, row: 1, terrain, tile: 1 }, "idle", false);
      return seen;
    };

    const grass = strokes("grass");
    const water = strokes("water");
    const mountain = strokes("mountain");

    expect(grass.length).toBeGreaterThan(0);
    expect(new Set([grass[0], water[0], mountain[0]]).size).toBe(3);
  });

  it.each(["grass", "water", "mountain"] as const)(
    "draws a non-color terrain glyph for %s pads",
    (terrain) => {
      const ctx = {
        strokeStyle: "",
        lineWidth: 0,
        strokeRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        stroke: vi.fn(),
      } as unknown as CanvasRenderingContext2D;

      drawPadState(
        ctx,
        { id: `${terrain}-pad`, col: 1, row: 1, terrain, tile: 1 },
        "idle",
        false,
      );

      expect(ctx.beginPath).toHaveBeenCalled();
      expect(ctx.moveTo).toHaveBeenCalled();
      expect(ctx.lineTo).toHaveBeenCalled();
      expect(ctx.stroke).toHaveBeenCalled();
    },
  );
});

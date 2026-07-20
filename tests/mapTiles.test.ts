import { describe, expect, it, vi } from "vitest";
import type { MapConfig } from "../src/types";
import {
  drawMapLayers,
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

  it("draws ground, authored path, decor, and pad base in order", () => {
    const draws: number[] = [];
    const ctx = {
      imageSmoothingEnabled: true,
      drawImage: (_image: unknown, sx: number) => draws.push(sx / 48 + 1),
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
    expect(draws).toEqual([1, 2, 5, 5]);
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

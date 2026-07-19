import { describe, expect, it } from "vitest";
import type { MapConfig } from "../src/types";
import { drawMapLayers, padVisualState, tileSourceRect } from "../src/engine/render/mapTiles";

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
});

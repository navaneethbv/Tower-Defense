import type { MapConfig, Terrain } from "../../types";
import { TILE } from "../../data/constants";

export type PadVisualState = "idle" | "compatible" | "incompatible" | "occupied";

export interface PadStateInput {
  occupied: boolean;
  selectedTerrain: Terrain[] | null;
  padTerrain: Terrain;
}

let atlas: HTMLImageElement | undefined;

export function tileSourceRect(tileId: number): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const index = Math.max(0, tileId - 1);
  return {
    x: (index % 8) * TILE,
    y: Math.floor(index / 8) * TILE,
    width: TILE,
    height: TILE,
  };
}

export function padVisualState(input: PadStateInput): PadVisualState {
  if (input.occupied) return "occupied";
  if (!input.selectedTerrain) return "idle";
  return input.selectedTerrain.includes(input.padTerrain) ? "compatible" : "incompatible";
}

export function getMapAtlas(): HTMLImageElement | undefined {
  if (typeof Image === "undefined") return undefined;
  if (!atlas) {
    atlas = new Image();
    atlas.src = "/maps/route-tileset.png";
  }
  return atlas.complete && atlas.naturalWidth > 0 ? atlas : undefined;
}

export function drawMapLayers(
  ctx: CanvasRenderingContext2D,
  map: MapConfig,
  image: HTMLImageElement,
): void {
  ctx.imageSmoothingEnabled = false;
  for (let row = 0; row < map.rows; row++) {
    for (let col = 0; col < map.cols; col++) {
      const tile = map.tiles[row * map.cols + col] ?? map.theme.groundTile;
      const source = tileSourceRect(tile);
      ctx.drawImage(
        image,
        source.x,
        source.y,
        source.width,
        source.height,
        col * TILE,
        row * TILE,
        TILE,
        TILE,
      );
    }
  }
  for (const decor of map.decor) {
    const source = tileSourceRect(decor.tile);
    ctx.drawImage(
      image,
      source.x,
      source.y,
      source.width,
      source.height,
      decor.col * TILE,
      decor.row * TILE,
      TILE,
      TILE,
    );
  }
}

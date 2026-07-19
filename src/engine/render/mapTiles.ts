import type { DeploymentPad, MapConfig, Terrain } from "../../types";
import { TILE } from "../../data/constants";
import { MAP_ATLAS_COLUMNS } from "../../data/maps/tileCatalog";

export type PadVisualState = "idle" | "compatible" | "incompatible" | "occupied";

export interface PadStateInput {
  occupied: boolean;
  selectedTerrain: Terrain[] | null;
  padTerrain: Terrain;
}

let atlas: HTMLImageElement | undefined;
let atlasPromise: Promise<HTMLImageElement | undefined> | undefined;

export function tileSourceRect(tileId: number): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const index = Math.max(0, tileId - 1);
  return {
    x: (index % MAP_ATLAS_COLUMNS) * TILE,
    y: Math.floor(index / MAP_ATLAS_COLUMNS) * TILE,
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
    atlas.src = "/maps/route-tileset.svg";
  }
  return atlas.complete && atlas.naturalWidth > 0 ? atlas : undefined;
}

export function loadMapAtlas(): Promise<HTMLImageElement | undefined> {
  const ready = getMapAtlas();
  if (ready) return Promise.resolve(ready);
  if (typeof Image === "undefined" || !atlas) return Promise.resolve(undefined);
  if (!atlasPromise) {
    atlasPromise = new Promise((resolve) => {
      atlas!.addEventListener("load", () => resolve(atlas), { once: true });
      atlas!.addEventListener("error", () => resolve(undefined), { once: true });
    });
  }
  return atlasPromise;
}

function drawTile(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  tile: number,
  col: number,
  row: number,
): void {
  if (tile <= 0) return;
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

export function drawMapLayers(
  ctx: CanvasRenderingContext2D,
  map: MapConfig,
  image: HTMLImageElement,
): void {
  ctx.imageSmoothingEnabled = false;
  for (let row = 0; row < map.rows; row++) {
    for (let col = 0; col < map.cols; col++) {
      drawTile(ctx, image, map.tiles[row * map.cols + col] ?? map.theme.groundTile, col, row);
      drawTile(ctx, image, map.pathTiles[row * map.cols + col] ?? 0, col, row);
    }
  }
  for (const decor of map.decor) drawTile(ctx, image, decor.tile, decor.col, decor.row);
  for (const pad of map.deploymentPads) drawTile(ctx, image, pad.tile, pad.col, pad.row);
}

export function drawPadState(
  ctx: CanvasRenderingContext2D,
  pad: DeploymentPad,
  state: PadVisualState,
  hovered: boolean,
): void {
  const x = pad.col * TILE;
  const y = pad.row * TILE;
  const colors: Record<PadVisualState, string> = {
    idle: "rgba(238,248,201,0.72)",
    compatible: "#eef8c9",
    incompatible: "#c95f58",
    occupied: "#182536",
  };
  ctx.strokeStyle = hovered ? "#ffffff" : colors[state];
  ctx.lineWidth = hovered || state === "compatible" ? 3 : 2;
  ctx.strokeRect(x + 5, y + 5, TILE - 10, TILE - 10);
  if (state === "incompatible") {
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 14);
    ctx.lineTo(x + TILE - 14, y + TILE - 14);
    ctx.moveTo(x + TILE - 14, y + 14);
    ctx.lineTo(x + 14, y + TILE - 14);
    ctx.stroke();
  }
}

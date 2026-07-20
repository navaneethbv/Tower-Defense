import type { DeploymentPad, MapConfig, Terrain } from "../../types";
import { TILE } from "../../data/constants";
import { MAP_ATLAS_COLUMNS } from "../../data/maps/tileCatalog";

export type PadVisualState = "idle" | "compatible" | "incompatible" | "occupied";

export interface PadStateInput {
  occupied: boolean;
  selectedTerrain: Terrain[] | null;
  padTerrain: Terrain;
}

export interface PathTileConnections {
  north: boolean;
  east: boolean;
  south: boolean;
  west: boolean;
}

const AUTO_CONNECTED_PATH_TILE_IDS = new Set([2]);

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
    atlas.src = "/maps/route-tileset.png";
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

export function pathTileConnections(
  map: Pick<MapConfig, "cols" | "rows" | "pathTiles">,
  col: number,
  row: number,
): PathTileConnections {
  const hasPath = (targetCol: number, targetRow: number): boolean =>
    targetCol >= 0 &&
    targetCol < map.cols &&
    targetRow >= 0 &&
    targetRow < map.rows &&
    (map.pathTiles[targetRow * map.cols + targetCol] ?? 0) > 0;
  const connections = {
    north: hasPath(col, row - 1),
    east: hasPath(col + 1, row),
    south: hasPath(col, row + 1),
    west: hasPath(col - 1, row),
  };
  const interiorConnectionCount = Object.values(connections).filter(Boolean).length;
  if (interiorConnectionCount === 1) {
    if (row === 0) connections.north = true;
    if (col === map.cols - 1) connections.east = true;
    if (row === map.rows - 1) connections.south = true;
    if (col === 0) connections.west = true;
  }
  return connections;
}

function drawConnectedPathTile(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  tile: number,
  col: number,
  row: number,
  connections: PathTileConnections,
): void {
  const source = tileSourceRect(tile);
  const x = col * TILE;
  const y = row * TILE;
  const drawArm = (
    clipX: number,
    clipY: number,
    clipWidth: number,
    clipHeight: number,
    rotation: number,
  ): void => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(clipX, clipY, clipWidth, clipHeight);
    ctx.clip();
    ctx.translate(x + TILE / 2, y + TILE / 2);
    ctx.rotate(rotation);
    ctx.drawImage(
      image,
      source.x,
      source.y,
      source.width,
      source.height,
      -TILE / 2,
      -TILE / 2,
      TILE,
      TILE,
    );
    ctx.restore();
  };

  if (connections.north) drawArm(x, y, TILE, TILE / 2, 0);
  if (connections.south) drawArm(x, y + TILE / 2, TILE, TILE / 2, 0);
  if (connections.west) drawArm(x, y, TILE / 2, TILE, Math.PI / 2);
  if (connections.east) drawArm(x + TILE / 2, y, TILE / 2, TILE, Math.PI / 2);
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
      const pathTile = map.pathTiles[row * map.cols + col] ?? 0;
      const connections = pathTileConnections(map, col, row);
      if (AUTO_CONNECTED_PATH_TILE_IDS.has(pathTile) && Object.values(connections).some(Boolean)) {
        drawConnectedPathTile(ctx, image, pathTile, col, row, connections);
      } else {
        drawTile(ctx, image, pathTile, col, row);
      }
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

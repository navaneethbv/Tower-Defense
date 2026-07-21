import type { DeploymentPad, MapConfig, Terrain } from "../../types";
import { TILE } from "../../data/constants";
import { MAP_ATLAS_COLUMNS, pathVariant } from "../../data/maps/tileCatalog";

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

/** Packs path connections into the four-bit mask the wang tables are indexed by. */
export function pathConnectionMask(connections: PathTileConnections): number {
  return (
    (connections.north ? 1 : 0) |
    (connections.east ? 2 : 0) |
    (connections.south ? 4 : 0) |
    (connections.west ? 8 : 0)
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
      const pathTile = map.pathTiles[row * map.cols + col] ?? 0;
      if (pathTile > 0) {
        // Autotiled variants are transparent outside the road body, so they
        // composite over the authored ground and each route keeps its terrain.
        const mask = pathConnectionMask(pathTileConnections(map, col, row));
        drawTile(ctx, image, pathVariant(pathTile, mask), col, row);
      }
    }
  }
  for (const decor of map.decor) drawTile(ctx, image, decor.tile, decor.col, decor.row);
  // Pads deliberately draw no base tile. Stamping a pad's habitat tile here put
  // water discs on top of grass wherever the habitat and ground layers disagree,
  // which read as debris floating on the board. drawPadState marks them instead.
}

/**
 * Habitat tints for idle pad markers. Chosen to stay legible over grass, water,
 * stone and lava alike, since a pad's habitat routinely differs from the ground
 * art beneath it.
 */
const PAD_TERRAIN_TINT: Record<Terrain, string> = {
  grass: "rgba(158,230,130,0.95)",
  water: "rgba(125,205,247,0.95)",
  mountain: "rgba(214,205,188,0.95)",
};

/** Small habitat mark: leaf for grass, ripples for water, peak for mountain. */
function drawTerrainGlyph(
  ctx: CanvasRenderingContext2D,
  terrain: Terrain,
  x: number,
  y: number,
  colour: string,
): void {
  ctx.strokeStyle = colour;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (terrain === "grass") {
    ctx.moveTo(x + 18, y + 24);
    ctx.lineTo(x + 24, y + 18);
    ctx.lineTo(x + 30, y + 24);
    ctx.lineTo(x + 24, y + 30);
    ctx.closePath();
    ctx.moveTo(x + 24, y + 19);
    ctx.lineTo(x + 24, y + 29);
  } else if (terrain === "water") {
    ctx.moveTo(x + 17, y + 21);
    ctx.lineTo(x + 21, y + 19);
    ctx.lineTo(x + 25, y + 21);
    ctx.lineTo(x + 29, y + 19);
    ctx.moveTo(x + 17, y + 28);
    ctx.lineTo(x + 21, y + 26);
    ctx.lineTo(x + 25, y + 28);
    ctx.lineTo(x + 29, y + 26);
  } else {
    ctx.moveTo(x + 17, y + 29);
    ctx.lineTo(x + 23, y + 18);
    ctx.lineTo(x + 30, y + 29);
    ctx.closePath();
    ctx.moveTo(x + 20, y + 24);
    ctx.lineTo(x + 23, y + 21);
    ctx.lineTo(x + 26, y + 25);
  }
  ctx.stroke();
}

/**
 * Deployment pads.
 *
 * Idle pads stay quiet so the artwork reads, but they are tinted and marked by
 * habitat: `pad.terrain` decides which species may deploy there, and the ground
 * art underneath contradicts it on more than half the pads in the shipped
 * routes, so the marker is the only truthful cue available before the player
 * commits to a Pokemon. A filled highlight is added only once a deployment or
 * redeployment is actually in progress.
 */
export function drawPadState(
  ctx: CanvasRenderingContext2D,
  pad: DeploymentPad,
  state: PadVisualState,
  hovered: boolean,
): void {
  // A tower already covers an occupied pad; drawing over it only adds noise.
  if (state === "occupied") return;

  const x = pad.col * TILE;
  const y = pad.row * TILE;

  if (state === "idle" && !hovered) {
    // Tinted by habitat, because which species a pad accepts is decided by
    // pad.terrain and the ground art underneath frequently disagrees with it:
    // a water pad often sits on grass. The tint is the only cue a player has
    // before picking a Pokemon, so it has to carry the habitat, not just say
    // "buildable".
    ctx.strokeStyle = PAD_TERRAIN_TINT[pad.terrain];
    ctx.lineWidth = 2;
    const inset = 7;
    const arm = 6;
    ctx.beginPath();
    for (const [cx, cy, dx, dy] of [
      [inset, inset, 1, 1],
      [TILE - inset, inset, -1, 1],
      [inset, TILE - inset, 1, -1],
      [TILE - inset, TILE - inset, -1, -1],
    ] as const) {
      ctx.moveTo(x + cx, y + cy + dy * arm);
      ctx.lineTo(x + cx, y + cy);
      ctx.lineTo(x + cx + dx * arm, y + cy);
    }
    ctx.stroke();
    drawTerrainGlyph(ctx, pad.terrain, x, y, PAD_TERRAIN_TINT[pad.terrain]);
    return;
  }

  const colors: Record<PadVisualState, string> = {
    idle: "rgba(238,248,201,0.72)",
    compatible: "#eef8c9",
    incompatible: "#c95f58",
    occupied: "#182536",
  };
  if (state === "compatible" || hovered) {
    ctx.fillStyle = hovered ? "rgba(238,248,201,0.26)" : "rgba(238,248,201,0.14)";
    ctx.fillRect(x + 5, y + 5, TILE - 10, TILE - 10);
  }
  ctx.strokeStyle = hovered ? "#ffffff" : colors[state];
  ctx.lineWidth = hovered || state === "compatible" ? 3 : 2;
  ctx.strokeRect(x + 5, y + 5, TILE - 10, TILE - 10);
  drawTerrainGlyph(ctx, pad.terrain, x, y, hovered ? "#ffffff" : colors[state]);
  if (state === "incompatible") {
    ctx.strokeStyle = colors.incompatible;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 14);
    ctx.lineTo(x + TILE - 14, y + TILE - 14);
    ctx.moveTo(x + TILE - 14, y + 14);
    ctx.lineTo(x + 14, y + TILE - 14);
    ctx.stroke();
  }
}

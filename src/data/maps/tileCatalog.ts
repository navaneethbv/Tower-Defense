import {
  ATLAS_COLUMNS,
  ATLAS_ROWS,
  ATLAS_TILE_COUNT,
  PATH_WANG_BY_MATERIAL,
} from "./generated/autotiles";

// The route atlas is a grid of authored 48px pixel-art tiles. The first 64 are
// the original hand-authored art; tools/extend-tileset.mjs appends autotile
// variants below them.
export const MAP_ATLAS_COLUMNS = ATLAS_COLUMNS;
export const MAP_ATLAS_ROWS = ATLAS_ROWS;
export const MAP_ATLAS_TILE_COUNT = ATLAS_TILE_COUNT;

export { PATH_WANG_BY_MATERIAL };

/**
 * Picks the connected variant of an authored path tile for a neighbour mask
 * (N=1, E=2, S=4, W=8). Materials without a generated set fall through to the
 * authored tile, so an unrecognised path id degrades rather than disappears.
 */
export function pathVariant(authoredTile: number, mask: number): number {
  return PATH_WANG_BY_MATERIAL[authoredTile]?.[mask] ?? authoredTile;
}

// Trodden dirt and its grass-edged variants; routes lay corridors from these.
export const PATH_TILE_IDS = new Set<number>([2, 10, 15, 18, 26, 42, 50, 58]);

// Pad bases sit flush with their habitat and let drawPadState supply the
// deployment ring. River and boulder tiles carry baked dark banks, so using
// them here punched dark holes through ponds and cliffs.
export const PAD_TILE_IDS = new Set<number>([
  3, 4, 5, 12, 14, 20, 23, 27, 29, 30, 31, 41, 44, 46, 48, 59,
]);

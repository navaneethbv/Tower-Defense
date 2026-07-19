// The route atlas is an 8x8 grid of authored 48px pixel-art tiles.
export const MAP_ATLAS_COLUMNS = 8;
export const MAP_ATLAS_ROWS = 8;
export const MAP_ATLAS_TILE_COUNT = MAP_ATLAS_COLUMNS * MAP_ATLAS_ROWS;

// Trodden dirt and its grass-edged variants; routes lay corridors from these.
export const PATH_TILE_IDS = new Set<number>([2, 10, 15, 18, 26, 42, 50, 58]);

// Pad bases sit flush with their habitat and let drawPadState supply the
// deployment ring. River and boulder tiles carry baked dark banks, so using
// them here punched dark holes through ponds and cliffs.
export const PAD_TILE_IDS = new Set<number>([3, 20, 29, 30, 46, 59]);

export const PAD_TILE_BY_TERRAIN = {
  grass: 29,
  water: 3,
  mountain: 20,
} as const;

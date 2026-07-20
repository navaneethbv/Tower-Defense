// The route atlas is an 8x8 grid of authored 48px pixel-art tiles.
export const MAP_ATLAS_COLUMNS = 8;
export const MAP_ATLAS_ROWS = 8;
export const MAP_ATLAS_TILE_COUNT = MAP_ATLAS_COLUMNS * MAP_ATLAS_ROWS;

// Trodden dirt and its grass-edged variants; routes lay corridors from these.
export const PATH_TILE_IDS = new Set<number>([2, 10, 15, 18, 26, 42, 50, 58]);

// Pad bases sit flush with their habitat and let drawPadState supply the
// deployment ring. River and boulder tiles carry baked dark banks, so using
// them here punched dark holes through ponds and cliffs.
export const PAD_TILE_IDS = new Set<number>([
  3, 4, 5, 12, 14, 20, 23, 27, 29, 30, 31, 41, 44, 46, 48, 59,
]);

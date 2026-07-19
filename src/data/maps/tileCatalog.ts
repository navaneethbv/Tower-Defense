export const MAP_ATLAS_COLUMNS = 12;
export const MAP_ATLAS_ROWS = 12;
export const MAP_ATLAS_TILE_COUNT = MAP_ATLAS_COLUMNS * MAP_ATLAS_ROWS;

// Biome path families occupy tiles 65 through 118; the remaining bands hold
// landmark pieces (119-126) and the three deployment-pad families (127-144).
export const PATH_TILE_IDS = new Set<number>(
  Array.from({ length: 54 }, (_, index) => 65 + index),
);

export const PAD_TILE_IDS = new Set<number>([
  127, 128, 129, 130, 131, 132,
  133, 134, 135, 136, 137, 138,
  139, 140, 141, 142, 143, 144,
]);

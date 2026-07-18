import type { Terrain } from "../../types";

// Build a terrain grid [row][col] from simple row bands. A real 2D grid (rather
// than the prototype's row-only rule) lets maps place water/mountain pockets.
export function buildTerrain(
  cols: number,
  rows: number,
  bands: { waterRows?: number[]; mountainRows?: number[] },
): Terrain[][] {
  const water = new Set(bands.waterRows ?? []);
  const mountain = new Set(bands.mountainRows ?? []);
  const grid: Terrain[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: Terrain[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(water.has(r) ? "water" : mountain.has(r) ? "mountain" : "grass");
    }
    grid.push(row);
  }
  return grid;
}

import type { MapConfig } from "../types";
import { TILE } from "../data/constants";

export interface Point {
  x: number;
  y: number;
}

// Precomputed path geometry in pixel space, plus the tile set the path occupies
// (used to block tower placement).
export class PathGeometry {
  readonly points: Point[];
  readonly cumulative: number[];
  readonly length: number;
  readonly blockedTiles: Set<string>;

  constructor(map: MapConfig) {
    this.points = map.path.map((w) => ({ x: (w.x + 0.5) * TILE, y: (w.y + 0.5) * TILE }));
    this.cumulative = [0];
    for (let i = 1; i < this.points.length; i++) {
      this.cumulative.push(this.cumulative[i - 1]! + dist(this.points[i - 1]!, this.points[i]!));
    }
    this.length = this.cumulative[this.cumulative.length - 1]!;
    this.blockedTiles = computeBlockedTiles(map, this.points);
  }

  // World position at a given distance travelled along the path.
  positionAt(d: number): Point {
    if (d <= 0) return this.points[0]!;
    if (d >= this.length) return this.points[this.points.length - 1]!;
    let seg = 1;
    while (seg < this.cumulative.length && this.cumulative[seg]! < d) seg++;
    const a = this.points[seg - 1]!;
    const b = this.points[seg]!;
    const segStart = this.cumulative[seg - 1]!;
    const segLen = this.cumulative[seg]! - segStart;
    const t = segLen === 0 ? 0 : (d - segStart) / segLen;
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  }
}

function dist(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function tileKey(col: number, row: number): string {
  return `${col},${row}`;
}

function computeBlockedTiles(map: MapConfig, points: Point[]): Set<string> {
  const blocked = new Set<string>();
  // Sample densely along each segment and mark the tile under each sample.
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const steps = Math.ceil(dist(a, b) / (TILE / 4));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const px = a.x + (b.x - a.x) * t;
      const py = a.y + (b.y - a.y) * t;
      const col = Math.floor(px / TILE);
      const row = Math.floor(py / TILE);
      if (col >= 0 && col < map.cols && row >= 0 && row < map.rows) {
        blocked.add(tileKey(col, row));
      }
    }
  }
  return blocked;
}

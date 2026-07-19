import type { LandmarkRole, MapConfig } from "../../types";

export interface RouteVisualMetrics {
  pathDistance: number;
  turns: number;
  groundAndPathTiles: number;
  decorTiles: number;
  landmarkRoles: Record<LandmarkRole, number>;
}

export function pathDistance(path: MapConfig["path"]): number {
  return path.slice(1).reduce((sum, point, index) => {
    const previous = path[index]!;
    return sum + Math.hypot(point.x - previous.x, point.y - previous.y);
  }, 0);
}

export function pathTurnCount(path: MapConfig["path"]): number {
  let turns = 0;
  for (let index = 1; index < path.length - 1; index++) {
    const before = path[index - 1]!;
    const point = path[index]!;
    const after = path[index + 1]!;
    const firstDirection = [Math.sign(point.x - before.x), Math.sign(point.y - before.y)];
    const secondDirection = [Math.sign(after.x - point.x), Math.sign(after.y - point.y)];
    if (firstDirection[0] !== secondDirection[0] || firstDirection[1] !== secondDirection[1]) turns++;
  }
  return turns;
}

export function pathCellKeys(
  path: MapConfig["path"],
  cols: number,
  rows: number,
): Set<string> {
  const keys = new Set<string>();
  for (let index = 0; index < path.length - 1; index++) {
    const start = path[index]!;
    const end = path[index + 1]!;
    const startCol = Math.round(start.x);
    const endCol = Math.round(end.x);
    const startRow = Math.round(start.y);
    const endRow = Math.round(end.y);
    for (let row = Math.min(startRow, endRow); row <= Math.max(startRow, endRow); row++) {
      for (let col = Math.min(startCol, endCol); col <= Math.max(startCol, endCol); col++) {
        if (col >= 0 && col < cols && row >= 0 && row < rows) keys.add(`${col},${row}`);
      }
    }
  }
  return keys;
}

export function routeVisualMetrics(map: MapConfig): RouteVisualMetrics {
  const landmarkRoles: Record<LandmarkRole, number> = {
    dominant: 0,
    secondary: 0,
    entrance: 0,
    exit: 0,
  };
  for (const landmark of map.landmarks) landmarkRoles[landmark.role]++;
  return {
    pathDistance: pathDistance(map.path),
    turns: pathTurnCount(map.path),
    groundAndPathTiles: new Set([...map.tiles, ...map.pathTiles].filter((tile) => tile > 0)).size,
    decorTiles: new Set(map.decor.map((item) => item.tile)).size,
    landmarkRoles,
  };
}

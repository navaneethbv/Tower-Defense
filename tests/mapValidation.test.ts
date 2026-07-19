import { describe, expect, it } from "vitest";
import type { MapConfig } from "../src/types";
import {
  pathCellKeys,
  pathDistance,
  pathTurnCount,
  routeVisualMetrics,
} from "../src/data/maps/validation";

const path: MapConfig["path"] = [
  { x: 0, y: 0 },
  { x: 4, y: 0 },
  { x: 4, y: 3 },
  { x: 8, y: 3 },
];

describe("route visual metrics", () => {
  it("measures orthogonal path distance and turns", () => {
    expect(pathDistance(path)).toBe(11);
    expect(pathTurnCount(path)).toBe(2);
    expect([...pathCellKeys(path, 9, 4)]).toEqual([
      "0,0", "1,0", "2,0", "3,0", "4,0",
      "4,1", "4,2", "4,3", "5,3", "6,3", "7,3", "8,3",
    ]);
  });

  it("counts visual tile and landmark diversity", () => {
    const map = {
      path,
      tiles: [1, 2, 3],
      pathTiles: [65, 66, 0],
      decor: [{ tile: 101 }, { tile: 102 }],
      landmarks: [
        { role: "dominant" },
        { role: "secondary" },
        { role: "secondary" },
        { role: "entrance" },
        { role: "exit" },
      ],
    } as MapConfig;
    expect(routeVisualMetrics(map)).toMatchObject({
      pathDistance: 11,
      turns: 2,
      groundAndPathTiles: 5,
      decorTiles: 2,
      landmarkRoles: { dominant: 1, secondary: 2, entrance: 1, exit: 1 },
    });
  });
});

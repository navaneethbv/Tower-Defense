import { describe, it, expect } from "vitest";
import { getMap, MAPS } from "../src/data/maps";
import { getEnemy } from "../src/data/enemies";
import { generateWave } from "../src/waves/generator";
import { buildTerrain } from "../src/data/maps/terrain";
import { MAP_ATLAS_TILE_COUNT, PAD_TILE_IDS } from "../src/data/maps/tileCatalog";
import { pathCellKeys, routeVisualMetrics } from "../src/data/maps/validation";

describe("map configs", () => {
  it("rejects unknown route ids", () => {
    expect(() => getMap("missing_route")).toThrow("Unknown map id: missing_route");
  });

  it("builds terrain grids with bands correctly", () => {
    const grid = buildTerrain(5, 4, { waterRows: [1], mountainRows: [2] });
    expect(grid).toHaveLength(4);
    expect(grid[0]).toEqual(["grass", "grass", "grass", "grass", "grass"]);
    expect(grid[1]).toEqual(["water", "water", "water", "water", "water"]);
    expect(grid[2]).toEqual(["mountain", "mountain", "mountain", "mountain", "mountain"]);
    expect(grid[3]).toEqual(["grass", "grass", "grass", "grass", "grass"]);
  });

  it("defines nine authored 100-wave routes with safe habitat pads", () => {
    expect(MAPS.map((map) => map.id)).toEqual([
      "verdant_route",
      "river_crossing",
      "granite_cave",
      "ember_caldera",
      "frostbound_lake",
      "shadow_marsh",
      "skygarden_ruins",
      "ancient_sanctuary",
      "indigo_plateau",
    ]);
    expect(new Set(MAPS.map((map) => map.id)).size).toBe(9);

    for (const map of MAPS) {
      expect(map.totalWaves).toBe(100);
      expect(map.tiles).toHaveLength(map.rows * map.cols);
      expect(map.deploymentPads.length).toBeGreaterThanOrEqual(10);
      expect(new Set(map.deploymentPads.map((pad) => pad.id)).size).toBe(
        map.deploymentPads.length,
      );
      expect(new Set(map.deploymentPads.map((pad) => pad.terrain)).size).toBeGreaterThanOrEqual(
        2,
      );
      for (const pad of map.deploymentPads) {
        expect(pad.col).toBeGreaterThanOrEqual(0);
        expect(pad.col).toBeLessThan(map.cols);
        expect(pad.row).toBeGreaterThanOrEqual(0);
        expect(pad.row).toBeLessThan(map.rows);
        expect(map.terrain[pad.row]![pad.col]).toBe(pad.terrain);
      }
    }

    expect(
      new Set(MAPS.find((map) => map.id === "indigo_plateau")!.deploymentPads.map((pad) => pad.terrain)),
    ).toEqual(new Set(["grass", "water", "mountain"]));
  });

  it.each([
    ["verdant_route", "research-outpost", [1, 2, 13, 17, 25, 30, 33, 36], 8, 6, 50.5, 12],
    ["river_crossing", "river-islands", [1, 2, 3, 13, 17, 25, 27, 59], 6, 4, 36, 14],
    ["granite_cave", "crystal-chambers", [3, 4, 11, 12, 20, 21, 32, 40], 8, 6, 50, 12],
  ] as const)("gives %s a dense balanced authored identity", (
    mapId,
    dominantId,
    requiredTiles,
    waypoints,
    turns,
    distance,
    pads,
  ) => {
    const map = getMap(mapId);
    const metrics = routeVisualMetrics(map);
    expect(map.landmarks.find((landmark) => landmark.role === "dominant")?.id).toBe(dominantId);
    const used = new Set([...map.tiles, ...map.pathTiles, ...map.decor.map((item) => item.tile)]);
    for (const tile of requiredTiles) expect(used.has(tile)).toBe(true);
    expect(map.path.length).toBeGreaterThanOrEqual(waypoints - 1);
    expect(map.path.length).toBeLessThanOrEqual(waypoints + 1);
    expect(metrics.turns).toBeGreaterThanOrEqual(turns - 1);
    expect(metrics.turns).toBeLessThanOrEqual(turns + 1);
    expect(metrics.pathDistance).toBeGreaterThanOrEqual(distance * 0.9);
    expect(metrics.pathDistance).toBeLessThanOrEqual(distance * 1.1);
    expect(map.deploymentPads.length).toBeGreaterThanOrEqual(pads);
    expect(new Set(map.deploymentPads.map((pad) => pad.terrain))).toEqual(
      new Set(["grass", "water", "mountain"]),
    );
    expect(metrics.groundAndPathTiles).toBeGreaterThanOrEqual(8);
    expect(metrics.decorTiles).toBeGreaterThanOrEqual(6);
    expect(metrics.landmarkRoles).toEqual({ dominant: 1, secondary: 2, entrance: 1, exit: 1 });
    for (const landmark of map.landmarks.filter(({ role }) => role === "entrance" || role === "exit")) {
      expect(
        landmark.col === 0 ||
        landmark.row === 0 ||
        landmark.col + landmark.width === map.cols ||
        landmark.row + landmark.height === map.rows,
      ).toBe(true);
    }
    for (const tile of used) expect(tile).toBeLessThanOrEqual(MAP_ATLAS_TILE_COUNT);
    for (const pad of map.deploymentPads) expect(PAD_TILE_IDS.has(pad.tile)).toBe(true);
    const pathCells = pathCellKeys(map.path, map.cols, map.rows);
    const boundaryEndpoint = (point: { x: number; y: number }): boolean =>
      point.x <= 0 || point.y <= 0 || point.x >= map.cols - 1 || point.y >= map.rows - 1;
    expect(boundaryEndpoint(map.path[0]!)).toBe(true);
    expect(boundaryEndpoint(map.path.at(-1)!)).toBe(true);
    for (const key of pathCells) {
      const [col, row] = key.split(",").map(Number);
      expect(map.pathTiles[row! * map.cols + col!]).toBeGreaterThan(0);
    }
    const padCells = new Set(map.deploymentPads.map((pad) => `${pad.col},${pad.row}`));
    for (const padCell of padCells) expect(pathCells.has(padCell)).toBe(false);
    for (const decor of map.decor) expect(padCells.has(`${decor.col},${decor.row}`)).toBe(false);
  });

  it("every enemy and boss id in every pool resolves", () => {
    for (const map of MAPS) {
      for (const e of map.waveGen.enemyPool) expect(() => getEnemy(e.enemyId)).not.toThrow();
      for (const b of map.waveGen.bossPool) expect(() => getEnemy(b.enemyId)).not.toThrow();
    }
  });

  it("generates all configured waves with spawns on every map", () => {
    for (const map of MAPS) {
      for (let n = 1; n <= map.totalWaves; n++) {
        const plan = generateWave(map, n, 7);
        expect(plan.spawns.length).toBeGreaterThan(0);
        // Delays are non-negative and sorted.
        let last = -1;
        for (const s of plan.spawns) {
          expect(s.delay).toBeGreaterThanOrEqual(last);
          last = s.delay;
        }
      }
    }
  });

  it("early waves only draw from pool entries already unlocked", () => {
    for (const map of MAPS) {
      const plan = generateWave(map, 1, 3);
      const unlocked = new Set(map.waveGen.enemyPool.filter((e) => e.minWave <= 1).map((e) => e.enemyId));
      for (const s of plan.spawns) expect(unlocked.has(s.enemyId)).toBe(true);
    }
  });

  it("terrain grid matches declared dimensions", () => {
    for (const map of MAPS) {
      expect(map.terrain.length).toBe(map.rows);
      for (const row of map.terrain) expect(row.length).toBe(map.cols);
    }
  });

  it("builds terrain with default bands fallback when they are omitted", () => {
    const grid = buildTerrain(2, 2, {});
    expect(grid).toHaveLength(2);
    expect(grid[0]).toEqual(["grass", "grass"]);
    expect(grid[1]).toEqual(["grass", "grass"]);
  });
});

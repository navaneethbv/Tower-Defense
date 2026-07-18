import { describe, expect, it } from "vitest";
import { loadAuthoredMap } from "../src/data/maps/tiled";
import type { TiledRouteSource, RouteRuntimeConfig } from "../src/data/maps/authored/types";

const mockConfig: RouteRuntimeConfig = {
  id: "test_route",
  name: "Test Route",
  description: "A test route.",
  totalWaves: 100,
  theme: { palette: "forest", groundTile: 1, pathTile: 2 },
  waveGen: {
    enemyPool: [],
    bossPool: [],
    baseCount: 5,
    countGrowth: 0.1,
    hpBase: 10,
    hpGrowth: 0.25,
    spawnInterval: 0.8,
    seedSalt: 123,
  },
  unlockRequirement: null,
  rewardMultiplier: 1.0,
};

function createValidSource(): TiledRouteSource {
  return {
    width: 2,
    height: 2,
    tilewidth: 48,
    tileheight: 48,
    layers: [
      {
        type: "tilelayer",
        name: "ground",
        width: 2,
        height: 2,
        data: [1, 2, 3, 4],
      },
      {
        type: "tilelayer",
        name: "habitat",
        width: 2,
        height: 2,
        data: [1, 2, 3, 1], // 1=grass, 2=water, 3=mountain
      },
      {
        type: "objectgroup",
        name: "path",
        objects: [
          {
            id: 1,
            x: 24,
            y: 24,
            polyline: [
              { x: 0, y: 0 },
              { x: 48, y: 48 },
            ],
          },
        ],
      },
      {
        type: "objectgroup",
        name: "pads",
        objects: [
          {
            id: 2,
            name: "pad-1",
            x: 0,
            y: 0,
            properties: [{ name: "terrain", type: "string", value: "grass" }],
          },
          {
            id: 3,
            name: "pad-2",
            x: 48,
            y: 0,
            properties: [{ name: "terrain", type: "string", value: "water" }],
          },
        ],
      },
      {
        type: "objectgroup",
        name: "decor",
        objects: [
          {
            id: 4,
            gid: 10,
            x: 0,
            y: 48,
          },
        ],
      },
    ],
  };
}

describe("loadAuthoredMap", () => {
  it("successfully loads a valid map structure", () => {
    const source = createValidSource();
    const map = loadAuthoredMap(source, mockConfig);
    expect(map.id).toBe("test_route");
    expect(map.cols).toBe(2);
    expect(map.rows).toBe(2);
    expect(map.deploymentPads).toHaveLength(2);
    expect(map.decor).toHaveLength(1);
  });

  it("throws if ground layer is missing", () => {
    const source = createValidSource();
    source.layers = source.layers.filter((l) => l.name !== "ground");
    expect(() => loadAuthoredMap(source, mockConfig)).toThrow("test_route: missing ground layer");
  });

  it("throws if ground layer has invalid dimensions", () => {
    const source = createValidSource();
    const ground = source.layers.find((l) => l.name === "ground") as any;
    ground.width = 3;
    expect(() => loadAuthoredMap(source, mockConfig)).toThrow("test_route: invalid ground dimensions");
  });

  it("throws if ground layer data length is invalid", () => {
    const source = createValidSource();
    const ground = source.layers.find((l) => l.name === "ground") as any;
    ground.data = [1, 2, 3];
    expect(() => loadAuthoredMap(source, mockConfig)).toThrow("test_route: invalid ground layer length");
  });

  it("throws if path layer is missing", () => {
    const source = createValidSource();
    source.layers = source.layers.filter((l) => l.name !== "path");
    expect(() => loadAuthoredMap(source, mockConfig)).toThrow("test_route: missing path layer");
  });

  it("throws if path layer has no polyline", () => {
    const source = createValidSource();
    const pathLayer = source.layers.find((l) => l.name === "path") as any;
    pathLayer.objects[0].polyline = undefined;
    expect(() => loadAuthoredMap(source, mockConfig)).toThrow("test_route: path layer has no polyline");
  });

  it("throws if habitat tile data is invalid", () => {
    const source = createValidSource();
    const habitat = source.layers.find((l) => l.name === "habitat") as any;
    habitat.data = [99, 2, 3, 1];
    expect(() => loadAuthoredMap(source, mockConfig)).toThrow("test_route: invalid habitat tile at 0,0");
  });

  it("throws if pad name/id is missing", () => {
    const source = createValidSource();
    const pads = source.layers.find((l) => l.name === "pads") as any;
    pads.objects[0].name = undefined;
    expect(() => loadAuthoredMap(source, mockConfig)).toThrow("test_route: pad is missing an id");
  });

  it("throws if duplicate pad id exists", () => {
    const source = createValidSource();
    const pads = source.layers.find((l) => l.name === "pads") as any;
    pads.objects[1].name = "pad-1";
    expect(() => loadAuthoredMap(source, mockConfig)).toThrow("test_route: duplicate pad pad-1");
  });

  it("throws if pad is outside the board", () => {
    const source = createValidSource();
    const pads = source.layers.find((l) => l.name === "pads") as any;
    pads.objects[0].x = 96; // 96 / 48 = 2 (col 2 is out of bounds for width 2)
    expect(() => loadAuthoredMap(source, mockConfig)).toThrow("test_route: pad pad-1 is outside the board");
  });

  it("throws if pad terrain mismatch with habitat layer", () => {
    const source = createValidSource();
    const pads = source.layers.find((l) => l.name === "pads") as any;
    // pad-1 is at (0,0) which is grass, let's change pad terrain to water
    pads.objects[0].properties[0].value = "water";
    expect(() => loadAuthoredMap(source, mockConfig)).toThrow("test_route: pad pad-1 does not match habitat layer");
  });

  it("throws if pad is missing a valid terrain property", () => {
    const source = createValidSource();
    const pads = source.layers.find((l) => l.name === "pads") as any;
    pads.objects[0].properties = undefined;
    expect(() => loadAuthoredMap(source, mockConfig)).toThrow("test_route: pad is missing a valid terrain property");
  });
});

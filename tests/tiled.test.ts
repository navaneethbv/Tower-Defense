import { describe, expect, it } from "vitest";
import { loadAuthoredMap } from "../src/data/maps/tiled";
import type {
  RouteRuntimeConfig,
  TiledRouteSource,
  TiledTileLayer,
} from "../src/data/maps/authored/types";

// The failure cases below deliberately corrupt a valid fixture to exercise the
// loader's validation, which means writing values the strict source types
// forbid. Layers are re-read through this permissive shape instead of `any`.
type JsonValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | JsonValue[]
  | { [key: string]: JsonValue };

type LooseLayer = { [key: string]: JsonValue } & {
  objects: { [key: string]: JsonValue }[];
};

function looseLayer(source: TiledRouteSource, name: string): LooseLayer {
  return source.layers.find((layer) => layer.name === name) as unknown as LooseLayer;
}

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
        type: "tilelayer",
        name: "pathTiles",
        width: 2,
        height: 2,
        data: [2, 10, 0, 0],
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
            properties: [
              { name: "terrain", type: "string", value: "grass" },
              { name: "tile", type: "int", value: 29 },
            ],
          },
          {
            id: 3,
            name: "pad-2",
            x: 48,
            y: 0,
            properties: [
              { name: "terrain", type: "string", value: "water" },
              { name: "tile", type: "int", value: 29 },
            ],
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
      {
        type: "objectgroup",
        name: "landmarks",
        objects: [
          {
            id: 10,
            name: "main-site",
            x: 0,
            y: 0,
            width: 96,
            height: 48,
            properties: [{ name: "role", type: "string", value: "dominant" }],
          },
          {
            id: 11,
            name: "garden-a",
            x: 0,
            y: 48,
            width: 48,
            height: 48,
            properties: [{ name: "role", type: "string", value: "secondary" }],
          },
          {
            id: 12,
            name: "garden-b",
            x: 48,
            y: 48,
            width: 48,
            height: 48,
            properties: [{ name: "role", type: "string", value: "secondary" }],
          },
          {
            id: 13,
            name: "west-gate",
            x: 0,
            y: 0,
            width: 48,
            height: 48,
            properties: [{ name: "role", type: "string", value: "entrance" }],
          },
          {
            id: 14,
            name: "east-gate",
            x: 48,
            y: 0,
            width: 48,
            height: 48,
            properties: [{ name: "role", type: "string", value: "exit" }],
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
    expect(map.pathTiles).toEqual([2, 10, 0, 0]);
    expect(map.deploymentPads.map((pad) => pad.tile)).toEqual([29, 29]);
    expect(map.landmarks.map(({ id, role }) => ({ id, role }))).toEqual([
      { id: "main-site", role: "dominant" },
      { id: "garden-a", role: "secondary" },
      { id: "garden-b", role: "secondary" },
      { id: "west-gate", role: "entrance" },
      { id: "east-gate", role: "exit" },
    ]);
  });

  it("throws if ground layer is missing", () => {
    const source = createValidSource();
    source.layers = source.layers.filter((l) => l.name !== "ground");
    expect(() => loadAuthoredMap(source, mockConfig)).toThrow("test_route: missing ground layer");
  });

  it("throws if ground layer has invalid dimensions", () => {
    const source = createValidSource();
    const ground = looseLayer(source, "ground");
    ground.width = 3;
    expect(() => loadAuthoredMap(source, mockConfig)).toThrow("test_route: invalid ground dimensions");
  });

  it("throws if ground layer data length is invalid", () => {
    const source = createValidSource();
    const ground = looseLayer(source, "ground");
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
    const pathLayer = looseLayer(source, "path");
    pathLayer.objects[0]!.polyline = undefined;
    expect(() => loadAuthoredMap(source, mockConfig)).toThrow("test_route: path layer has no polyline");
  });

  it("throws if habitat tile data is invalid", () => {
    const source = createValidSource();
    const habitat = looseLayer(source, "habitat");
    habitat.data = [99, 2, 3, 1];
    expect(() => loadAuthoredMap(source, mockConfig)).toThrow("test_route: invalid habitat tile at 0,0");
  });

  it("throws if pad name/id is missing", () => {
    const source = createValidSource();
    const pads = looseLayer(source, "pads");
    pads.objects[0]!.name = undefined;
    expect(() => loadAuthoredMap(source, mockConfig)).toThrow("test_route: pad is missing an id");
  });

  it("throws if duplicate pad id exists", () => {
    const source = createValidSource();
    const pads = looseLayer(source, "pads");
    pads.objects[1]!.name = "pad-1";
    expect(() => loadAuthoredMap(source, mockConfig)).toThrow("test_route: duplicate pad pad-1");
  });

  it("throws if pad is outside the board", () => {
    const source = createValidSource();
    const pads = looseLayer(source, "pads");
    pads.objects[0]!.x = 96; // 96 / 48 = 2 (col 2 is out of bounds for width 2)
    expect(() => loadAuthoredMap(source, mockConfig)).toThrow("test_route: pad pad-1 is outside the board");
  });

  it("throws if pad terrain mismatch with habitat layer", () => {
    const source = createValidSource();
    const pads = looseLayer(source, "pads");
    // pad-1 is at (0,0) which is grass, let's change pad terrain to water
    (pads.objects[0]!.properties as { value: string }[])[0]!.value = "water";
    expect(() => loadAuthoredMap(source, mockConfig)).toThrow("test_route: pad pad-1 does not match habitat layer");
  });

  it("throws if pad is missing a valid terrain property", () => {
    const source = createValidSource();
    const pads = looseLayer(source, "pads");
    pads.objects[0]!.properties = undefined;
    expect(() => loadAuthoredMap(source, mockConfig)).toThrow("test_route: pad is missing a valid terrain property");
  });

  it("rejects a missing authored path tile layer", () => {
    const source = createValidSource();
    source.layers = source.layers.filter((layer) => layer.name !== "pathTiles");
    expect(() => loadAuthoredMap(source, mockConfig)).toThrow(
      "test_route: missing pathTiles layer",
    );
  });

  it("rejects a pad without a valid tile property", () => {
    const source = createValidSource();
    looseLayer(source, "pads").objects[0]!.properties = [
      { name: "terrain", type: "string", value: "grass" },
    ];
    expect(() => loadAuthoredMap(source, mockConfig)).toThrow(
      "test_route: pad pad-1 is missing a valid tile property",
    );
  });

  it("rejects incomplete landmark roles", () => {
    const source = createValidSource();
    looseLayer(source, "landmarks").objects = looseLayer(source, "landmarks").objects.filter(
      (object) => object.name !== "east-gate",
    );
    expect(() => loadAuthoredMap(source, mockConfig)).toThrow(
      "test_route: landmarks require 1 dominant, 2 secondary, 1 entrance, and 1 exit",
    );
  });

  it("rejects duplicate landmark ids", () => {
    const source = createValidSource();
    looseLayer(source, "landmarks").objects[1]!.name = "main-site";
    expect(() => loadAuthoredMap(source, mockConfig)).toThrow(
      "test_route: duplicate landmark main-site",
    );
  });

  it("rejects a landmark outside the board", () => {
    const source = createValidSource();
    looseLayer(source, "landmarks").objects[0]!.x = 96;
    expect(() => loadAuthoredMap(source, mockConfig)).toThrow(
      "test_route: landmark main-site is outside the board",
    );
  });

  it("rejects undefined ground and path tile ids", () => {
    const source = createValidSource();
    (source.layers.find((layer) => layer.name === "ground") as TiledTileLayer).data[0] = 65;
    expect(() => loadAuthoredMap(source, mockConfig)).toThrow(
      "test_route: undefined tile 65 in ground",
    );

    const second = createValidSource();
    (second.layers.find((layer) => layer.name === "pathTiles") as TiledTileLayer).data[0] = 65;
    expect(() => loadAuthoredMap(second, mockConfig)).toThrow(
      "test_route: undefined tile 65 in pathTiles",
    );
  });

  it("rejects undefined decor and pad tile ids", () => {
    const source = createValidSource();
    looseLayer(source, "decor").objects[0]!.gid = 65;
    expect(() => loadAuthoredMap(source, mockConfig)).toThrow(
      "test_route: undefined tile 65 in decor",
    );

    const second = createValidSource();
    (looseLayer(second, "pads").objects[0]!.properties as { name: string; value: number }[])
      .find((property) => property.name === "tile")!.value = 65;
    expect(() => loadAuthoredMap(second, mockConfig)).toThrow(
      "test_route: undefined tile 65 in pad pad-1",
    );
  });
});

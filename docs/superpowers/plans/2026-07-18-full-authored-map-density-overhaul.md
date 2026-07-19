# Full Authored Map Density Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the nine formulaic battlefields with dense, fully authored original pixel-art locations while preserving route balance, deterministic gameplay, and the existing 18-by-12 board contract.

**Architecture:** Extend the existing Tiled-compatible map contract with authored path tiles, biome-specific pad tiles, and semantic landmark metadata.
Keep waypoint movement authoritative, render every visual layer from the shared local atlas, and reuse that renderer for real route thumbnails.
Hand-author the nine committed JSON exports in three reviewable route groups and validate composition, path tolerances, balance, and browser presentation before delivery.

**Tech Stack:** TypeScript 5.6 strict mode, Vite, Vitest, native Canvas API, Tiled-compatible JSON, local SVG pixel atlas, ESLint, and Chrome browser verification.

## Global Constraints

- Preserve the route IDs `verdant_route`, `river_crossing`, `granite_cave`, `ember_caldera`, `frostbound_lake`, `shadow_marsh`, `skygarden_ruins`, `ancient_sanctuary`, and `indigo_plateau`.
- Keep every route at 18 columns, 12 rows, and 100 waves.
- Keep waypoint count within one point, turn count within one turn, and total path distance within 10 percent of the current route baseline.
- Preserve minimum pad counts of 12, 14, 12, 12, 14, 13, 14, 14, and 14 in route order.
- Preserve grass, water, and mountain habitat availability on every route.
- Use only original local terrain art.
- Keep deterministic waypoint traversal as the movement authority.
- Do not change route progression, wave rules, captures, combat economy, collection systems, or save structure.
- Follow red, green, refactor for every production behavior change.
- Keep each full Markdown sentence on its own physical line.
- Do not modify generated Pokemon data, generated reports, or `CHANGELOG.md`.
- Preserve unrelated working-tree changes.

---

## File Responsibility Map

- `src/types.ts` owns the runtime map, landmark, pad-tile, and theme interfaces.
- `src/data/maps/authored/types.ts` owns the narrow Tiled source contract.
- `src/data/maps/tiled.ts` validates and converts Tiled layers into `MapConfig`.
- `src/data/maps/tileCatalog.ts` owns atlas dimensions, valid tile ranges, and biome pad-tile IDs.
- `src/data/maps/validation.ts` owns pure composition and path metrics used by tests and development validation.
- `src/engine/render/mapTiles.ts` owns atlas loading, source rectangles, map-layer drawing, and pad-state overlays.
- `src/engine/render/renderer.ts` owns combat-layer ordering above the authored battlefield.
- `src/ui/mapThumbnail.ts` owns miniature rendering from real map data.
- `src/ui/screens/homeScreen.ts` mounts real route thumbnails into route cards.
- `src/ui/screens/mapGalleryScreen.ts` owns a development-only nine-map visual review surface.
- `src/data/maps/authored/*.json` remain the source of truth for the nine hand-authored compositions.
- `public/maps/route-tileset.svg` remains the editable original atlas.
- `public/maps/route-tileset.png` remains the runtime raster atlas.
- `public/maps/route-tileset.tsx` describes the expanded atlas to Tiled.

---

### Task 1: Extend and Validate the Authored Map Contract

**Files:**
- Modify: `src/types.ts`
- Modify: `src/data/maps/authored/types.ts`
- Modify: `src/data/maps/tiled.ts`
- Modify: `src/data/maps/authored/verdant-route.json`
- Modify: `src/data/maps/authored/river-crossing.json`
- Modify: `src/data/maps/authored/granite-cave.json`
- Modify: `src/data/maps/authored/ember-caldera.json`
- Modify: `src/data/maps/authored/frostbound-lake.json`
- Modify: `src/data/maps/authored/shadow-marsh.json`
- Modify: `src/data/maps/authored/skygarden-ruins.json`
- Modify: `src/data/maps/authored/ancient-sanctuary.json`
- Modify: `src/data/maps/authored/indigo-plateau.json`
- Modify: `tests/tiled.test.ts`

**Interfaces:**
- Produces: `LandmarkRole = "dominant" | "secondary" | "entrance" | "exit"`.
- Produces: `MapLandmark { id: string; role: LandmarkRole; col: number; row: number; width: number; height: number }`.
- Extends: `DeploymentPad` with `tile: number`.
- Extends: `MapConfig` with `pathTiles: number[]` and `landmarks: MapLandmark[]`.
- Preserves: `loadAuthoredMap(source: TiledRouteSource, config: RouteRuntimeConfig): MapConfig`.

- [ ] **Step 1: Add the failing valid-source assertions**

Update `createValidSource()` in `tests/tiled.test.ts` with a `pathTiles` layer, pad tile properties, and landmark objects:

```ts
{
  type: "tilelayer",
  name: "pathTiles",
  width: 2,
  height: 2,
  data: [65, 66, 0, 0],
},
// Add this property to each pad object.
{ name: "tile", type: "int", value: 127 },
{
  type: "objectgroup",
  name: "landmarks",
  objects: [
    { id: 10, name: "main-site", x: 0, y: 0, width: 96, height: 48, properties: [{ name: "role", type: "string", value: "dominant" }] },
    { id: 11, name: "garden-a", x: 0, y: 48, width: 48, height: 48, properties: [{ name: "role", type: "string", value: "secondary" }] },
    { id: 12, name: "garden-b", x: 48, y: 48, width: 48, height: 48, properties: [{ name: "role", type: "string", value: "secondary" }] },
    { id: 13, name: "west-gate", x: 0, y: 0, width: 48, height: 48, properties: [{ name: "role", type: "string", value: "entrance" }] },
    { id: 14, name: "east-gate", x: 48, y: 0, width: 48, height: 48, properties: [{ name: "role", type: "string", value: "exit" }] },
  ],
},
```

Extend the successful-load test:

```ts
expect(map.pathTiles).toEqual([65, 66, 0, 0]);
expect(map.deploymentPads.map((pad) => pad.tile)).toEqual([127, 127]);
expect(map.landmarks.map(({ id, role }) => ({ id, role }))).toEqual([
  { id: "main-site", role: "dominant" },
  { id: "garden-a", role: "secondary" },
  { id: "garden-b", role: "secondary" },
  { id: "west-gate", role: "entrance" },
  { id: "east-gate", role: "exit" },
]);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx vitest run tests/tiled.test.ts`

Expected: FAIL because `MapConfig` does not expose `pathTiles` or `landmarks`, and pads do not expose `tile`.

- [ ] **Step 3: Add focused invalid-source tests**

Add these cases to `tests/tiled.test.ts`:

```ts
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
```

- [ ] **Step 4: Run the invalid-source tests and verify RED**

Run: `npx vitest run tests/tiled.test.ts`

Expected: FAIL because the new validation errors are not implemented.

- [ ] **Step 5: Add the runtime types**

Add to `src/types.ts`:

```ts
export type LandmarkRole = "dominant" | "secondary" | "entrance" | "exit";

export interface MapLandmark {
  id: string;
  role: LandmarkRole;
  col: number;
  row: number;
  width: number;
  height: number;
}

export interface DeploymentPad {
  id: string;
  col: number;
  row: number;
  terrain: Terrain;
  tile: number;
}
```

Extend `MapConfig`:

```ts
pathTiles: number[];
landmarks: MapLandmark[];
```

Extend `TiledObject` in `src/data/maps/authored/types.ts`:

```ts
width?: number;
height?: number;
```

- [ ] **Step 6: Implement strict property and landmark conversion**

Add these helpers to `src/data/maps/tiled.ts`:

Extend the imports to include `LandmarkRole` from `src/types.ts` and `TiledProperty` from `src/data/maps/authored/types.ts`.

```ts
function numberProperty(
  properties: TiledProperty[] | undefined,
  name: string,
): number | undefined {
  const value = properties?.find((property) => property.name === name)?.value;
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : undefined;
}

function landmarkRole(
  properties: TiledProperty[] | undefined,
  id: string,
): LandmarkRole {
  const value = properties?.find((property) => property.name === "role")?.value;
  if (value === "dominant" || value === "secondary" || value === "entrance" || value === "exit") {
    return value;
  }
  throw new Error(`${id}: landmark is missing a valid role`);
}
```

Load the additional layers and values inside `loadAuthoredMap`:

```ts
const pathTiles = tileLayer(source, "pathTiles", config.id);
const landmarksLayer = objectLayer(source, "landmarks", config.id);

const landmarkIds = new Set<string>();
const landmarks: MapLandmark[] = landmarksLayer.objects.map((object) => {
  const id = object.name?.trim();
  if (!id) throw new Error(`${config.id}: landmark is missing an id`);
  if (landmarkIds.has(id)) throw new Error(`${config.id}: duplicate landmark ${id}`);
  landmarkIds.add(id);
  const landmark = {
    id,
    role: landmarkRole(object.properties, config.id),
    col: Math.floor(object.x / source.tilewidth),
    row: Math.floor(object.y / source.tileheight),
    width: Math.max(1, Math.ceil((object.width ?? source.tilewidth) / source.tilewidth)),
    height: Math.max(1, Math.ceil((object.height ?? source.tileheight) / source.tileheight)),
  };
  if (
    landmark.col < 0 ||
    landmark.row < 0 ||
    landmark.col + landmark.width > source.width ||
    landmark.row + landmark.height > source.height
  ) {
    throw new Error(`${config.id}: landmark ${id} is outside the board`);
  }
  return landmark;
});

const roleCounts = landmarks.reduce<Record<LandmarkRole, number>>(
  (counts, landmark) => ({ ...counts, [landmark.role]: counts[landmark.role] + 1 }),
  { dominant: 0, secondary: 0, entrance: 0, exit: 0 },
);
if (roleCounts.dominant !== 1 || roleCounts.secondary < 2 || roleCounts.entrance !== 1 || roleCounts.exit !== 1) {
  throw new Error(`${config.id}: landmarks require 1 dominant, 2 secondary, 1 entrance, and 1 exit`);
}
```

Add `tile` to pad conversion:

```ts
const tile = numberProperty(object.properties, "tile");
if (!tile) throw new Error(`${config.id}: pad ${id} is missing a valid tile property`);
return { id, col, row, terrain: padTerrain, tile };
```

Return the authored fields:

```ts
pathTiles: [...pathTiles.data],
landmarks,
```

- [ ] **Step 7: Run focused and existing map tests and verify GREEN**

Before running the tests, add contract-compatible transitional data to all nine authored JSON files.
Add a 216-entry zero-filled `pathTiles` tile layer, add a positive `tile` integer property to every pad using `127` for grass, `133` for water, and `139` for mountain, and add the approved dominant, two secondary, entrance, and exit landmark objects from Tasks 4 through 6.
These transitional values keep the runtime green while the later route tasks replace them with final authored compositions.
Use these landmark IDs in route order so later authoring changes geometry without renaming the semantic contract:

```text
verdant_route       research-outpost, pond, lower-garden, west-meadow-gate, east-lower-gate
river_crossing      river-islands, north-dock, south-reed-basin, north-river-gate, south-river-gate
granite_cave        crystal-chambers, torch-alcoves, mineral-pool, west-cave-mouth, east-cave-mouth
ember_caldera       caldera-core, basalt-overlook, vent-field, west-basalt-gate, west-lower-gate
frostbound_lake     frozen-lake, snowbound-outpost, ridge-overlook, north-ice-gate, south-ice-gate
shadow_marsh        drowned-grove, broken-boardwalk, root-basin, west-marsh-gate, east-marsh-gate
skygarden_ruins     floating-courtyard, broken-colonnade, sky-bridge-garden, north-ruin-gate, south-ruin-gate
ancient_sanctuary   temple-court, ceremonial-pool, statue-garden, west-temple-gate, east-temple-gate
indigo_plateau      champion-arena, banner-terraces, formal-gardens, west-champion-gate, west-arena-exit
```

Assign the roles in the listed order as `dominant`, `secondary`, `secondary`, `entrance`, and `exit`.
Use one-tile in-bounds rectangles for transitional metadata because Tasks 4 through 6 will replace their geometry.

Run: `npx vitest run tests/tiled.test.ts tests/maps.test.ts`

Expected: PASS with no warnings.

- [ ] **Step 8: Commit the map contract**

```bash
git add src/types.ts src/data/maps/authored/types.ts src/data/maps/tiled.ts src/data/maps/authored/*.json tests/tiled.test.ts
git commit -m "feat: add authored path and landmark map contract"
```

---

### Task 2: Add Atlas and Composition Validation

**Files:**
- Create: `src/data/maps/tileCatalog.ts`
- Create: `src/data/maps/validation.ts`
- Create: `tests/mapValidation.test.ts`
- Create: `tests/mapAuthoring.test.ts`
- Modify: `tests/tiled.test.ts`
- Modify: `tests/mapTiles.test.ts`
- Modify: `src/data/maps/tiled.ts`
- Modify: `tools/generate-route-maps.mjs`

**Interfaces:**
- Produces: `MAP_ATLAS_COLUMNS`, `MAP_ATLAS_ROWS`, `MAP_ATLAS_TILE_COUNT`, and `PAD_TILE_IDS`.
- Produces: `pathDistance(path): number`.
- Produces: `pathTurnCount(path): number`.
- Produces: `pathCellKeys(path, cols, rows): Set<string>`.
- Produces: `routeVisualMetrics(map): RouteVisualMetrics`.
- Consumes: the Task 1 `MapConfig` contract.

- [ ] **Step 1: Write failing atlas and visual-metric tests**

Create `tests/mapValidation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { MapConfig } from "../src/types";
import { pathDistance, pathTurnCount, routeVisualMetrics } from "../src/data/maps/validation";

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
```

Update `tests/mapTiles.test.ts`:

```ts
it("maps one-based tile IDs into the twelve-column atlas", () => {
  expect(tileSourceRect(1)).toEqual({ x: 0, y: 0, width: 48, height: 48 });
  expect(tileSourceRect(13)).toEqual({ x: 0, y: 48, width: 48, height: 48 });
  expect(tileSourceRect(144)).toEqual({ x: 528, y: 528, width: 48, height: 48 });
});
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npx vitest run tests/mapValidation.test.ts tests/mapTiles.test.ts`

Expected: FAIL because the catalog and metric helpers do not exist.

- [ ] **Step 3: Create the focused atlas catalog**

Create `src/data/maps/tileCatalog.ts`:

```ts
export const MAP_ATLAS_COLUMNS = 12;
export const MAP_ATLAS_ROWS = 12;
export const MAP_ATLAS_TILE_COUNT = MAP_ATLAS_COLUMNS * MAP_ATLAS_ROWS;

export const PATH_TILE_IDS = new Set<number>([
  65, 66, 67, 68, 69, 70,
  71, 72, 73, 74, 75, 76,
  77, 78, 79, 80, 81, 82,
  83, 84, 85, 86, 87, 88,
  89, 90, 91, 92, 93, 94,
  95, 96, 97, 98, 99, 100,
]);

export const PAD_TILE_IDS = new Set<number>([
  127, 128, 129, 130, 131, 132,
  133, 134, 135, 136, 137, 138,
  139, 140, 141, 142, 143, 144,
]);
```

- [ ] **Step 4: Create pure route metrics**

Create `src/data/maps/validation.ts`:

```ts
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
```

- [ ] **Step 5: Write failing undefined-atlas-tile tests**

Add to `tests/tiled.test.ts`:

Extend the authored-type import to include `TiledTileLayer`.

```ts
it("rejects undefined ground and path tile ids", () => {
  const source = createValidSource();
  (source.layers.find((layer) => layer.name === "ground") as TiledTileLayer).data[0] = 145;
  expect(() => loadAuthoredMap(source, mockConfig)).toThrow(
    "test_route: undefined tile 145 in ground",
  );

  const second = createValidSource();
  (second.layers.find((layer) => layer.name === "pathTiles") as TiledTileLayer).data[0] = 145;
  expect(() => loadAuthoredMap(second, mockConfig)).toThrow(
    "test_route: undefined tile 145 in pathTiles",
  );
});

it("rejects undefined decor and pad tile ids", () => {
  const source = createValidSource();
  looseLayer(source, "decor").objects[0]!.gid = 145;
  expect(() => loadAuthoredMap(source, mockConfig)).toThrow(
    "test_route: undefined tile 145 in decor",
  );

  const second = createValidSource();
  (looseLayer(second, "pads").objects[0]!.properties as { name: string; value: number }[])
    .find((property) => property.name === "tile")!.value = 145;
  expect(() => loadAuthoredMap(second, mockConfig)).toThrow(
    "test_route: undefined tile 145 in pad pad-1",
  );
});
```

- [ ] **Step 6: Run undefined-atlas-tile tests and verify RED**

Run: `npx vitest run tests/tiled.test.ts -t "undefined"`

Expected: FAIL because the loader does not validate tile IDs against the expanded catalog.

- [ ] **Step 7: Enforce atlas bounds in the loader**

Import `MAP_ATLAS_TILE_COUNT` in `src/data/maps/tiled.ts` and add:

```ts
function assertTile(tile: number, context: string, id: string, allowEmpty = false): void {
  if (allowEmpty && tile === 0) return;
  if (!Number.isInteger(tile) || tile < 1 || tile > MAP_ATLAS_TILE_COUNT) {
    throw new Error(`${id}: undefined tile ${tile} in ${context}`);
  }
}
```

Validate all source values immediately after reading the layers and properties:

```ts
for (const tile of ground.data) assertTile(tile, "ground", config.id);
for (const tile of pathTiles.data) assertTile(tile, "pathTiles", config.id, true);
for (const object of decorLayer.objects) {
  if (object.gid !== undefined) assertTile(object.gid, "decor", config.id);
}
// Inside pad conversion, after reading tile.
assertTile(tile, `pad ${id}`, config.id);
```

- [ ] **Step 8: Write a failing non-overwrite test for the route utility**

Create `tests/mapAuthoring.test.ts`:

```ts
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const files = [
  "verdant-route.json",
  "river-crossing.json",
  "granite-cave.json",
  "ember-caldera.json",
  "frostbound-lake.json",
  "shadow-marsh.json",
  "skygarden-ruins.json",
  "ancient-sanctuary.json",
  "indigo-plateau.json",
];

describe("route authoring utility", () => {
  it("validates without rewriting committed authored maps", () => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), "route-authoring-"));
    try {
      mkdirSync(join(fixtureRoot, "tools"), { recursive: true });
      mkdirSync(join(fixtureRoot, "src/data/maps/authored"), { recursive: true });
      cpSync("tools/generate-route-maps.mjs", join(fixtureRoot, "tools/generate-route-maps.mjs"));
      cpSync("src/data/maps/authored", join(fixtureRoot, "src/data/maps/authored"), {
        recursive: true,
      });
      const before = files.map((file) =>
        readFileSync(join(fixtureRoot, "src/data/maps/authored", file), "utf8"),
      );
      execFileSync(process.execPath, [join(fixtureRoot, "tools/generate-route-maps.mjs")]);
      const after = files.map((file) =>
        readFileSync(join(fixtureRoot, "src/data/maps/authored", file), "utf8"),
      );
      expect(after).toEqual(before);
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });
});
```

- [ ] **Step 9: Run the non-overwrite test and verify RED**

Run: `npx vitest run tests/mapAuthoring.test.ts`

Expected: FAIL because the existing utility rewrites eight route files and removes the transitional authored layers.

- [ ] **Step 10: Convert the route utility to validation-only behavior**

Replace the writing loop in `tools/generate-route-maps.mjs` with a read-only validation loop:

```js
import { readFileSync } from "node:fs";

const requiredLayers = ["ground", "pathTiles", "habitat", "decor", "path", "pads", "landmarks"];
for (const route of routes) {
  const file = resolve(outputDir, route.file);
  const source = JSON.parse(readFileSync(file, "utf8"));
  const layerNames = new Set(source.layers.map((layer) => layer.name));
  for (const layer of requiredLayers) {
    if (!layerNames.has(layer)) throw new Error(`${route.file}: missing ${layer} layer`);
  }
  if (source.width !== width || source.height !== height) {
    throw new Error(`${route.file}: expected ${width}x${height}`);
  }
}
console.log(`Validated ${routes.length} authored route maps.`);
```

Remove `mkdirSync`, `writeFileSync`, `makeMap`, and every procedural composition branch from the file.
Keep only the nine filenames, fixed dimensions, and read-only validation.

- [ ] **Step 11: Update source-rectangle math**

Import `MAP_ATLAS_COLUMNS` in `src/engine/render/mapTiles.ts` and replace the hard-coded column count:

```ts
return {
  x: (index % MAP_ATLAS_COLUMNS) * TILE,
  y: Math.floor(index / MAP_ATLAS_COLUMNS) * TILE,
  width: TILE,
  height: TILE,
};
```

- [ ] **Step 12: Run the validation foundation tests**

Run: `npx vitest run tests/mapValidation.test.ts tests/mapAuthoring.test.ts tests/mapTiles.test.ts tests/tiled.test.ts`

Expected: PASS for path metrics, non-destructive route validation, and twelve-column source rectangles.

- [ ] **Step 13: Commit the validation foundation**

```bash
git add src/data/maps/tileCatalog.ts src/data/maps/validation.ts src/data/maps/tiled.ts src/engine/render/mapTiles.ts tools/generate-route-maps.mjs tests/mapValidation.test.ts tests/mapAuthoring.test.ts tests/mapTiles.test.ts tests/tiled.test.ts
git commit -m "feat: validate authored route composition"
```

---

### Task 3: Expand the Original Atlas and Render Authored Layers

**Files:**
- Modify: `public/maps/route-tileset.svg`
- Modify: `public/maps/route-tileset.png`
- Modify: `public/maps/route-tileset.tsx`
- Modify: `src/engine/render/mapTiles.ts`
- Modify: `src/engine/render/renderer.ts`
- Modify: `tests/mapTiles.test.ts`

**Interfaces:**
- Produces: `drawMapLayers(ctx, map, image): void` with ground, path, decor, and pad-base ordering.
- Produces: `drawPadState(ctx, pad, state, hovered): void` for accessible overlays only.
- Produces: `loadMapAtlas(): Promise<HTMLImageElement | undefined>` for one-shot thumbnail and gallery rendering.
- Consumes: Task 1 map fields and Task 2 tile catalog.

- [ ] **Step 1: Write a failing layer-order test**

Add a recording canvas fixture and test to `tests/mapTiles.test.ts`:

```ts
it("draws ground, authored path, decor, and pad base in order", () => {
  const draws: number[] = [];
  const ctx = {
    imageSmoothingEnabled: true,
    drawImage: (_image: unknown, sx: number) => draws.push(sx / 48 + 1),
  } as unknown as CanvasRenderingContext2D;
  const map = {
    cols: 1,
    rows: 1,
    tiles: [1],
    pathTiles: [65],
    decor: [{ tile: 101, col: 0, row: 0 }],
    deploymentPads: [{ id: "grass-1", col: 0, row: 0, terrain: "grass", tile: 127 }],
    theme: { palette: "verdant", groundTile: 1, pathTile: 65 },
  } as MapConfig;

  drawMapLayers(ctx, map, {} as HTMLImageElement);

  expect(ctx.imageSmoothingEnabled).toBe(false);
  expect(draws).toEqual([1, 5, 5, 7]);
});
```

The expected source-column values account for twelve atlas columns, so tile 65, tile 101, and tile 127 each begin new atlas regions rather than sharing the old eight-column math.

- [ ] **Step 2: Run the layer-order test and verify RED**

Run: `npx vitest run tests/mapTiles.test.ts`

Expected: FAIL because `drawMapLayers` does not draw path tiles or pad bases.

- [ ] **Step 3: Expand the atlas definition**

Change `public/maps/route-tileset.tsx` to:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.10" tiledversion="1.11.2" name="route-tileset" tilewidth="48" tileheight="48" tilecount="144" columns="12">
 <image source="route-tileset.png" width="576" height="576"/>
</tileset>
```

Resize `public/maps/route-tileset.svg` to a 576-by-576 twelve-column grid and retain tiles 1 through 64 unchanged.
Author these original tile families in the remaining cells:

```text
65-70   meadow sand path: straight, corner, edge, entrance, exit
71-76   river bank and bridge path
77-82   granite stone path and stair
83-88   basalt and lava-bridge path
89-94   snow and ice path
95-100  marsh mud and boardwalk path
101-106 skygarden bridge and ruin path
107-112 sanctuary ceremonial path and stair
113-118 plateau formal path, gate, and arena edge
119-126 multi-tile landmark pieces: gate, column, statue, banner, dock, torch, vent, dead tree
127-132 grass-family pads: clearing, garden, snow turf, marsh island, ruin garden, formal garden
133-138 water-family pads: stepping stone, dock, mineral shelf, ice shelf, lily platform, ceremonial pool
139-144 mountain-family pads: carved rock, basalt shelf, frozen ridge, ruin plinth, temple plinth, champion dais
```

Export the SVG to `public/maps/route-tileset.png` at exactly 576 by 576 pixels with no smoothing.

- [ ] **Step 4: Add a reliable asynchronous atlas loader**

Replace the atlas initialization in `src/engine/render/mapTiles.ts` with:

```ts
let atlas: HTMLImageElement | undefined;
let atlasPromise: Promise<HTMLImageElement | undefined> | undefined;

export function getMapAtlas(): HTMLImageElement | undefined {
  if (typeof Image === "undefined") return undefined;
  if (!atlas) {
    atlas = new Image();
    atlas.src = "/maps/route-tileset.png";
  }
  return atlas.complete && atlas.naturalWidth > 0 ? atlas : undefined;
}

export function loadMapAtlas(): Promise<HTMLImageElement | undefined> {
  const ready = getMapAtlas();
  if (ready) return Promise.resolve(ready);
  if (typeof Image === "undefined" || !atlas) return Promise.resolve(undefined);
  if (!atlasPromise) {
    atlasPromise = new Promise((resolve) => {
      atlas!.addEventListener("load", () => resolve(atlas), { once: true });
      atlas!.addEventListener("error", () => resolve(undefined), { once: true });
    });
  }
  return atlasPromise;
}
```

- [ ] **Step 5: Draw authored visual layers**

Update `drawMapLayers` in `src/engine/render/mapTiles.ts`:

```ts
function drawTile(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  tile: number,
  col: number,
  row: number,
): void {
  if (tile <= 0) return;
  const source = tileSourceRect(tile);
  ctx.drawImage(
    image,
    source.x,
    source.y,
    source.width,
    source.height,
    col * TILE,
    row * TILE,
    TILE,
    TILE,
  );
}

export function drawMapLayers(
  ctx: CanvasRenderingContext2D,
  map: MapConfig,
  image: HTMLImageElement,
): void {
  ctx.imageSmoothingEnabled = false;
  for (let row = 0; row < map.rows; row++) {
    for (let col = 0; col < map.cols; col++) {
      drawTile(ctx, image, map.tiles[row * map.cols + col] ?? map.theme.groundTile, col, row);
      drawTile(ctx, image, map.pathTiles[row * map.cols + col] ?? 0, col, row);
    }
  }
  for (const decor of map.decor) drawTile(ctx, image, decor.tile, decor.col, decor.row);
  for (const pad of map.deploymentPads) drawTile(ctx, image, pad.tile, pad.col, pad.row);
}
```

- [ ] **Step 6: Replace generic pad fills with state overlays**

Add to `src/engine/render/mapTiles.ts`:

```ts
export function drawPadState(
  ctx: CanvasRenderingContext2D,
  pad: DeploymentPad,
  state: PadVisualState,
  hovered: boolean,
): void {
  const x = pad.col * TILE;
  const y = pad.row * TILE;
  const colors: Record<PadVisualState, string> = {
    idle: "rgba(238,248,201,0.72)",
    compatible: "#eef8c9",
    incompatible: "#c95f58",
    occupied: "#182536",
  };
  ctx.strokeStyle = hovered ? "#ffffff" : colors[state];
  ctx.lineWidth = hovered || state === "compatible" ? 3 : 2;
  ctx.strokeRect(x + 5, y + 5, TILE - 10, TILE - 10);
  if (state === "incompatible") {
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 14);
    ctx.lineTo(x + TILE - 14, y + TILE - 14);
    ctx.moveTo(x + TILE - 14, y + 14);
    ctx.lineTo(x + 14, y + TILE - 14);
    ctx.stroke();
  }
}
```

Call this helper from `renderer.ts` and remove the terrain-colored `fillRect` block.

- [ ] **Step 7: Remove the normal vector path stroke**

Delete the two path-stroke blocks in `src/engine/render/renderer.ts` that use `#8e7548` and `#d7bd72`.
Keep `game.path` for movement only.
The relevant rendering sequence becomes:

```ts
const atlas = getMapAtlas();
if (atlas) {
  drawMapLayers(ctx, map, atlas);
} else {
  for (let row = 0; row < map.rows; row++) {
    for (let col = 0; col < map.cols; col++) {
      ctx.fillStyle = TERRAIN_COLORS[map.terrain[row]![col]!] ?? "#79bd68";
      ctx.fillRect(col * TILE, row * TILE, TILE, TILE);
    }
  }
}

for (const pad of map.deploymentPads) {
  const state = padVisualState({
    occupied: Boolean(game.towerAt(pad.col, pad.row)),
    selectedTerrain: interaction.allowedTerrain,
    padTerrain: pad.terrain,
  });
  drawPadState(
    ctx,
    pad,
    state,
    interaction.hovered?.col === pad.col && interaction.hovered.row === pad.row,
  );
}
```

- [ ] **Step 8: Run focused rendering tests and verify GREEN**

Run: `npx vitest run tests/mapTiles.test.ts tests/placement.test.ts`

Expected: PASS with authored layer ordering and unchanged placement behavior.

- [ ] **Step 9: Commit the atlas and renderer**

```bash
git add public/maps/route-tileset.svg public/maps/route-tileset.png public/maps/route-tileset.tsx src/engine/render/mapTiles.ts src/engine/render/renderer.ts tests/mapTiles.test.ts
git commit -m "feat: render authored route paths and habitat pads"
```

---

### Task 4: Hand-Author Verdant Route, River Crossing, and Granite Cave

**Files:**
- Modify: `src/data/maps/authored/verdant-route.json`
- Modify: `src/data/maps/authored/river-crossing.json`
- Modify: `src/data/maps/authored/granite-cave.json`
- Modify: `tests/maps.test.ts`

**Interfaces:**
- Consumes: Task 1 layers and Task 3 tile IDs.
- Produces: the first three dense route configurations.

- [ ] **Step 1: Add failing route-specific identity assertions**

Add to `tests/maps.test.ts`:

```ts
import { MAP_ATLAS_TILE_COUNT, PAD_TILE_IDS } from "../src/data/maps/tileCatalog";
import { pathCellKeys, routeVisualMetrics } from "../src/data/maps/validation";

it.each([
  ["verdant_route", "research-outpost", [1, 3, 17, 25, 33, 34, 37, 119], 8, 6, 50.5, 12],
  ["river_crossing", "river-islands", [3, 13, 17, 23, 35, 71, 72, 123], 6, 4, 36, 14],
  ["granite_cave", "crystal-chambers", [4, 11, 14, 24, 31, 36, 77, 124], 8, 6, 50, 12],
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
```

- [ ] **Step 2: Run the route-specific test and verify RED**

Run: `npx vitest run tests/maps.test.ts -t "dense balanced authored identity"`

Expected: FAIL because the three routes do not have path tiles or landmark metadata.

- [ ] **Step 3: Author Verdant Route**

Edit `verdant-route.json` in Tiled or directly as JSON with these fixed semantic regions:

```text
dominant   research-outpost  col 11 row 0 width 5 height 3
secondary pond               col 4  row 6 width 8 height 3
secondary lower-garden       col 3  row 9 width 10 height 3
entrance  west-meadow-gate   col 0  row 2 width 1 height 1
exit      east-lower-gate    col 17 row 9 width 1 height 1
```

Retain a six-turn route between 45.45 and 55.55 tiles.
Use enclosed gardens, irregular hedges, pond-edge tiles, a five-tile research outpost, fence openings at path crossings, and all three biome pad families.
Use at least 12 pads with a minimum distribution of five grass, three water, and three mountain pads.

- [ ] **Step 4: Author River Crossing**

Edit `river-crossing.json` with these semantic regions:

```text
dominant   river-islands       col 6  row 2 width 7 height 7
secondary north-dock          col 1  row 0 width 4 height 3
secondary south-reed-basin    col 12 row 8 width 5 height 4
entrance  north-river-gate    col 2  row 0 width 1 height 1
exit      south-river-gate    col 5  row 11 width 1 height 1
```

Retain four turns and a path distance between 32.4 and 39.6 tiles.
Use a connected diagonal river, two islands, two bridge segments, reeds, current marks, docks, shoreline transitions, and at least 14 pads.
Place water pads on docks or stepping stones, never as green squares inside water.

- [ ] **Step 5: Author Granite Cave**

Edit `granite-cave.json` with these semantic regions:

```text
dominant   crystal-chambers  col 6  row 2 width 6 height 5
secondary torch-alcoves     col 1  row 0 width 4 height 4
secondary mineral-pool      col 12 row 7 width 5 height 4
entrance  west-cave-mouth   col 0  row 5 width 1 height 2
exit      east-cave-mouth   col 17 row 6 width 1 height 2
```

Retain six turns and a path distance between 45 and 55 tiles.
Use connected rooms, cliff boundaries, stairs, torch clusters, stalagmites, boulders, a mineral pool, and at least 12 pads.

- [ ] **Step 6: Run route and placement tests and verify GREEN**

Run: `npx vitest run tests/maps.test.ts tests/tiled.test.ts tests/placement.test.ts`

Expected: the first three identity assertions pass, all map contracts pass for authored routes, and placement remains deterministic.

- [ ] **Step 7: Review the first route batch in the browser**

Run: `npm run dev -- --host 127.0.0.1`

Inspect the three maps at 1440 by 900.
Verify dominant landmarks, entrance and exit clarity, path continuity, pad integration, enemy silhouettes, and absence of large accidental empty fields.
Fix visible defects in only these three JSON files or their atlas tiles, then rerun Step 6.

- [ ] **Step 8: Commit the first authored route batch**

```bash
git add src/data/maps/authored/verdant-route.json src/data/maps/authored/river-crossing.json src/data/maps/authored/granite-cave.json tests/maps.test.ts public/maps/route-tileset.svg public/maps/route-tileset.png
git commit -m "feat: author meadow river and cave routes"
```

---

### Task 5: Hand-Author Ember Caldera, Frostbound Lake, and Shadow Marsh

**Files:**
- Modify: `src/data/maps/authored/ember-caldera.json`
- Modify: `src/data/maps/authored/frostbound-lake.json`
- Modify: `src/data/maps/authored/shadow-marsh.json`
- Modify: `tests/maps.test.ts`

**Interfaces:**
- Consumes: Task 1 layers and Task 3 tile IDs.
- Produces: the volcanic, frozen, and marsh route configurations.

- [ ] **Step 1: Add failing route-specific identity assertions**

Extend the identity table in `tests/maps.test.ts`:

```ts
["ember_caldera", "caldera-core", [5, 15, 20, 21, 36, 83, 84, 125], 8, 6, 45, 12],
["frostbound_lake", "frozen-lake", [6, 12, 22, 32, 89, 90, 119, 136], 6, 4, 30, 14],
["shadow_marsh", "drowned-grove", [7, 13, 17, 23, 35, 95, 96, 126], 8, 6, 35, 13],
```

- [ ] **Step 2: Run the route-specific test and verify RED**

Run: `npx vitest run tests/maps.test.ts -t "dense balanced authored identity"`

Expected: FAIL for the three newly listed routes.

- [ ] **Step 3: Author Ember Caldera**

Use these semantic regions:

```text
dominant   caldera-core       col 6  row 3 width 6 height 5
secondary basalt-overlook    col 1  row 7 width 4 height 4
secondary vent-field         col 13 row 0 width 4 height 4
entrance  west-basalt-gate   col 0  row 1 width 1 height 2
exit      west-lower-gate    col 0  row 6 width 1 height 2
```

Retain six turns and a path distance between 40.5 and 49.5 tiles.
Use connected lava channels, a crater rim, vents, cooled-rock transitions, ash, basalt shelves, scorched vegetation, and at least 12 pads.

- [ ] **Step 4: Author Frostbound Lake**

Use these semantic regions:

```text
dominant   frozen-lake        col 5  row 2 width 8 height 7
secondary snowbound-outpost  col 0  row 7 width 4 height 4
secondary ridge-overlook     col 14 row 0 width 4 height 4
entrance  north-ice-gate     col 3  row 0 width 1 height 1
exit      south-ice-gate     col 8  row 11 width 1 height 1
```

Retain four turns and a path distance between 27 and 33 tiles.
Use one continuous lake silhouette, cracked ice, snow banks, frozen trees, drifted fences, islands, ridge overlooks, and at least 14 pads.

- [ ] **Step 5: Author Shadow Marsh**

Use these semantic regions:

```text
dominant   drowned-grove      col 6  row 3 width 6 height 6
secondary broken-boardwalk   col 0  row 6 width 5 height 4
secondary root-basin         col 13 row 7 width 5 height 4
entrance  west-marsh-gate    col 0  row 9 width 1 height 1
exit      east-marsh-gate    col 17 row 1 width 1 height 1
```

Retain six turns and a path distance between 31.5 and 38.5 tiles.
Use irregular pools, mud banks, reeds, dead trees, exposed roots, fog pockets, broken boardwalks, constrained dry islands, and at least 13 pads.

- [ ] **Step 6: Run route, placement, and balance tests and verify GREEN**

Run: `npx vitest run tests/maps.test.ts tests/placement.test.ts tests/balance.test.ts`

Expected: all six authored-route identities pass and existing early, developed, specialist, and endgame balance bands remain green.

- [ ] **Step 7: Review the second route batch in the browser**

Inspect all three maps at 1440 by 900.
Verify lava and ice contrast, marsh silhouette readability, coherent connected landforms, biome-specific pads, and no decor over combat information.
Fix defects within this batch and rerun Step 6.

- [ ] **Step 8: Commit the second authored route batch**

```bash
git add src/data/maps/authored/ember-caldera.json src/data/maps/authored/frostbound-lake.json src/data/maps/authored/shadow-marsh.json tests/maps.test.ts public/maps/route-tileset.svg public/maps/route-tileset.png
git commit -m "feat: author volcanic frozen and marsh routes"
```

---

### Task 6: Hand-Author Skygarden Ruins, Ancient Sanctuary, and Indigo Plateau

**Files:**
- Modify: `src/data/maps/authored/skygarden-ruins.json`
- Modify: `src/data/maps/authored/ancient-sanctuary.json`
- Modify: `src/data/maps/authored/indigo-plateau.json`
- Modify: `tests/maps.test.ts`

**Interfaces:**
- Consumes: Task 1 layers and Task 3 tile IDs.
- Produces: the three endgame authored route configurations.

- [ ] **Step 1: Add failing route-specific identity assertions**

Extend the identity table in `tests/maps.test.ts`:

```ts
["skygarden_ruins", "floating-courtyard", [8, 14, 24, 31, 101, 102, 120, 141], 8, 6, 40, 14],
["ancient_sanctuary", "temple-court", [9, 14, 23, 27, 107, 108, 121, 142], 8, 6, 48, 14],
["indigo_plateau", "champion-arena", [10, 14, 24, 27, 113, 114, 122, 144], 8, 6, 71, 14],
```

- [ ] **Step 2: Run the route-specific test and verify RED**

Run: `npx vitest run tests/maps.test.ts -t "dense balanced authored identity"`

Expected: FAIL for the three newly listed routes.

- [ ] **Step 3: Author Skygarden Ruins**

Use these semantic regions:

```text
dominant   floating-courtyard  col 5  row 3 width 7 height 5
secondary broken-colonnade    col 0  row 0 width 5 height 4
secondary sky-bridge-garden   col 13 row 7 width 5 height 4
entrance  north-ruin-gate     col 8  row 0 width 1 height 1
exit      south-ruin-gate     col 7  row 11 width 1 height 1
```

Retain six turns and a path distance between 36 and 44 tiles.
Use visible cliff edges, open-air gaps, bridges, broken walls, columns, overgrown courtyards, collapsed masonry, and at least 14 pads.

- [ ] **Step 4: Author Ancient Sanctuary**

Use these semantic regions:

```text
dominant   temple-court       col 6  row 2 width 7 height 7
secondary ceremonial-pool    col 1  row 7 width 4 height 4
secondary statue-garden      col 14 row 0 width 4 height 5
entrance  west-temple-gate   col 0  row 4 width 1 height 2
exit      east-temple-gate   col 17 row 7 width 1 height 2
```

Retain six turns and a path distance between 43.2 and 52.8 tiles.
Use gates, stairs, courtyards, statues, ceremonial pools, interior walls, garden rooms, and at least 14 pads.

- [ ] **Step 5: Author Indigo Plateau**

Use these semantic regions:

```text
dominant   champion-arena     col 5  row 3 width 8 height 6
secondary banner-terraces    col 0  row 0 width 5 height 4
secondary formal-gardens     col 13 row 7 width 5 height 5
entrance  west-champion-gate col 0  row 1 width 1 height 2
exit      west-arena-exit    col 0  row 10 width 1 height 2
```

Retain six turns and a path distance between 63.9 and 78.1 tiles.
Use monumental gates, terraces, banners, formal gardens, polished stone, champion insignia, a final arena, and at least 14 pads.

- [ ] **Step 6: Run the complete map and balance tests and verify GREEN**

Run: `npx vitest run tests/maps.test.ts tests/tiled.test.ts tests/placement.test.ts tests/balance.test.ts`

Expected: all nine identity assertions, density thresholds, landmark roles, path tolerances, placement invariants, and balance bands pass.

- [ ] **Step 7: Review the final route batch in the browser**

Inspect all three maps at 1440 by 900.
Verify stronger endgame visual hierarchy, connected architecture, clear cliff or wall boundaries, integrated three-habitat pads, and a clearly superior Indigo Plateau composition.
Fix defects within this batch and rerun Step 6.

- [ ] **Step 8: Commit the final authored route batch**

```bash
git add src/data/maps/authored/skygarden-ruins.json src/data/maps/authored/ancient-sanctuary.json src/data/maps/authored/indigo-plateau.json tests/maps.test.ts public/maps/route-tileset.svg public/maps/route-tileset.png
git commit -m "feat: author ruin sanctuary and champion routes"
```

---

### Task 7: Replace CSS Route Previews with Real Map Thumbnails

**Files:**
- Create: `src/ui/mapThumbnail.ts`
- Create: `tests/mapThumbnail.test.ts`
- Modify: `src/ui/screens/homeScreen.ts`
- Modify: `src/styles.css`
- Modify: `tests/homeScreen.test.ts`

**Interfaces:**
- Produces: `drawRouteThumbnail(ctx, map, atlas, width, height): void`.
- Produces: `mountRouteThumbnail(container, map): void`.
- Consumes: `drawMapLayers`, `loadMapAtlas`, and Task 1 map fields.

- [ ] **Step 1: Write failing thumbnail renderer tests**

Create `tests/mapThumbnail.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { MAPS } from "../src/data/maps";
import { drawRouteThumbnail } from "../src/ui/mapThumbnail";

describe("route thumbnails", () => {
  it("draws the actual authored route with pixel smoothing disabled", () => {
    const scale = vi.fn();
    const save = vi.fn();
    const restore = vi.fn();
    const drawImage = vi.fn();
    const ctx = {
      canvas: { width: 270, height: 180 },
      imageSmoothingEnabled: true,
      save,
      restore,
      scale,
      drawImage,
    } as unknown as CanvasRenderingContext2D;

    drawRouteThumbnail(ctx, MAPS[0]!, {} as HTMLImageElement, 270, 180);

    expect(ctx.imageSmoothingEnabled).toBe(false);
    expect(save).toHaveBeenCalledOnce();
    expect(scale).toHaveBeenCalledWith(270 / 864, 180 / 576);
    expect(restore).toHaveBeenCalledOnce();
    expect(drawImage.mock.calls.length).toBeGreaterThan(20);
  });
});
```

Extend `tests/homeScreen.test.ts` with a DOM test that calls `showHome`, then asserts:

```ts
expect(document.querySelectorAll("canvas.route-preview")).toHaveLength(9);
expect(document.querySelector(".preview-path")).toBeNull();
expect(document.querySelector(".preview-pad")).toBeNull();
```

- [ ] **Step 2: Run thumbnail tests and verify RED**

Run: `npx vitest run tests/mapThumbnail.test.ts tests/homeScreen.test.ts`

Expected: FAIL because the miniature renderer does not exist and route cards use CSS approximations.

- [ ] **Step 3: Implement the miniature renderer**

Create `src/ui/mapThumbnail.ts`:

```ts
import { TILE } from "../data/constants";
import type { MapConfig } from "../types";
import { drawMapLayers, loadMapAtlas } from "../engine/render/mapTiles";

export function drawRouteThumbnail(
  ctx: CanvasRenderingContext2D,
  map: MapConfig,
  atlas: HTMLImageElement,
  width: number,
  height: number,
): void {
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  ctx.scale(width / (map.cols * TILE), height / (map.rows * TILE));
  drawMapLayers(ctx, map, atlas);
  ctx.restore();
}

export function mountRouteThumbnail(container: HTMLElement, map: MapConfig): void {
  const canvas = document.createElement("canvas");
  canvas.className = "route-preview";
  canvas.width = 270;
  canvas.height = 180;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", `${map.name} map preview`);
  container.appendChild(canvas);

  void loadMapAtlas().then((atlas) => {
    const ctx = canvas.getContext("2d");
    if (atlas && ctx) drawRouteThumbnail(ctx, map, atlas, canvas.width, canvas.height);
  });
}
```

- [ ] **Step 4: Mount real thumbnails in route cards**

Import `mountRouteThumbnail` in `homeScreen.ts`.
Replace the CSS preview markup with:

```html
<div class="route-preview-slot palette-${map.theme.palette}"></div>
```

After assigning `card.innerHTML`, mount the map:

```ts
mountRouteThumbnail(card.querySelector<HTMLElement>(".route-preview-slot")!, map);
```

Remove `.preview-path`, `.preview-pad`, and route-preview palette artwork rules from `src/styles.css`.
Keep a route-specific fallback background on `.route-preview-slot` and style the real canvas:

```css
.route-preview-slot {
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  border: 2px solid #0a1721;
  background: #253746;
}

canvas.route-preview {
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
}
```

- [ ] **Step 5: Run thumbnail and home tests and verify GREEN**

Run: `npx vitest run tests/mapThumbnail.test.ts tests/homeScreen.test.ts`

Expected: PASS with nine real canvases and no generic preview elements.

- [ ] **Step 6: Review route cards at desktop and mobile widths**

Inspect the home screen at 1440 by 900 and 390 by 844.
Verify that every thumbnail remains sharp, locked routes remain legible, cards do not overflow, and dominant route silhouettes remain distinguishable at miniature size.
Fix only thumbnail or card styling defects, then rerun Step 5.

- [ ] **Step 7: Commit real route thumbnails**

```bash
git add src/ui/mapThumbnail.ts src/ui/screens/homeScreen.ts src/styles.css tests/mapThumbnail.test.ts tests/homeScreen.test.ts
git commit -m "feat: render authored route thumbnails"
```

---

### Task 8: Add a Development Map Gallery and Complete Verification

**Files:**
- Create: `src/ui/screens/mapGalleryScreen.ts`
- Create: `tests/mapGalleryScreen.test.ts`
- Modify: `src/main.ts`
- Modify: `src/styles.css`
- Modify: `README.md`
- Modify: `HANDOFF.md`

**Interfaces:**
- Produces: `showMapGallery(root: HTMLElement): void` for `?__qaMaps=1` in development only.
- Consumes: `MAPS`, `drawMapLayers`, and the shared atlas.

- [ ] **Step 1: Write a failing gallery test**

Create `tests/mapGalleryScreen.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { showMapGallery } from "../src/ui/screens/mapGalleryScreen";

describe("development map gallery", () => {
  it("renders all nine full battlefield canvases with route names", () => {
    document.body.innerHTML = '<main id="app"></main>';
    showMapGallery(document.querySelector<HTMLElement>("#app")!);
    expect(document.querySelectorAll(".map-gallery-card")).toHaveLength(9);
    expect(document.querySelectorAll("canvas.map-gallery-board")).toHaveLength(9);
    expect(document.body.textContent).toContain("Verdant Route");
    expect(document.body.textContent).toContain("Indigo Plateau");
  });
});
```

- [ ] **Step 2: Run the gallery test and verify RED**

Run: `npx vitest run tests/mapGalleryScreen.test.ts`

Expected: FAIL because the gallery module does not exist.

- [ ] **Step 3: Implement the development-only gallery**

Create `src/ui/screens/mapGalleryScreen.ts`:

```ts
import { MAPS } from "../../data/maps";
import { drawRouteThumbnail } from "../mapThumbnail";
import { loadMapAtlas } from "../../engine/render/mapTiles";

export function showMapGallery(root: HTMLElement): void {
  root.innerHTML = `
    <section class="map-gallery">
      <header><p>Development review</p><h1>Authored route gallery</h1></header>
      <div class="map-gallery-grid"></div>
    </section>
  `;
  const grid = root.querySelector<HTMLElement>(".map-gallery-grid")!;
  for (const map of MAPS) {
    const card = document.createElement("article");
    card.className = "map-gallery-card";
    card.innerHTML = `<h2>${map.name}</h2><canvas class="map-gallery-board" width="864" height="576" aria-label="${map.name} full map"></canvas>`;
    grid.appendChild(card);
    void loadMapAtlas().then((atlas) => {
      const canvas = card.querySelector<HTMLCanvasElement>("canvas")!;
      const ctx = canvas.getContext("2d");
      if (atlas && ctx) drawRouteThumbnail(ctx, map, atlas, canvas.width, canvas.height);
    });
  }
}
```

Add before save loading in `main.ts`:

```ts
if (import.meta.env.DEV && new URLSearchParams(window.location.search).get("__qaMaps") === "1") {
  const { showMapGallery } = await import("./ui/screens/mapGalleryScreen");
  showMapGallery(app);
  return;
}
```

Add focused responsive gallery styles with a one-column mobile layout and no production navigation entry.

- [ ] **Step 4: Run the gallery test and verify GREEN**

Run: `npx vitest run tests/mapGalleryScreen.test.ts tests/mapThumbnail.test.ts`

Expected: PASS with nine route canvases.

- [ ] **Step 5: Run the complete automated gate**

Run:

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

Expected: every command exits zero, all tests pass, coverage stays above the repository's 95 percent thresholds, and the build emits no warnings or errors.

- [ ] **Step 6: Run production-preview and browser verification**

Run:

```bash
npm run build
npm run preview -- --host 127.0.0.1
```

Inspect the route selector and normal Verdant battlefield at 1440 by 900 and 390 by 844.
Use the development server with `?__qaMaps=1` to inspect all nine full battlefields at 1440 by 900.
Verify path continuity, landmark hierarchy, entrances, exits, pad clarity, enemy and tower silhouette space, real thumbnails, responsive layout, and zero application console errors or warnings.
Fix defects in their owning map, atlas, renderer, thumbnail, or style file and rerun Steps 5 and 6.

- [ ] **Step 7: Update project documentation**

Update `README.md` with:

```markdown
The nine 18-by-12 battlefields are fully authored Tiled-compatible maps.
Each route includes original ground, path, landmark, decor, habitat, and deployment-pad layers rendered from the local 12-by-12 pixel atlas.
Route cards render miniature versions of the same authored map data used by combat.
```

Update `HANDOFF.md` with the final test count, coverage totals, browser viewport evidence, route-gallery URL, and the exact final commit hashes produced by this plan.

- [ ] **Step 8: Commit verification and documentation**

```bash
git add src/ui/screens/mapGalleryScreen.ts src/main.ts src/styles.css tests/mapGalleryScreen.test.ts README.md HANDOFF.md
git commit -m "docs: verify full authored map overhaul"
```

- [ ] **Step 9: Push the completed implementation branch**

```bash
git status --short
git log --oneline --decorate -8
git push
```

Expected: the working tree is clean before the push and the remote branch advances through every verified stage commit.

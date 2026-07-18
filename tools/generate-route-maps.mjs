import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outputDir = resolve(here, "../src/data/maps/authored");
const width = 18;
const height = 12;
const tileSize = 48;

const routes = [
  {
    file: "verdant-route.json",
    ground: 1,
    path: [[-1, 2], [14, 2], [14, 5], [3, 5], [3, 9], [18, 9]],
    pads: [[1, 0, "grass"], [4, 0, "grass"], [7, 0, "grass"], [10, 0, "mountain"], [16, 2, "grass"], [16, 5, "mountain"], [12, 7, "grass"], [9, 7, "water"], [6, 7, "water"], [1, 7, "grass"], [6, 11, "water"], [11, 11, "grass"]],
  },
  {
    file: "river-crossing.json",
    ground: 3,
    path: [[2, -1], [2, 3], [15, 3], [15, 7], [5, 7], [5, 12]],
    pads: [[0, 1, "grass"], [4, 1, "water"], [8, 1, "water"], [12, 1, "mountain"], [17, 1, "grass"], [0, 5, "water"], [4, 5, "water"], [9, 5, "grass"], [13, 5, "water"], [17, 5, "mountain"], [1, 9, "grass"], [8, 9, "water"], [12, 9, "water"], [16, 10, "grass"]],
  },
  {
    file: "granite-cave.json",
    ground: 4,
    path: [[-1, 5], [5, 5], [5, 1], [12, 1], [12, 9], [4, 9], [4, 6], [18, 6]],
    pads: [[1, 2, "mountain"], [3, 2, "grass"], [7, 3, "mountain"], [9, 3, "mountain"], [15, 2, "water"], [16, 4, "mountain"], [14, 8, "grass"], [10, 11, "mountain"], [7, 11, "water"], [1, 10, "mountain"], [7, 7, "grass"], [16, 10, "mountain"]],
  },
  {
    file: "ember-caldera.json",
    ground: 5,
    path: [[-1, 1], [8, 1], [8, 4], [16, 4], [16, 9], [7, 9], [7, 6], [-1, 6]],
    pads: [[1, 3, "grass"], [4, 3, "mountain"], [10, 1, "mountain"], [13, 1, "water"], [16, 1, "mountain"], [10, 6, "grass"], [13, 6, "mountain"], [4, 8, "water"], [1, 9, "mountain"], [10, 11, "mountain"], [14, 11, "grass"], [17, 11, "mountain"]],
  },
  {
    file: "frostbound-lake.json",
    ground: 6,
    path: [[3, -1], [3, 4], [14, 4], [14, 8], [8, 8], [8, 12]],
    pads: [[0, 1, "mountain"], [6, 1, "water"], [9, 1, "water"], [13, 1, "grass"], [17, 2, "mountain"], [1, 6, "grass"], [5, 6, "water"], [9, 6, "water"], [12, 6, "grass"], [17, 6, "water"], [2, 10, "mountain"], [5, 10, "grass"], [11, 10, "water"], [16, 10, "grass"]],
  },
  {
    file: "shadow-marsh.json",
    ground: 7,
    path: [[-1, 9], [4, 9], [4, 3], [10, 3], [10, 7], [15, 7], [15, 1], [18, 1]],
    pads: [[1, 1, "water"], [5, 1, "grass"], [9, 1, "mountain"], [12, 1, "water"], [2, 5, "grass"], [7, 5, "water"], [12, 5, "grass"], [17, 5, "mountain"], [1, 7, "water"], [7, 9, "grass"], [11, 10, "water"], [14, 10, "grass"], [17, 10, "water"]],
  },
  {
    file: "skygarden-ruins.json",
    ground: 8,
    path: [[8, -1], [8, 2], [2, 2], [2, 6], [15, 6], [15, 10], [7, 10], [7, 12]],
    pads: [[0, 0, "mountain"], [3, 0, "grass"], [11, 0, "mountain"], [15, 1, "water"], [5, 4, "grass"], [10, 4, "mountain"], [17, 4, "grass"], [0, 8, "water"], [4, 8, "mountain"], [9, 8, "grass"], [12, 8, "mountain"], [17, 8, "grass"], [2, 11, "mountain"], [12, 11, "water"]],
  },
  {
    file: "ancient-sanctuary.json",
    ground: 9,
    path: [[-1, 4], [6, 4], [6, 1], [13, 1], [13, 10], [6, 10], [6, 7], [18, 7]],
    pads: [[1, 1, "grass"], [3, 1, "water"], [8, 3, "mountain"], [10, 3, "grass"], [16, 2, "water"], [1, 6, "mountain"], [4, 6, "grass"], [8, 6, "water"], [11, 6, "mountain"], [16, 5, "grass"], [2, 9, "water"], [9, 11, "grass"], [11, 11, "mountain"], [16, 10, "water"]],
  },
  {
    file: "indigo-plateau.json",
    ground: 10,
    path: [[-1, 1], [16, 1], [16, 4], [2, 4], [2, 7], [16, 7], [16, 10], [-1, 10]],
    pads: [[1, 2, "grass"], [4, 2, "water"], [7, 2, "mountain"], [10, 2, "grass"], [13, 2, "water"], [0, 6, "mountain"], [5, 6, "grass"], [8, 6, "water"], [11, 6, "mountain"], [17, 6, "grass"], [3, 9, "water"], [6, 9, "mountain"], [10, 9, "grass"], [13, 9, "water"]],
  },
];

function makeMap(route) {
  const habitat = Array(width * height).fill(1);
  for (const [col, row, terrain] of route.pads) {
    habitat[row * width + col] = terrain === "grass" ? 1 : terrain === "water" ? 2 : 3;
  }
  const ground = habitat.map((value, index) => {
    if (value === 2) return 3;
    if (value === 3) return 4;
    return route.ground + ((index + Math.floor(index / width)) % 11 === 0 ? 16 : 0);
  });
  const first = route.path[0];
  const polyline = route.path.map(([col, row]) => ({
    x: (col - first[0]) * tileSize,
    y: (row - first[1]) * tileSize,
  }));
  const padObjects = route.pads.map(([col, row, terrain], index) => ({
    id: 100 + index,
    name: `${terrain}-${index + 1}`,
    point: true,
    x: col * tileSize,
    y: row * tileSize,
    properties: [{ name: "terrain", type: "string", value: terrain }],
  }));
  const decor = [[0, 0, 33], [17, 0, 34], [0, 11, 35], [17, 11, 36]].map(
    ([col, row, gid], index) => ({
      id: 200 + index,
      gid,
      x: col * tileSize,
      y: (row + 1) * tileSize,
      width: tileSize,
      height: tileSize,
    }),
  );
  return {
    compressionlevel: -1,
    height,
    infinite: false,
    layers: [
      { id: 1, name: "ground", type: "tilelayer", width, height, data: ground, opacity: 1, visible: true, x: 0, y: 0 },
      { id: 2, name: "habitat", type: "tilelayer", width, height, data: habitat, opacity: 0, visible: false, x: 0, y: 0 },
      { id: 3, name: "decor", type: "objectgroup", objects: decor, opacity: 1, visible: true, x: 0, y: 0 },
      { id: 4, name: "path", type: "objectgroup", objects: [{ id: 1, name: "enemy-path", x: (first[0] + 0.5) * tileSize, y: (first[1] + 0.5) * tileSize, polyline }], opacity: 1, visible: true, x: 0, y: 0 },
      { id: 5, name: "pads", type: "objectgroup", objects: padObjects, opacity: 1, visible: true, x: 0, y: 0 },
    ],
    nextlayerid: 6,
    nextobjectid: 300,
    orientation: "orthogonal",
    renderorder: "right-down",
    tiledversion: "1.11.2",
    tileheight: tileSize,
    tilesets: [{ firstgid: 1, source: "../../../../public/maps/route-tileset.tsx" }],
    tilewidth: tileSize,
    type: "map",
    version: "1.10",
    width,
  };
}

mkdirSync(outputDir, { recursive: true });
for (const route of routes) {
  writeFileSync(resolve(outputDir, route.file), `${JSON.stringify(makeMap(route), null, 2)}\n`);
}

import fs from "node:fs";
import path from "node:path";

const COLS = 18;
const ROWS = 12;
const TILE = 48;

// Initialize layers
const groundData = Array(COLS * ROWS).fill(1); // default 1 = grass
const habitatData = Array(COLS * ROWS).fill(1); // default 1 = grass

// 1. Define Path Cells
const pathCells = new Set();
function addPath(c, r) {
  pathCells.add(`${c},${r}`);
  groundData[r * COLS + c] = 17; // 17 = path tile
}

// Draw S-curve path:
// Segment 1: from (9, 0) down to (9, 1)
for (let r = 0; r <= 1; r++) addPath(9, r);
// Segment 2: from (9, 1) left to (1, 1)
for (let c = 8; c >= 1; c--) addPath(c, 1);
// Segment 3: from (1, 1) down to (1, 5)
for (let r = 2; r <= 5; r++) addPath(1, r);
// Segment 4: from (1, 5) right to (16, 5)
for (let c = 2; c <= 16; c++) addPath(c, 5);
// Segment 5: from (16, 5) down to (16, 9)
for (let r = 6; r <= 9; r++) addPath(16, r);
// Segment 6: from (16, 9) left to (1, 9)
for (let c = 15; c >= 1; c--) addPath(c, 9);
// Segment 7: from (1, 9) down to (1, 11)
for (let r = 10; r <= 11; r++) addPath(1, r);

// 2. Define Lake (Water)
// Rows 7 and 8, Columns 4 to 13
for (let r = 7; r <= 8; r++) {
  for (let c = 4; c <= 13; c++) {
    const idx = r * COLS + c;
    if (!pathCells.has(`${c},${r}`)) {
      groundData[idx] = 3; // 3 = water tile
      habitatData[idx] = 2; // 2 = water terrain
    }
  }
}

// 3. Define Left Forest (Dense Trees)
// Columns 0 and 1, Rows 0 to 11
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c <= 1; c++) {
    const idx = r * COLS + c;
    if (!pathCells.has(`${c},${r}`)) {
      groundData[idx] = 34; // 34 = trees group
      habitatData[idx] = 3; // 3 = mountain/blocked terrain
    }
  }
}

// 4. Define Right Mountains
// Columns 16 and 17, Rows 2-4 and 7-9
for (let r = 0; r < ROWS; r++) {
  if ((r >= 2 && r <= 4) || (r >= 7 && r <= 9)) {
    for (let c = 16; c <= 17; c++) {
      const idx = r * COLS + c;
      if (!pathCells.has(`${c},${r}`)) {
        groundData[idx] = 28; // 28 = mountain stone
        habitatData[idx] = 3; // 3 = mountain terrain
      }
    }
  }
}

// 5. Generate Decors (Objects)
const decorObjects = [];
let nextObjectId = 200;

function addDecor(tileId, col, row) {
  decorObjects.push({
    id: nextObjectId++,
    gid: tileId,
    x: col * TILE,
    y: (row + 1) * TILE, // Tiled bottom-left alignment
    width: TILE,
    height: TILE,
  });
}

// Top House
addDecor(39, 12, 0);

// Fences (37 = fence)
const fenceRows = [
  { row: 2, cols: [3, 4, 5, 6, 7, 8, 10, 11] },
  { row: 4, cols: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] },
  { row: 6, cols: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] },
  { row: 10, cols: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] }
];

for (const fr of fenceRows) {
  for (const col of fr.cols) {
    if (!pathCells.has(`${col},${fr.row}`)) {
      addDecor(37, col, fr.row);
    }
  }
}

// 6. Generate Pads
const padsObjects = [
  { id: 100, name: "grass-1", col: 2, row: 0, terrain: "grass" },
  { id: 101, name: "grass-2", col: 4, row: 0, terrain: "grass" },
  { id: 102, name: "grass-3", col: 7, row: 0, terrain: "grass" },
  { id: 103, name: "grass-4", col: 3, row: 7, terrain: "grass" },
  { id: 104, name: "grass-5", col: 14, row: 7, terrain: "grass" },
  { id: 105, name: "grass-6", col: 11, row: 11, terrain: "grass" },
  { id: 106, name: "grass-7", col: 14, row: 11, terrain: "grass" },
  { id: 107, name: "grass-8", col: 8, row: 3, terrain: "grass" },
  { id: 108, name: "water-1", col: 6, row: 7, terrain: "water" },
  { id: 109, name: "water-2", col: 9, row: 7, terrain: "water" },
  { id: 110, name: "mountain-1", col: 17, row: 3, terrain: "mountain" },
  { id: 111, name: "mountain-2", col: 17, row: 8, terrain: "mountain" },
].map(pad => ({
  id: pad.id,
  name: pad.name,
  point: true,
  x: pad.col * TILE,
  y: pad.row * TILE,
  properties: [
    {
      name: "terrain",
      type: "string",
      value: pad.terrain
    }
  ]
}));

// 7. Winding path coordinates (centers of cells)
const pathPolyline = [
  { x: 9 * TILE + 24, y: -24 },
  { x: 9 * TILE + 24, y: 1 * TILE + 24 },
  { x: 1 * TILE + 24, y: 1 * TILE + 24 },
  { x: 1 * TILE + 24, y: 5 * TILE + 24 },
  { x: 16 * TILE + 24, y: 5 * TILE + 24 },
  { x: 16 * TILE + 24, y: 9 * TILE + 24 },
  { x: 1 * TILE + 24, y: 9 * TILE + 24 },
  { x: 1 * TILE + 24, y: 12 * TILE }
].map(p => ({ x: p.x, y: p.y }));

// Assemble final Tiled map structure
const mapJson = {
  compressionlevel: -1,
  width: COLS,
  height: ROWS,
  infinite: false,
  layers: [
    {
      id: 1,
      name: "ground",
      type: "tilelayer",
      width: COLS,
      height: ROWS,
      data: groundData,
      opacity: 1,
      visible: true,
      x: 0,
      y: 0
    },
    {
      id: 2,
      name: "habitat",
      type: "tilelayer",
      width: COLS,
      height: ROWS,
      data: habitatData,
      opacity: 0,
      visible: false,
      x: 0,
      y: 0
    },
    {
      id: 3,
      name: "decor",
      type: "objectgroup",
      objects: decorObjects,
      opacity: 1,
      visible: true,
      x: 0,
      y: 0
    },
    {
      id: 4,
      name: "path",
      type: "objectgroup",
      objects: [
        {
          id: 1,
          name: "enemy-path",
          x: 0,
          y: 0,
          polyline: pathPolyline
        }
      ],
      opacity: 1,
      visible: true,
      x: 0,
      y: 0
    },
    {
      id: 5,
      name: "pads",
      type: "objectgroup",
      objects: padsObjects,
      opacity: 1,
      visible: true,
      x: 0,
      y: 0
    }
  ],
  nextlayerid: 6,
  nextobjectid: nextObjectId,
  orientation: "orthogonal",
  renderorder: "right-down",
  tiledversion: "1.11.2",
  tileheight: TILE,
  tilesets: [
    {
      firstgid: 1,
      source: "../../../../public/maps/route-tileset.tsx"
    }
  ],
  tilewidth: TILE,
  type: "map",
  version: "1.10"
};

// Write output file
const outputPath = path.resolve("src/data/maps/authored/verdant-route.json");
fs.writeFileSync(outputPath, JSON.stringify(mapJson, null, 2), "utf8");
console.log("Successfully rebuilt verdant-route.json!");

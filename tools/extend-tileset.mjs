// Extends the route atlas with autotile (Wang) variants for paths.
//
// The existing 64 tiles are copied through byte-for-byte: every biome tile the
// nine routes depend on keeps its exact art. New variants are appended below,
// drawn in colours sampled from the shipped tiles so they match rather than
// approximate. The atlas grows 8x8 -> 8x16.
//
// Why this exists: the original path tile bakes a grass fringe into all four
// sides, so a corridor renders as a row of disconnected squares. A 16-variant
// Wang set gives every neighbour configuration its own tile, which is what
// makes a path read as one continuous road.
//
// Run: node tools/extend-tileset.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decodePng, encodePng, blank, blit } from "./png.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ATLAS = path.join(ROOT, "public/maps/route-tileset.png");
const TILE = 48;
const COLUMNS = 8;
const BASE_TILES = 64;

const source = decodePng(fs.readFileSync(ATLAS));
if (source.width !== COLUMNS * TILE) {
  throw new Error(`unexpected atlas width ${source.width}`);
}

const px = (img, x, y) => {
  const o = (y * img.width + x) * 4;
  return [img.data[o], img.data[o + 1], img.data[o + 2], img.data[o + 3]];
};

/** Tile id (1-based) -> pixel origin in the atlas. */
function tileOrigin(id) {
  const index = id - 1;
  return { x: (index % COLUMNS) * TILE, y: Math.floor(index / COLUMNS) * TILE };
}

/**
 * Most frequent colour inside a tile, ignoring a margin. Sampling the shipped
 * art keeps appended tiles consistent with it even though the checked-in SVG
 * is a stale draft that no longer matches the atlas.
 */
function dominantColour(id, margin = 14) {
  const { x, y } = tileOrigin(id);
  const counts = new Map();
  for (let dy = margin; dy < TILE - margin; dy++) {
    for (let dx = margin; dx < TILE - margin; dx++) {
      const [r, g, b, a] = px(source, x + dx, y + dy);
      if (a < 200) continue;
      const key = `${r},${g},${b}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  let best = null;
  let bestCount = -1;
  for (const [key, count] of counts) {
    if (count > bestCount) { bestCount = count; best = key; }
  }
  return best.split(",").map(Number);
}

const shade = ([r, g, b], factor) => [
  Math.max(0, Math.min(255, Math.round(r * factor))),
  Math.max(0, Math.min(255, Math.round(g * factor))),
  Math.max(0, Math.min(255, Math.round(b * factor))),
];

/**
 * The nine routes lay their corridors from four different materials, so one
 * shared sand-coloured set would repaint Granite Cave's stone path and
 * Ancient Sanctuary's brick. Each material gets its own Wang set, coloured
 * from the material's own tile.
 */
const PATH_MATERIALS = [
  { tile: 2, name: "dirt" },
  { tile: 4, name: "stone" },
  { tile: 31, name: "brick" },
  { tile: 59, name: "crossing" },
];

/**
 * Draws one Wang variant.
 *
 * `mask` bits: N=1, E=2, S=4, W=8, set when that neighbour is the same terrain.
 * The body is inset on every side that has no neighbour, and the two corners
 * flanking a pair of open sides are rounded, so isolated cells read as blobs
 * and long runs read as straight corridors.
 */
/**
 * Repeating texture taken from the middle of a source tile, avoiding the fringe
 * the original bakes into its outer edges. Filling a variant with one averaged
 * colour would flatten brick into grey and stone into brown; sampling keeps the
 * material's own patterning.
 */
function centreTexture(id, size = 24) {
  const { x, y } = tileOrigin(id);
  const offset = Math.floor((TILE - size) / 2);
  return {
    size,
    sample(sx, sy) {
      return px(source, x + offset + (sx % size), y + offset + (sy % size));
    },
  };
}

function wangTile(mask, texture, edgeFactor) {
  // Everything outside the body stays transparent so the tile composites over
  // whatever ground the route authored underneath. Baking a grass backdrop in
  // would draw a green fringe along the path through Ember Caldera's lava and
  // Granite Cave's stone.
  const tile = blank(TILE, TILE);

  const INSET = 9;
  const RADIUS = 9;
  const n = (mask & 1) !== 0;
  const e = (mask & 2) !== 0;
  const s = (mask & 4) !== 0;
  const w = (mask & 8) !== 0;

  const left = w ? 0 : INSET;
  const right = e ? TILE : TILE - INSET;
  const top = n ? 0 : INSET;
  const bottom = s ? TILE : TILE - INSET;

  // Round a corner only where both of its sides are open.
  const corners = [
    { active: !n && !w, cx: left + RADIUS, cy: top + RADIUS, sx: -1, sy: -1 },
    { active: !n && !e, cx: right - RADIUS, cy: top + RADIUS, sx: 1, sy: -1 },
    { active: !s && !w, cx: left + RADIUS, cy: bottom - RADIUS, sx: -1, sy: 1 },
    { active: !s && !e, cx: right - RADIUS, cy: bottom - RADIUS, sx: 1, sy: 1 },
  ];

  const inBody = (x, y) => {
    if (x < left || x >= right || y < top || y >= bottom) return false;
    for (const c of corners) {
      if (!c.active) continue;
      const beyondX = c.sx < 0 ? x < c.cx : x > c.cx;
      const beyondY = c.sy < 0 ? y < c.cy : y > c.cy;
      if (beyondX && beyondY) {
        const dx = x - c.cx;
        const dy = y - c.cy;
        if (dx * dx + dy * dy > RADIUS * RADIUS) return false;
      }
    }
    return true;
  };

  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      if (!inBody(x, y)) continue;
      // A pixel is an edge pixel when it borders a non-body pixel. Edges are
      // the sampled texture darkened, so the rim still carries the material.
      const boundary =
        !inBody(x - 1, y) || !inBody(x + 1, y) || !inBody(x, y - 1) || !inBody(x, y + 1);
      const sampled = texture.sample(x, y);
      const colour = boundary ? shade(sampled, edgeFactor) : sampled;
      const o = (y * TILE + x) * 4;
      tile.data[o] = colour[0];
      tile.data[o + 1] = colour[1];
      tile.data[o + 2] = colour[2];
      tile.data[o + 3] = 255;
    }
  }
  return tile;
}

// --- compose the extended atlas -------------------------------------------
const totalTiles = BASE_TILES + PATH_MATERIALS.length * 16;
const rows = Math.ceil(totalTiles / COLUMNS);
const atlas = blank(COLUMNS * TILE, rows * TILE);

// Existing art, unchanged.
blit(atlas, source, 0, 0);

let next = BASE_TILES + 1;
const sets = [];

for (const material of PATH_MATERIALS) {
  const texture = centreTexture(material.tile);
  const ids = [];
  for (let mask = 0; mask < 16; mask++) {
    const { x, y } = tileOrigin(next);
    blit(atlas, wangTile(mask, texture, 0.84), x, y);
    ids.push(next);
    next++;
  }
  sets.push({ ...material, ids });
  console.log(
    `  ${material.name.padEnd(9)} tile ${String(material.tile).padStart(2)} -> ids ${ids[0]}-${ids.at(-1)}  (textured, avg rgb(${dominantColour(material.tile)}))`,
  );
}

fs.writeFileSync(ATLAS, encodePng(atlas));

const entries = sets
  .map((set) => `  ${set.tile}: [${set.ids.join(", ")}], // ${set.name}`)
  .join("\n");

const ts = `// GENERATED by tools/extend-tileset.mjs -- do not edit by hand.
//
// Tiles 1-${BASE_TILES} are the original authored atlas and keep their meaning
// and their art. The ids below are appended autotile variants, indexed by a
// four-bit neighbour mask: N=1, E=2, S=4, W=8, set when that neighbour is also
// path. Their backdrop is transparent, so they composite over whatever ground
// the route authored underneath.
//
// Each authored path material keeps its own set, so a stone corridor stays
// stone and a brick one stays brick.

export const ATLAS_COLUMNS = ${COLUMNS};
export const ATLAS_ROWS = ${rows};
export const ATLAS_TILE_COUNT = ${totalTiles};
export const BASE_TILE_COUNT = ${BASE_TILES};

/** authored path tile id -> 16 wang variant ids, indexed by neighbour mask */
export const PATH_WANG_BY_MATERIAL: Readonly<Record<number, readonly number[]>> = {
${entries}
};
`;

const outTs = path.join(ROOT, "src/data/maps/generated/autotiles.ts");
fs.mkdirSync(path.dirname(outTs), { recursive: true });
fs.writeFileSync(outTs, ts);

console.log(`atlas: ${atlas.width}x${atlas.height} (${totalTiles} tiles, ${rows} rows)`);
console.log(`wrote ${path.relative(ROOT, outTs)}`);

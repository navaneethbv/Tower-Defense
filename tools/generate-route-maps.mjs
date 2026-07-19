// The nine battlefields are hand-authored Tiled exports and are the source of
// truth. This utility no longer generates them; it only validates that each
// committed export still satisfies the structural contract the loader expects.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outputDir = resolve(here, "../src/data/maps/authored");
const width = 18;
const height = 12;

const routes = [
  { file: "verdant-route.json" },
  { file: "river-crossing.json" },
  { file: "granite-cave.json" },
  { file: "ember-caldera.json" },
  { file: "frostbound-lake.json" },
  { file: "shadow-marsh.json" },
  { file: "skygarden-ruins.json" },
  { file: "ancient-sanctuary.json" },
  { file: "indigo-plateau.json" },
];

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

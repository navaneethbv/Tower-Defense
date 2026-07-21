// Breaks up long fence runs in the authored routes.
//
// Fences were laid in unbroken parallel lines beside the paths, which striped
// the board and competed with the road for attention. Real route art uses short
// fence sections near landmarks, not continuous walls, so any run longer than
// MAX_RUN is trimmed back to a short section.
//
// Run: node tools/cull-fences.mjs [--dry]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry");

const FENCE_GID = 36;
const MAX_RUN = 4;   // runs at or below this are left alone
const KEEP = 3;      // longer runs are trimmed back to this many tiles

const files = fs
  .readdirSync(path.join(ROOT, "src/data/maps/authored"))
  .filter((name) => name.endsWith(".json"))
  .sort();

let removedTotal = 0;

for (const file of files) {
  const full = path.join(ROOT, "src/data/maps/authored", file);
  const source = JSON.parse(fs.readFileSync(full, "utf8"));
  const tw = source.tilewidth;
  const th = source.tileheight;
  const decor = source.layers.find((l) => l.type === "objectgroup" && l.name === "decor");
  if (!decor) continue;

  // Tiled anchors object tiles at their bottom-left corner.
  const cellOf = (o) => [Math.round(o.x / tw), Math.round(o.y / th) - 1];
  const fences = decor.objects.filter((o) => o.gid === FENCE_GID);
  if (fences.length === 0) continue;

  const byCell = new Map();
  for (const o of fences) byCell.set(cellOf(o).join(","), o);
  const has = (c, r) => byCell.has(`${c},${r}`);
  const doomed = new Set();

  // Walk each run once from its start, trimming anything past KEEP.
  const trim = (stepC, stepR) => {
    for (const key of byCell.keys()) {
      const [c, r] = key.split(",").map(Number);
      if (has(c - stepC, r - stepR)) continue; // not the start of a run
      let length = 0;
      while (has(c + stepC * length, r + stepR * length)) length++;
      if (length <= MAX_RUN) continue;
      for (let i = KEEP; i < length; i++) doomed.add(`${c + stepC * i},${r + stepR * i}`);
    }
  };
  trim(1, 0);
  trim(0, 1);

  if (doomed.size > 0) {
    const drop = new Set([...doomed].map((k) => byCell.get(k)).filter(Boolean));
    decor.objects = decor.objects.filter((o) => !drop.has(o));
    removedTotal += drop.size;
  }

  console.log(
    `${file.padEnd(24)} fences ${String(fences.length).padStart(3)} -> ${String(fences.length - doomed.size).padStart(3)}  (removed ${doomed.size})`,
  );
  if (!DRY && doomed.size > 0) fs.writeFileSync(full, `${JSON.stringify(source, null, 2)}\n`);
}

console.log(`\ntotal fence segments removed: ${removedTotal}${DRY ? "  (dry run)" : ""}`);

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const spritesDir = join(here, "..", "public", "sprites");

describe("Generation I through IX sprite assets", () => {
  it("has a valid self-hosted PNG for every dex 1..1025", () => {
    const missing: number[] = [];
    const invalid: number[] = [];
    for (let dex = 1; dex <= 1025; dex++) {
      const path = join(spritesDir, `${dex}.png`);
      if (!existsSync(path)) {
        missing.push(dex);
        continue;
      }
      const bytes = readFileSync(path);
      const signature = bytes.subarray(0, 8).toString("hex");
      const width = bytes.length >= 24 ? bytes.readUInt32BE(16) : 0;
      const height = bytes.length >= 24 ? bytes.readUInt32BE(20) : 0;
      if (signature !== "89504e470d0a1a0a" || width === 0 || height === 0) invalid.push(dex);
    }
    expect(missing).toEqual([]);
    expect(invalid).toEqual([]);
  });
});

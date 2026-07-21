// Visual harness: renders every authored route to .preview/ through the real
// drawMapLayers code path, so tile mapping can be checked by eye.
//
// Opt-in, because it writes files and asserts nothing meaningful:
//   RENDER_PREVIEW=1 npx vitest run tests/_preview.test.ts
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "vitest";
import { MAPS } from "../src/data/maps";
import { drawMapLayers } from "../src/engine/render/mapTiles";
import { TILE } from "../src/data/constants";
// @ts-expect-error -- plain JS helper, no type declarations
import { decodePng, encodePng, crop, blank, blit } from "../tools/png.mjs";

const OUT = path.resolve(__dirname, "../.preview");

type Img = { width: number; height: number; data: Buffer };

/** Minimal 2D context that composites drawImage calls into an RGBA buffer. */
function makeContext(atlas: Img, target: Img): CanvasRenderingContext2D {
  return {
    imageSmoothingEnabled: true,
    drawImage(
      _img: unknown, sx: number, sy: number, sw: number, sh: number,
      dx: number, dy: number,
    ) {
      blit(target, crop(atlas, sx, sy, sw, sh), dx, dy);
    },
  } as unknown as CanvasRenderingContext2D;
}

describe("route art preview", () => {
  it.skipIf(!process.env.RENDER_PREVIEW)("renders every authored route to .preview/", () => {
    fs.mkdirSync(OUT, { recursive: true });
    const atlas = decodePng(
      fs.readFileSync(path.resolve(__dirname, "../public/maps/route-tileset.png")),
    );

    for (const map of MAPS) {
      const board: Img = blank(map.cols * TILE, map.rows * TILE);
      drawMapLayers(makeContext(atlas, board), map, {} as HTMLImageElement);
      fs.writeFileSync(path.join(OUT, `${map.id}.png`), encodePng(board));
    }
    console.log(`rendered ${MAPS.length} routes to .preview/`);
  });
});

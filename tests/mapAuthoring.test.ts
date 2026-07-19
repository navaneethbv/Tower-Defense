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

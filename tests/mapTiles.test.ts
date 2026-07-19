import { describe, expect, it } from "vitest";
import { padVisualState, tileSourceRect } from "../src/engine/render/mapTiles";

describe("map tile rendering helpers", () => {
  it("maps one-based tile IDs into the twelve-column atlas", () => {
    expect(tileSourceRect(1)).toEqual({ x: 0, y: 0, width: 48, height: 48 });
    expect(tileSourceRect(13)).toEqual({ x: 0, y: 48, width: 48, height: 48 });
    expect(tileSourceRect(144)).toEqual({ x: 528, y: 528, width: 48, height: 48 });
  });

  it("prioritizes occupied and compatibility pad states", () => {
    expect(padVisualState({ occupied: true, selectedTerrain: null, padTerrain: "grass" })).toBe(
      "occupied",
    );
    expect(
      padVisualState({ occupied: false, selectedTerrain: ["grass"], padTerrain: "grass" }),
    ).toBe("compatible");
    expect(
      padVisualState({ occupied: false, selectedTerrain: ["water"], padTerrain: "grass" }),
    ).toBe("incompatible");
    expect(padVisualState({ occupied: false, selectedTerrain: null, padTerrain: "grass" })).toBe(
      "idle",
    );
  });
});

import { describe, expect, it } from "vitest";
import { getMap } from "../src/data/maps";
import { freshSave } from "../src/meta/save";
import { applyMilestoneCaptures } from "../src/meta/milestoneCaptures";
import { milestoneFor, milestonePool } from "../src/waves/milestones";

const map = getMap("verdant_route");

describe("milestone captures", () => {
  it("guarantees every newly crossed milestone", () => {
    const save = freshSave();
    const captures = applyMilestoneCaptures(save, map, 0, 75, 1234, () => 0.5);

    expect(captures.map((capture) => capture.wave)).toEqual([25, 50, 75]);
    expect(captures.every((capture) => capture.guaranteed)).toBe(true);
    expect(captures.map((capture) => capture.pokemon.speciesId)).toEqual(
      [25, 50, 75].map((wave) => milestoneFor(map, wave, 1234)?.speciesId),
    );
    expect(save.collection).toEqual(captures.map((capture) => capture.pokemon));
    expect(save.milestoneCapturesByMap[map.id]).toEqual({ 25: true, 50: true, 75: true });
  });

  it("uses an exact 20 percent independent repeat chance", () => {
    const save = freshSave();
    applyMilestoneCaptures(save, map, 0, 75, 9, () => 0.5);
    const collectionSize = save.collection.length;

    expect(applyMilestoneCaptures(save, map, 75, 75, 9, () => 0.2)).toEqual([]);
    expect(save.collection).toHaveLength(collectionSize);

    const repeats = applyMilestoneCaptures(save, map, 75, 75, 9, () => 0.199999);
    expect(repeats).toHaveLength(3);
    expect(repeats.every((capture) => !capture.guaranteed)).toBe(true);
    expect(new Set(repeats.map((capture) => capture.pokemon.uid)).size).toBe(3);
    expect(
      repeats.every((capture) =>
        Object.values(capture.pokemon.ivs).every((value) => value >= 0 && value <= 15),
      ),
    ).toBe(true);
  });

  it("captures only species belonging to the declared tier", () => {
    const save = freshSave();
    const captures = applyMilestoneCaptures(save, map, 0, 100, 777, () => 0.4);
    for (const capture of captures) {
      expect(milestonePool(capture.tier).map((species) => species.id)).toContain(
        capture.pokemon.speciesId,
      );
    }
  });
});

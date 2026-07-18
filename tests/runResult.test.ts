import { describe, expect, it } from "vitest";
import { getMap } from "../src/data/maps";
import { freshSave } from "../src/meta/save";
import { applyCompletedRun } from "../src/meta/runResult";
import { milestoneFor } from "../src/waves/milestones";
import { captureResultView, milestoneBannerView } from "../src/ui/gameScreen";

describe("completed milestone results", () => {
  it("formats milestone banners and capture cards", () => {
    const save = freshSave();
    const map = getMap("verdant_route");
    const applied = applyCompletedRun(
      save,
      map,
      { wavesCleared: 25, bossKills: 3, runXpByUid: {}, runSeed: 42 },
      () => 0.5,
    );
    const capture = applied.captures[0]!;
    const encounter = milestoneFor(map, 25, 42)!;

    expect(milestoneBannerView(encounter)).toContain("Special encounter");
    expect(milestoneBannerView(encounter)).toContain("Wave 25");
    expect(captureResultView(capture)).toMatchObject({
      waveLabel: "Wave 25",
      rewardLabel: "Guaranteed first-clear capture",
      tierLabel: "Rare",
    });
  });

  it("returns the encountered Pokemon and capture details", () => {
    const save = freshSave();
    const map = getMap("verdant_route");
    const result = applyCompletedRun(
      save,
      map,
      { wavesCleared: 25, bossKills: 3, runXpByUid: {}, runSeed: 42 },
      () => 0.5,
    );

    expect(result.eggsGranted).toEqual([]);
    expect(result.captures).toHaveLength(1);
    expect(result.captures[0]).toMatchObject({
      wave: 25,
      tier: "rare",
      guaranteed: true,
      pokemon: { speciesId: milestoneFor(map, 25, 42)?.speciesId },
    });
  });

  it("returns no capture when a repeat roll fails", () => {
    const save = freshSave();
    const map = getMap("verdant_route");
    applyCompletedRun(
      save,
      map,
      { wavesCleared: 25, bossKills: 3, runXpByUid: {}, runSeed: 42 },
      () => 0.5,
    );

    const repeat = applyCompletedRun(
      save,
      map,
      { wavesCleared: 25, bossKills: 3, runXpByUid: {}, runSeed: 42 },
      () => 0.2,
    );
    expect(repeat.captures).toEqual([]);
  });
});

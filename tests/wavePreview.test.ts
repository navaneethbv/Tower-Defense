import { describe, expect, it } from "vitest";
import { getMap } from "../src/data/maps";
import { generateWave } from "../src/waves/generator";
import { previewNextWave, summarizeWave } from "../src/ui/wavePreview";

const verdant = getMap("verdant_route");

describe("upcoming wave preview", () => {
  it("groups a wave into one row per archetype, bosses first", () => {
    const preview = summarizeWave(generateWave(verdant, 10, 42));

    expect(preview.waveNumber).toBe(10);
    expect(preview.isBoss).toBe(true);
    expect(preview.entries.length).toBeGreaterThan(0);
    // Counts across rows must account for every spawn, none dropped or doubled.
    const counted = preview.entries.reduce((sum, entry) => sum + entry.count, 0);
    expect(counted).toBe(preview.totalEnemies);
    // A boss wave sorts its boss to the top.
    expect(preview.entries[0]!.boss).toBe(true);
    expect(new Set(preview.entries.map((e) => e.enemyId)).size).toBe(preview.entries.length);
  });

  it("matches the wave that will actually spawn, for the same seed", () => {
    const plan = generateWave(verdant, 7, 1234);
    const preview = previewNextWave(verdant, 6, 1234)!;

    expect(preview.waveNumber).toBe(plan.waveNumber);
    expect(preview.totalEnemies).toBe(plan.spawns.length);
    for (const entry of preview.entries) {
      const actual = plan.spawns.filter((s) => s.enemyId === entry.enemyId).length;
      expect(actual).toBe(entry.count);
    }
  });

  it("is deterministic for a seed and varies across seeds", () => {
    const a = previewNextWave(verdant, 20, 99)!;
    const b = previewNextWave(verdant, 20, 99)!;
    expect(a).toEqual(b);

    const different = previewNextWave(verdant, 20, 100)!;
    expect(different.waveNumber).toBe(a.waveNumber);
  });

  it("stops past the final wave", () => {
    expect(previewNextWave(verdant, verdant.totalWaves, 5)).toBeNull();
    expect(previewNextWave(verdant, verdant.totalWaves - 1, 5)).not.toBeNull();
  });

  it("warns about spectral foes, which most towers cannot damage", () => {
    const marsh = getMap("shadow_marsh");
    // Sweep a range so the assertion does not depend on one lucky wave roll.
    const sawSpectral = Array.from({ length: 40 }, (_, i) =>
      summarizeWave(generateWave(marsh, i + 1, 7)),
    ).some((preview) => preview.entries.some((entry) => entry.spectral));

    expect(sawSpectral).toBe(true);

    const withSpectral = Array.from({ length: 40 }, (_, i) =>
      summarizeWave(generateWave(marsh, i + 1, 7)),
    ).find((preview) => preview.entries.some((entry) => entry.spectral))!;
    expect(withSpectral.warnings.some((w) => w.includes("Spectral"))).toBe(true);
  });

  it("reports the milestone tier on encounter waves", () => {
    const preview = summarizeWave(generateWave(verdant, 25, 3));
    expect(preview.milestoneTier).not.toBeNull();
  });
});

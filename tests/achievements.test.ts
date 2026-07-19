import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS, syncAchievements, unlockedAchievements } from "../src/meta/achievements";
import { freshSave } from "../src/meta/save";

describe("achievements", () => {
  it("reserves route clear achievements for wave 100", () => {
    const save = freshSave();
    save.bestWaveByMap = { verdant_route: 99, indigo_plateau: 99 };

    const unlocked = unlockedAchievements(save).map((achievement) => achievement.id);
    expect(unlocked).not.toContain("first_clear");
    expect(unlocked).not.toContain("plateau_champion");
    expect(ACHIEVEMENTS.find((achievement) => achievement.id === "first_clear")?.description).toBe(
      "Clear all 100 waves of a map.",
    );
  });

  it("derives milestone badges from persistent progress", () => {
    const save = freshSave();
    save.stats.hatches = 1;
    save.stats.bossesDefeated = 1;
    save.stats.totalWavesCleared = 100;
    save.collection = Array.from({ length: 6 }, (_, index) => ({
      uid: `owned-${index}`,
      speciesId: "pidgey",
      ivs: { damage: 0, range: 0, attackSpeed: 0 },
      level: 1,
      xp: 0,
      hatchedAt: 0,
    }));
    save.bestWaveByMap = { verdant_route: 100, indigo_plateau: 100 };

    expect(unlockedAchievements(save).map((achievement) => achievement.id)).toEqual([
      "first_hatch",
      "wave_ten",
      "first_boss",
      "first_clear",
      "six_owned",
      "hundred_waves",
      "plateau_champion",
    ]);
  });

  it("stores newly unlocked IDs once", () => {
    const save = freshSave();
    save.stats.hatches = 1;

    expect(syncAchievements(save).map((achievement) => achievement.id)).toEqual(["first_hatch"]);
    expect(syncAchievements(save)).toEqual([]);
    expect(save.achievements).toEqual(["first_hatch"]);
  });
});

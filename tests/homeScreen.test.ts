import { describe, expect, it } from "vitest";
import { MAPS } from "../src/data/maps";
import { freshSave } from "../src/meta/save";
import { routeCardView } from "../src/ui/screens/homeScreen";

describe("route selector models", () => {
  it("describes nine route cards with milestone and habitat progress", () => {
    const save = freshSave();
    const cards = MAPS.map((map) => routeCardView(map, save));

    expect(cards).toHaveLength(9);
    expect(cards[0]).toMatchObject({ unlocked: true, bestLabel: "Best: 0/100" });
    expect(cards[1]).toMatchObject({
      unlocked: false,
      lockLabel: "Reach wave 25 on Verdant Route",
    });
    for (const card of cards) {
      expect(card.milestones.map((milestone) => milestone.wave)).toEqual([25, 50, 75, 100]);
      expect(card.habitats.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("unlocks the next route at wave 25", () => {
    const save = freshSave();
    save.bestWaveByMap.verdant_route = 25;

    expect(routeCardView(MAPS[1]!, save).unlocked).toBe(true);
  });
});

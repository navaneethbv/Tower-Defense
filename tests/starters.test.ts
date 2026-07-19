import { describe, expect, it } from "vitest";
import { getSpecies, isBaseSpecies } from "../src/data/species";
import { STARTER_GROUPS, STARTER_IDS, starterGroup } from "../src/data/starters";
import { starterCardView } from "../src/ui/screens/starterScreen";

describe("starter catalogue", () => {
  it("contains all nine generations and exactly 28 unique base species", () => {
    expect(STARTER_GROUPS.map((group) => group.generation)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(STARTER_IDS).toHaveLength(28);
    expect(new Set(STARTER_IDS).size).toBe(28);
    expect(STARTER_IDS.map((id) => getSpecies(id).name)).toEqual([
      "Bulbasaur", "Charmander", "Squirtle", "Pikachu",
      "Chikorita", "Cyndaquil", "Totodile",
      "Treecko", "Torchic", "Mudkip",
      "Turtwig", "Chimchar", "Piplup",
      "Snivy", "Tepig", "Oshawott",
      "Chespin", "Fennekin", "Froakie",
      "Rowlet", "Litten", "Popplio",
      "Grookey", "Scorbunny", "Sobble",
      "Sprigatito", "Fuecoco", "Quaxly",
    ]);
    // Every starter is an unevolved first stage, with one deliberate exception:
    // Pikachu is offered as an iconic Gen 1 partner even though Pichu evolves
    // into it, mirroring the mainline games. No other evolved form qualifies.
    const notBase = STARTER_IDS.filter((id) => !isBaseSpecies(getSpecies(id)));
    expect(notBase).toEqual(["pikachu"]);
    expect(starterGroup(9).speciesIds).toEqual(["sprigatito", "fuecoco", "quaxly"]);
  });

  it("rejects an unknown generation", () => {
    expect(() => starterGroup(10)).toThrow("Unknown starter generation: 10");
  });
});

describe("starter card presentation", () => {
  it("describes starter combat and habitat identity", () => {
    expect(starterCardView("charmander")).toMatchObject({
      name: "Charmander",
      types: "fire",
      role: "Dps",
      habitats: "grass / mountain",
      status: "Burn",
    });
    expect(starterCardView("mudkip")).toMatchObject({
      name: "Mudkip",
      types: "water",
    });
  });
});

describe("starter combat identity", () => {
  it("gives every starter an understandable combat identity", () => {
    for (const id of STARTER_IDS) {
      const species = getSpecies(id);
      expect(["damage", "balanced", "status"]).toContain(species.combatProfile);
      expect(species.combatProfile === "status" ? species.onHitStatus : true).toBeTruthy();
      // Every approved first choice must be affordable under the same opening economy.
      expect(species.base.cost).toBeGreaterThanOrEqual(80);
      expect(species.base.cost).toBeLessThanOrEqual(90);
    }
  });
});

import { Tower } from "../src/engine/tower";

describe("Tower level logic", () => {
  it("cannot level up beyond max level", () => {
    const tower = new Tower("user1", "charmander", { damage: 0, range: 0, attackSpeed: 0 }, 0, 0, false, 0, 100);
    expect(tower.atMaxLevel()).toBe(true);
    expect(tower.levelUp()).toBe(false);
  });
});


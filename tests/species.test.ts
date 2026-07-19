import { describe, expect, it } from "vitest";
import {
  SPECIES,
  baseSpeciesByRarity,
  getSpecies,
  hasSpecies,
  isBaseSpecies,
  selectEvolution,
} from "../src/data/species";
import type { Rarity, SpeciesDef, TypeName } from "../src/types";

const TYPES = new Set<TypeName>([
  "normal",
  "fire",
  "water",
  "grass",
  "electric",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
]);

function combatValue(species: SpeciesDef): number {
  return (species.base.damage / species.base.cooldown) * species.base.range;
}

describe("runtime species roster", () => {
  it("contains every National Dex species from 1 through 1025 exactly once", () => {
    expect(SPECIES).toHaveLength(1025);
    expect(new Set(SPECIES.map((species) => species.dex)).size).toBe(1025);
    expect(new Set(SPECIES.map((species) => species.id)).size).toBe(1025);
    expect(SPECIES.map((species) => species.dex)).toEqual(
      Array.from({ length: 1025 }, (_, index) => index + 1),
    );
  });

  it("has valid types, terrain, combat stats, and evolution references", () => {
    const ids = new Set(SPECIES.map((species) => species.id));
    for (const species of SPECIES) {
      expect(species.types.length).toBeGreaterThan(0);
      expect(species.types.every((type) => TYPES.has(type))).toBe(true);
      expect(TYPES.has(species.attackType)).toBe(true);
      expect(species.allowedTerrain).toContain(species.favoredTerrain);
      expect(species.base.damage).toBeGreaterThan(0);
      expect(species.base.cooldown).toBeGreaterThan(0);
      expect(species.base.range).toBeGreaterThan(0);
      expect(species.base.cost).toBeGreaterThan(0);
      for (const evolution of species.evolutions ?? []) {
        expect(ids.has(evolution.speciesId)).toBe(true);
        expect(evolution.atLevel).toBeGreaterThan(1);
        expect(combatValue(getSpecies(evolution.speciesId))).toBeGreaterThan(
          combatValue(species),
        );
      }
    }
  });

  it("keeps every rarity pool populated with base species", () => {
    for (const rarity of ["common", "rare", "legendary"] satisfies Rarity[]) {
      const pool = baseSpeciesByRarity(rarity);
      expect(pool.length).toBeGreaterThan(0);
      expect(pool.every(isBaseSpecies)).toBe(true);
      expect(pool.every((species) => species.rarity === rarity)).toBe(true);
    }
  });

  it("selects a stable owner-specific branch for branching families", () => {
    const eevee = getSpecies("eevee");
    expect(eevee.evolutions?.length).toBeGreaterThanOrEqual(8);
    const first = selectEvolution(eevee, "owner-a");
    expect(selectEvolution(eevee, "owner-a")).toEqual(first);
    const selected = new Set(
      Array.from({ length: 100 }, (_, index) =>
        selectEvolution(eevee, `owner-${index}`)?.speciesId,
      ),
    );
    expect(selected.size).toBe(eevee.evolutions!.length);
  });

  it("preserves tuned starter definitions as curated overrides", () => {
    expect(getSpecies("charmander").base.damage).toBe(12);
    expect(getSpecies("venusaur").ability?.id).toBe("solar_beam");
    expect(getSpecies("blastoise").ability?.id).toBe("surf");
    expect(hasSpecies("charmander")).toBe(true);
    expect(hasSpecies("nonexistent")).toBe(false);
    expect(() => getSpecies("nonexistent")).toThrow("Unknown species id: nonexistent");
  });

  it("assigns reusable active kits across the expanded roster", () => {
    const withAbilities = SPECIES.filter((species) => species.ability);
    expect(withAbilities.length).toBeGreaterThanOrEqual(100);
    expect(new Set(withAbilities.map((species) => species.ability!.kind)).size).toBeGreaterThanOrEqual(8);
    expect(getSpecies("mewtwo").ability).toBeDefined();
    expect(getSpecies("arceus").ability).toBeDefined();
    expect(getSpecies("miraidon").ability).toBeDefined();
  });
});

describe("combat profiles", () => {
  it("assigns deterministic combat profiles and status-specialist tradeoffs", () => {
    expect(getSpecies("charmander").combatProfile).toBe("balanced");
    expect(getSpecies("vulpix").combatProfile).toBe("status");
    expect(getSpecies("vulpix").onHitStatus?.kind).toBe("burn");
    expect(getSpecies("salandit").combatProfile).toBe("status");
    expect(["poison", "toxic"]).toContain(getSpecies("salandit").onHitStatus?.kind);
    expect(getSpecies("mareep").onHitStatus?.kind).toBe("paralysis");
    expect(getSpecies("smoochum").onHitStatus?.kind).toBe("freeze");
    expect(SPECIES.filter((species) => species.combatProfile === "status").length).toBeGreaterThan(100);
    expect(SPECIES.every((species) => species.combatProfile !== "status" || species.onHitStatus)).toBe(true);
    // Vulpix derives 13 direct damage before the specialist tradeoff; the 0.80
    // multiplier (a 20% cut, the shallow end of the approved 20-30% band) takes
    // it to 11. Balance tuning settled on 0.80 because 0.75 left specialist
    // teams unable to hold Ember Caldera.
    expect(getSpecies("vulpix").base.damage).toBe(11);
  });
});

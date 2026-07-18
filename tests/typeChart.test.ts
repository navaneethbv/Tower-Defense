import { describe, it, expect } from "vitest";
import { getEffectiveness } from "../src/data/typeChart";

describe("type chart", () => {
  it("applies single-type effectiveness", () => {
    expect(getEffectiveness("water", ["fire"])).toBe(2);
    expect(getEffectiveness("fire", ["water"])).toBe(0.5);
    expect(getEffectiveness("normal", ["normal"])).toBe(1);
  });

  it("multiplies across dual types", () => {
    // Grass vs rock/ground (Geodude): 2 * 2 = 4
    expect(getEffectiveness("grass", ["rock", "ground"])).toBe(4);
    // Electric vs water/flying (Gyarados): 2 * 2 = 4
    expect(getEffectiveness("electric", ["water", "flying"])).toBe(4);
  });

  it("handles immunities", () => {
    expect(getEffectiveness("normal", ["ghost"])).toBe(0);
    expect(getEffectiveness("electric", ["ground"])).toBe(0);
    expect(getEffectiveness("ground", ["flying"])).toBe(0);
  });

  it("uses modern Dark, Steel, and Fairy interactions", () => {
    expect(getEffectiveness("dark", ["psychic"])).toBe(2);
    expect(getEffectiveness("dark", ["ghost"])).toBe(2);
    expect(getEffectiveness("normal", ["steel"])).toBe(0.5);
    expect(getEffectiveness("steel", ["rock"])).toBe(2);
    expect(getEffectiveness("steel", ["ice"])).toBe(2);
    expect(getEffectiveness("fighting", ["dark", "steel"])).toBe(4);
    expect(getEffectiveness("poison", ["steel"])).toBe(0);
    expect(getEffectiveness("fairy", ["fighting"])).toBe(2);
    expect(getEffectiveness("fairy", ["dragon"])).toBe(2);
    expect(getEffectiveness("fairy", ["dark"])).toBe(2);
    expect(getEffectiveness("dragon", ["fairy"])).toBe(0);
    expect(getEffectiveness("poison", ["fairy"])).toBe(2);
    expect(getEffectiveness("ghost", ["steel"])).toBe(1);
    expect(getEffectiveness("dark", ["steel"])).toBe(1);
  });

  it("uses corrected modern Ghost and Poison interactions", () => {
    expect(getEffectiveness("ghost", ["psychic"])).toBe(2);
    expect(getEffectiveness("poison", ["bug"])).toBe(1);
    expect(getEffectiveness("bug", ["poison"])).toBe(0.5);
  });
});

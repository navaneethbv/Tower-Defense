import { describe, it, expect } from "vitest";
import { simulateRun } from "../src/engine/headlessSim";
import { runPayout } from "../src/meta/economy";
import { EGG_PRICES } from "../src/meta/economy";
import { getMap } from "../src/data/maps";
import type { IVs, OwnedPokemon } from "../src/types";

const ZERO_IV: IVs = { damage: 0, range: 0, attackSpeed: 0 };
const GOOD_IV: IVs = { damage: 12, range: 10, attackSpeed: 12 };
const MAX_IV: IVs = { damage: 15, range: 15, attackSpeed: 15 };

let counter = 0;
function owned(speciesId: string, ivs: IVs = ZERO_IV, level = 1): OwnedPokemon {
  return { uid: `sim-${counter++}`, speciesId, ivs, level, xp: 0, hatchedAt: 0 };
}

function avgWaves(team: OwnedPokemon[], seeds = 5): number {
  const map = getMap("verdant_route");
  let total = 0;
  for (let s = 0; s < seeds; s++) total += simulateRun(map, team, 1000 + s * 777).wavesCleared;
  return total / seeds;
}

describe("balance bands (Verdant Route)", () => {
  it("reports difficulty curve", () => {
    const solo = avgWaves([owned("charmander")]);
    const trio = avgWaves([owned("charmander"), owned("squirtle"), owned("pikachu")]);
    const six = avgWaves([
      owned("charmander"),
      owned("squirtle"),
      owned("bulbasaur"),
      owned("pikachu"),
      owned("pidgey"),
      owned("geodude"),
    ]);
    const sixStrong = avgWaves([
      owned("charmander", GOOD_IV, 8),
      owned("squirtle", GOOD_IV, 8),
      owned("bulbasaur", GOOD_IV, 8),
      owned("pikachu", GOOD_IV, 8),
      owned("pidgey", GOOD_IV, 8),
      owned("geodude", GOOD_IV, 8),
    ]);
    const sixMax = avgWaves([
      owned("charmander", MAX_IV, 20),
      owned("squirtle", MAX_IV, 20),
      owned("bulbasaur", MAX_IV, 20),
      owned("pikachu", MAX_IV, 20),
      owned("geodude", MAX_IV, 20),
      owned("pidgey", MAX_IV, 20),
    ]);
    const roster = ["charmander", "squirtle", "bulbasaur", "pikachu", "pidgey", "geodude"];
    const tenMax = avgWaves(
      Array.from({ length: 10 }, (_, i) => owned(roster[i % roster.length]!, MAX_IV, 20)),
    );
    // eslint-disable-next-line no-console
    console.log(
      "BALANCE  solo=%s trio=%s six=%s sixStrong=%s sixMax=%s tenMax=%s",
      solo, trio, six, sixStrong, sixMax, tenMax,
    );

    // A lone starter should fail after just a few waves (the signal to go hatch
    // more pokemon), and both fielding more pokemon and leveling them up should
    // extend the run — a clean monotonic climb.
    expect(solo).toBeLessThanOrEqual(11);
    expect(six).toBeGreaterThan(solo);
    expect(sixStrong).toBeGreaterThan(six);
    expect(tenMax).toBeGreaterThan(sixMax);
  });
});

describe("grind economy", () => {
  it("banks enough from short repeated runs to afford eggs", () => {
    const map = getMap("verdant_route");
    // Ten short runs that each clear ~3 waves should roughly fund a common egg.
    const perRun = runPayout(map, 3, 0);
    expect(perRun * 10).toBeGreaterThanOrEqual(EGG_PRICES.common);
  });

  it("pays deeper runs meaningfully more than shallow ones", () => {
    const map = getMap("verdant_route");
    expect(runPayout(map, 15, 1)).toBeGreaterThan(runPayout(map, 3, 0) * 3);
  });
});

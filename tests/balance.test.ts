import { describe, it, expect, vi } from "vitest";
import { simulateRun } from "../src/engine/headlessSim";
import { runPayout } from "../src/meta/economy";
import { EGG_PRICES } from "../src/meta/economy";
import { getMap } from "../src/data/maps";
import { MAPS } from "../src/data/maps";
import { GameSession } from "../src/engine/game";
import type { IVs, OwnedPokemon } from "../src/types";

const ZERO_IV: IVs = { damage: 0, range: 0, attackSpeed: 0 };
const GOOD_IV: IVs = { damage: 12, range: 10, attackSpeed: 12 };
const MAX_IV: IVs = { damage: 15, range: 15, attackSpeed: 15 };

let counter = 0;
function owned(speciesId: string, ivs: IVs = ZERO_IV, level = 1): OwnedPokemon {
  return { uid: `sim-${counter++}`, speciesId, ivs, level, xp: 0, hatchedAt: 0 };
}

function avgWavesOnMap(mapId: string, team: OwnedPokemon[], seeds = 5): number {
  const map = getMap(mapId);
  let total = 0;
  for (let s = 0; s < seeds; s++) total += simulateRun(map, team, 1000 + s * 777).wavesCleared;
  return total / seeds;
}

function avgWaves(team: OwnedPokemon[], seeds = 5): number {
  return avgWavesOnMap("verdant_route", team, seeds);
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
    console.log(
      "BALANCE  solo=%s trio=%s six=%s sixStrong=%s sixMax=%s tenMax=%s",
      solo, trio, six, sixStrong, sixMax, tenMax,
    );

    // A lone starter should fail after just a few waves (the signal to go hatch
    // more pokemon), and both fielding more pokemon and leveling them up should
    // extend the run, producing a clean monotonic climb.
    expect(solo).toBeGreaterThanOrEqual(5);
    expect(solo).toBeLessThanOrEqual(20);
    expect(six).toBeGreaterThan(solo);
    expect(sixStrong).toBeGreaterThan(six);
    expect(tenMax).toBeGreaterThanOrEqual(sixMax);
  }, 30_000);
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

describe("all-map endgame balance", () => {
  const mapIds = MAPS.map((map) => map.id);
  const finalRoster = [
    "charizard",
    "blastoise",
    "gyarados",
    "milotic",
    "greninja",
    "metagross",
    "garchomp",
    "aegislash",
    "primarina",
    "mewtwo",
  ];

  it.each(mapIds)("lets a maxed final-stage team clear all 100 waves on %s", (mapId) => {
    const team = finalRoster.map((speciesId) => owned(speciesId, MAX_IV, 20));
    const results = [11, 22, 33].map((seed) => simulateRun(getMap(mapId), team, seed));
    expect(results.map((result) => result.wavesCleared)).toEqual([100, 100, 100]);
  });

  it.each(mapIds)("lets a developed six-member team reach wave 35 on %s", (mapId) => {
    const team = ["charmander", "squirtle", "bulbasaur", "pikachu", "gastly", "abra"].map(
      (speciesId) => owned(speciesId, GOOD_IV, 12),
    );
    const results = [11, 22, 33].map((seed) => simulateRun(getMap(mapId), team, seed));
    expect(Math.min(...results.map((result) => result.wavesCleared))).toBeGreaterThanOrEqual(35);
  });

  it.each(mapIds)("keeps progression meaningful on %s", (mapId) => {
    const solo = avgWavesOnMap(mapId, [owned("charmander")], 3);
    const novice = avgWavesOnMap(
      mapId,
      [owned("charmander"), owned("squirtle"), owned("bulbasaur")],
      3,
    );
    const developed = avgWavesOnMap(
      mapId,
      [owned("charizard", GOOD_IV, 12), owned("blastoise", GOOD_IV, 12), owned("venusaur", GOOD_IV, 12)],
      3,
    );
    expect(solo).toBeLessThanOrEqual(20);
    expect(developed).toBeGreaterThan(solo);
    expect(developed).toBeGreaterThanOrEqual(novice);
  });

  // A team built entirely from status specialists trades direct damage for
  // control, so it has to remain competitive with the developed damage team.
  // Composition is load-bearing on two routes and was chosen deliberately:
  // Mareanie (poison/water) supplies water-pad coverage, because water-typed
  // Pokemon attack as water, which has no status kit, so poison/water and
  // ice/water duals are the only specialists that can hold a water pad at all.
  // Gastly, Drowzee, and Abra supply the three spectral-capable attackers that
  // Shadow Marsh's spectral enemies require.
  const specialistRoster = ["vulpix", "gastly", "drowzee", "abra", "mareanie", "magnemite"];

  it.each(mapIds)("lets a status-specialist team reach wave 35 on %s", (mapId) => {
    const team = specialistRoster.map((speciesId) => owned(speciesId, GOOD_IV, 12));
    const results = [11, 22, 33].map((seed) => simulateRun(getMap(mapId), team, seed));
    expect(Math.min(...results.map((result) => result.wavesCleared))).toBeGreaterThanOrEqual(35);
  });

  it("replays status-specialist runs identically for a fixed seed", () => {
    const map = getMap("verdant_route");
    const team = specialistRoster.map((speciesId) => owned(speciesId, GOOD_IV, 12));
    const first = simulateRun(map, team, 4242).wavesCleared;
    const second = simulateRun(map, team, 4242).wavesCleared;
    expect(first).toBe(second);
  });

  it("repeats exactly for the same run seed", () => {
    const map = getMap("indigo_plateau");
    const team = finalRoster.slice(0, 6).map((speciesId) => owned(speciesId, GOOD_IV, 12));
    expect(simulateRun(map, team, 90210)).toEqual(simulateRun(map, team, 90210));
  });

  it("keeps a lone starter inside the early-game failure band", () => {
    const results = [11, 22, 33].map((seed) =>
      simulateRun(getMap("verdant_route"), [owned("charmander")], seed).wavesCleared,
    );
    const average = results.reduce((sum, waves) => sum + waves, 0) / results.length;
    expect(average).toBeGreaterThanOrEqual(5);
    expect(average).toBeLessThanOrEqual(20);
  });

  it("handles upgrade failure in simulation loop", () => {
    const map = getMap("verdant_route");
    const team = [owned("charmander")];
    const spy = vi.spyOn(GameSession.prototype, "upgradeTower").mockReturnValue(false);
    
    // Run the simulation with upgradeTower always returning false
    const res = simulateRun(map, team, 12345);
    expect(res).toBeDefined();

    spy.mockRestore();
  });
});

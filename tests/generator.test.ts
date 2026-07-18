import { describe, expect, it } from "vitest";
import {
  generatePokemonSnapshot,
  validateSnapshot,
} from "../tools/generate-pokemon-data.mjs";

interface FixtureResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

function fixtureFetch(fixtures: Record<string, unknown>, calls: string[]): typeof fetch {
  return (async (input: string | URL | Request): Promise<FixtureResponse> => {
    const url = String(input);
    calls.push(url);
    const body = fixtures[url];
    if (!body) {
      return { ok: false, status: 404, json: async () => ({}) };
    }
    return { ok: true, status: 200, json: async () => body };
  }) as unknown as typeof fetch;
}

function species(id: number, name: string, evolvesFrom: string | null) {
  return {
    id,
    name,
    names: [{ name: name[0]!.toUpperCase() + name.slice(1), language: { name: "en" } }],
    generation: { name: "generation-i" },
    evolves_from_species: evolvesFrom ? { name: evolvesFrom } : null,
    evolution_chain: { url: "https://pokeapi.test/evolution-chain/14" },
    is_legendary: false,
    is_mythical: false,
    capture_rate: id === 35 ? 150 : 75,
  };
}

function pokemon(id: number, name: string, currentType: string, pastType?: string) {
  return {
    id,
    name,
    types: [{ slot: 1, type: { name: currentType } }],
    past_types: pastType
      ? [
          {
            generation: { name: "generation-vi" },
            types: [{ slot: 1, type: { name: pastType } }],
          },
        ]
      : [],
    stats: [
      { base_stat: 70, stat: { name: "hp" } },
      { base_stat: 45, stat: { name: "attack" } },
      { base_stat: 48, stat: { name: "defense" } },
      { base_stat: 60, stat: { name: "special-attack" } },
      { base_stat: 65, stat: { name: "special-defense" } },
      { base_stat: 35, stat: { name: "speed" } },
    ],
  };
}

describe("PokéAPI snapshot generator", () => {
  it("normalizes current Generation IX typing and fetches a shared chain once", async () => {
    const calls: string[] = [];
    const fixtures = {
      "https://pokeapi.co/api/v2/pokemon-species/35": species(35, "clefairy", null),
      "https://pokeapi.co/api/v2/pokemon/35": pokemon(35, "clefairy", "fairy", "normal"),
      "https://pokeapi.co/api/v2/pokemon-species/36": species(36, "clefable", "clefairy"),
      "https://pokeapi.co/api/v2/pokemon/36": pokemon(36, "clefable", "fairy", "normal"),
      "https://pokeapi.test/evolution-chain/14": { id: 14, chain: {} },
    };

    const snapshot = await generatePokemonSnapshot({
      fetchImpl: fixtureFetch(fixtures, calls),
      firstDex: 35,
      lastDex: 36,
      retries: 1,
    });

    expect(snapshot.map((entry) => entry.dex)).toEqual([35, 36]);
    expect(snapshot[0]!.types).toEqual(["fairy"]);
    expect(snapshot[0]!.evolvesTo).toEqual(["clefable"]);
    expect(snapshot[1]!.evolvesFrom).toBe("clefairy");
    expect(calls.filter((url) => url.includes("evolution-chain/14"))).toHaveLength(1);
  });

  it("rejects missing and duplicate National Dex records", () => {
    const valid = {
      dex: 1,
      id: "bulbasaur",
      name: "Bulbasaur",
      types: ["grass", "poison"],
      baseStats: { hp: 45, attack: 49, defense: 49, specialAttack: 65, specialDefense: 65, speed: 45 },
      generation: 1,
      evolvesFrom: null,
      evolvesTo: ["ivysaur"],
      isLegendary: false,
      isMythical: false,
      captureRate: 45,
    };

    expect(() => validateSnapshot([valid], 1, 2)).toThrow("Missing National Dex entries: 2");
    expect(() => validateSnapshot([valid, valid], 1, 1)).toThrow("Duplicate National Dex entry: 1");
  });
});

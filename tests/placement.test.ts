import { describe, expect, it } from "vitest";
import { getMap } from "../src/data/maps";
import { getSpecies } from "../src/data/species";
import { GameSession } from "../src/engine/game";
import type { OwnedPokemon, Terrain } from "../src/types";

function owned(uid: string, speciesId: string): OwnedPokemon {
  return {
    uid,
    speciesId,
    ivs: { damage: 0, range: 0, attackSpeed: 0 },
    level: 1,
    xp: 0,
    hatchedAt: 0,
  };
}

describe("authored deployment pads", () => {
  it("rejects ordinary tiles and enforces pad habitat compatibility", () => {
    const map = getMap("verdant_route");
    const member = owned("starter", "charmander");
    const game = new GameSession(map, [member], 7);
    const species = getSpecies(member.speciesId);
    const padKeys = new Set(map.deploymentPads.map((pad) => `${pad.col},${pad.row}`));
    const nonPad = map.terrain
      .flatMap((row, rowIndex) => row.map((_terrain, col) => ({ col, row: rowIndex })))
      .find((tile) => !padKeys.has(`${tile.col},${tile.row}`))!;
    const compatible = map.deploymentPads.find((pad) =>
      species.allowedTerrain.includes(pad.terrain),
    )!;
    const incompatible = map.deploymentPads.find(
      (pad) => !species.allowedTerrain.includes(pad.terrain),
    )!;

    expect(game.canPlace(member.uid, nonPad.col, nonPad.row)).toEqual({
      ok: false,
      reason: "Only marked habitat pads can hold Pokémon",
    });
    expect(game.canPlace(member.uid, compatible.col, compatible.row).ok).toBe(true);
    expect(game.canPlace(member.uid, incompatible.col, incompatible.row)).toEqual({
      ok: false,
      reason: `${species.name} needs a ${species.allowedTerrain.join(" or ")} pad`,
    });
  });

  it("prevents two team members from occupying the same pad", () => {
    const map = getMap("verdant_route");
    const first = owned("first", "charmander");
    const second = owned("second", "bulbasaur");
    const game = new GameSession(map, [first, second], 8);
    const pad = map.deploymentPads.find((candidate) => candidate.terrain === "grass")!;

    expect(game.placeTower(first.uid, pad.col, pad.row).ok).toBe(true);
    expect(game.canPlace(second.uid, pad.col, pad.row)).toEqual({
      ok: false,
      reason: "Habitat pad occupied",
    });
  });

  it("exposes authored pad lookup", () => {
    const map = getMap("indigo_plateau");
    const game = new GameSession(map, [], 9);
    const pad = map.deploymentPads[0]!;

    expect(game.padAt(pad.col, pad.row)).toEqual(pad);
    expect(game.padAt(17, 11)).toBeUndefined();
    expect(new Set(map.deploymentPads.map((candidate) => candidate.terrain))).toEqual(
      new Set<Terrain>(["grass", "water", "mountain"]),
    );
  });
});

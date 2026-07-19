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

  it("enforces team membership, bounds, state presence, and financial limits", () => {
    const map = getMap("verdant_route");
    const member = owned("starter", "charmander");
    const game = new GameSession(map, [member], 7);
    const pad = map.deploymentPads.find((candidate) => candidate.terrain === "grass")!;

    // 1. Not on team
    expect(game.canPlace("non-existent-uid", pad.col, pad.row)).toEqual({
      ok: false,
      reason: "Not on team",
    });

    // 2. Out of bounds
    expect(game.canPlace("starter", -1, 0)).toEqual({
      ok: false,
      reason: "Out of bounds",
    });
    expect(game.canPlace("starter", map.cols, 0)).toEqual({
      ok: false,
      reason: "Out of bounds",
    });
    expect(game.canPlace("starter", 0, -1)).toEqual({
      ok: false,
      reason: "Out of bounds",
    });
    expect(game.canPlace("starter", 0, map.rows)).toEqual({
      ok: false,
      reason: "Out of bounds",
    });

    // 3. Insufficient gold
    game.gold = 0;
    expect(game.canPlace("starter", pad.col, pad.row)).toEqual({
      ok: false,
      reason: "Not enough gold",
    });

    // Restore gold to place
    game.gold = 1000;
    expect(game.placeTower("starter", pad.col, pad.row).ok).toBe(true);

    // 4. Already deployed
    expect(game.canPlace("starter", pad.col, pad.row)).toEqual({
      ok: false,
      reason: "Already deployed",
    });

    // 5. placeTower fails early when canPlace check fails
    const second = owned("second", "bulbasaur");
    const game2 = new GameSession(map, [second], 1);
    game2.gold = 0; // cannot place
    const check = game2.placeTower("second", pad.col, pad.row);
    expect(check.ok).toBe(false);
  });
});

describe("mid-run redeployment", () => {
  it("redeploys the same tower without charging gold or resetting state", () => {
    const map = getMap("verdant_route");
    const member = owned("mover", "charmander");
    const game = new GameSession(map, [member], 10);
    const pads = map.deploymentPads.filter((pad) => pad.terrain === "grass");
    const placed = game.placeTower(member.uid, pads[0]!.col, pads[0]!.row);
    expect(placed.ok).toBe(true);
    if (!placed.ok) throw new Error(placed.reason);
    const tower = placed.tower;
    tower.level = 4;
    tower.xp = 3;
    tower.runXp = 12;
    tower.targeting = "strongest";
    tower.cooldownLeft = 0.4;
    tower.abilityCooldownLeft = 6;
    const gold = game.gold;

    const moved = game.redeployTower(tower, pads[1]!.col, pads[1]!.row);

    expect(moved).toEqual({ ok: true, tower });
    expect(game.gold).toBe(gold);
    expect(game.towers).toEqual([tower]);
    expect(tower).toMatchObject({
      col: pads[1]!.col,
      row: pads[1]!.row,
      level: 4,
      xp: 3,
      runXp: 12,
      targeting: "strongest",
      cooldownLeft: 0.4,
      abilityCooldownLeft: 6,
      redeployCooldownLeft: 5,
    });
  });

  it("rejects invalid, occupied, incompatible, and cooling-down moves", () => {
    const map = getMap("verdant_route");
    const charmander = owned("fire", "charmander");
    const bulbasaur = owned("grass", "bulbasaur");
    const game = new GameSession(map, [charmander, bulbasaur], 11);
    const grassPads = map.deploymentPads.filter((pad) => pad.terrain === "grass");
    const mountainPads = map.deploymentPads.filter((pad) => pad.terrain === "mountain");
    const waterPad = map.deploymentPads.find((pad) => pad.terrain === "water")!;
    const fire = game.placeTower(charmander.uid, mountainPads[0]!.col, mountainPads[0]!.row);
    const grass = game.placeTower(bulbasaur.uid, grassPads[0]!.col, grassPads[0]!.row);
    if (!fire.ok || !grass.ok) throw new Error("test setup failed");

    expect(game.canRedeploy(fire.tower, fire.tower.col, fire.tower.row)).toEqual({
      ok: false,
      reason: "Choose a different habitat pad",
    });
    expect(game.canRedeploy(fire.tower, grass.tower.col, grass.tower.row)).toEqual({
      ok: false,
      reason: "Habitat pad occupied",
    });
    expect(game.canRedeploy(fire.tower, waterPad.col, waterPad.row)).toEqual({
      ok: false,
      reason: "Charmander needs a grass or mountain pad",
    });
    expect(game.redeployTower(fire.tower, mountainPads[1]!.col, mountainPads[1]!.row).ok).toBe(true);
    expect(game.canRedeploy(fire.tower, grassPads[1]!.col, grassPads[1]!.row)).toEqual({
      ok: false,
      reason: "Redeploy ready in 5.0s",
    });
  });
});

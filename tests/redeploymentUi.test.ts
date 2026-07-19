import { describe, expect, it } from "vitest";
import { getMap } from "../src/data/maps";
import { GameSession } from "../src/engine/game";
import { cycleRedeploymentPad, redeploymentPads } from "../src/ui/redeployment";
import type { OwnedPokemon } from "../src/types";

const member: OwnedPokemon = {
  uid: "mover",
  speciesId: "charmander",
  ivs: { damage: 0, range: 0, attackSpeed: 0 },
  level: 1,
  xp: 0,
  hatchedAt: 0,
};

describe("redeployment controls", () => {
  it("returns only legal empty destination pads", () => {
    const map = getMap("verdant_route");
    const game = new GameSession(map, [member], 13);
    const origin = map.deploymentPads.find((pad) => pad.terrain === "grass")!;
    const placed = game.placeTower(member.uid, origin.col, origin.row);
    if (!placed.ok) throw new Error(placed.reason);
    const destinations = redeploymentPads(game, placed.tower);
    expect(destinations.length).toBeGreaterThan(0);
    expect(destinations).not.toContainEqual(origin);
    expect(destinations.every((pad) => game.canRedeploy(placed.tower, pad.col, pad.row).ok)).toBe(true);
  });

  it("cycles forward and backward with wraparound", () => {
    const pads = [
      { id: "a", col: 1, row: 1, terrain: "grass" as const, tile: 127 },
      { id: "b", col: 2, row: 1, terrain: "grass" as const, tile: 127 },
    ];
    expect(cycleRedeploymentPad(pads, null, 1)).toEqual(pads[0]);
    expect(cycleRedeploymentPad(pads, { col: 2, row: 1 }, 1)).toEqual(pads[0]);
    expect(cycleRedeploymentPad(pads, { col: 1, row: 1 }, -1)).toEqual(pads[1]);
  });
});

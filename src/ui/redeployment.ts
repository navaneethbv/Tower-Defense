import type { DeploymentPad } from "../types";
import type { GameSession } from "../engine/game";
import type { Tower } from "../engine/tower";

export interface TileSelection {
  col: number;
  row: number;
}

// Pure destination filtering and keyboard cycling, kept out of gameScreen so
// move mode can be reasoned about (and tested) without a DOM.
export function redeploymentPads(game: GameSession, tower: Tower): DeploymentPad[] {
  return game.map.deploymentPads.filter((pad) => game.canRedeploy(tower, pad.col, pad.row).ok);
}

export function cycleRedeploymentPad(
  pads: DeploymentPad[],
  current: TileSelection | null,
  direction: -1 | 1,
): DeploymentPad | undefined {
  if (pads.length === 0) return undefined;
  const index = current
    ? pads.findIndex((pad) => pad.col === current.col && pad.row === current.row)
    : -1;
  return pads[(index + direction + pads.length) % pads.length];
}

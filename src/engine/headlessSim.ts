import type { MapConfig, OwnedPokemon } from "../types";
import { getSpecies } from "../data/species";
import { GameSession } from "./game";
import type { Tower } from "./tower";
import { TILE } from "../data/constants";

export interface SimResult {
  wavesCleared: number;
  phase: "won" | "lost";
  livesLeft: number;
  towersPlaced: number;
  finalGold: number;
}

// Densely sample the path polyline so tile coverage can be scored.
function samplePath(game: GameSession, spacing = TILE / 2): { x: number; y: number }[] {
  const pts = game.path.points;
  const out: { x: number; y: number }[] = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.ceil(len / spacing));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  return out;
}

// Pick the empty, compatible habitat pad that covers the most path with the
// species' base range. Models a player deploying where a tower does the most work.
function bestTile(game: GameSession, uid: string, speciesId: string, pathPts: { x: number; y: number }[]) {
  const species = getSpecies(speciesId);
  const r = species.base.range * TILE;
  const r2 = r * r;
  let best: { col: number; row: number; score: number } | null = null;
  for (const pad of game.map.deploymentPads) {
    const { col, row } = pad;
    if (!game.canPlace(uid, col, row).ok) continue;
    const cx = (col + 0.5) * TILE;
    const cy = (row + 0.5) * TILE;
    let score = 0;
    for (const p of pathPts) {
      if ((p.x - cx) ** 2 + (p.y - cy) ** 2 <= r2) score++;
    }
    if (pad.terrain === species.favoredTerrain) score *= 1.1;
    if (score > 0 && (!best || score > best.score)) best = { col, row, score };
  }
  return best;
}

// Simulate a run to completion with a competent-player policy: deploy affordable
// team members on high-coverage tiles, then spend leftover gold leveling the
// lowest-level tower. Returns how far the team gets.
export function simulateRun(map: MapConfig, team: OwnedPokemon[], runSeed: number): SimResult {
  const game = new GameSession(map, team, runSeed);
  const pathPts = samplePath(game);
  const dt = 1 / 30;

  const manage = (): void => {
    // Deploy any affordable, unplaced member on its best tile.
    for (const m of team) {
      if (game.isPlaced(m.uid)) continue;
      if (game.gold < getSpecies(m.speciesId).base.cost) continue;
      const tile = bestTile(game, m.uid, m.speciesId, pathPts);
      if (tile) game.placeTower(m.uid, tile.col, tile.row);
    }
    // Spend remaining gold leveling the weakest placed tower, keeping a buffer
    // to redeploy the rest of the team as gold accrues.
    let guard = 0;
    while (guard++ < 200) {
      const undeployed = team.filter((m) => !game.isPlaced(m.uid)).length;
      const buffer = undeployed > 0 ? 80 : 0;
      const candidates = game.towers.filter((t) => game.canUpgrade(t));
      if (candidates.length === 0) break;
      const cheapest = candidates.reduce((a: Tower, b: Tower) =>
        game.upgradeCost(b) < game.upgradeCost(a) ? b : a,
      );
      if (game.gold - game.upgradeCost(cheapest) < buffer) break;
      const target = candidates.reduce((a: Tower, b: Tower) => (b.level < a.level ? b : a));
      if (!game.upgradeTower(target)) break;
    }
  };

  const activateReadyAbilities = (): void => {
    if (game.enemies.length === 0) return;
    for (const tower of game.towers) {
      if (tower.species.ability && tower.abilityCooldownLeft <= 0) game.activateAbility(tower);
    }
  };

  let guard = 0;
  while (game.phase !== "won" && game.phase !== "lost" && guard++ < 500000) {
    if (game.phase === "building") {
      manage();
      game.startWave();
    }
    activateReadyAbilities();
    game.update(dt);
  }

  const wavesCleared = game.phase === "won" ? map.totalWaves : Math.max(0, game.waveNumber - 1);
  return {
    wavesCleared,
    phase: game.phase === "won" ? "won" : "lost",
    livesLeft: game.lives,
    towersPlaced: game.towers.length,
    finalGold: game.gold,
  };
}

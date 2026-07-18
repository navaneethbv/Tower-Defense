import type { StatusApplication } from "../types";
import { resolveHit } from "./combat";
import type { Enemy } from "./enemy";
import type { PathGeometry, Point } from "./path";
import type { Tower } from "./tower";

export type AbilityActivationResult =
  | { ok: true; affected: number; killed: Enemy[] }
  | { ok: false; reason: string };

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function enemiesInRange(tower: Tower, enemies: Enemy[]): Enemy[] {
  return enemies.filter(
    (enemy) => enemy.alive && distance(tower.pos, enemy.pos) <= tower.rangePx(),
  );
}

function applyStatus(enemy: Enemy, status: StatusApplication): void {
  if (enemy.alive) enemy.status.apply(status.kind, status.duration, status.magnitude);
}

function lineTargets(tower: Tower, enemies: Enemy[]): Enemy[] {
  const candidates = enemiesInRange(tower, enemies);
  const primary = candidates[0];
  if (!primary) return [];
  const dx = primary.pos.x - tower.pos.x;
  const dy = primary.pos.y - tower.pos.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) return [primary];
  const ux = dx / length;
  const uy = dy / length;
  return candidates.filter((enemy) => {
    const ex = enemy.pos.x - tower.pos.x;
    const ey = enemy.pos.y - tower.pos.y;
    const projection = ex * ux + ey * uy;
    const perpendicular = Math.abs(ex * uy - ey * ux);
    return projection >= 0 && projection <= tower.rangePx() && perpendicular <= 24;
  });
}

export function executeAbility(
  tower: Tower,
  enemies: Enemy[],
  path: PathGeometry,
): AbilityActivationResult {
  const ability = tower.species.ability;
  if (!ability) return { ok: false, reason: "This Pokémon has no active ability" };
  if (tower.abilityCooldownLeft > 0) return { ok: false, reason: "Ability is cooling down" };

  const inRange = enemiesInRange(tower, enemies);
  let targets: Enemy[] = [];
  let multiplier = 1;
  let status: StatusApplication | undefined;

  switch (ability.kind) {
    case "line_blast":
      targets = lineTargets(tower, enemies);
      multiplier = 3;
      break;
    case "area_damage":
      targets = inRange;
      multiplier = 1.75;
      break;
    case "aoe_burn":
      targets = inRange;
      multiplier = 1.25;
      status = { kind: "burn", chance: 1, duration: 4, magnitude: tower.damage() * 0.12 };
      break;
    case "path_wave":
      targets = enemies.filter((enemy) => enemy.alive);
      multiplier = 1.5;
      break;
    case "chain":
      targets = [...inRange]
        .sort((left, right) => distance(tower.pos, left.pos) - distance(tower.pos, right.pos))
        .slice(0, 5);
      multiplier = 1.8;
      break;
    case "aoe_push":
      targets = inRange;
      multiplier = 1.1;
      break;
    case "aoe_stun":
      targets = inRange;
      multiplier = 1.1;
      status = { kind: "stun", chance: 1, duration: 1.25, magnitude: 1 };
      break;
    case "multishot":
      targets = inRange.slice(0, 3);
      multiplier = 1.4;
      break;
    case "execute":
      targets = inRange.filter((enemy) => enemy.hp / enemy.maxHp <= 0.3).slice(0, 1);
      multiplier = 8;
      break;
    case "status_burst":
      targets = inRange;
      multiplier = 0.8;
      status = tower.species.onHitStatus
        ? { ...tower.species.onHitStatus, chance: 1 }
        : { kind: "slow", chance: 1, duration: 2, magnitude: 0.35 };
      break;
  }

  if (targets.length === 0) return { ok: false, reason: "No valid targets" };

  const killed: Enemy[] = [];
  for (const target of targets) {
    const result = resolveHit(target, tower.species.attackType, tower.damage() * multiplier);
    if (status) applyStatus(target, status);
    if (ability.kind === "aoe_push" && target.alive) {
      target.distance = Math.max(0, target.distance - 48);
      target.pos = path.positionAt(target.distance);
    }
    if (result.killed) killed.push(target);
  }

  tower.abilityCooldownLeft = ability.cooldown;
  return { ok: true, affected: targets.length, killed };
}

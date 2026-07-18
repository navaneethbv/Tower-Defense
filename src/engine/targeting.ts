import type { TargetingMode, TypeName } from "../types";
import type { Enemy } from "./enemy";
import type { Point } from "./path";

// Whether a tower can damage an enemy at all (spectral enemies resist all but
// super-effective / ghost / psychic attacks).
export function canHit(enemy: Enemy, attackType: TypeName, effectiveness: number): boolean {
  if (!enemy.def.spectral) return true;
  return effectiveness > 1 || attackType === "ghost" || attackType === "psychic";
}

// Pick the best in-range enemy for the given targeting mode.
export function chooseTarget(
  origin: Point,
  rangePx: number,
  enemies: Enemy[],
  mode: TargetingMode,
): Enemy | null {
  const r2 = rangePx * rangePx;
  const inRange = enemies.filter((e) => {
    if (!e.alive) return false;
    const dx = e.pos.x - origin.x;
    const dy = e.pos.y - origin.y;
    return dx * dx + dy * dy <= r2;
  });
  if (inRange.length === 0) return null;

  const best = (score: (e: Enemy) => number): Enemy =>
    inRange.reduce((a, b) => (score(b) > score(a) ? b : a));

  switch (mode) {
    case "first":
      return best((e) => e.distance);
    case "last":
      return best((e) => -e.distance);
    case "strongest":
      return best((e) => e.hp);
    case "weakest":
      return best((e) => -e.hp);
    case "fastest":
      return best((e) => e.speed);
    case "slowest":
      return best((e) => -e.speed);
    case "closest":
      return best((e) => -((e.pos.x - origin.x) ** 2 + (e.pos.y - origin.y) ** 2));
  }
}

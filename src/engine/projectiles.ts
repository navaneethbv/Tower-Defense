import type { TypeName, StatusApplication } from "../types";
import type { Enemy } from "./enemy";
import type { Point } from "./path";

// A homing projectile. Carries everything needed to resolve its hit so the
// GameSession can apply damage/status/reward in one place.
export class Projectile {
  pos: Point;
  readonly target: Enemy;
  readonly speed: number;
  readonly damage: number;
  readonly attackType: TypeName;
  readonly color: string;
  readonly status?: StatusApplication;
  done = false;

  constructor(
    origin: Point,
    target: Enemy,
    damage: number,
    attackType: TypeName,
    color: string,
    status?: StatusApplication,
    speed = 520,
  ) {
    this.pos = { x: origin.x, y: origin.y };
    this.target = target;
    this.damage = damage;
    this.attackType = attackType;
    this.color = color;
    this.status = status;
    this.speed = speed;
  }

  // Returns true when the projectile reaches (or should give up on) its target.
  update(dt: number): boolean {
    if (!this.target.alive) {
      this.done = true;
      return true;
    }
    const dx = this.target.pos.x - this.pos.x;
    const dy = this.target.pos.y - this.pos.y;
    const d = Math.hypot(dx, dy);
    const step = this.speed * dt;
    if (d <= step) {
      this.pos = { x: this.target.pos.x, y: this.target.pos.y };
      this.done = true;
      return true;
    }
    this.pos = { x: this.pos.x + (dx / d) * step, y: this.pos.y + (dy / d) * step };
    return false;
  }
}

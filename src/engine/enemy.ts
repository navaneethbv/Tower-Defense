import type { EnemyDef, EnemyStatMods } from "../types";
import { StatusSet } from "./status";
import type { PathGeometry, Point } from "./path";

let nextEnemyId = 1;

// A live enemy walking the path.
export class Enemy {
  readonly instanceId = nextEnemyId++;
  readonly def: EnemyDef;
  readonly maxHp: number;
  hp: number;
  readonly speed: number;
  readonly armor: number;
  readonly reward: number;
  readonly heartDamage: number;
  readonly isBoss: boolean;
  distance = 0;
  pos: Point;
  readonly status = new StatusSet();
  alive = true;
  reachedEnd = false;

  constructor(def: EnemyDef, mods: EnemyStatMods, path: PathGeometry) {
    this.def = def;
    this.maxHp = mods.hp;
    this.hp = mods.hp;
    this.speed = mods.speed;
    this.armor = mods.armor;
    this.reward = mods.reward;
    this.heartDamage = mods.heartDamage;
    this.isBoss = mods.boss;
    this.pos = path.positionAt(0);
  }

  effectiveArmor(): number {
    return this.status.armorNegated() ? 0 : this.armor;
  }

  update(dt: number, path: PathGeometry): void {
    const tick = this.status.tick(dt, this.isBoss);
    if (tick.damage > 0) this.hp -= tick.damage;
    if (this.def.regen && this.hp > 0) this.hp = Math.min(this.maxHp, this.hp + this.def.regen * dt);
    if (this.hp <= 0) {
      this.alive = false;
      return;
    }
    // Enemy walks at TILE tiles/sec scaled; convert tiles/sec to px/sec.
    const pxPerSec = this.speed * 48 * this.status.speedFactor(this.isBoss);
    this.distance += pxPerSec * dt;
    this.pos = path.positionAt(this.distance);
    if (this.distance >= path.length) {
      this.reachedEnd = true;
      this.alive = false;
    }
  }
}

import type { WavePlan } from "../types";
import { getEnemy } from "../data/enemies";
import { Enemy } from "./enemy";
import type { PathGeometry } from "./path";

// Emits enemies from a WavePlan as their scheduled delays elapse.
export class Spawner {
  private plan: WavePlan | null = null;
  private elapsed = 0;
  private index = 0;

  start(plan: WavePlan): void {
    this.plan = plan;
    this.elapsed = 0;
    this.index = 0;
  }

  get active(): boolean {
    return this.plan !== null && this.index < this.plan.spawns.length;
  }

  // Advance time and return enemies that spawn during this tick.
  update(dt: number, path: PathGeometry): Enemy[] {
    if (!this.plan) return [];
    this.elapsed += dt;
    const out: Enemy[] = [];
    while (this.index < this.plan.spawns.length && this.plan.spawns[this.index]!.delay <= this.elapsed) {
      const spawn = this.plan.spawns[this.index]!;
      out.push(new Enemy(getEnemy(spawn.enemyId), spawn.mods, path));
      this.index++;
    }
    return out;
  }
}

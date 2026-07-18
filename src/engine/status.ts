import type { StatusKind } from "../types";

// Active status effects on an enemy. Kept as a small map keyed by kind so a
// re-application refreshes rather than stacks.
export interface ActiveStatus {
  kind: StatusKind;
  remaining: number;
  magnitude: number;
}

export class StatusSet {
  private effects = new Map<StatusKind, ActiveStatus>();

  apply(kind: StatusKind, duration: number, magnitude: number): void {
    const existing = this.effects.get(kind);
    if (!existing || duration > existing.remaining || magnitude > existing.magnitude) {
      this.effects.set(kind, { kind, remaining: duration, magnitude });
    }
  }

  has(kind: StatusKind): boolean {
    return this.effects.has(kind);
  }

  get(kind: StatusKind): ActiveStatus | undefined {
    return this.effects.get(kind);
  }

  // Advance timers and return total DoT damage dealt this tick (poison + burn).
  tick(dt: number): number {
    let dot = 0;
    for (const [kind, eff] of this.effects) {
      if (kind === "poison" || kind === "burn") dot += eff.magnitude * dt;
      eff.remaining -= dt;
      if (eff.remaining <= 0) this.effects.delete(kind);
    }
    return dot;
  }

  // Multiplier applied to enemy speed from slow/stun.
  speedFactor(): number {
    if (this.effects.has("stun")) return 0;
    const slow = this.effects.get("slow");
    return slow ? 1 - slow.magnitude : 1;
  }

  // Armor is zeroed while armorBreak or curse is active.
  armorNegated(): boolean {
    return this.effects.has("armorBreak") || this.effects.has("curse");
  }
}

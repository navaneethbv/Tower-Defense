import type { StatusEventKind, StatusKind, TypeName } from "../types";

// Active status effects on an enemy. Kept as a small map keyed by kind so a
// re-application refreshes rather than stacks. Every timing rule here is
// deterministic: effects track their own elapsed time instead of rolling dice,
// so a fixed run seed always replays identically.
export interface ActiveStatus {
  kind: StatusKind;
  remaining: number;
  magnitude: number;
  elapsed: number;
}

export interface StatusTickResult {
  damage: number;
  events: StatusEventKind[];
}

// Effects that stop movement outright. Bosses get half duration so a status
// team can still control them without locking them down permanently.
const HARD_CONTROL = new Set<StatusKind>(["freeze", "sleep", "stun"]);
const PARALYSIS_PERIOD = 1.25;
const PARALYSIS_STOP = 0.18;
const CONFUSION_PERIOD = 1;
const CONFUSION_STOP = 0.15;
const TOXIC_CAP = 5;
const BOSS_TOXIC_CAP = 3;

export class StatusSet {
  private effects = new Map<StatusKind, ActiveStatus>();

  apply(kind: StatusKind, duration: number, magnitude: number, boss = false): void {
    const scaled = boss && HARD_CONTROL.has(kind) ? duration / 2 : duration;
    const safeDuration = Math.max(0, scaled);
    const existing = this.effects.get(kind);
    if (!existing) {
      this.effects.set(kind, { kind, remaining: safeDuration, magnitude, elapsed: 0 });
      return;
    }
    // Refresh rather than stack: keep whichever is stronger and whichever lasts
    // longer, independently. Elapsed time survives so toxic keeps ramping.
    existing.remaining = Math.max(existing.remaining, safeDuration);
    existing.magnitude = Math.max(existing.magnitude, magnitude);
  }

  has(kind: StatusKind): boolean {
    return this.effects.has(kind);
  }

  get(kind: StatusKind): ActiveStatus | undefined {
    return this.effects.get(kind);
  }

  active(): ActiveStatus[] {
    return [...this.effects.values()];
  }

  // Advance timers and report damage plus the discrete events that fired.
  tick(dt: number, boss = false): StatusTickResult {
    let damage = 0;
    const events: StatusEventKind[] = [];
    for (const [kind, eff] of this.effects) {
      const before = eff.elapsed;
      eff.elapsed += dt;
      if (kind === "burn" || kind === "poison") {
        damage += eff.magnitude * dt;
      } else if (kind === "toxic") {
        const cap = boss ? BOSS_TOXIC_CAP : TOXIC_CAP;
        damage += eff.magnitude * Math.min(1 + Math.floor(eff.elapsed), cap) * dt;
        events.push("toxic");
      } else if (kind === "confusion") {
        const pulses =
          Math.floor(eff.elapsed / CONFUSION_PERIOD) - Math.floor(before / CONFUSION_PERIOD);
        if (pulses > 0) {
          damage += eff.magnitude * pulses;
          events.push("confusion");
        }
      }
      eff.remaining -= dt;
      if (eff.remaining <= 0) {
        this.effects.delete(kind);
        events.push("recover");
      }
    }
    // Curse amplifies all status damage rather than dealing its own.
    const curse = this.effects.get("curse");
    if (curse) damage *= 1 + curse.magnitude;
    return { damage: Math.max(0, damage), events };
  }

  // Multiplier applied to enemy speed. Hard control wins, then the deterministic
  // paralysis and confusion interruption windows, then continuous slows.
  speedFactor(boss = false): number {
    for (const kind of HARD_CONTROL) if (this.effects.has(kind)) return 0;

    const paralysis = this.effects.get("paralysis");
    if (paralysis) {
      const stop = boss ? PARALYSIS_STOP / 2 : PARALYSIS_STOP;
      if (paralysis.elapsed % PARALYSIS_PERIOD < stop) return 0;
    }
    const confusion = this.effects.get("confusion");
    if (confusion) {
      const stop = boss ? CONFUSION_STOP / 2 : CONFUSION_STOP;
      if (confusion.elapsed % CONFUSION_PERIOD < stop) return 0;
    }

    let factor = 1;
    if (paralysis) factor *= 1 - paralysis.magnitude;
    const slow = this.effects.get("slow");
    if (slow) factor *= 1 - slow.magnitude;
    return Math.min(1, Math.max(0, factor));
  }

  // Resolved after a direct hit's damage lands: fire thaws, any hit wakes.
  afterDirectHit(attackType: TypeName): StatusEventKind[] {
    const events: StatusEventKind[] = [];
    if (attackType === "fire" && this.effects.delete("freeze")) events.push("thaw");
    if (this.effects.delete("sleep")) events.push("wake");
    return events;
  }

  // Armor is zeroed while armorBreak or curse is active.
  armorNegated(): boolean {
    return this.effects.has("armorBreak") || this.effects.has("curse");
  }
}

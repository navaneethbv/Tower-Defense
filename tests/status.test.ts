import { describe, expect, it } from "vitest";
import { StatusSet } from "../src/engine/status";

describe("StatusSet", () => {
  it("applies, tracks, and ticks status effects", () => {
    const status = new StatusSet();
    expect(status.has("slow")).toBe(false);
    expect(status.get("slow")).toBeUndefined();
    expect(status.speedFactor()).toBe(1.0);

    // Apply slow
    status.apply("slow", 2.0, 0.4);
    expect(status.has("slow")).toBe(true);
    expect(status.get("slow")).toMatchObject({ kind: "slow", remaining: 2.0, magnitude: 0.4 });
    expect(status.speedFactor()).toBe(0.6);

    // Re-applying with smaller duration/magnitude shouldn't overwrite
    status.apply("slow", 1.0, 0.2);
    expect(status.get("slow")?.remaining).toBe(2.0);
    expect(status.get("slow")?.magnitude).toBe(0.4);

    // Re-applying with larger duration/magnitude should overwrite
    status.apply("slow", 3.0, 0.5);
    expect(status.get("slow")?.remaining).toBe(3.0);
    expect(status.get("slow")?.magnitude).toBe(0.5);
    expect(status.speedFactor()).toBe(0.5);

    // Ticking advances time
    const dot = status.tick(1.0).damage;
    expect(dot).toBe(0); // slow has no DoT
    expect(status.get("slow")?.remaining).toBe(2.0);

    // Ticking past duration removes slow
    status.tick(2.1);
    expect(status.has("slow")).toBe(false);
    expect(status.speedFactor()).toBe(1.0);
  });

  it("applies DoT for poison and burn, and handles stun speed override", () => {
    const status = new StatusSet();

    // Poison deals DoT
    status.apply("poison", 3.0, 10); // 10 dps
    const dot = status.tick(0.5).damage;
    expect(dot).toBe(5); // 10 * 0.5

    // Stun forces speed factor to 0
    status.apply("stun", 1.0, 1.0);
    expect(status.speedFactor()).toBe(0);

    // Tick past stun duration
    status.tick(1.1);
    expect(status.has("stun")).toBe(false);
    expect(status.speedFactor()).toBe(1.0); // speed factor returns to normal
  });
});

describe("expanded status lifecycles", () => {
  it("applies burn, poison, toxic growth, and curse status amplification", () => {
    const steady = new StatusSet();
    steady.apply("burn", 3, 4);
    steady.apply("poison", 2, 6);
    expect(steady.tick(1).damage).toBe(10);

    const toxic = new StatusSet();
    toxic.apply("toxic", 5, 3);
    expect(toxic.tick(1).damage).toBe(6);
    expect(toxic.tick(1).damage).toBe(9);

    const cursed = new StatusSet();
    cursed.apply("curse", 2, 0.35);
    cursed.apply("burn", 2, 10);
    expect(cursed.tick(1).damage).toBeCloseTo(13.5);
  });

  it("implements deterministic paralysis, freeze, sleep, and confusion", () => {
    const status = new StatusSet();
    status.apply("paralysis", 3, 0.5);
    expect(status.speedFactor()).toBe(0);
    status.tick(0.2);
    expect(status.speedFactor()).toBe(0.5);
    status.apply("freeze", 2, 1);
    expect(status.speedFactor()).toBe(0);
    expect(status.afterDirectHit("fire")).toContain("thaw");
    status.apply("sleep", 3, 1);
    expect(status.afterDirectHit("water")).toContain("wake");
    status.apply("confusion", 3, 5);
    expect(status.tick(1).damage).toBe(5);
  });

  it("halves boss hard-control duration and caps boss toxic growth", () => {
    const status = new StatusSet();
    status.apply("freeze", 4, 1, true);
    expect(status.get("freeze")?.remaining).toBe(2);
    status.apply("toxic", 20, 10, true);
    for (let second = 0; second < 10; second++) {
      expect(status.tick(1, true).damage).toBeLessThanOrEqual(30);
    }
  });
});

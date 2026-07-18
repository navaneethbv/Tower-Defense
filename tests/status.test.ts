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
    expect(status.get("slow")).toEqual({ kind: "slow", remaining: 2.0, magnitude: 0.4 });
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
    const dot = status.tick(1.0);
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
    let dot = status.tick(0.5);
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

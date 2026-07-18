import { describe, expect, it } from "vitest";
import { playSound } from "../src/ui/audio";

describe("audio", () => {
  it("is safe in environments without Web Audio", () => {
    expect(() => playSound("deploy", false)).not.toThrow();
  });

  it("does nothing while muted", () => {
    expect(() => playSound("boss", true)).not.toThrow();
  });
});

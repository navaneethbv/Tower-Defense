import { describe, expect, it } from "vitest";
import { advanceAutoWaveTimer } from "../src/engine/autoWave";

describe("auto wave timer", () => {
  it("starts only after the delay while building with a deployed tower", () => {
    expect(advanceAutoWaveTimer(0.75, 0.5, true, true, true)).toEqual({ delay: 0.25, start: false });
    expect(advanceAutoWaveTimer(0.25, 0.3, true, true, true)).toEqual({ delay: 0.75, start: true });
  });

  it("resets while disabled, in combat, or before the first deployment", () => {
    expect(advanceAutoWaveTimer(0.1, 1, false, true, true)).toEqual({ delay: 0.75, start: false });
    expect(advanceAutoWaveTimer(0.1, 1, true, false, true)).toEqual({ delay: 0.75, start: false });
    expect(advanceAutoWaveTimer(0.1, 1, true, true, false)).toEqual({ delay: 0.75, start: false });
  });
});

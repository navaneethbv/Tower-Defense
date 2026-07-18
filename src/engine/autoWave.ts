const AUTO_WAVE_DELAY = 0.75;

export interface AutoWaveTick {
  delay: number;
  start: boolean;
}

export function advanceAutoWaveTimer(
  delay: number,
  dt: number,
  enabled: boolean,
  building: boolean,
  hasTowers: boolean,
): AutoWaveTick {
  if (!enabled || !building || !hasTowers) return { delay: AUTO_WAVE_DELAY, start: false };
  const nextDelay = delay - dt;
  return nextDelay <= 0
    ? { delay: AUTO_WAVE_DELAY, start: true }
    : { delay: nextDelay, start: false };
}

// Seeded, deterministic PRNG (mulberry32). Reproducible waves per run seed.
export interface Rng {
  next(): number; // [0, 1)
  int(minInclusive: number, maxInclusive: number): number;
  pick<T>(items: readonly T[]): T;
}

export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = (): number => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (items) => {
      if (items.length === 0) throw new Error("pick from empty array");
      return items[Math.floor(next() * items.length)]!;
    },
  };
}

// Combine a run seed with a wave number and salt into a stable per-wave seed.
export function waveSeed(runSeed: number, waveNumber: number, salt: number): number {
  return (Math.imul(runSeed ^ salt, 0x9e3779b1) ^ Math.imul(waveNumber, 0x85ebca77)) >>> 0;
}

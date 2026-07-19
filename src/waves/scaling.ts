import type { EnemyDef, WaveGenParams } from "../types";

// Pure scaling formulas for a 50+ wave run. All tuning knobs live here so the
// balance sim (Phase 6) can sweep them without touching engine code.

export const COUNT_CAP = 40;

export function actForWave(waveNumber: number): 1 | 2 | 3 | 4 {
  return Math.min(4, Math.max(1, Math.ceil(waveNumber / 25))) as 1 | 2 | 3 | 4;
}

// Power-law HP growth: steep in the early waves (so a lone tower is quickly
// overwhelmed) but sub-exponential later (so a full, upgraded team can still
// clear wave 50). `hpGrowth` is the power exponent; `hpBase`/30 scales it.
export function waveHpMultiplier(params: WaveGenParams, waveNumber: number): number {
  const act = actForWave(waveNumber);
  const actStart = (act - 1) * 25 + 1;
  const actPressure = 1 + (act - 1) * 0.04 + (waveNumber - actStart) * 0.001;
  const lateGameRelief = 1 / (1 + 0.055 * Math.max(0, waveNumber - 10));
  
  // Scale enemy HP exponentially beyond wave 35 to provide end-game challenge for level 100 Pokemon
  const waveScaling = waveNumber <= 35 ? 1 : Math.pow(1.025, waveNumber - 35);

  return (
    (params.hpBase / 30) *
    Math.pow(waveNumber, params.hpGrowth) *
    lateGameRelief *
    actPressure *
    waveScaling
  );
}

export function enemyHp(def: EnemyDef, params: WaveGenParams, waveNumber: number): number {
  let hp = def.hp * waveHpMultiplier(params, waveNumber);
  const uncapped = Math.round(params.baseCount + params.countGrowth * waveNumber);
  if (uncapped > COUNT_CAP) {
    // Surplus count converts into extra HP so entity counts stay sane.
    hp *= 1 + 0.02 * (uncapped - COUNT_CAP);
  }
  return Math.round(hp);
}

export function waveCount(params: WaveGenParams, waveNumber: number): number {
  return Math.min(COUNT_CAP, Math.round(params.baseCount + params.countGrowth * waveNumber));
}

export function enemySpeed(def: EnemyDef, waveNumber: number): number {
  return def.speed * Math.min(1.5, 1 + 0.009 * waveNumber);
}

export function enemyArmor(def: EnemyDef, waveNumber: number): number {
  const earlyArmor = Math.floor(Math.min(waveNumber, 50) / 12);
  const lateArmor = Math.floor(Math.max(0, waveNumber - 50) / 20);
  return def.armor + earlyArmor + lateArmor;
}

export function enemyReward(def: EnemyDef, waveNumber: number): number {
  return Math.round(def.reward * (1 + 0.05 * waveNumber));
}

export function spawnInterval(params: WaveGenParams, waveNumber: number): number {
  return params.spawnInterval * Math.max(0.45, 1 - 0.012 * waveNumber);
}

export function waveClearBonus(waveNumber: number): number {
  return 25 + 6 * waveNumber;
}

export function isBossWave(waveNumber: number): boolean {
  return waveNumber % 10 === 0;
}

export function isSwarmWave(waveNumber: number): boolean {
  return waveNumber % 5 === 0 && !isBossWave(waveNumber);
}

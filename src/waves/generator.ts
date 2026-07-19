import type { EnemyDef, MapConfig, WaveGenParams, WavePlan, WaveSpawn, EnemyStatMods } from "../types";
import { getEnemy } from "../data/enemies";
import { makeRng, waveSeed, type Rng } from "./rng";
import {
  enemyHp,
  enemyArmor,
  enemyReward,
  enemySpeed,
  waveCount,
  spawnInterval,
  waveClearBonus,
  isBossWave,
  isSwarmWave,
} from "./scaling";
import { milestoneFor } from "./milestones";

function statMods(def: EnemyDef, params: WaveGenParams, n: number, extraHp = 1, boss = false): EnemyStatMods {
  return {
    hp: enemyHp(def, params, n) * extraHp,
    speed: enemySpeed(def, n),
    armor: enemyArmor(def, n) + (boss ? 4 : 0),
    reward: enemyReward(def, n) * (boss ? 15 : 1),
    heartDamage: boss ? 5 : 1,
    boss,
  };
}

// Enemy archetypes available at this wave, biased toward recently unlocked ones.
function activePool(params: WaveGenParams, n: number): { enemyId: string; weight: number }[] {
  return params.enemyPool
    .filter((e) => e.minWave <= n)
    .map((e) => ({
      enemyId: e.enemyId,
      weight: e.weight * (n - e.minWave < 5 ? 1.5 : 1),
    }));
}

function weightedPick(pool: { enemyId: string; weight: number }[], rng: Rng): string {
  const total = pool.reduce((s, e) => s + e.weight, 0);
  let r = rng.next() * total;
  for (const e of pool) {
    r -= e.weight;
    if (r <= 0) return e.enemyId;
  }
  return pool[pool.length - 1]!.enemyId;
}

export function generateWave(map: MapConfig, n: number, runSeed: number): WavePlan {
  const params = map.waveGen;
  const rng = makeRng(waveSeed(runSeed, n, params.seedSalt));
  const interval = spawnInterval(params, n);
  const spawns: WaveSpawn[] = [];
  const milestone = milestoneFor(map, n, runSeed);

  if (milestone) {
    const escortCount = Math.min(12, Math.round(waveCount(params, n) * 0.3));
    const escortId = weightedPick(activePool(params, n), rng);
    const escort = getEnemy(escortId);
    for (let i = 0; i < escortCount; i++) {
      spawns.push({ enemyId: escortId, delay: i * interval, mods: statMods(escort, params, n) });
    }
    const boss = getEnemy(milestone.speciesId);
    spawns.push({
      enemyId: milestone.speciesId,
      delay: escortCount * interval + 1.5,
      mods: statMods(boss, params, n, n === 100 ? 4 : 3.25, true),
    });
  } else if (isBossWave(n)) {
    // Escort swarm (60% of a normal wave) then the boss.
    const escortCount = Math.round(waveCount(params, n) * 0.6);
    const escortId = weightedPick(activePool(params, n), rng);
    const escort = getEnemy(escortId);
    for (let i = 0; i < escortCount; i++) {
      spawns.push({ enemyId: escortId, delay: i * interval, mods: statMods(escort, params, n) });
    }
    const bossEntry = [...params.bossPool].filter((b) => b.minWave <= n).pop() ?? params.bossPool[0]!;
    const boss = getEnemy(bossEntry.enemyId);
    spawns.push({
      enemyId: bossEntry.enemyId,
      delay: escortCount * interval + 1.5,
      mods: statMods(boss, params, n, n <= 20 ? 3.5 : 2, true),
    });
  } else if (isSwarmWave(n)) {
    // Single-archetype swarm: more, weaker enemies.
    const id = weightedPick(activePool(params, n), rng);
    const def = getEnemy(id);
    const count = Math.round(waveCount(params, n) * 1.25);
    for (let i = 0; i < count; i++) {
      spawns.push({ enemyId: id, delay: i * interval, mods: statMods(def, params, n, 0.75) });
    }
  } else {
    // Mixed wave: 1-3 archetypes interleaved.
    const pool = activePool(params, n);
    const kinds = Math.min(pool.length, 1 + rng.int(0, 2));
    const chosen: string[] = [];
    for (let k = 0; k < kinds; k++) chosen.push(weightedPick(pool, rng));
    const count = waveCount(params, n);
    for (let i = 0; i < count; i++) {
      const id = chosen[i % chosen.length]!;
      spawns.push({ enemyId: id, delay: i * interval, mods: statMods(getEnemy(id), params, n) });
    }
  }

  spawns.sort((a, b) => a.delay - b.delay);
  return {
    waveNumber: n,
    isBoss: Boolean(milestone) || isBossWave(n),
    spawns,
    goldReward: Math.round(waveClearBonus(n) * Math.sqrt(map.rewardMultiplier)),
    milestone,
  };
}

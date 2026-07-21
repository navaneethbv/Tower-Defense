import type { MapConfig, MilestoneTier, WavePlan } from "../types";
import { getEnemy } from "../data/enemies";
import { generateWave } from "../waves/generator";
import { spriteUrl } from "../data/constants";

export interface PreviewEntry {
  enemyId: string;
  name: string;
  sprite: string;
  count: number;
  /** Highest HP this archetype arrives with, so a buffed variant is visible. */
  hp: number;
  armor: number;
  boss: boolean;
  /** Only reachable by ghost, psychic, or super-effective attacks. */
  spectral: boolean;
  regen: number;
}

export interface WavePreview {
  waveNumber: number;
  isBoss: boolean;
  totalEnemies: number;
  goldReward: number;
  milestoneTier: MilestoneTier | null;
  entries: PreviewEntry[];
  /** Threats the player cannot damage without the right coverage. */
  warnings: string[];
}

/**
 * Groups an upcoming wave into one row per enemy archetype.
 *
 * Wave generation is deterministic for a run seed, so the composition shown
 * here is exactly what will spawn. Ordered by count so the bulk of the wave
 * reads first, with bosses forced to the top.
 */
export function summarizeWave(plan: WavePlan): WavePreview {
  const byEnemy = new Map<string, PreviewEntry>();

  for (const spawn of plan.spawns) {
    const def = getEnemy(spawn.enemyId);
    const existing = byEnemy.get(spawn.enemyId);
    if (existing) {
      existing.count += 1;
      existing.hp = Math.max(existing.hp, Math.round(spawn.mods.hp));
      existing.armor = Math.max(existing.armor, spawn.mods.armor);
      existing.boss ||= spawn.mods.boss;
      continue;
    }
    byEnemy.set(spawn.enemyId, {
      enemyId: spawn.enemyId,
      name: def.name,
      sprite: spriteUrl(def.dex),
      count: 1,
      hp: Math.round(spawn.mods.hp),
      armor: spawn.mods.armor,
      boss: spawn.mods.boss,
      spectral: def.spectral === true,
      regen: def.regen ?? 0,
    });
  }

  const entries = [...byEnemy.values()].sort(
    (a, b) => Number(b.boss) - Number(a.boss) || b.count - a.count || a.name.localeCompare(b.name),
  );

  const warnings: string[] = [];
  if (entries.some((entry) => entry.spectral)) {
    warnings.push("Spectral: only ghost, psychic, or super-effective attacks connect.");
  }
  if (entries.some((entry) => entry.regen > 0)) {
    warnings.push("Regenerating: sustained damage needed to out-pace healing.");
  }
  if (entries.some((entry) => entry.armor >= 8)) {
    warnings.push("Heavily armored: flat damage is blunted.");
  }

  return {
    waveNumber: plan.waveNumber,
    isBoss: plan.isBoss,
    totalEnemies: plan.spawns.length,
    goldReward: plan.goldReward,
    milestoneTier: plan.milestone?.tier ?? null,
    entries,
    warnings,
  };
}

/** Convenience wrapper: summarize the wave that the given run is about to face. */
export function previewNextWave(
  map: MapConfig,
  clearedWaves: number,
  runSeed: number,
): WavePreview | null {
  const next = clearedWaves + 1;
  if (next > map.totalWaves) return null;
  return summarizeWave(generateWave(map, next, runSeed));
}

export function wavePreviewHtml(preview: WavePreview): string {
  const badge = preview.milestoneTier
    ? `<span class="wave-badge tier-${preview.milestoneTier}">${preview.milestoneTier}</span>`
    : preview.isBoss
      ? `<span class="wave-badge boss">Boss</span>`
      : "";

  const rows = preview.entries
    .map(
      (entry) => `
      <li class="wave-row${entry.boss ? " boss" : ""}">
        <img src="${entry.sprite}" alt="" loading="lazy" />
        <span class="wave-name">${entry.name}</span>
        <span class="wave-count">x${entry.count}</span>
        <span class="wave-stat" title="Health">${entry.hp}</span>
        <span class="wave-stat" title="Armor">${entry.armor > 0 ? `+${entry.armor}` : "-"}</span>
      </li>`,
    )
    .join("");

  const warnings = preview.warnings
    .map((text) => `<li class="wave-warning">${text}</li>`)
    .join("");

  return `
    <div class="wave-preview-head">
      <h4>Next: Wave ${preview.waveNumber}</h4>
      ${badge}
      <span class="muted">${preview.totalEnemies} foes</span>
    </div>
    <div class="wave-row wave-head" aria-hidden="true">
      <span></span><span>Foe</span><span>Qty</span><span>HP</span><span>Arm</span>
    </div>
    <ul class="wave-list">${rows}</ul>
    ${warnings ? `<ul class="wave-warnings">${warnings}</ul>` : ""}
  `;
}

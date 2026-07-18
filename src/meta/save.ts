import type { MilestoneCaptureRecord, SaveGame } from "../types";
import { STARTER_POKECOINS } from "../data/constants";

const KEY = "ptd.save";
export const CURRENT_VERSION = 3;
const CAPTURE_MILESTONES = [25, 50, 75, 100] as const;

export function freshSave(): SaveGame {
  const now = Date.now();
  return {
    version: CURRENT_VERSION,
    createdAt: now,
    updatedAt: now,
    pokeCoins: 0,
    starterChosen: null,
    collection: [],
    eggs: [],
    team: [null, null, null, null, null, null],
    bestWaveByMap: {},
    eggDropsClaimedByMap: {},
    milestoneCapturesByMap: {},
    settings: { speed: 1, muted: false, autoWave: false, particles: true },
    stats: {
      runs: 0,
      totalWavesCleared: 0,
      hatches: 0,
      bossesDefeated: 0,
      victories: 0,
    },
    achievements: [],
  };
}

// Bring a save written by an older version up to CURRENT_VERSION. Each step
// transforms v(n) -> v(n+1). New fields get sensible defaults here.
function migrate(raw: Record<string, unknown>): SaveGame {
  const base = freshSave();
  const rawSettings = asRecord(raw.settings);
  const rawStats = asRecord(raw.stats);
  const rawVersion = typeof raw.version === "number" ? raw.version : 0;
  const merged = {
    ...base,
    ...raw,
    settings: { ...base.settings, ...rawSettings },
    stats: { ...base.stats, ...rawStats },
    achievements: Array.isArray(raw.achievements)
      ? raw.achievements.filter((value): value is string => typeof value === "string")
      : [],
    eggDropsClaimedByMap: asNumberRecord(raw.eggDropsClaimedByMap),
    milestoneCapturesByMap: asCaptureRecord(raw.milestoneCapturesByMap),
  } as SaveGame;
  if (rawVersion < 3) {
    for (const [mapId, bestWave] of Object.entries(asNumberRecord(raw.bestWaveByMap))) {
      const claimed = merged.milestoneCapturesByMap[mapId] ?? {};
      for (const milestone of CAPTURE_MILESTONES) {
        if (bestWave >= milestone) claimed[milestone] = true;
      }
      if (Object.keys(claimed).length > 0) merged.milestoneCapturesByMap[mapId] = claimed;
    }
  }
  merged.version = CURRENT_VERSION;
  return merged;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function asNumberRecord(value: unknown): Record<string, number> {
  return Object.fromEntries(
    Object.entries(asRecord(value)).filter((entry): entry is [string, number] =>
      typeof entry[1] === "number",
    ),
  );
}

function asCaptureRecord(value: unknown): MilestoneCaptureRecord {
  const record: MilestoneCaptureRecord = {};
  for (const [mapId, rawMilestones] of Object.entries(asRecord(value))) {
    const milestones = asRecord(rawMilestones);
    const claimed: Partial<Record<25 | 50 | 75 | 100, boolean>> = {};
    for (const milestone of CAPTURE_MILESTONES) {
      if (milestones[String(milestone)] === true) claimed[milestone] = true;
    }
    if (Object.keys(claimed).length > 0) record[mapId] = claimed;
  }
  return record;
}

export function loadSave(): SaveGame {
  try {
    const text = localStorage.getItem(KEY);
    if (!text) return freshSave();
    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (typeof parsed !== "object" || parsed === null) return freshSave();
    return migrate(parsed);
  } catch {
    // Corrupt or unreadable save: start fresh rather than crash.
    return freshSave();
  }
}

export function saveSave(save: SaveGame): void {
  save.updatedAt = Date.now();
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // Storage full or blocked (private mode). Progress stays in memory.
  }
}

export function resetSave(): SaveGame {
  const s = freshSave();
  saveSave(s);
  return s;
}

// Grant the starter pick and starting currency exactly once.
export function chooseStarter(save: SaveGame, ownedUid: string, speciesId: string): void {
  save.starterChosen = speciesId;
  save.pokeCoins += STARTER_POKECOINS;
  save.team[0] = ownedUid;
}

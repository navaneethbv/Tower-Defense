import type { SaveGame } from "../types";
import { STARTER_POKECOINS } from "../data/constants";

const KEY = "ptd.save";
export const CURRENT_VERSION = 2;

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
  const merged = {
    ...base,
    ...raw,
    settings: { ...base.settings, ...rawSettings },
    stats: { ...base.stats, ...rawStats },
    achievements: Array.isArray(raw.achievements)
      ? raw.achievements.filter((value): value is string => typeof value === "string")
      : [],
  } as SaveGame;
  merged.version = CURRENT_VERSION;
  return merged;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
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

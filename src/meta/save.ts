import type { SaveGame } from "../types";
import { STARTER_POKECOINS } from "../data/constants";

const KEY = "ptd.save";
export const CURRENT_VERSION = 1;

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
    settings: { speed: 1, muted: false },
    stats: { runs: 0, totalWavesCleared: 0, hatches: 0 },
  };
}

// Bring a save written by an older version up to CURRENT_VERSION. Each step
// transforms v(n) -> v(n+1). New fields get sensible defaults here.
function migrate(raw: Record<string, unknown>): SaveGame {
  const base = freshSave();
  const merged = { ...base, ...raw } as SaveGame;
  // Future migrations dispatch on merged.version here.
  merged.version = CURRENT_VERSION;
  return merged;
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

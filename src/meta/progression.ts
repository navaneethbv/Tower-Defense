import type { MapConfig, SaveGame } from "../types";

// Deploy slots are derived from wave progress, never stored, so there is no
// migration hazard and the rules can change freely.
export function unlockedSlots(save: SaveGame): number {
  const best = save.bestWaveByMap;
  const bestAnywhere = Math.max(0, ...Object.values(best));
  const mapsClearedTo40 = Object.values(best).filter((w) => w >= 40).length;
  const clearedAnyMap = Object.values(best).some((w) => w >= 50);
  const clearedFinal = (best["indigo_plateau"] ?? 0) >= 100;

  let slots = 6;
  if (bestAnywhere >= 40) slots = 7;
  if (clearedAnyMap) slots = 8;
  if (mapsClearedTo40 >= 3) slots = Math.max(slots, 9);
  if (clearedFinal) slots = 10;
  return slots;
}

// Describes the next slot unlock for UI hints.
export function nextSlotHint(save: SaveGame): string | null {
  const slots = unlockedSlots(save);
  switch (slots) {
    case 6:
      return "Reach wave 40 on any map to unlock a 7th slot.";
    case 7:
      return "Clear wave 50 on any map to unlock an 8th slot.";
    case 8:
      return "Reach wave 40 on 3 maps to unlock a 9th slot.";
    case 9:
      return "Clear the Indigo Plateau to unlock a 10th slot.";
    default:
      return null;
  }
}

export function isMapUnlocked(save: SaveGame, map: MapConfig): boolean {
  const req = map.unlockRequirement;
  if (!req) return true;
  return (save.bestWaveByMap[req.mapId] ?? 0) >= req.wave;
}

import type { CombatProfile, StatusApplication, TypeName } from "../types";
import { STARTER_IDS } from "./starters";

// Starter-specific combat exceptions. Every approved first choice needs a legible
// identity under the same opening economy, so starters are always `balanced`:
// they keep full direct damage and get a modest, readable status instead of the
// specialist tradeoff the wider roster uses.
export interface StarterKit {
  combatProfile: CombatProfile;
  onHitStatus: StatusApplication;
}

const SLOW: StatusApplication = { kind: "slow", chance: 0.3, duration: 1.8, magnitude: 0.28 };
const BURN: StatusApplication = { kind: "burn", chance: 0.26, duration: 2.5, magnitude: 4 };
const CONFUSION: StatusApplication = { kind: "confusion", chance: 0.2, duration: 2.5, magnitude: 4 };
const PARALYSIS: StatusApplication = { kind: "paralysis", chance: 0.18, duration: 1.8, magnitude: 0.5 };

// Gen 1 starters ship hand-tuned curated definitions and are left untouched.
const PRESERVED = new Set(["bulbasaur", "charmander", "squirtle"]);

// Recognizable exceptions to the plain type default.
const BY_SPECIES: Record<string, StatusApplication> = {
  rowlet: CONFUSION,
  froakie: SLOW,
  pikachu: PARALYSIS,
};

const BY_TYPE: Partial<Record<TypeName, StatusApplication>> = {
  grass: SLOW,
  water: SLOW,
  fire: BURN,
};

const STARTERS = new Set<string>(STARTER_IDS);

export function starterKit(id: string, attackType: TypeName): StarterKit | undefined {
  if (!STARTERS.has(id) || PRESERVED.has(id)) return undefined;
  const onHitStatus = BY_SPECIES[id] ?? BY_TYPE[attackType];
  if (!onHitStatus) return undefined;
  return { combatProfile: "balanced", onHitStatus: { ...onHitStatus } };
}

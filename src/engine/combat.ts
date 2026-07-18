import type { TypeName } from "../types";
import { getEffectiveness } from "../data/typeChart";
import type { Enemy } from "./enemy";

export interface DamageResult {
  dealt: number;
  effectiveness: number;
  killed: boolean;
}

// Resolve a single hit: type effectiveness, then armor mitigation.
// `flatDamage` already includes tower level, IVs, and favored-terrain bonuses.
export function resolveHit(enemy: Enemy, attackType: TypeName, flatDamage: number): DamageResult {
  const effectiveness = getEffectiveness(attackType, enemy.def.types);
  const afterType = flatDamage * effectiveness;
  const armor = enemy.effectiveArmor();
  const dealt = Math.max(effectiveness > 0 ? 1 : 0, afterType - armor);
  enemy.hp -= dealt;
  const killed = enemy.hp <= 0 && enemy.alive;
  if (killed) enemy.alive = false;
  return { dealt, effectiveness, killed };
}

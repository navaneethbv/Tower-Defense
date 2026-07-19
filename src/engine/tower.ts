import type { IVs, SpeciesDef, TargetingMode } from "../types";
import { getSpecies, selectEvolution } from "../data/species";
import { TILE, RANGE_SCALE } from "../data/constants";
import type { Point } from "./path";

const MAX_LEVEL = 100;

export function xpToNext(level: number): number {
  return 6 + level * 4;
}

// A placed tower. Wraps a species that can evolve in-run, applies IV and
// level scaling, and tracks cooldown / targeting.
export class Tower {
  species: SpeciesDef;
  readonly ownerUid: string;
  readonly ivs: IVs;
  favored: boolean;
  readonly persistentDamageBonus: number;
  col: number;
  row: number;
  pos: Point;
  level = 1;
  xp = 0;
  runXp = 0;
  goldLevels = 0;
  cooldownLeft = 0;
  abilityCooldownLeft = 0;
  redeployCooldownLeft = 0;
  targeting: TargetingMode = "first";
  totalInvested: number;

  constructor(
    ownerUid: string,
    speciesId: string,
    ivs: IVs,
    col: number,
    row: number,
    favored: boolean,
    persistentDamageBonus = 0,
    startingLevel = 1,
  ) {
    this.species = getSpecies(speciesId);
    this.ownerUid = ownerUid;
    this.ivs = ivs;
    this.favored = favored;
    this.persistentDamageBonus = persistentDamageBonus;
    this.col = col;
    this.row = row;
    this.pos = { x: (col + 0.5) * TILE, y: (row + 0.5) * TILE };
    this.level = startingLevel;
    this.totalInvested = this.species.base.cost;
  }

  // Mid-run redeployment: relocate in place so all progression state survives.
  moveTo(col: number, row: number, favored: boolean): void {
    this.col = col;
    this.row = row;
    this.pos = { x: (col + 0.5) * TILE, y: (row + 0.5) * TILE };
    this.favored = favored;
  }


  damage(): number {
    const b = this.species.base.damage;
    const lvl = Math.pow(this.level, 0.48);
    const iv = 1 + this.ivs.damage / 100;
    const fav = this.favored ? 1.25 : 1;
    return b * lvl * iv * fav * (1 + this.persistentDamageBonus);
  }

  rangePx(): number {
    const b = this.species.base.range;
    const lvl = Math.pow(this.level, 0.25);
    const iv = 1 + this.ivs.range / 100;
    const fav = this.favored ? 1.25 : 1;
    return b * lvl * iv * fav * TILE * RANGE_SCALE;
  }

  cooldown(): number {
    const b = this.species.base.cooldown;
    const iv = 1 + this.ivs.attackSpeed / 100;
    return (b * Math.pow(0.97, Math.pow(this.level - 1, 0.7))) / iv;
  }

  atMaxLevel(): boolean {
    return this.level >= MAX_LEVEL;
  }

  // Buy a single level with gold. Returns true if it triggered an evolution.
  levelUp(): boolean {
    if (this.level >= MAX_LEVEL) return false;
    this.level++;
    this.goldLevels++;
    const evo = selectEvolution(this.species, this.ownerUid);
    if (evo && this.level >= evo.atLevel) {
      this.species = getSpecies(evo.speciesId);
      return true;
    }
    return false;
  }

  // Grant XP; returns true if the tower evolved this grant.
  gainXp(amount: number): boolean {
    this.runXp += amount;
    // Level up via money only. Not kills.
    return false;
  }
}

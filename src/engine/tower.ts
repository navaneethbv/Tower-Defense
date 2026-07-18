import type { IVs, SpeciesDef, TargetingMode } from "../types";
import { getSpecies, selectEvolution } from "../data/species";
import { TILE, RANGE_SCALE } from "../data/constants";
import type { Point } from "./path";

const MAX_LEVEL = 15;

export function xpToNext(level: number): number {
  return 6 + level * 4;
}

// A placed tower. Wraps a species that can evolve in-run, applies IV and
// level scaling, and tracks cooldown / targeting.
export class Tower {
  species: SpeciesDef;
  readonly ownerUid: string;
  readonly ivs: IVs;
  readonly favored: boolean;
  readonly persistentDamageBonus: number;
  readonly col: number;
  readonly row: number;
  readonly pos: Point;
  level = 1;
  xp = 0;
  runXp = 0;
  goldLevels = 0;
  cooldownLeft = 0;
  abilityCooldownLeft = 0;
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
  ) {
    this.species = getSpecies(speciesId);
    this.ownerUid = ownerUid;
    this.ivs = ivs;
    this.favored = favored;
    this.persistentDamageBonus = persistentDamageBonus;
    this.col = col;
    this.row = row;
    this.pos = { x: (col + 0.5) * TILE, y: (row + 0.5) * TILE };
    this.totalInvested = this.species.base.cost;
  }

  private levelFactor(exp: number): number {
    return Math.pow(exp, this.level - 1);
  }

  damage(): number {
    const b = this.species.base.damage;
    const lvl = 1 + (this.level - 1) * 0.22;
    const iv = 1 + this.ivs.damage / 100;
    const fav = this.favored ? 1.25 : 1;
    return b * lvl * iv * fav * (1 + this.persistentDamageBonus);
  }

  rangePx(): number {
    const b = this.species.base.range;
    const lvl = 1 + (this.level - 1) * 0.08;
    const iv = 1 + this.ivs.range / 100;
    const fav = this.favored ? 1.25 : 1;
    return b * lvl * iv * fav * TILE * RANGE_SCALE;
  }

  cooldown(): number {
    const b = this.species.base.cooldown;
    const iv = 1 + this.ivs.attackSpeed / 100;
    return (b * this.levelFactor(0.97)) / iv;
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
    if (this.level >= MAX_LEVEL) return false;
    this.xp += amount;
    let evolved = false;
    while (this.level < MAX_LEVEL && this.xp >= xpToNext(this.level)) {
      this.xp -= xpToNext(this.level);
      this.level++;
      const evo = selectEvolution(this.species, this.ownerUid);
      if (evo && this.level >= evo.atLevel) {
        this.species = getSpecies(evo.speciesId);
        evolved = true;
      }
    }
    return evolved;
  }
}

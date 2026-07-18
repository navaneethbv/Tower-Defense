import type { MapConfig, OwnedPokemon, TargetingMode } from "../types";
import { getSpecies } from "../data/species";
import { STARTING_GOLD, STARTING_LIVES } from "../data/constants";
import { generateWave } from "../waves/generator";
import { PathGeometry, tileKey } from "./path";
import { Enemy } from "./enemy";
import { Tower } from "./tower";
import { Projectile } from "./projectiles";
import { Spawner } from "./spawner";
import { chooseTarget, canHit } from "./targeting";
import { resolveHit } from "./combat";
import { getEffectiveness } from "../data/typeChart";
import { executeAbility, type AbilityActivationResult } from "./abilities";

export type RunPhase = "building" | "wave" | "won" | "lost";

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

export interface GameEvents {
  onWaveCleared?: (wave: number) => void;
  onGameOver?: (won: boolean, wavesCleared: number) => void;
  onChange?: () => void;
}

export interface PlacementError {
  ok: false;
  reason: string;
}
export type PlacementResult = { ok: true; tower: Tower } | PlacementError;

// Owns all mutable run state and advances the simulation one dt at a time.
export class GameSession {
  readonly map: MapConfig;
  readonly path: PathGeometry;
  readonly runSeed: number;
  readonly team: OwnedPokemon[];

  gold = STARTING_GOLD;
  lives = STARTING_LIVES;
  waveNumber = 0;
  bossKills = 0;
  phase: RunPhase = "building";

  towers: Tower[] = [];
  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];
  floating: FloatingText[] = [];

  private spawner = new Spawner();
  private placedUids = new Set<string>();
  private events: GameEvents;

  constructor(map: MapConfig, team: OwnedPokemon[], runSeed: number, events: GameEvents = {}) {
    this.map = map;
    this.path = new PathGeometry(map);
    this.team = team;
    this.runSeed = runSeed;
    this.events = events;
  }

  private terrainAt(col: number, row: number) {
    return this.map.terrain[row]?.[col] ?? "grass";
  }

  isPlaced(uid: string): boolean {
    return this.placedUids.has(uid);
  }

  towerAt(col: number, row: number): Tower | undefined {
    return this.towers.find((t) => t.col === col && t.row === row);
  }

  canPlace(uid: string, col: number, row: number): PlacementResult | PlacementError {
    if (this.placedUids.has(uid)) return { ok: false, reason: "Already deployed" };
    const member = this.team.find((m) => m.uid === uid);
    if (!member) return { ok: false, reason: "Not on team" };
    if (col < 0 || col >= this.map.cols || row < 0 || row >= this.map.rows)
      return { ok: false, reason: "Out of bounds" };
    if (this.path.blockedTiles.has(tileKey(col, row))) return { ok: false, reason: "On the path" };
    if (this.towerAt(col, row)) return { ok: false, reason: "Tile occupied" };
    const species = getSpecies(member.speciesId);
    const terrain = this.terrainAt(col, row);
    if (!species.allowedTerrain.includes(terrain))
      return { ok: false, reason: `${species.name} can't stand on ${terrain}` };
    if (this.gold < species.base.cost) return { ok: false, reason: "Not enough gold" };
    return { ok: true, tower: null as unknown as Tower };
  }

  placeTower(uid: string, col: number, row: number): PlacementResult {
    const check = this.canPlace(uid, col, row);
    if (!check.ok) return check;
    const member = this.team.find((m) => m.uid === uid)!;
    const species = getSpecies(member.speciesId);
    const favored = this.terrainAt(col, row) === species.favoredTerrain;
    // Persistent collection level grants up to +20% damage in-run.
    const persistentBonus = Math.min(0.2, (member.level - 1) * 0.01);
    const tower = new Tower(member.uid, member.speciesId, member.ivs, col, row, favored, persistentBonus);
    this.towers.push(tower);
    this.placedUids.add(uid);
    this.gold -= species.base.cost;
    this.emitChange();
    return { ok: true, tower };
  }

  sellTower(tower: Tower): void {
    const idx = this.towers.indexOf(tower);
    if (idx < 0) return;
    this.towers.splice(idx, 1);
    this.gold += Math.round(tower.totalInvested * 0.6);
    // Free the team member back up (owner tracked directly, survives evolution).
    this.placedUids.delete(tower.ownerUid);
    this.emitChange();
  }

  setTargeting(tower: Tower, mode: TargetingMode): void {
    tower.targeting = mode;
    this.emitChange();
  }

  activateAbility(tower: Tower): Omit<AbilityActivationResult & { ok: true }, "killed"> | Extract<AbilityActivationResult, { ok: false }> {
    if (!this.towers.includes(tower)) return { ok: false, reason: "Tower is not deployed" };
    const result = executeAbility(tower, this.enemies, this.path);
    if (!result.ok) return result;
    for (const enemy of result.killed) this.onKill(enemy);
    this.emitChange();
    return { ok: true, affected: result.affected };
  }

  // Gold can buy only a few levels per tower, so dumping a whole run's gold into
  // one tower hits a wall fast. Deploying more pokemon is the efficient spend —
  // this is what makes hatching a bigger team the real path to going further.
  static readonly MAX_GOLD_LEVELS = 4;

  // In-run upgrade: gold buys tower levels. Cost climbs with levels already
  // bought so a single tower can't be cheaply maxed.
  upgradeCost(tower: Tower): number {
    return Math.round(45 * Math.pow(1.55, tower.goldLevels));
  }

  canUpgrade(tower: Tower): boolean {
    return (
      !tower.atMaxLevel() &&
      tower.goldLevels < GameSession.MAX_GOLD_LEVELS &&
      this.gold >= this.upgradeCost(tower)
    );
  }

  upgradeTower(tower: Tower): boolean {
    if (!this.canUpgrade(tower)) return false;
    const cost = this.upgradeCost(tower);
    this.gold -= cost;
    tower.totalInvested += cost;
    if (tower.levelUp()) this.addFloating(tower.pos.x, tower.pos.y, "Evolved!", "#f472b6");
    this.emitChange();
    return true;
  }

  startWave(): boolean {
    if (this.phase !== "building") return false;
    this.waveNumber++;
    this.phase = "wave";
    this.spawner.start(generateWave(this.map, this.waveNumber, this.runSeed));
    this.emitChange();
    return true;
  }

  private addFloating(x: number, y: number, text: string, color: string): void {
    this.floating.push({ x, y, text, color, life: 0.9 });
  }

  update(dt: number): void {
    if (this.phase === "won" || this.phase === "lost") return;

    // Spawn
    if (this.phase === "wave") {
      for (const e of this.spawner.update(dt, this.path)) this.enemies.push(e);
    }

    // Enemies
    for (const e of this.enemies) {
      e.update(dt, this.path);
      if (e.reachedEnd) {
        this.lives -= e.heartDamage;
        this.addFloating(e.pos.x, e.pos.y, `-${e.heartDamage}`, "#f87171");
      }
    }

    // Towers fire
    for (const t of this.towers) {
      t.abilityCooldownLeft = Math.max(0, t.abilityCooldownLeft - dt);
      t.cooldownLeft -= dt;
      if (t.cooldownLeft > 0) continue;
      const target = chooseTarget(t.pos, t.rangePx(), this.enemies, t.targeting);
      if (!target) continue;
      const eff = getEffectiveness(t.species.attackType, target.def.types);
      if (!canHit(target, t.species.attackType, eff)) continue;
      this.projectiles.push(
        new Projectile(t.pos, target, t.damage(), t.species.attackType, t.species.projectile.color, t.species.onHitStatus),
      );
      t.cooldownLeft = t.cooldown();
    }

    // Projectiles resolve
    for (const p of this.projectiles) {
      if (!p.update(dt)) continue;
      if (!p.target.alive) continue;
      const res = resolveHit(p.target, p.attackType, p.damage);
      if (res.dealt > 0 && p.status && Math.random() < p.status.chance) {
        p.target.status.apply(p.status.kind, p.status.duration, p.status.magnitude);
      }
      if (res.killed) this.onKill(p.target);
    }

    // Cull
    this.enemies = this.enemies.filter((e) => e.alive);
    this.projectiles = this.projectiles.filter((p) => !p.done);
    for (const f of this.floating) f.life -= dt;
    this.floating = this.floating.filter((f) => f.life > 0);

    // Lose check
    if (this.lives <= 0) {
      this.phase = "lost";
      this.events.onGameOver?.(false, Math.max(0, this.waveNumber - 1));
      this.emitChange();
      return;
    }

    // Wave clear check
    if (this.phase === "wave" && !this.spawner.active && this.enemies.length === 0) {
      this.gold += generateWave(this.map, this.waveNumber, this.runSeed).goldReward;
      this.events.onWaveCleared?.(this.waveNumber);
      if (this.waveNumber >= this.map.totalWaves) {
        this.phase = "won";
        this.events.onGameOver?.(true, this.waveNumber);
      } else {
        this.phase = "building";
      }
      this.emitChange();
    }
  }

  // Total run XP earned per team member (owner uid), for persistent leveling.
  runXpByUid(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const t of this.towers) out[t.ownerUid] = (out[t.ownerUid] ?? 0) + t.runXp;
    return out;
  }

  private onKill(enemy: Enemy): void {
    this.gold += enemy.reward;
    if (enemy.isBoss) this.bossKills += 1;
    this.addFloating(enemy.pos.x, enemy.pos.y, `+${enemy.reward}`, "#fbbf24");
    const xp = enemy.isBoss ? 30 : 3;
    // Award XP to the nearest tower that can reach the kill site.
    let best: Tower | null = null;
    let bestD = Infinity;
    for (const t of this.towers) {
      const d = (t.pos.x - enemy.pos.x) ** 2 + (t.pos.y - enemy.pos.y) ** 2;
      if (d <= t.rangePx() ** 2 && d < bestD) {
        best = t;
        bestD = d;
      }
    }
    if (best?.gainXp(xp)) this.addFloating(best.pos.x, best.pos.y, "Evolved!", "#f472b6");
  }

  private emitChange(): void {
    this.events.onChange?.();
  }
}

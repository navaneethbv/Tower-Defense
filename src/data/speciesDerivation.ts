import type { CanonicalPokemon } from "./generated/pokemon";
import { starterKit } from "./starterKits";
import type {
  AbilityDef,
  CombatProfile,
  Rarity,
  Role,
  SpeciesDef,
  StatusApplication,
  Terrain,
  TypeName,
} from "../types";

const TYPE_ABILITY: Record<
  TypeName,
  Pick<AbilityDef, "name" | "description" | "cooldown" | "kind">
> = {
  normal: { name: "Barrage", description: "Fires a rapid multishot volley.", cooldown: 13, kind: "multishot" },
  fire: { name: "Wildfire", description: "Burns every enemy in range.", cooldown: 16, kind: "aoe_burn" },
  water: { name: "Tidal Wave", description: "Washes across the entire path.", cooldown: 17, kind: "path_wave" },
  grass: { name: "Solar Beam", description: "Blasts enemies in a straight line.", cooldown: 14, kind: "line_blast" },
  electric: { name: "Thunder Chain", description: "Chains through nearby enemies.", cooldown: 12, kind: "chain" },
  ice: { name: "Blizzard", description: "Damages and stuns enemies in range.", cooldown: 17, kind: "aoe_stun" },
  fighting: { name: "Close Combat", description: "Deals heavy area damage.", cooldown: 14, kind: "area_damage" },
  poison: { name: "Toxic Cloud", description: "Applies a status burst in range.", cooldown: 15, kind: "status_burst" },
  ground: { name: "Earthquake", description: "Damages and stuns enemies in range.", cooldown: 17, kind: "aoe_stun" },
  flying: { name: "Hurricane", description: "Damages and pushes enemies backward.", cooldown: 16, kind: "aoe_push" },
  psychic: { name: "Psywave", description: "Chains psychic force through enemies.", cooldown: 13, kind: "chain" },
  bug: { name: "Pin Missile", description: "Fires a focused multishot volley.", cooldown: 12, kind: "multishot" },
  rock: { name: "Rock Slide", description: "Deals heavy area damage.", cooldown: 15, kind: "area_damage" },
  ghost: { name: "Nightmare", description: "Curses enemies in range.", cooldown: 15, kind: "status_burst" },
  dragon: { name: "Dragon Pulse", description: "Blasts enemies in a straight line.", cooldown: 14, kind: "line_blast" },
  dark: { name: "Night Slash", description: "Executes a weakened enemy.", cooldown: 12, kind: "execute" },
  steel: { name: "Meteor Mash", description: "Deals heavy area damage.", cooldown: 15, kind: "area_damage" },
  fairy: { name: "Moonblast", description: "Disrupts enemies with a status burst.", cooldown: 14, kind: "status_burst" },
};

const TYPE_COLOR: Record<TypeName, string> = {
  normal: "#cbd5e1",
  fire: "#fb7185",
  water: "#38bdf8",
  grass: "#4ade80",
  electric: "#facc15",
  ice: "#67e8f9",
  fighting: "#f97316",
  poison: "#c084fc",
  ground: "#d6a85f",
  flying: "#a5b4fc",
  psychic: "#f472b6",
  bug: "#a3e635",
  rock: "#a8a29e",
  ghost: "#818cf8",
  dragon: "#8b5cf6",
  dark: "#64748b",
  steel: "#94a3b8",
  fairy: "#f9a8d4",
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function baseStatTotal(record: CanonicalPokemon): number {
  return Object.values(record.baseStats).reduce((total, value) => total + value, 0);
}

function stageDepth(record: CanonicalPokemon, byId: ReadonlyMap<string, CanonicalPokemon>): number {
  let depth = 0;
  let cursor = record;
  const visited = new Set<string>();
  while (cursor.evolvesFrom && !visited.has(cursor.id)) {
    visited.add(cursor.id);
    const parent = byId.get(cursor.evolvesFrom);
    if (!parent) break;
    depth++;
    cursor = parent;
  }
  return depth;
}

function familyRoot(record: CanonicalPokemon, byId: ReadonlyMap<string, CanonicalPokemon>): CanonicalPokemon {
  let cursor = record;
  const visited = new Set<string>();
  while (cursor.evolvesFrom && !visited.has(cursor.id)) {
    visited.add(cursor.id);
    const parent = byId.get(cursor.evolvesFrom);
    if (!parent) break;
    cursor = parent;
  }
  return cursor;
}

function rarityFor(record: CanonicalPokemon, byId: ReadonlyMap<string, CanonicalPokemon>): Rarity {
  const root = familyRoot(record, byId);
  const familyLegendary =
    record.isLegendary || record.isMythical || root.isLegendary || root.isMythical;
  if (familyLegendary || root.captureRate <= 3) return "legendary";
  if (root.captureRate <= 45 || baseStatTotal(root) >= 500) return "rare";
  return "common";
}

function roleFor(record: CanonicalPokemon): Role {
  const { attack, defense, hp, specialAttack, specialDefense, speed } = record.baseStats;
  const offense = Math.max(attack, specialAttack);
  const bulk = (hp + defense + specialDefense) / 3;
  if (speed >= 105) return "dps";
  if (offense >= 120) return "tank_killer";
  if (specialAttack >= attack * 1.25) return "aoe";
  if (bulk >= 100) return "support";
  if (speed <= 45 && offense >= 85) return "sniper";
  return "balanced";
}

function terrainFor(types: TypeName[]): { allowed: Terrain[]; favored: Terrain } {
  if (types.includes("water")) return { allowed: ["water", "grass"], favored: "water" };
  if (types.some((type) => type === "rock" || type === "ground" || type === "steel")) {
    return { allowed: ["mountain", "grass"], favored: "mountain" };
  }
  if (types.includes("flying")) return { allowed: ["grass", "mountain"], favored: "mountain" };
  return { allowed: ["grass", "mountain"], favored: "grass" };
}

// Types whose specialists get a genuinely different status, not just a stronger
// version of the same one. A `status` profile is only ever assigned to a species
// whose attack type appears here, which keeps "status implies a kit" true.
const STATUS_KITS: Partial<Record<TypeName, Record<"balanced" | "status", StatusApplication>>> = {
  fire: {
    balanced: { kind: "burn", chance: 0.22, duration: 2.5, magnitude: 4 },
    status: { kind: "burn", chance: 0.48, duration: 4, magnitude: 7 },
  },
  poison: {
    balanced: { kind: "poison", chance: 0.28, duration: 3, magnitude: 5 },
    status: { kind: "toxic", chance: 0.42, duration: 6, magnitude: 3 },
  },
  electric: {
    balanced: { kind: "paralysis", chance: 0.16, duration: 1.8, magnitude: 0.5 },
    status: { kind: "paralysis", chance: 0.35, duration: 3, magnitude: 0.5 },
  },
  ice: {
    balanced: { kind: "slow", chance: 0.3, duration: 2, magnitude: 0.3 },
    status: { kind: "freeze", chance: 0.2, duration: 1.4, magnitude: 1 },
  },
  psychic: {
    balanced: { kind: "confusion", chance: 0.2, duration: 2, magnitude: 4 },
    status: { kind: "sleep", chance: 0.18, duration: 2.5, magnitude: 1 },
  },
  ghost: {
    balanced: { kind: "curse", chance: 0.2, duration: 3, magnitude: 0.25 },
    status: { kind: "confusion", chance: 0.35, duration: 4, magnitude: 6 },
  },
  fairy: {
    balanced: { kind: "confusion", chance: 0.18, duration: 2.5, magnitude: 4 },
    status: { kind: "sleep", chance: 0.16, duration: 3, magnitude: 1 },
  },
};

// Types that keep a single tactical effect regardless of stat spread.
const FIXED_KITS: Partial<Record<TypeName, StatusApplication>> = {
  dark: { kind: "curse", chance: 0.18, duration: 3, magnitude: 0.2 },
  fighting: { kind: "armorBreak", chance: 0.2, duration: 2.5, magnitude: 1 },
  ground: { kind: "armorBreak", chance: 0.2, duration: 2.5, magnitude: 1 },
  steel: { kind: "armorBreak", chance: 0.18, duration: 2.5, magnitude: 1 },
};

export function deriveCombatProfile(
  record: CanonicalPokemon,
  attackType: TypeName,
  role: Role,
): CombatProfile {
  if (!STATUS_KITS[attackType]) return FIXED_KITS[attackType] ? "balanced" : "damage";
  const { attack, specialAttack, speed } = record.baseStats;
  const specialist = specialAttack >= attack * 1.1 || role === "support" || speed <= 65;
  return specialist ? "status" : "balanced";
}

export function deriveStatusKit(
  attackType: TypeName,
  profile: CombatProfile,
): StatusApplication | undefined {
  const kit = STATUS_KITS[attackType];
  if (kit) return profile === "status" ? kit.status : kit.balanced;
  return FIXED_KITS[attackType];
}

function evolutionLevel(
  record: CanonicalPokemon,
  byId: ReadonlyMap<string, CanonicalPokemon>,
): number {
  const depth = stageDepth(record, byId);
  if (depth > 0) return 10;
  const continues = record.evolvesTo.some((id) => (byId.get(id)?.evolvesTo.length ?? 0) > 0);
  return continues ? 5 : 8;
}

function abilityFor(record: CanonicalPokemon, attackType: TypeName): AbilityDef | undefined {
  const eligible =
    record.evolvesTo.length === 0 &&
    (baseStatTotal(record) >= 450 || record.isLegendary || record.isMythical);
  if (!eligible) return undefined;
  const template = TYPE_ABILITY[attackType];
  return { id: `${record.id}_${template.kind}`, ...template };
}

// Curated entries may omit `combatProfile`; it is normalized on the way out.
export type SpeciesTemplate = Omit<SpeciesDef, "combatProfile"> & {
  combatProfile?: CombatProfile;
};

// Status specialists give up direct damage for stronger status application.
const SPECIALIST_DAMAGE_MULTIPLIER = 0.8;

export function deriveSpecies(
  record: CanonicalPokemon,
  byId: ReadonlyMap<string, CanonicalPokemon>,
  override?: SpeciesTemplate,
): SpeciesDef {
  if (override) {
    const curatedStarter = starterKit(override.id, override.attackType);
    return {
      ...override,
      combatProfile:
        curatedStarter?.combatProfile ??
        override.combatProfile ??
        (override.onHitStatus ? "balanced" : "damage"),
      onHitStatus: curatedStarter?.onHitStatus ?? override.onHitStatus,
    };
  }

  const types = record.types as TypeName[];
  const attackType = types.find((type) => type !== "normal") ?? types[0]!;
  const role = roleFor(record);
  const depth = stageDepth(record, byId);
  const hasEvolution = record.evolvesTo.length > 0;
  const singleStage = depth === 0 && !hasEvolution;
  const offense = Math.max(record.baseStats.attack, record.baseStats.specialAttack);
  const terrain = terrainFor(types);
  const roleRange = role === "sniper" ? 3.5 : role === "aoe" ? 3 : role === "support" ? 3.1 : 2.7;
  const cost = singleStage ? 140 : depth === 0 ? 80 : hasEvolution ? 160 : 300;
  // Starter exceptions resolve before the multiplier, so a starter forced back
  // to `balanced` keeps its full direct damage without any rescaling.
  const starter = starterKit(record.id, attackType);
  const combatProfile = starter?.combatProfile ?? deriveCombatProfile(record, attackType, role);
  const damageMultiplier = combatProfile === "status" ? SPECIALIST_DAMAGE_MULTIPLIER : 1;

  return {
    id: record.id,
    dex: record.dex,
    name: record.name,
    types,
    attackType,
    role,
    rarity: rarityFor(record, byId),
    combatProfile,
    base: {
      damage: Math.round(clamp(6 + offense / 7 + depth * 8, 9, 55) * damageMultiplier),
      cooldown: Number(clamp(1.3 - record.baseStats.speed / 180 - depth * 0.06, 0.45, 1.25).toFixed(2)),
      range: Number((roleRange + depth * 0.22).toFixed(2)),
      cost,
    },
    allowedTerrain: terrain.allowed,
    favoredTerrain: terrain.favored,
    projectile: { color: TYPE_COLOR[attackType], kind: attackType },
    ability: abilityFor(record, attackType),
    evolutions:
      record.evolvesTo.length > 0
        ? record.evolvesTo.map((speciesId) => ({
            speciesId,
            atLevel: evolutionLevel(record, byId),
          }))
        : undefined,
    onHitStatus: starter?.onHitStatus ?? deriveStatusKit(attackType, combatProfile),
    description: `${record.name} uses ${attackType}-type attacks as a ${role.replace("_", " ")} tower.`,
  };
}

function hashOwnerUid(uid: string): number {
  let hash = 2166136261;
  for (let index = 0; index < uid.length; index++) {
    hash ^= uid.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function selectEvolution(species: SpeciesDef, ownerUid: string) {
  const evolutions = species.evolutions;
  if (!evolutions || evolutions.length === 0) return undefined;
  return evolutions[hashOwnerUid(ownerUid) % evolutions.length];
}

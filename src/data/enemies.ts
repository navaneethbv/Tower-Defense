import type { EnemyDef } from "../types";
import { getSpecies } from "./species";

type EnemyStats = Omit<EnemyDef, "id" | "name" | "dex" | "types">;

function speciesEnemy(id: string, stats: EnemyStats): EnemyDef {
  const species = getSpecies(id);
  return { id, name: species.name, dex: species.dex, types: species.types, ...stats };
}

// Base enemy archetypes. Wave scaling (waves/scaling.ts) multiplies these.
// Phase 5 expands this list; Phase 1-2 ships a representative core set.
export const ENEMIES: EnemyDef[] = [
  { id: "rattata", name: "Rattata", dex: 19, types: ["normal"], hp: 26, speed: 1.35, reward: 6, heartDamage: 1, armor: 0 },
  { id: "pidgey", name: "Pidgey", dex: 16, types: ["normal", "flying"], hp: 22, speed: 1.7, reward: 6, heartDamage: 1, armor: 0 },
  { id: "zubat", name: "Zubat", dex: 41, types: ["poison", "flying"], hp: 20, speed: 1.95, reward: 7, heartDamage: 1, armor: 0 },
  { id: "weedle", name: "Weedle", dex: 13, types: ["bug", "poison"], hp: 18, speed: 1.5, reward: 5, heartDamage: 1, armor: 0 },
  { id: "geodude", name: "Geodude", dex: 74, types: ["rock", "ground"], hp: 42, speed: 0.95, reward: 9, heartDamage: 1, armor: 3 },
  { id: "machop", name: "Machop", dex: 66, types: ["fighting"], hp: 40, speed: 1.05, reward: 9, heartDamage: 1, armor: 1, regen: 2 },
  { id: "gastly", name: "Gastly", dex: 92, types: ["ghost", "poison"], hp: 30, speed: 1.4, reward: 10, heartDamage: 1, armor: 0, spectral: true },
  { id: "sandshrew", name: "Sandshrew", dex: 27, types: ["ground"], hp: 38, speed: 1.1, reward: 8, heartDamage: 1, armor: 2 },
  { id: "grimer", name: "Grimer", dex: 88, types: ["poison"], hp: 46, speed: 0.85, reward: 10, heartDamage: 1, armor: 1, regen: 3 },
  { id: "onix", name: "Onix", dex: 95, types: ["rock", "ground"], hp: 120, speed: 0.9, reward: 40, heartDamage: 3, armor: 5, boss: true },
  { id: "gyarados", name: "Gyarados", dex: 130, types: ["water", "flying"], hp: 150, speed: 1.05, reward: 45, heartDamage: 3, armor: 3, boss: true },
  { id: "arcanine", name: "Arcanine", dex: 59, types: ["fire"], hp: 140, speed: 1.4, reward: 45, heartDamage: 3, armor: 2, boss: true },
  { id: "mewtwo", name: "Mewtwo", dex: 150, types: ["psychic"], hp: 220, speed: 1.1, reward: 80, heartDamage: 5, armor: 4, boss: true },
  { id: "dragonite", name: "Dragonite", dex: 149, types: ["dragon", "flying"], hp: 260, speed: 1.15, reward: 90, heartDamage: 5, armor: 5, boss: true },
  speciesEnemy("hoothoot", { hp: 24, speed: 1.45, reward: 6, heartDamage: 1, armor: 0 }),
  speciesEnemy("poochyena", { hp: 28, speed: 1.5, reward: 7, heartDamage: 1, armor: 0 }),
  speciesEnemy("bidoof", { hp: 34, speed: 1.15, reward: 7, heartDamage: 1, armor: 1 }),
  speciesEnemy("patrat", { hp: 26, speed: 1.55, reward: 7, heartDamage: 1, armor: 0 }),
  speciesEnemy("fletchling", { hp: 24, speed: 1.8, reward: 7, heartDamage: 1, armor: 0 }),
  speciesEnemy("yungoos", { hp: 36, speed: 1.2, reward: 8, heartDamage: 1, armor: 1 }),
  speciesEnemy("skwovet", { hp: 42, speed: 1.05, reward: 8, heartDamage: 1, armor: 1 }),
  speciesEnemy("lechonk", { hp: 48, speed: 1, reward: 9, heartDamage: 1, armor: 2 }),
  speciesEnemy("wooper", { hp: 34, speed: 1.1, reward: 8, heartDamage: 1, armor: 1 }),
  speciesEnemy("wingull", { hp: 24, speed: 1.85, reward: 7, heartDamage: 1, armor: 0 }),
  speciesEnemy("buizel", { hp: 30, speed: 1.75, reward: 8, heartDamage: 1, armor: 0 }),
  speciesEnemy("tympole", { hp: 36, speed: 1.35, reward: 8, heartDamage: 1, armor: 1 }),
  speciesEnemy("froakie", { hp: 32, speed: 1.8, reward: 9, heartDamage: 1, armor: 0 }),
  speciesEnemy("wishiwashi", { hp: 58, speed: 0.95, reward: 11, heartDamage: 2, armor: 2 }),
  speciesEnemy("chewtle", { hp: 52, speed: 0.9, reward: 10, heartDamage: 1, armor: 3 }),
  speciesEnemy("wiglett", { hp: 28, speed: 1.9, reward: 9, heartDamage: 1, armor: 0 }),
  speciesEnemy("aron", { hp: 54, speed: 0.85, reward: 11, heartDamage: 1, armor: 5 }),
  speciesEnemy("roggenrola", { hp: 50, speed: 0.8, reward: 10, heartDamage: 1, armor: 4 }),
  speciesEnemy("sableye", { hp: 38, speed: 1.25, reward: 11, heartDamage: 1, armor: 1, spectral: true }),
  speciesEnemy("carbink", { hp: 66, speed: 0.75, reward: 12, heartDamage: 1, armor: 6 }),
  speciesEnemy("rockruff", { hp: 38, speed: 1.55, reward: 10, heartDamage: 1, armor: 2 }),
  speciesEnemy("rolycoly", { hp: 58, speed: 0.8, reward: 11, heartDamage: 1, armor: 5 }),
  speciesEnemy("nacli", { hp: 64, speed: 0.75, reward: 12, heartDamage: 1, armor: 6, regen: 2 }),
  speciesEnemy("tyranitar", { hp: 260, speed: 0.95, reward: 85, heartDamage: 5, armor: 7, boss: true }),
  speciesEnemy("metagross", { hp: 280, speed: 0.9, reward: 90, heartDamage: 5, armor: 8, boss: true }),
  speciesEnemy("garchomp", { hp: 250, speed: 1.35, reward: 90, heartDamage: 5, armor: 5, boss: true }),
  speciesEnemy("hydreigon", { hp: 270, speed: 1.25, reward: 95, heartDamage: 5, armor: 5, boss: true }),
  speciesEnemy("aegislash", { hp: 290, speed: 0.85, reward: 95, heartDamage: 5, armor: 9, boss: true }),
  speciesEnemy("kommo-o", { hp: 300, speed: 1.05, reward: 100, heartDamage: 5, armor: 7, boss: true }),
  speciesEnemy("dragapult", { hp: 240, speed: 1.65, reward: 100, heartDamage: 5, armor: 4, boss: true, spectral: true }),
  speciesEnemy("baxcalibur", { hp: 320, speed: 1, reward: 110, heartDamage: 5, armor: 7, boss: true }),
  speciesEnemy("kyogre", { hp: 310, speed: 0.95, reward: 110, heartDamage: 5, armor: 6, boss: true, regen: 4 }),
  speciesEnemy("palkia", { hp: 320, speed: 1.1, reward: 115, heartDamage: 5, armor: 7, boss: true }),
  speciesEnemy("primarina", { hp: 230, speed: 1, reward: 80, heartDamage: 4, armor: 4, boss: true }),
  speciesEnemy("arceus", { hp: 400, speed: 1.2, reward: 150, heartDamage: 7, armor: 10, boss: true, regen: 5 }),
];

const BY_ID = new Map(ENEMIES.map((e) => [e.id, e]));

export function getEnemy(id: string): EnemyDef {
  const def = BY_ID.get(id);
  if (!def) throw new Error(`Unknown enemy id: ${id}`);
  return def;
}

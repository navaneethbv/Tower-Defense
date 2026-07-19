import type { MapConfig, WaveGenParams } from "../../types";
import { loadAuthoredMap } from "./tiled";
import type { RouteRuntimeConfig, TiledRouteSource } from "./authored/types";

export type RouteBiome =
  | "meadow"
  | "water"
  | "stone"
  | "ember"
  | "frost"
  | "shadow"
  | "sky"
  | "ancient"
  | "champion";

const REGULAR: Record<RouteBiome, string[]> = {
  meadow: ["rattata", "pidgey", "weedle", "hoothoot", "poochyena", "bidoof", "fletchling", "skwovet", "lechonk"],
  water: ["zubat", "wooper", "wingull", "buizel", "tympole", "froakie", "wishiwashi", "chewtle", "wiglett"],
  stone: ["geodude", "sandshrew", "machop", "aron", "roggenrola", "sableye", "carbink", "rockruff", "nacli"],
  ember: ["poochyena", "fletchling", "sandshrew", "geodude", "machop", "rockruff", "rolycoly", "aron", "nacli"],
  frost: ["wingull", "wooper", "buizel", "zubat", "roggenrola", "carbink", "wishiwashi", "chewtle", "sableye"],
  shadow: ["gastly", "zubat", "grimer", "sableye", "poochyena", "weedle", "wooper", "carbink", "wiglett"],
  sky: ["pidgey", "zubat", "hoothoot", "wingull", "fletchling", "rockruff", "carbink", "sableye", "aron"],
  ancient: ["rattata", "machop", "gastly", "geodude", "grimer", "carbink", "froakie", "rockruff", "nacli"],
  champion: ["pidgey", "zubat", "machop", "geodude", "gastly", "grimer", "roggenrola", "fletchling", "lechonk"],
};

const BOSSES: Record<RouteBiome, string[]> = {
  meadow: ["onix", "arcanine", "gyarados", "tyranitar", "dragonite"],
  water: ["gyarados", "primarina", "kyogre", "palkia", "dragonite"],
  stone: ["onix", "tyranitar", "metagross", "garchomp", "baxcalibur"],
  ember: ["arcanine", "onix", "tyranitar", "garchomp", "baxcalibur"],
  frost: ["gyarados", "primarina", "baxcalibur", "kyogre", "palkia"],
  shadow: ["mewtwo", "aegislash", "hydreigon", "dragapult", "arceus"],
  sky: ["dragonite", "garchomp", "hydreigon", "dragapult", "arceus"],
  ancient: ["metagross", "kommo-o", "aegislash", "palkia", "arceus"],
  champion: ["tyranitar", "metagross", "garchomp", "hydreigon", "arceus"],
};

export function makeWaveGen(
  biome: RouteBiome,
  seedSalt: number,
  difficulty: number,
): WaveGenParams {
  const regularIds = [
    ...new Set([
      ...REGULAR[biome],
      "rattata",
      "patrat",
      "yungoos",
      "bidoof",
      "skwovet",
      "lechonk",
      "hoothoot",
      "wingull",
      "aron",
    ]),
  ].slice(0, 12);
  return {
    enemyPool: regularIds.map((enemyId, index) => ({
      enemyId,
      minWave: index <= 1 ? 1 : Math.min(70, 1 + (index - 1) * 8),
      weight: Number(Math.max(0.55, 1 - index * 0.05).toFixed(2)),
    })),
    bossPool: BOSSES[biome].map((enemyId, index) => ({
      enemyId,
      minWave: 10 + index * 20,
    })),
    baseCount: 7 + Math.floor((difficulty - 1) / 5),
    countGrowth: 0.72 + difficulty * 0.005,
    hpBase: 30 + difficulty * 0.75,
    hpGrowth: 1.106 + difficulty * 0.0015,
    spawnInterval: Math.max(0.56, 0.68 - difficulty * 0.006),
    seedSalt,
  };
}

export function makeRoute(source: unknown, config: RouteRuntimeConfig): MapConfig {
  return loadAuthoredMap(source as TiledRouteSource, config);
}

export interface CanonicalPokemon {
  dex: number;
  id: string;
  name: string;
  types: string[];
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  generation: number;
  evolvesFrom: string | null;
  evolvesTo: string[];
  isLegendary: boolean;
  isMythical: boolean;
  captureRate: number;
}

export interface GeneratePokemonSnapshotOptions {
  fetchImpl?: typeof fetch;
  firstDex?: number;
  lastDex?: number;
  concurrency?: number;
  retries?: number;
}

export function generatePokemonSnapshot(
  options?: GeneratePokemonSnapshotOptions,
): Promise<CanonicalPokemon[]>;

export function validateSnapshot(
  records: CanonicalPokemon[],
  firstDex: number,
  lastDex: number,
): CanonicalPokemon[];

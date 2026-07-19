// First-launch starter choices: the traditional Grass/Fire/Water trio from every
// generation, plus Pikachu in Gen 1. Grouped so 28 options stay readable behind
// generation tabs. IDs must resolve in the canonical roster (see tests).
export interface StarterGroup {
  generation: number;
  label: string;
  speciesIds: readonly string[];
}

export const STARTER_GROUPS = [
  { generation: 1, label: "Generation 1", speciesIds: ["bulbasaur", "charmander", "squirtle", "pikachu"] },
  { generation: 2, label: "Generation 2", speciesIds: ["chikorita", "cyndaquil", "totodile"] },
  { generation: 3, label: "Generation 3", speciesIds: ["treecko", "torchic", "mudkip"] },
  { generation: 4, label: "Generation 4", speciesIds: ["turtwig", "chimchar", "piplup"] },
  { generation: 5, label: "Generation 5", speciesIds: ["snivy", "tepig", "oshawott"] },
  { generation: 6, label: "Generation 6", speciesIds: ["chespin", "fennekin", "froakie"] },
  { generation: 7, label: "Generation 7", speciesIds: ["rowlet", "litten", "popplio"] },
  { generation: 8, label: "Generation 8", speciesIds: ["grookey", "scorbunny", "sobble"] },
  { generation: 9, label: "Generation 9", speciesIds: ["sprigatito", "fuecoco", "quaxly"] },
] as const satisfies readonly StarterGroup[];

export const STARTER_IDS = STARTER_GROUPS.flatMap((group) => [...group.speciesIds]);

export function starterGroup(generation: number): StarterGroup {
  const group = STARTER_GROUPS.find((candidate) => candidate.generation === generation);
  if (!group) throw new Error(`Unknown starter generation: ${generation}`);
  return group;
}

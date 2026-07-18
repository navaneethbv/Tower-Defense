import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const API_ROOT = "https://pokeapi.co/api/v2";
const GEN_III_TYPES = new Set([
  "normal",
  "fire",
  "water",
  "grass",
  "electric",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
]);

const GENERATION_NUMBER = new Map([
  ["generation-i", 1],
  ["generation-ii", 2],
  ["generation-iii", 3],
  ["generation-iv", 4],
  ["generation-v", 5],
  ["generation-vi", 6],
  ["generation-vii", 7],
  ["generation-viii", 8],
  ["generation-ix", 9],
]);

function generationNumber(name) {
  const number = GENERATION_NUMBER.get(name);
  if (!number) throw new Error(`Unknown generation: ${name}`);
  return number;
}

function currentTypes(pokemon) {
  return [...pokemon.types]
    .sort((left, right) => left.slot - right.slot)
    .map((entry) => entry.type.name);
}

function englishName(species) {
  return species.names?.find((entry) => entry.language.name === "en")?.name ?? species.name;
}

function baseStats(pokemon) {
  const stats = new Map(pokemon.stats.map((entry) => [entry.stat.name, entry.base_stat]));
  return {
    hp: stats.get("hp"),
    attack: stats.get("attack"),
    defense: stats.get("defense"),
    specialAttack: stats.get("special-attack"),
    specialDefense: stats.get("special-defense"),
    speed: stats.get("speed"),
  };
}

async function fetchJson(url, fetchImpl, retries) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetchImpl(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolveDelay) => setTimeout(resolveDelay, 100 * 2 ** (attempt - 1)));
      }
    }
  }
  const message = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`Failed to fetch ${url}: ${message}`);
}

async function mapLimit(values, concurrency, mapper) {
  const output = new Array(values.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex++;
      output[index] = await mapper(values[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, () => worker()),
  );
  return output;
}

export function validateSnapshot(records, firstDex, lastDex) {
  const dexSeen = new Set();
  const idSeen = new Set();

  for (const record of records) {
    if (dexSeen.has(record.dex)) throw new Error(`Duplicate National Dex entry: ${record.dex}`);
    if (idSeen.has(record.id)) throw new Error(`Duplicate species id: ${record.id}`);
    dexSeen.add(record.dex);
    idSeen.add(record.id);
  }

  const missing = [];
  for (let dex = firstDex; dex <= lastDex; dex++) {
    if (!dexSeen.has(dex)) missing.push(dex);
  }
  if (missing.length > 0) throw new Error(`Missing National Dex entries: ${missing.join(", ")}`);

  for (const record of records) {
    if (record.dex < firstDex || record.dex > lastDex) {
      throw new Error(`Out-of-range National Dex entry: ${record.dex}`);
    }
    if (!record.id || !record.name) throw new Error(`Missing identity for National Dex ${record.dex}`);
    if (record.types.length === 0 || record.types.some((type) => !GEN_III_TYPES.has(type))) {
      throw new Error(`Unsupported types for ${record.id}: ${record.types.join(", ")}`);
    }
    if (Object.values(record.baseStats).some((value) => !Number.isFinite(value) || value <= 0)) {
      throw new Error(`Malformed base stats for ${record.id}`);
    }
    if (record.evolvesFrom && !idSeen.has(record.evolvesFrom)) {
      throw new Error(`Unresolved evolution source for ${record.id}: ${record.evolvesFrom}`);
    }
    for (const target of record.evolvesTo) {
      if (!idSeen.has(target)) throw new Error(`Unresolved evolution target for ${record.id}: ${target}`);
    }
  }

  return records;
}

export async function generatePokemonSnapshot({
  fetchImpl = fetch,
  firstDex = 1,
  lastDex = 1025,
  concurrency = 8,
  retries = 3,
} = {}) {
  const dexNumbers = Array.from(
    { length: lastDex - firstDex + 1 },
    (_, index) => firstDex + index,
  );

  const sourceRows = await mapLimit(dexNumbers, concurrency, async (dex) => {
    const [species, pokemon] = await Promise.all([
      fetchJson(`${API_ROOT}/pokemon-species/${dex}`, fetchImpl, retries),
      fetchJson(`${API_ROOT}/pokemon/${dex}`, fetchImpl, retries),
    ]);
    return { dex, species, pokemon };
  });

  const chainUrls = [...new Set(sourceRows.map((row) => row.species.evolution_chain?.url).filter(Boolean))];
  await mapLimit(chainUrls, concurrency, (url) => fetchJson(url, fetchImpl, retries));

  const includedIds = new Set(sourceRows.map((row) => row.species.name));
  const records = sourceRows.map(({ dex, species, pokemon }) => ({
    dex,
    id: species.name,
    name: englishName(species),
    types: currentTypes(pokemon),
    baseStats: baseStats(pokemon),
    generation: generationNumber(species.generation.name),
    evolvesFrom: includedIds.has(species.evolves_from_species?.name)
      ? species.evolves_from_species.name
      : null,
    evolvesTo: [],
    isLegendary: Boolean(species.is_legendary),
    isMythical: Boolean(species.is_mythical),
    captureRate: species.capture_rate,
  }));

  const byId = new Map(records.map((record) => [record.id, record]));
  for (const record of records) {
    if (record.evolvesFrom) byId.get(record.evolvesFrom)?.evolvesTo.push(record.id);
  }
  for (const record of records) record.evolvesTo.sort();

  records.sort((left, right) => left.dex - right.dex);
  return validateSnapshot(records, firstDex, lastDex);
}

function cacheFileFor(cacheDir, url) {
  return resolve(cacheDir, `${createHash("sha256").update(url).digest("hex")}.json`);
}

function cachedFetch(fetchImpl, cacheDir) {
  return async (url) => {
    const cacheFile = cacheFileFor(cacheDir, String(url));
    try {
      const cached = await readFile(cacheFile, "utf8");
      return { ok: true, status: 200, json: async () => JSON.parse(cached) };
    } catch {
      const response = await fetchImpl(url);
      if (!response.ok) return response;
      const body = await response.json();
      await mkdir(cacheDir, { recursive: true });
      await writeFile(cacheFile, `${JSON.stringify(body)}\n`, "utf8");
      return { ok: true, status: response.status, json: async () => body };
    }
  };
}

function renderTypeScript(records) {
  return `// This file is generated by tools/generate-pokemon-data.mjs.\n// Do not edit it manually.\n\nexport interface CanonicalPokemon {\n  dex: number;\n  id: string;\n  name: string;\n  types: string[];\n  baseStats: { hp: number; attack: number; defense: number; specialAttack: number; specialDefense: number; speed: number };\n  generation: number;\n  evolvesFrom: string | null;\n  evolvesTo: string[];\n  isLegendary: boolean;\n  isMythical: boolean;\n  captureRate: number;\n}\n\nexport const CANONICAL_POKEMON: CanonicalPokemon[] = ${JSON.stringify(records, null, 2)};\n`;
}

async function writeSnapshot(outputFile, records) {
  await mkdir(dirname(outputFile), { recursive: true });
  const temporary = `${outputFile}.tmp-${process.pid}`;
  await writeFile(temporary, renderTypeScript(records), "utf8");
  await rename(temporary, outputFile);
}

async function main() {
  const repoRoot = fileURLToPath(new URL("..", import.meta.url));
  const outputFile = resolve(repoRoot, "src/data/generated/pokemon.ts");
  const cacheDir = resolve(repoRoot, ".cache/pokeapi");
  const records = await generatePokemonSnapshot({ fetchImpl: cachedFetch(fetch, cacheDir) });
  await writeSnapshot(outputFile, records);
  console.log(`Generated ${records.length} species at ${outputFile}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

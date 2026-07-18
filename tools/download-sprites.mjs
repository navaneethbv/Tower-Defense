import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SPRITE_ROOT = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

function isValidPng(bytes) {
  return (
    bytes.length >= 24 &&
    bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" &&
    bytes.readUInt32BE(16) > 0 &&
    bytes.readUInt32BE(20) > 0
  );
}

async function existingSpriteIsValid(path) {
  try {
    return isValidPng(await readFile(path));
  } catch {
    return false;
  }
}

async function fetchSprite(dex, fetchImpl, retries) {
  const url = `${SPRITE_ROOT}/${dex}.png`;
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetchImpl(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!isValidPng(bytes)) throw new Error("response is not a valid PNG");
      return bytes;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolveDelay) => setTimeout(resolveDelay, 100 * 2 ** (attempt - 1)));
      }
    }
  }
  const message = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`Failed to download sprite ${dex} from ${url}: ${message}`);
}

export async function downloadSprites({
  firstDex = 1,
  lastDex = 1025,
  fetchImpl = fetch,
  outputDir,
  concurrency = 8,
  retries = 3,
}) {
  await mkdir(outputDir, { recursive: true });
  const dexNumbers = Array.from(
    { length: lastDex - firstDex + 1 },
    (_, index) => firstDex + index,
  );
  let nextIndex = 0;
  let downloaded = 0;

  async function worker() {
    while (nextIndex < dexNumbers.length) {
      const dex = dexNumbers[nextIndex++];
      const target = resolve(outputDir, `${dex}.png`);
      if (await existingSpriteIsValid(target)) continue;
      const bytes = await fetchSprite(dex, fetchImpl, retries);
      const temporary = `${target}.tmp-${process.pid}`;
      await writeFile(temporary, bytes);
      await rename(temporary, target);
      downloaded++;
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, dexNumbers.length) }, () => worker()),
  );
  return downloaded;
}

async function main() {
  const repoRoot = fileURLToPath(new URL("..", import.meta.url));
  const outputDir = resolve(repoRoot, "public/sprites");
  const downloaded = await downloadSprites({ outputDir });
  console.log(`Downloaded ${downloaded} sprites into ${outputDir}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

# Generation I Through IX Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish Phases 4 through 7 and ship a polished Pokémon tower-defense game containing all 1,025 default-form Generation I through IX species.

**Architecture:** Keep the existing Vite, TypeScript, DOM, and canvas layers, then add a development-only PokéAPI snapshot generator that feeds deterministic runtime species derivation plus curated overrides. Add reusable engine-level ability behaviors, data-driven enemies and achievements, and preserve browser persistence through versioned migrations.

**Tech Stack:** Vite 6, TypeScript 5.6 strict mode, Vitest 3, native DOM and Canvas APIs, Node.js development scripts, PokéAPI, localStorage, Playwright browser verification, and Vercel static hosting.

## Global Constraints

- Finish and browser-verify Phase 4 before changing the roster pipeline.
- Support exactly National Dex entries 1 through 1025 using one default form per species.
- Use the current Generation IX type chart with Dark, Steel, and Fairy.
- Make no PokéAPI requests from the deployed application.
- Keep sprites local under `public/sprites/<dex>.png`.
- Preserve stable species IDs and valid existing saves.
- Follow red, green, refactor for every behavior change.
- Do not commit unless the user explicitly requests it.
- Preserve unrelated untracked files, including `.playwright-mcp/`.
- Do not modify generated reports or changelog files manually.

---

### Task 1: Finish Phase 4 domain behavior

**Files:**
- Create: `tests/eggs.test.ts`
- Create: `src/meta/runResult.ts`
- Modify: `src/main.ts`
- Test: `tests/eggs.test.ts`

**Interfaces:**
- Consumes: `freshSave(): SaveGame`, `getMap(id): MapConfig`, `buyEgg(save, rarity): Egg | null`, `hatchEgg(save, uid, rand?): OwnedPokemon | null`, `claimMilestoneDrops(save, map, newBestWave): Egg[]`.
- Produces: `applyCompletedRun(save, map, result): { coinsEarned: number; newBest: boolean; eggsGranted: Egg[] }`.

- [ ] **Step 1: Write deterministic egg tests**

Add tests with a crypto UUID shim and a seeded random helper:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { getMap } from "../src/data/maps";
import { EGG_PRICES } from "../src/meta/economy";
import { buyEgg, claimMilestoneDrops, hatchEgg, rollHatch } from "../src/meta/eggs";
import { applyCompletedRun } from "../src/meta/runResult";
import { freshSave } from "../src/meta/save";
import { getSpecies } from "../src/data/species";

let uid = 0;
beforeEach(() => {
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: { randomUUID: () => `test-${++uid}` },
  });
});

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

describe("egg economy", () => {
  it("deducts coins and refuses an unaffordable purchase without mutation", () => {
    const save = freshSave();
    save.pokeCoins = EGG_PRICES.common;
    expect(buyEgg(save, "common")).not.toBeNull();
    expect(save.pokeCoins).toBe(0);
    expect(save.eggs).toHaveLength(1);
    expect(buyEgg(save, "common")).toBeNull();
    expect(save.pokeCoins).toBe(0);
    expect(save.eggs).toHaveLength(1);
  });

  it("moves a hatched egg into the collection with bounded IVs", () => {
    const save = freshSave();
    save.pokeCoins = EGG_PRICES.common;
    const egg = buyEgg(save, "common")!;
    const pokemon = hatchEgg(save, egg.uid, mulberry32(7))!;
    expect(save.eggs).toHaveLength(0);
    expect(save.collection).toContain(pokemon);
    expect(Object.values(pokemon.ivs).every((value) => value >= 0 && value <= 15)).toBe(true);
  });

  it("grants each crossed map milestone once", () => {
    const save = freshSave();
    const map = getMap("verdant_route");
    expect(claimMilestoneDrops(save, map, 31).map((egg) => egg.rarity)).toEqual(["common", "common", "rare"]);
    expect(claimMilestoneDrops(save, map, 31)).toEqual([]);
    expect(save.eggs).toHaveLength(3);
  });

  it("keeps seeded common-egg rarity results inside broad configured bands", () => {
    const rand = mulberry32(42);
    let common = 0;
    for (let index = 0; index < 10_000; index++) {
      const pokemon = rollHatch("common", rand);
      if (getSpecies(pokemon.speciesId).rarity === "common") common++;
    }
    expect(common).toBeGreaterThan(8_000);
    expect(common).toBeLessThan(9_000);
  });

  it("applies a completed run and grants milestone eggs only for a new best", () => {
    const save = freshSave();
    const map = getMap("verdant_route");
    const first = applyCompletedRun(save, map, {
      wavesCleared: 12,
      bossKills: 1,
      runXpByUid: {},
    });
    expect(first.newBest).toBe(true);
    expect(first.eggsGranted).toHaveLength(1);
    const second = applyCompletedRun(save, map, {
      wavesCleared: 11,
      bossKills: 1,
      runXpByUid: {},
    });
    expect(second.newBest).toBe(false);
    expect(second.eggsGranted).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `npx vitest run tests/eggs.test.ts`
Expected: FAIL because `src/meta/runResult.ts` does not exist.

- [ ] **Step 3: Wire milestone drops into the run-result transaction**

Implement `applyCompletedRun` as the only coordinator for coins, best wave, milestone eggs, and persistent XP.
Replace the result application in `src/main.ts` with:

```ts
applyCompletedRun(save, map, result);
saveSave(save);
```

- [ ] **Step 4: Verify Phase 4 domain GREEN**

Run: `npx vitest run tests/eggs.test.ts tests/save.test.ts && npx tsc --noEmit`
Expected: all selected tests pass and TypeScript exits zero.

- [ ] **Step 5: Review checkpoint**

Inspect `git diff -- src/main.ts src/meta/runResult.ts tests/eggs.test.ts` and preserve the changes without committing.

### Task 2: Style and browser-verify Phase 4

**Files:**
- Modify: `src/styles.css`
- Modify: `src/ui/screens/shopScreen.ts`
- Modify: `src/ui/screens/collectionScreen.ts`
- Test: browser behavior through the running Vite application.

**Interfaces:**
- Consumes: existing `.meta-screen`, `.collection-grid`, `.collection-card`, and CSS variables.
- Produces: responsive `.egg-grid`, `.egg-card`, `.egg-inventory`, `.reveal`, `.reveal-card`, `.box-card`, and IV bar presentation.

- [ ] **Step 1: Record the unstyled E2E baseline**

Run: `npm run dev -- --host 127.0.0.1`
Open a fresh-profile browser session at `http://127.0.0.1:5173` and capture the shop and collection screens before CSS changes.
Expected: the new class names exist in the DOM but lack dedicated layout and reveal styling.

- [ ] **Step 2: Add the minimal responsive styles**

Add CSS that uses grid and flex layouts, keeps cards within the viewport, makes the reveal a modal overlay, renders IV tracks with accessible contrast, and switches the game layout to a single column below 900px.
Use existing design tokens only, with rarity color remaining an inline semantic border color from `rarityColor`.

- [ ] **Step 3: Verify the complete Phase 4 browser flow**

Use a fresh save, choose a starter, buy a common egg, hatch it, dismiss the reveal, select the new Pokémon in the loadout, and confirm the home slot hint.
Set a controlled save with a best wave immediately below a milestone, complete a qualifying run or invoke the same persisted result flow, and confirm one egg is granted and cannot be granted twice.
Verify at 1440px and 390px widths with no console errors, clipped controls, overlapping text, or inaccessible buttons.

- [ ] **Step 4: Run the Phase 4 gate**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: 0 failed tests, TypeScript exit zero, and Vite build exit zero.

### Task 3: Upgrade the Vercel CLI

**Files:**
- No repository files should change.

**Interfaces:**
- Consumes: globally installed `vercel` executable.
- Produces: current Vercel CLI available for Phase 7 deployment.

- [ ] **Step 1: Record the current version**

Run: `vercel --version`
Expected: `54.21.0` or another version older than `56.3.1`.

- [ ] **Step 2: Upgrade globally**

Run: `npm i -g vercel@latest`
Expected: npm exits zero.

- [ ] **Step 3: Verify the upgrade**

Run: `vercel --version`
Expected: `56.3.1` or a newer stable version.

### Task 4: Add the canonical PokéAPI snapshot generator

**Files:**
- Create: `tools/generate-pokemon-data.mjs`
- Create: `src/data/generated/pokemon.ts`
- Modify: `package.json`
- Test: `tests/generator.test.ts`

**Interfaces:**
- Produces: `generatePokemonSnapshot({ fetchImpl, firstDex, lastDex }): Promise<CanonicalPokemon[]>`.
- Produces: `CanonicalPokemon` records containing `dex`, `id`, `name`, `types`, `baseStats`, `generation`, `evolvesFrom`, `evolvesTo`, `isLegendary`, `isMythical`, and `captureRate`.

- [ ] **Step 1: Write generator contract tests with fixture fetch responses**

Test that the generator sorts records, uses current Generation IX types, resolves each evolution chain once, rejects duplicate or missing dex numbers, and does not replace output after a failed validation.

- [ ] **Step 2: Run generator tests and confirm RED**

Run: `npx vitest run tests/generator.test.ts`
Expected: FAIL because `tools/generate-pokemon-data.mjs` does not exist.

- [ ] **Step 3: Implement bounded fetching and validation**

Implement exported pure normalization helpers plus a CLI entrypoint.
Use a concurrency limit of 8, three attempts with short exponential backoff, a `Map` keyed by evolution-chain URL, and an atomic temporary output file renamed only after all validation succeeds.
Resolve historical types from `past_types` for records whose current typing includes a post-Generation-III change.

- [ ] **Step 4: Add explicit npm commands**

Add:

```json
"data:generate": "node tools/generate-pokemon-data.mjs",
"data:check": "vitest run tests/generator.test.ts tests/species.test.ts tests/sprites.test.ts"
```

- [ ] **Step 5: Verify generator GREEN**

Run: `npx vitest run tests/generator.test.ts`
Expected: all fixture-based generator tests pass without network access.

### Task 5: Expand the type system and chart to Generation IX

**Files:**
- Modify: `src/types.ts`
- Modify: `src/data/typeChart.ts`
- Modify: `tests/typeChart.test.ts`

**Interfaces:**
- Produces: `TypeName` with `dark`, `steel`, and `fairy`.
- Preserves: `getEffectiveness(attack, defenderTypes): number`.

- [ ] **Step 1: Add failing Dark, Steel, and Fairy chart tests**

Assert Dark is super-effective against Psychic and Ghost, Steel resists Normal, Fairy is super-effective against Fighting, Dragon, and Dark, Dragon has no effect on Fairy, and Poison has no effect on Steel.

- [ ] **Step 2: Confirm RED**

Run: `npx vitest run tests/typeChart.test.ts`
Expected: TypeScript or assertions fail because Fairy is absent.

- [ ] **Step 3: Add Generation IX chart entries and defenses**

Extend `TypeName` and update the sparse chart so every modern interaction involving Dark, Steel, or Fairy is represented.

- [ ] **Step 4: Verify GREEN**

Run: `npx vitest run tests/typeChart.test.ts && npx tsc --noEmit`
Expected: tests and type-check pass.

### Task 6: Download and validate all 1,025 local sprites

**Files:**
- Create: `tools/download-sprites.mjs`
- Create: `public/sprites/387.png` through `public/sprites/1025.png`
- Modify: `tests/sprites.test.ts`

**Interfaces:**
- Produces: `downloadSprites({ firstDex, lastDex, fetchImpl, outputDir }): Promise<void>`.

- [ ] **Step 1: Expand the sprite invariant to 1,025**

Change the test to iterate from 1 through 1025, assert every file exists, and assert every file has a PNG signature and non-zero dimensions.

- [ ] **Step 2: Confirm RED**

Run: `npx vitest run tests/sprites.test.ts`
Expected: FAIL beginning at sprite 387.

- [ ] **Step 3: Implement and run the sprite downloader**

Fetch numeric default sprites from `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/<dex>.png` with bounded concurrency.
Skip existing valid PNG files and write each new file through a temporary sibling before rename.

Run: `node tools/download-sprites.mjs`
Expected: sprites 387 through 1025 are added and all files validate.

- [ ] **Step 4: Verify GREEN**

Run: `npx vitest run tests/sprites.test.ts`
Expected: the 1,025-sprite invariant passes.

### Task 7: Derive and expose all 1,025 runtime species

**Files:**
- Create: `src/data/speciesDerivation.ts`
- Create: `src/data/speciesOverrides.ts`
- Modify: `src/data/species.ts`
- Modify: `src/types.ts`
- Create: `tests/species.test.ts`

**Interfaces:**
- Produces: `deriveSpecies(canonical, override?): SpeciesDef`.
- Produces: `selectEvolution(species, ownerUid): { speciesId: string; atLevel: number } | undefined`.
- Changes: `SpeciesDef.evolvesTo` from one edge to `evolutions?: EvolutionDef[]` where `EvolutionDef` contains `speciesId` and `atLevel`.
- Preserves: `SPECIES`, `getSpecies`, `hasSpecies`, `isBaseSpecies`, `baseSpeciesByRarity`, and `STARTER_IDS`.

- [ ] **Step 1: Add roster invariant tests**

Test exactly 1,025 unique dex numbers, stable unique IDs, allowed Generation IX types, resolved evolution edges, non-empty hatch pools, valid terrain, finite positive combat stats, and local sprite presence.
Test that the same owner UID selects the same branch and that branch selection distributes across Eevee's available Generation IX evolutions.

- [ ] **Step 2: Confirm RED**

Run: `npx vitest run tests/species.test.ts`
Expected: FAIL because the current roster contains only 17 records and the new derivation interfaces do not exist.

- [ ] **Step 3: Implement role templates and deterministic derivation**

Derive role from canonical stats and typing, rarity from legendary flags, capture rate, and family characteristics, and tower values from bounded role templates.
Assign terrain and projectile defaults through explicit type maps.
Preserve existing tuned families as complete overrides.

- [ ] **Step 4: Implement deterministic branching evolution**

Hash `ownerUid` with a stable 32-bit string hash and select `hash % evolutions.length`.
Update `Tower.levelUp()` and `Tower.gainXp()` to call `selectEvolution` instead of reading one `evolvesTo` edge.

- [ ] **Step 5: Verify GREEN**

Run: `npx vitest run tests/species.test.ts tests/balance.test.ts && npx tsc --noEmit`
Expected: roster invariants and existing balance tests pass.

### Task 8: Implement reusable active abilities and HUD controls

**Files:**
- Create: `src/engine/abilities.ts`
- Modify: `src/types.ts`
- Modify: `src/engine/game.ts`
- Modify: `src/engine/tower.ts`
- Modify: `src/ui/gameScreen.ts`
- Modify: `src/styles.css`
- Create: `tests/abilities.test.ts`

**Interfaces:**
- Produces: `activateAbility(game, tower): AbilityActivationResult`.
- Produces: `GameSession.activateAbility(tower): AbilityActivationResult`.
- Produces: `AbilityDef.params` as a typed record for reusable damage, radius, duration, target-count, and status values.

- [ ] **Step 1: Add failing behavior tests**

Cover line blast, area damage, path wave, chain, status burst, no-target rejection, and cooldown rejection with real `GameSession`, `Tower`, and `Enemy` objects.

- [ ] **Step 2: Confirm RED**

Run: `npx vitest run tests/abilities.test.ts`
Expected: FAIL because the executor and activation method do not exist.

- [ ] **Step 3: Implement the minimal reusable executor**

Use a switch over validated ability behavior keys.
Keep targeting and damage resolution inside the engine.
Set `tower.abilityCooldownLeft` only after a successful activation, decrement it in `GameSession.update`, and expose a structured rejection reason.

- [ ] **Step 4: Add the HUD ability button**

Render the button only for towers with abilities.
Show the rounded remaining cooldown, disable it when unavailable, activate on click, and bind the `A` key only while a tower is selected and the focus is not in an input control.

- [ ] **Step 5: Verify GREEN**

Run: `npx vitest run tests/abilities.test.ts && npm test && npx tsc --noEmit`
Expected: all tests and type-check pass.

### Task 9: Expand data-driven enemies and map pools

**Files:**
- Modify: `src/types.ts`
- Modify: `src/data/enemies.ts`
- Modify: `src/data/maps/verdantRoute.ts`
- Modify: `src/data/maps/riverCrossing.ts`
- Modify: `src/data/maps/graniteCave.ts`
- Modify: `src/data/maps/indigoPlateau.ts`
- Modify: `src/engine/enemy.ts`
- Modify: `tests/maps.test.ts`
- Create: `tests/enemies.test.ts`

**Interfaces:**
- Extends: `EnemyDef` with data-defined trait tags and resistance values.
- Preserves: existing enemy lookup and wave pool interfaces.

- [ ] **Step 1: Add enemy and map invariant tests**

Test unique enemy IDs, valid species dex references, valid traits, non-empty regular and boss pools on every map, and the presence of Generation II and III enemies across later routes.

- [ ] **Step 2: Confirm RED**

Run: `npx vitest run tests/enemies.test.ts tests/maps.test.ts`
Expected: FAIL because the expanded roster and traits are absent.

- [ ] **Step 3: Add reusable archetypes and map identities**

Build enemies from fast, swarm, tank, armored, regenerator, spectral, status-resistant, and boss templates.
Populate route pools with species suited to grass, water, cave, and final-challenge identities.
Keep all behavior keyed from trait data rather than names.

- [ ] **Step 4: Verify GREEN**

Run: `npx vitest run tests/enemies.test.ts tests/maps.test.ts tests/waves.test.ts`
Expected: all enemy, map, and wave tests pass.

### Task 10: Add achievements, sound, auto-wave, and persisted settings

**Files:**
- Create: `src/meta/achievements.ts`
- Create: `src/ui/audio.ts`
- Modify: `src/types.ts`
- Modify: `src/meta/save.ts`
- Modify: `src/main.ts`
- Modify: `src/ui/gameScreen.ts`
- Modify: `src/ui/screens/homeScreen.ts`
- Modify: `src/styles.css`
- Create: `tests/achievements.test.ts`
- Modify: `tests/save.test.ts`

**Interfaces:**
- Produces: `AchievementDef`, `unlockedAchievements(save): AchievementDef[]`, and `newlyUnlockedAchievements(before, after): AchievementDef[]`.
- Extends: save settings with `autoWave`, particle preference, and unlocked achievement IDs.
- Produces: an audio controller whose methods never throw when audio playback is unavailable.

- [ ] **Step 1: Add failing migration and achievement tests**

Test migration from version 1, preservation of collection and teams, default settings, deterministic achievement unlocks, and no duplicate unlock IDs.

- [ ] **Step 2: Confirm RED**

Run: `npx vitest run tests/save.test.ts tests/achievements.test.ts`
Expected: FAIL because schema version 2 and achievement functions are absent.

- [ ] **Step 3: Implement schema version 2 and achievements**

Add a small fixed set for first hatch, wave 10, first boss, first clear, six owned Pokémon, 100 total waves, and Indigo Plateau completion.
Do not add a new currency.

- [ ] **Step 4: Implement auto-wave and persisted speed**

Add an Auto checkbox to the run topbar.
When enabled, start the next wave after a short building-phase delay while still allowing placement and upgrades.
Initialize speed and auto-wave from save settings and persist changes through a callback supplied by `main.ts`.

- [ ] **Step 5: Implement resilient audio and restrained particles**

Use local browser-generated oscillator effects or checked-in small assets.
Catch rejected playback promises and honor mute state.
Reuse the existing floating and renderer state for bounded particles instead of adding a second animation loop.

- [ ] **Step 6: Verify GREEN**

Run: `npx vitest run tests/save.test.ts tests/achievements.test.ts && npm test && npx tsc --noEmit`
Expected: tests and type-check pass.

### Task 11: Extend and tune deterministic balance

**Files:**
- Modify: `src/engine/headlessSim.ts`
- Modify: `src/engine/game.ts`
- Modify: `src/waves/scaling.ts`
- Modify: `src/waves/generator.ts`
- Modify: `src/data/constants.ts`
- Modify: `tests/balance.test.ts`

**Interfaces:**
- Extends: headless simulation policy to activate available abilities.
- Preserves: `simulateRun(map, team, runSeed): SimResult`.

- [ ] **Step 1: Add failing per-map balance bands**

For deterministic seed sets, require solo starters to fail early, developed teams to outperform undeveloped teams, and strong high-IV teams with suitable final evolutions to clear wave 50 on every map.

- [ ] **Step 2: Confirm RED**

Run: `npx vitest run tests/balance.test.ts`
Expected: late-game clear assertions fail against the current curve.

- [ ] **Step 3: Teach the simulator to activate abilities**

During each update, activate ready abilities against valid enemies before advancing the simulation.
Keep the policy deterministic.

- [ ] **Step 4: Tune the smallest shared set of knobs**

Adjust wave HP curves, boss multipliers, rewards, deploy costs, and reusable ability parameters only as needed to meet monotonic bands.
Avoid per-species balance exceptions unless an invariant identifies a genuine outlier.

- [ ] **Step 5: Verify GREEN and runtime**

Run: `npx vitest run tests/balance.test.ts`
Expected: all per-map bands pass and the suite completes without excessive runtime or flaky seeds.

### Task 12: Complete visual and browser quality assurance

**Files:**
- Modify only files implicated by observed defects in `src/ui/`, `src/engine/render/`, or `src/styles.css`.

**Interfaces:**
- Produces: a consistent desktop and mobile user experience with no console failures.

- [ ] **Step 1: Run all critical E2E flows locally**

Cover fresh start, starter choice, egg purchase and hatch, collection and loadout, all run controls, ability activation, milestone rewards, defeat, victory, reload persistence, achievements, and muted audio.

- [ ] **Step 2: Inspect visual quality at representative widths**

Inspect 1440px desktop and 390px mobile layouts.
Correct clipped text, overlapping controls, weak hierarchy, inconsistent spacing, illegible contrast, broken sprite scaling, and unstable canvas sizing encountered during these flows.

- [ ] **Step 3: Re-run affected tests after every correction**

Use the narrowest relevant Vitest command during iteration, then run `npm test && npx tsc --noEmit && npm run build` after all corrections.
Expected: clean output and exit zero for every command.

### Task 13: Remove legacy files and document the shipped game

**Files:**
- Delete: `web/app.js`
- Delete: `web/data.js`
- Delete: `web/index.html`
- Delete: `web/styles.css`
- Delete obsolete one-off files under `tools/` only when superseded by the new generator and downloader.
- Modify: `README.md`
- Modify: `HANDOFF.md`

**Interfaces:**
- Produces: current run, test, data generation, controls, save, deployment, and non-affiliation documentation.

- [ ] **Step 1: Verify parity before deletion**

Compare targeting, terrain, statuses, progression, speed, mute, and auto-wave behavior between the rebuild and the legacy reference.
Do not delete `web/` until every retained behavior has an equivalent or an explicit approved replacement.

- [ ] **Step 2: Remove the legacy prototype and superseded tools**

Delete only the verified legacy targets.
Keep `tools/generate-pokemon-data.mjs`, `tools/download-sprites.mjs`, and any currently required sprite validation helper.

- [ ] **Step 3: Rewrite README and handoff documentation**

Document prerequisites, install, dev, tests, build, preview, generation, controls, persistence, architecture, deployment, and the 1,025-species scope.
Add a fan-project, non-affiliation, ownership, and no-monetization notice.
Put each full sentence on its own physical Markdown line.

- [ ] **Step 4: Verify no stale references remain**

Run: `rg -n "cd web|151 species|Phase 4.*IN PROGRESS|does NOT exist|currently empty" README.md HANDOFF.md docs package.json src tests`
Expected: no stale statements describing removed or incomplete behavior.

### Task 14: Final verification and Vercel deployment

**Files:**
- Modify deployment configuration only if the current Vercel CLI reports a concrete incompatibility.

**Interfaces:**
- Produces: verified local build and a deployed static application.

- [ ] **Step 1: Run the complete local gate**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all tests pass, TypeScript exits zero, and Vite emits `dist/` successfully.

- [ ] **Step 2: Preview the exact production build**

Run: `npm run preview -- --host 127.0.0.1`
Repeat the fresh-profile critical browser flow against the preview server.
Expected: no console errors, missing assets, or persistence failures.

- [ ] **Step 3: Resolve the Vercel target safely**

Run: `vercel whoami` and inspect `.vercel/project.json` if it exists.
Stop instead of guessing if authentication or project ownership is ambiguous.

- [ ] **Step 4: Deploy production**

Run: `vercel --prod`
Expected: CLI exits zero and prints the production deployment URL.

- [ ] **Step 5: Smoke-test production**

Open the production URL in a fresh browser profile.
Verify boot, local sprites, starter selection, shop, hatch, loadout, run start, controls, and reload persistence.
Expected: no console or network failures and no runtime PokéAPI requests.

- [ ] **Step 6: Report actual completion state**

Report test counts, type-check and build status, browser flows performed, deployed URL, remaining manual risks, files deleted, and the fact that no commit was created.

# Authored Route and Milestone Capture Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship nine original pixel-art routes with authored habitat pads, 100-wave progression, milestone encounters, and guaranteed first-clear captures.

**Architecture:** Keep the current Vite, TypeScript, DOM, and canvas layers.
Load committed Tiled JSON exports through one validated adapter into `MapConfig`, render an original local tileset beneath combat entities, and keep all placement, wave, and reward behavior deterministic in pure domain modules.

**Tech Stack:** Vite 6, TypeScript 5.6 strict mode, Vitest 3, native DOM and Canvas APIs, Tiled JSON, local SVG map atlas, localStorage, Playwright browser verification, and Vercel static hosting.

## Global Constraints

- Preserve the existing route IDs `verdant_route`, `river_crossing`, `granite_cave`, and `indigo_plateau`.
- Present exactly nine routes in a three-by-three desktop selector.
- Configure exactly 100 waves on every route.
- Use waves 25, 50, 75, and 100 as milestone encounters.
- Grant a rare capture at 25, a power or pseudo-legendary capture at 50, a mythical capture at 75, and a legendary capture at 100 on first clear.
- Give repeat clears an exact 20 percent chance per cleared milestone to grant another copy with fresh IVs.
- Permit deployment only on authored habitat pads.
- Enforce the existing species `allowedTerrain` list against each pad's habitat.
- Keep all Pokémon and map assets local at runtime.
- Do not include ripped or redistributed commercial Pokémon map tiles.
- Preserve current saves through a versioned migration.
- Follow red, green, refactor for every behavior change.
- Commit and push only after the full verification gate at the end of each delivery stage.
- Preserve the unrelated untracked `.superpowers/` directory.
- Do not manually edit generated Pokémon data or generated reports.

---

## Stage 1: Authored Maps, Placement Pads, and Route Selection

### Task 1: Define and validate the authored map contract

**Files:**
- Create: `src/data/maps/tiled.ts`
- Create: `src/data/maps/authored/types.ts`
- Modify: `src/types.ts`
- Modify: `tsconfig.json`
- Modify: `tests/maps.test.ts`

**Interfaces:**
- Produces: `DeploymentPad { id: string; col: number; row: number; terrain: Terrain }`.
- Produces: `MapTheme { palette: string; groundTile: number; pathTile: number }`.
- Produces: `loadAuthoredMap(source: TiledRouteSource, config: RouteRuntimeConfig): MapConfig`.
- Extends: `MapConfig` with `theme`, `tiles`, `decor`, and `deploymentPads`.

- [ ] **Step 1: Write failing authored-map contract tests**

Add these assertions to `tests/maps.test.ts`:

```ts
it("defines nine authored 100-wave routes with safe habitat pads", () => {
  expect(MAPS).toHaveLength(9);
  expect(new Set(MAPS.map((map) => map.id)).size).toBe(9);
  for (const map of MAPS) {
    expect(map.totalWaves).toBe(100);
    expect(map.tiles).toHaveLength(map.rows * map.cols);
    expect(map.deploymentPads.length).toBeGreaterThanOrEqual(10);
    expect(new Set(map.deploymentPads.map((pad) => pad.id)).size).toBe(map.deploymentPads.length);
    for (const pad of map.deploymentPads) {
      expect(pad.col).toBeGreaterThanOrEqual(0);
      expect(pad.col).toBeLessThan(map.cols);
      expect(pad.row).toBeGreaterThanOrEqual(0);
      expect(pad.row).toBeLessThan(map.rows);
      expect(map.terrain[pad.row]![pad.col]).toBe(pad.terrain);
    }
  }
});
```

- [ ] **Step 2: Run the contract test and confirm RED**

Run: `npx vitest run tests/maps.test.ts`
Expected: FAIL because there are four routes and `MapConfig` has no authored tile or pad fields.

- [ ] **Step 3: Add the focused runtime types**

Add to `src/types.ts`:

```ts
export interface DeploymentPad {
  id: string;
  col: number;
  row: number;
  terrain: Terrain;
}

export interface MapTheme {
  palette: string;
  groundTile: number;
  pathTile: number;
}

export interface MapDecor {
  tile: number;
  col: number;
  row: number;
}
```

Extend `MapConfig` with:

```ts
theme: MapTheme;
tiles: number[];
decor: MapDecor[];
deploymentPads: DeploymentPad[];
```

- [ ] **Step 4: Implement strict Tiled export parsing**

Define the narrow source types in `src/data/maps/authored/types.ts` and implement `loadAuthoredMap` so it rejects missing `ground`, `habitat`, `path`, or `pads` layers, invalid layer lengths, duplicate pads, pathless maps, and pads whose habitat disagrees with the habitat layer.
Use exact error messages such as `verdant_route: missing pads layer` and `verdant_route: duplicate pad grass-1` so fixture tests can diagnose invalid exports.
Enable `resolveJsonModule` in `tsconfig.json` so route modules can import committed Tiled exports without unchecked runtime fetches.

- [ ] **Step 5: Add loader fixture tests and verify GREEN**

Create a minimal 2-by-2 Tiled fixture inside `tests/maps.test.ts` and assert one valid conversion plus one duplicate-pad rejection.
Run: `npx vitest run tests/maps.test.ts`
Expected: the loader fixtures pass while the nine-route assertion remains RED until Task 2.

### Task 2: Author nine Tiled routes and the original map atlas

**Files:**
- Create: `public/maps/route-tileset.svg`
- Create: `public/maps/route-tileset.tsx`
- Create: `src/data/maps/authored/verdant-route.json`
- Create: `src/data/maps/authored/river-crossing.json`
- Create: `src/data/maps/authored/granite-cave.json`
- Create: `src/data/maps/authored/ember-caldera.json`
- Create: `src/data/maps/authored/frostbound-lake.json`
- Create: `src/data/maps/authored/shadow-marsh.json`
- Create: `src/data/maps/authored/skygarden-ruins.json`
- Create: `src/data/maps/authored/ancient-sanctuary.json`
- Create: `src/data/maps/authored/indigo-plateau.json`
- Create: `src/data/maps/routeFactory.ts`
- Create: `src/data/maps/emberCaldera.ts`
- Create: `src/data/maps/frostboundLake.ts`
- Create: `src/data/maps/shadowMarsh.ts`
- Create: `src/data/maps/skygardenRuins.ts`
- Create: `src/data/maps/ancientSanctuary.ts`
- Modify: `src/data/maps/verdantRoute.ts`
- Modify: `src/data/maps/riverCrossing.ts`
- Modify: `src/data/maps/graniteCave.ts`
- Modify: `src/data/maps/indigoPlateau.ts`
- Modify: `src/data/maps/index.ts`
- Modify: `src/data/constants.ts`
- Test: `tests/maps.test.ts`
- Test: `tests/enemies.test.ts`

**Interfaces:**
- Consumes: `loadAuthoredMap` from Task 1.
- Produces: nine `MapConfig` values ordered from `verdant_route` through `indigo_plateau`.
- Produces: one local 48-pixel tile atlas with ground, path, water, cliff, fence, vegetation, structure, and habitat-pad tiles.

- [ ] **Step 1: Expand the failing route assertions**

Add an expected ID assertion:

```ts
expect(MAPS.map((map) => map.id)).toEqual([
  "verdant_route",
  "river_crossing",
  "granite_cave",
  "ember_caldera",
  "frostbound_lake",
  "shadow_marsh",
  "skygarden_ruins",
  "ancient_sanctuary",
  "indigo_plateau",
]);
```

Also assert that every route has at least two pad habitats and that `indigo_plateau` has all three.

- [ ] **Step 2: Run the route assertions and confirm RED**

Run: `npx vitest run tests/maps.test.ts tests/enemies.test.ts`
Expected: FAIL because five route modules and all authored exports are missing.

- [ ] **Step 3: Create the original atlas and Tiled tileset definition**

Build `public/maps/route-tileset.svg` on a 384-by-384 view box containing an eight-by-eight grid of 48-pixel tiles.
Use only original rectangles, polygons, circles, and paths aligned to integer coordinates.
Use the approved Moss `#4f8f5b`, Meadow `#79bd68`, Sand `#d7bd72`, Water `#4f91bd`, Stone `#736f68`, and Ink `#182536` palette plus derived highlight and shadow shades.
Set `shape-rendering="crispEdges"` and provide unique tiles for grass, sand path, water, stone, lava, ice, marsh, ruins, fences, shrubs, flowers, rocks, signs, structures, and three pad families.
Point `route-tileset.tsx` at the SVG with `tilewidth="48"`, `tileheight="48"`, `tilecount="64"`, and `columns="8"`.

- [ ] **Step 4: Author the nine deterministic Tiled JSON exports**

Each file must use width 18, height 12, tile width 48, tile height 48, and contain these layers:

```text
ground  tilelayer   216 tile IDs
habitat tilelayer   216 values mapped to grass, water, or mountain
decor   objectgroup atlas tile objects that do not overlap pads
path    objectgroup one polyline whose first or last point exits the board
pads    objectgroup 10 to 16 point objects with id and terrain properties
```

Give each route a distinct path and pad distribution matching the approved biome description.
Keep every pad at least one tile away from the path centerline and reserve readable empty space around entrances and exits.

- [ ] **Step 5: Convert existing route modules to thin runtime configuration**

Use `routeFactory.ts` to combine a Tiled export with the existing enemy pools, boss pools, descriptions, seed salts, and reward multipliers.
Set `WAVES_PER_MAP` to 100.
Use ordered unlock requirements of wave 25 on the immediately preceding route.
Move `indigo_plateau` to ninth without changing its ID.

- [ ] **Step 6: Verify authored route GREEN**

Run: `npx vitest run tests/maps.test.ts tests/enemies.test.ts && npx tsc --noEmit`
Expected: nine route configurations pass all invariants and TypeScript exits zero.

### Task 3: Enforce habitat pads in placement and simulation

**Files:**
- Modify: `src/engine/game.ts`
- Modify: `src/engine/headlessSim.ts`
- Create: `tests/placement.test.ts`

**Interfaces:**
- Produces: `GameSession.padAt(col: number, row: number): DeploymentPad | undefined`.
- Preserves: `GameSession.canPlace` and `GameSession.placeTower` return contracts.

- [ ] **Step 1: Write placement tests before changing the engine**

Create `tests/placement.test.ts` with a starter and assert:

```ts
expect(game.canPlace(uid, nonPad.col, nonPad.row)).toEqual({
  ok: false,
  reason: "Only marked habitat pads can hold Pokémon",
});
expect(game.canPlace(uid, compatible.col, compatible.row).ok).toBe(true);
expect(game.canPlace(uid, incompatible.col, incompatible.row)).toEqual({
  ok: false,
  reason: `${species.name} needs a ${species.allowedTerrain.join(" or ")} pad`,
});
```

Place on the compatible pad and assert a second tower cannot occupy it.

- [ ] **Step 2: Run placement tests and confirm RED**

Run: `npx vitest run tests/placement.test.ts`
Expected: FAIL because non-path terrain cells are still generally placeable.

- [ ] **Step 3: Implement pad-first placement validation**

Add a cached `Map<string, DeploymentPad>` keyed by `tileKey(col, row)` in `GameSession`.
Validate bounds, pad existence, occupancy, habitat compatibility, and affordability in that order.
Use the pad's terrain for favored-terrain calculation.

- [ ] **Step 4: Update headless placement selection**

Score only `game.map.deploymentPads` that accept the team member.
Do not fall back to arbitrary grid cells when no compatible pad is available.

- [ ] **Step 5: Verify placement GREEN**

Run: `npx vitest run tests/placement.test.ts tests/sim.test.ts && npx tsc --noEmit`
Expected: placement and simulation tests pass.

### Task 4: Render pixel routes and placement feedback

**Files:**
- Create: `src/engine/render/mapTiles.ts`
- Modify: `src/engine/render/renderer.ts`
- Modify: `src/ui/gameScreen.ts`
- Modify: `src/styles.css`
- Test: `tests/mapTiles.test.ts`

**Interfaces:**
- Produces: `loadMapAtlas(): Promise<HTMLImageElement>`.
- Produces: `drawMapLayers(ctx, map, atlas): void`.
- Extends: `drawBoard` with selected deployment UID and hovered tile state.

- [ ] **Step 1: Write tile-coordinate and pad-state tests**

Test that tile ID 1 resolves to source rectangle `{ x: 0, y: 0, width: 48, height: 48 }`, tile ID 9 resolves to `{ x: 0, y: 48, width: 48, height: 48 }`, and pad presentation returns `compatible`, `incompatible`, `occupied`, or `idle` from explicit inputs.

- [ ] **Step 2: Run the rendering helpers and confirm RED**

Run: `npx vitest run tests/mapTiles.test.ts`
Expected: FAIL because `src/engine/render/mapTiles.ts` does not exist.

- [ ] **Step 3: Implement layered atlas rendering**

Disable `ctx.imageSmoothingEnabled` and draw the authored ground tile layer, decor objects, pads, combat effects, enemies, and towers in that order.
Keep the existing solid terrain renderer as the atlas-loading fallback so a failed local image never makes the board blank.
Add a deterministic two-frame water shimmer and vegetation sway driven by renderer time, and suppress the ambient frame change when `matchMedia("(prefers-reduced-motion: reduce)").matches` is true.

- [ ] **Step 4: Add interactive pad feedback**

Track the hovered canvas cell in `gameScreen.ts`.
When a team member is selected, draw compatible pads with a bright outline, incompatible pads with a blocked cross glyph, occupied pads with a compact occupied marker, and the hovered pad with a habitat label in the DOM hint.
Add `Q` and `E` keyboard shortcuts to cycle backward and forward through compatible open pads, while preserving `A` for active abilities.

- [ ] **Step 5: Verify renderer GREEN**

Run: `npx vitest run tests/mapTiles.test.ts tests/placement.test.ts && npx tsc --noEmit`
Expected: rendering helpers and placement behavior pass.

### Task 5: Build the three-by-three route selector

**Files:**
- Modify: `src/ui/screens/homeScreen.ts`
- Modify: `src/styles.css`
- Create: `tests/homeScreen.test.ts`

**Interfaces:**
- Consumes: ordered `MAPS`, `isMapUnlocked`, map theme and habitat data.
- Preserves: `HomeAction` and `showHome` promise behavior.

- [ ] **Step 1: Write route-card DOM tests**

Render `showHome` into a test root and assert nine `.map-card` elements, route names, `Best: 0/100`, four milestone medallions, habitat labels, and the wave-25 lock copy.
Set `save.bestWaveByMap.verdant_route = 25`, rerender, click River Crossing, and assert the promise resolves with `{ type: "play", mapId: "river_crossing" }`.

- [ ] **Step 2: Run the selector test and confirm RED**

Run: `npx vitest run tests/homeScreen.test.ts`
Expected: FAIL because the current route cards have no thumbnails, medallions, or habitat summary.

- [ ] **Step 3: Implement the selector card hierarchy**

Add a CSS-rendered pixel thumbnail using each map's theme and path preview, the route name, best wave, habitat chips, milestone states for 25, 50, 75, and 100, and one Play or locked action.
Keep the existing shop, collection, settings, and achievement controls unchanged.

- [ ] **Step 4: Add responsive selector styling**

Use exactly three equal columns above 1100 pixels, two columns from 700 through 1099 pixels, and one column below 700 pixels.
Use square corners, pixel borders, compact labels, and no gradients or glass effects.
Keep all route information visible without relying on hover.

- [ ] **Step 5: Verify selector GREEN**

Run: `npx vitest run tests/homeScreen.test.ts tests/save.test.ts && npx tsc --noEmit`
Expected: route selection and progression tests pass.

### Task 6: Verify, commit, and push Stage 1

**Files:**
- Review all Stage 1 files.

- [ ] **Step 1: Run the full Stage 1 gate**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: zero failed tests, TypeScript exit zero, and Vite build exit zero.

- [ ] **Step 2: Inspect the desktop and mobile map experience**

Run: `npm run dev -- --host 127.0.0.1`.
Verify the route selector and one battlefield at 1440 by 900 and 390 by 844.
Confirm crisp map art, readable paths, limited pads, compatibility feedback, no clipped controls, and no console errors.

- [ ] **Step 3: Review the exact diff**

Run: `git diff --check && git status --short && git diff --stat`.
Confirm `.superpowers/` remains untracked and unstaged.

- [ ] **Step 4: Commit and push Stage 1**

```bash
git add public/maps src/data/maps src/data/constants.ts src/types.ts src/engine src/ui src/styles.css tests
git commit -m "feat: add authored habitat routes"
git push origin feat/gen-1-3-overhaul
```

---

## Stage 2: One-Hundred-Wave Milestones and Captures

### Task 7: Add explicit milestone encounters

**Files:**
- Create: `src/waves/milestones.ts`
- Create: `src/waves/milestonePoolOverrides.ts`
- Modify: `src/types.ts`
- Modify: `src/waves/generator.ts`
- Modify: `src/waves/scaling.ts`
- Modify: `tests/waves.test.ts`
- Modify: `tests/maps.test.ts`

**Interfaces:**
- Produces: `MilestoneTier = "rare" | "power" | "mythical" | "legendary"`.
- Produces: `MilestoneEncounter { wave: 25 | 50 | 75 | 100; tier: MilestoneTier; speciesId: string }`.
- Produces: `milestoneFor(map, waveNumber, runSeed): MilestoneEncounter | undefined`.
- Extends: `WavePlan` with optional `milestone`.

- [ ] **Step 1: Write failing milestone precedence tests**

Assert waves 25, 50, 75, and 100 return tiers `rare`, `power`, `mythical`, and `legendary`, contain one boss spawn matching `milestone.speciesId`, and remain deterministic for a seed.
Assert waves 10, 20, 30, 40, 60, 70, 80, and 90 remain ordinary bosses.

- [ ] **Step 2: Run milestone tests and confirm RED**

Run: `npx vitest run tests/waves.test.ts`
Expected: FAIL because `WavePlan` has no milestone and wave 25 is currently a swarm.

- [ ] **Step 3: Build canonical milestone pools**

Use `CANONICAL_POKEMON` and `SPECIES` to derive eligible default forms.
The rare pool must exclude legendary, mythical, and all records with base-stat total at least 540.
The power pool must include non-legendary, non-mythical final forms with base-stat total at least 540.
The mythical and legendary pools must use the canonical flags exactly.
Filter each pool to species that can resolve through `getSpecies` and local sprite invariants.
Define explicit `rareIncludes`, `rareExcludes`, `powerIncludes`, and `powerExcludes` arrays in `milestonePoolOverrides.ts` for the small number of design exceptions, and validate that every override ID resolves and does not cross into mythical or legendary pools.

- [ ] **Step 4: Generate milestone waves before ordinary boss or swarm branches**

Choose the encounter species with `makeRng(waveSeed(runSeed, wave, map.waveGen.seedSalt)).pick(pool)`.
Spawn a short route-appropriate escort followed by the milestone species with boss modifiers.
Set `isBoss: true` and include the milestone object on the returned plan.

- [ ] **Step 5: Extend four-act scaling without a wave-50 discontinuity**

Introduce `actForWave` and normalize each act around its first wave.
Keep wave health non-decreasing from 1 through 100, cap entity count at 40, cap speed at 1.5 times base, and increase armor at a slower rate after wave 50.

- [ ] **Step 6: Verify milestone GREEN**

Run: `npx vitest run tests/waves.test.ts tests/maps.test.ts && npx tsc --noEmit`
Expected: all 900 generated route waves are non-empty, deterministic, and milestone-correct.

### Task 8: Replace milestone eggs with direct captures and migrate saves

**Files:**
- Create: `src/meta/milestoneCaptures.ts`
- Modify: `src/types.ts`
- Modify: `src/meta/save.ts`
- Modify: `src/meta/runResult.ts`
- Modify: `src/meta/eggs.ts`
- Modify: `tests/eggs.test.ts`
- Modify: `tests/save.test.ts`

**Interfaces:**
- Produces: `MilestoneCaptureRecord = Record<string, Partial<Record<25 | 50 | 75 | 100, boolean>>>`.
- Produces: `CapturedPokemon { pokemon: OwnedPokemon; wave: 25 | 50 | 75 | 100; tier: MilestoneTier; guaranteed: boolean }`.
- Produces: `applyMilestoneCaptures(save, map, previousBest, wavesCleared, runSeed, rand): CapturedPokemon[]`.
- Extends: `AppliedRunResult` with `captures` and removes milestone egg grants from completed runs.

- [ ] **Step 1: Write guaranteed and repeat-capture tests**

Assert a first clear to wave 75 grants exactly the 25, 50, and 75 captures.
Assert applying the same result again grants nothing with `rand = () => 0.2` and grants three repeat captures with `rand = () => 0.199999`.
Assert repeat copies have different UUIDs and independently generated bounded IVs.
Assert every captured species belongs to its declared pool.

- [ ] **Step 2: Write migration tests**

Load a version-2 save with `bestWaveByMap: { verdant_route: 50 }` and `eggDropsClaimedByMap: { verdant_route: 50 }`.
Assert the migrated version marks 25 and 50 as claimed, preserves eggs and collection, and does not mark 75 or 100.
Also omit `eggDropsClaimedByMap` from a version-2 fixture with the same best wave and assert 25 and 50 are still marked, because completed milestones must not regain first-clear rewards.

- [ ] **Step 3: Run capture and migration tests and confirm RED**

Run: `npx vitest run tests/eggs.test.ts tests/save.test.ts`
Expected: FAIL because the new capture record and coordinator do not exist.

- [ ] **Step 4: Implement version-3 migration**

Set `CURRENT_VERSION = 3`.
Add `milestoneCapturesByMap` to `SaveGame` and `freshSave`.
For each old `bestWaveByMap` entry, mark every milestone less than or equal to the old best wave, regardless of whether the legacy numeric egg claim marker is present.
Keep `eggDropsClaimedByMap` readable for backward compatibility but stop writing new milestone egg claims.

- [ ] **Step 5: Implement direct capture application**

Use the same deterministic milestone selection as the encountered wave.
On first clear, guarantee every newly crossed milestone.
On repeat clear, roll independently with `rand() < 0.2` for each milestone at or below `wavesCleared` that was previously claimed.
Create each copy through `makeOwned(speciesId, rollIVs(rand))` and append it to the collection exactly once.

- [ ] **Step 6: Coordinate completed-run rewards atomically**

Capture `previousBest` before `applyRunResult` updates it.
Apply coins, statistics, captures, and persistent XP in `applyCompletedRun`.
Return `{ coinsEarned, newBest, eggsGranted: [], captures }` during the compatibility transition.

- [ ] **Step 7: Verify capture GREEN**

Run: `npx vitest run tests/eggs.test.ts tests/save.test.ts && npx tsc --noEmit`
Expected: first-clear, repeat-clear, IV, pool, idempotency, and migration tests pass.

### Task 9: Present milestone encounters and capture results

**Files:**
- Modify: `src/engine/game.ts`
- Modify: `src/ui/gameScreen.ts`
- Modify: `src/main.ts`
- Modify: `src/styles.css`
- Create: `tests/runResult.test.ts`

**Interfaces:**
- Extends: `GameScreenResult` with `runSeed` and cleared milestone encounter metadata.
- Consumes: `AppliedRunResult.captures`.

- [ ] **Step 1: Write result-presentation data tests**

Assert a controlled wave-25 completed result returns one capture with the encountered species ID, tier, IVs, and `guaranteed: true`.
Assert a repeat result with a failed repeat roll returns an empty capture list.

- [ ] **Step 2: Run result tests and confirm RED**

Run: `npx vitest run tests/runResult.test.ts`
Expected: FAIL because the completed result does not expose captures.

- [ ] **Step 3: Add milestone battle signaling**

When a milestone wave begins, show a compact banner containing `Special encounter`, the tier, the species name, and the milestone number.
Use the local species sprite and keep the banner non-blocking so auto-wave remains functional.

- [ ] **Step 4: Add the capture reveal to the run result**

After `applyCompletedRun`, show captured Pokémon cards before returning home.
Each card must show the sprite, name, tier, wave, guaranteed or repeat label, and three IV values.
If there is no capture, keep the existing concise route result.

- [ ] **Step 5: Verify result GREEN**

Run: `npx vitest run tests/runResult.test.ts tests/eggs.test.ts && npx tsc --noEmit`
Expected: result data and UI integration types pass.

### Task 10: Verify, commit, and push Stage 2

**Files:**
- Review all Stage 2 files.

- [ ] **Step 1: Run the full Stage 2 gate**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: zero failed tests, TypeScript exit zero, and Vite build exit zero.

- [ ] **Step 2: Browser-verify a controlled milestone clear**

Use a controlled save and run seed to start near wave 25.
Confirm the special encounter banner matches the spawned species, the first clear grants it, a repeat failed roll grants nothing, the result is persisted after reload, and no egg is added.

- [ ] **Step 3: Review the exact diff**

Run: `git diff --check && git status --short && git diff --stat`.
Confirm Stage 1 remains committed and `.superpowers/` remains unstaged.

- [ ] **Step 4: Commit and push Stage 2**

```bash
git add src/waves src/meta src/types.ts src/engine src/ui src/main.ts src/styles.css tests
git commit -m "feat: add milestone encounters and captures"
git push origin feat/gen-1-3-overhaul
```

---

## Stage 3: Balance, Browser Polish, Documentation, and Deployment

### Task 11: Rebalance simulations for authored pads and 100 waves

**Files:**
- Modify: `src/engine/headlessSim.ts`
- Modify: `tests/sim.test.ts`
- Modify: `src/data/maps/*.ts`
- Modify: `src/waves/scaling.ts`

**Interfaces:**
- Preserves: `simulateRun(map, team, runSeed): SimResult`.
- Produces: deterministic balance bands for early, developed, and endgame teams.

- [ ] **Step 1: Write failing 100-wave balance bands**

Assert a lone starter fails between waves 5 and 20 on Verdant Route.
Assert a developed six-member type-diverse team reaches at least wave 35 on each route.
Assert a ten-member level-20 max-IV final-stage team clears all 100 waves on all nine routes for the fixed seeds already used by the suite.

- [ ] **Step 2: Run simulation tests and confirm RED**

Run: `npx vitest run tests/sim.test.ts`
Expected: at least the 100-wave endgame assertions fail before tuning.

- [ ] **Step 3: Tune only central scaling and per-map knobs**

Adjust act multipliers, wave-clear gold, milestone boss HP, reward multipliers, and per-map wave parameters.
Do not change species stats merely to force the simulator green.
Keep entity count capped at 40 and do not reduce the 15-life rule.

- [ ] **Step 4: Verify deterministic simulation GREEN**

Run: `npx vitest run tests/sim.test.ts tests/waves.test.ts`
Expected: all balance bands pass twice consecutively with identical results.

### Task 12: Complete visual and accessibility verification

**Files:**
- Modify only if browser evidence exposes defects: `src/styles.css`, `src/ui/gameScreen.ts`, `src/ui/screens/homeScreen.ts`, `src/engine/render/renderer.ts`.

- [ ] **Step 1: Run the production-like preview**

Run: `npm run build && npm run preview -- --host 127.0.0.1`.
Expected: Vite serves the production build without console errors.

- [ ] **Step 2: Verify desktop presentation at 1440 by 900**

Check the nine-card selector, locked and unlocked cards, one meadow battlefield, one water battlefield, one mountain battlefield, pad states, range overlay, milestone banner, and capture reveal.
Reject visible seams, blurry atlas scaling, obscured enemies, clipped controls, weak contrast, or decorative objects that resemble deployment pads.

- [ ] **Step 3: Verify mobile presentation at 390 by 844**

Check selector scrolling, battlefield scaling, sidebar ordering, touch placement, result cards, and all primary actions.
Confirm no horizontal page overflow and no text smaller than the existing utility-size floor.

- [ ] **Step 4: Verify keyboard and reduced-motion behavior**

Tab through all DOM controls, use `Q` and `E` to cycle pads, use `A` for an ability, and confirm visible focus.
Enable reduced motion and confirm ambient map motion stops without suppressing required combat or placement feedback.

- [ ] **Step 5: Fix observed defects and rerun focused checks**

For every defect, reproduce it in the browser, add a focused test when the behavior is automatable, apply the smallest fix, and repeat the affected viewport check.

### Task 13: Update handoff and deploy production

**Files:**
- Modify: `HANDOFF.md`
- Modify: `README.md`

- [ ] **Step 1: Update player and maintainer documentation**

Document nine routes, 100 waves, habitat-pad placement, milestone capture rules, the original map-asset policy, Tiled JSON maintenance, the atlas location, verification commands, and current balance bands.
Keep each complete Markdown sentence on its own physical line.

- [ ] **Step 2: Run the final local gate**

Run: `npm test && npx tsc --noEmit && npm run build && git diff --check`
Expected: zero failed tests, TypeScript exit zero, Vite build exit zero, and no whitespace errors.

- [ ] **Step 3: Deploy through the linked Vercel project**

Run: `vercel --prod --yes`.
Expected: production deploy completes for the linked `navaneethbv/tower-defense` project.

- [ ] **Step 4: Smoke-test production**

Open `https://tower-defense-navy.vercel.app` in a fresh profile.
Verify root delivery, local atlas and Pokémon sprites, nine route cards, starter persistence, one deployment-pad interaction, desktop layout, mobile layout, and immutable caching for map and sprite assets.

- [ ] **Step 5: Review the exact Stage 3 diff**

Run: `git status --short && git diff --stat && git diff --check`.
Confirm only Stage 3 tuning, fixes, and documentation remain uncommitted.

- [ ] **Step 6: Commit and push Stage 3**

```bash
git add src tests README.md HANDOFF.md
git commit -m "feat: balance and ship 100-wave routes"
git push origin feat/gen-1-3-overhaul
```

- [ ] **Step 7: Verify the pushed branch and deployment**

Run: `git status --short --branch && git log -4 --oneline --decorate && vercel inspect https://tower-defense-navy.vercel.app`.
Expected: the branch matches origin, only `.superpowers/` remains untracked, and the production deployment reports Ready.

## Deferred Independent Stage

GitHub Actions for lint, test, and build, SonarCloud analysis, branch protection, and repository rules are intentionally excluded from this gameplay plan.
They require a separate approved operational design because GitHub repository mutations and SonarCloud secrets are independent of the game implementation.

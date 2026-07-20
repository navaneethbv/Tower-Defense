# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Vite dev server on http://localhost:5173
npm test             # full vitest suite
npm run test:watch   # vitest in watch mode
npm run test:coverage # coverage with 95% gate (statements/branches/functions/lines)
npm run lint         # eslint
npm run build        # tsc --noEmit, then vite build
npm run preview -- --host 127.0.0.1  # serve the exact production output
```

Run a single test file or a single case:

```bash
npx vitest run tests/balance.test.ts
npx vitest run tests/waves.test.ts -t "swarm"
```

Asset and data pipelines (development-time only, never run at runtime):

```bash
npm run data:generate      # regenerate src/data/generated/pokemon.ts from PokeAPI
npm run sprites:download   # fetch missing sprites into public/sprites/
npm run data:check         # validate generated data and sprite coverage
node tools/generate-route-maps.mjs  # validate authored route JSON against the loader contract
```

Dev-only QA routes: `?__qaMaps=1` opens a gallery of all nine battlefields at full board size; `?__qaCapture=<25|50|75|100>` jumps straight to a milestone capture screen.

## Architecture

Vanilla TypeScript with no UI framework. Canvas for the battlefield, plain DOM for everything else.

### Layering and the one-way dependency rule

```
src/data/   pure records: generated dex, curated species, authored maps, enemies, type chart
src/waves/  seeded wave generation and shared scaling curves
src/engine/ deterministic simulation: session, towers, enemies, combat, abilities, rendering
src/meta/   persisted progression: saves, collection, eggs, economy, achievements
src/ui/     screens, battle HUD, audio
```

The engine never touches `localStorage` or the DOM outside of `src/engine/render/`.
`src/main.ts` is the only place that bridges persisted meta progression into an isolated game session, and it is the sole owner of the top-level flow: starter pick once, then a `while (true)` loop of home hub, loadout, run, apply results.
A `GameSession` receives a team and a run seed, and returns a result; it knows nothing about saves.

### Determinism is a hard invariant

Every run is reproducible from its seed.
`src/waves/rng.ts` provides a mulberry32 PRNG plus `waveSeed(runSeed, waveNumber, salt)`, which derives a stable per-wave seed.
`GameSession` holds a separate `combatRng` seeded from `runSeed ^ 0x9e3779b9` so combat rolls do not perturb wave generation.
`src/engine/loop.ts` runs a fixed 1/60 timestep with a speed multiplier, so 1x/2x/3x produce identical simulations.

Never introduce `Math.random()`, `Date.now()`, or frame-rate-dependent math into `src/engine/` or `src/waves/`.
`tests/balance.test.ts` and `src/engine/headlessSim.ts` depend on this: the simulator plays full routes headlessly to check balance, and it would go flaky the moment determinism breaks.

### Species data has two sources that merge

`src/data/generated/pokemon.ts` is a checked-in snapshot of all 1,025 National Dex entries and is machine-generated.
Do not edit it by hand; change `tools/generate-pokemon-data.mjs` and rerun `npm run data:generate`.

`src/data/species.ts` holds a hand-tuned `CURATED_SPECIES` list (starter lines and staples) and layers it over the generated snapshot via `deriveSpecies` in `speciesDerivation.ts`.
Derivation maps canonical types and stats onto gameplay concepts (role, rarity, terrain, ability, on-hit status), so an uncurated species still gets a coherent kit.
To tune a specific Pokemon, add or edit its curated entry.
To change how the other thousand behave, edit the derivation rules.

### Maps are authored Tiled JSON, not code

`src/data/maps/authored/*.json` is the source of truth for all nine 18x12 battlefields and is no longer generated.
`tiled.ts` loads it, `routeFactory.ts` wraps it with runtime config (`makeRoute`/`makeWaveGen`), and each `<route>.ts` file is a thin binding of the two.
`validation.ts` enforces the loader contract; `tileCatalog.ts` describes the shared 8x8 atlas.

The atlas has a trap worth remembering: several tiles bake their edges into all four sides, so they only work as objects or borders.
Tiles 3, 4, 20, 21, 31, and 32 tile seamlessly and are safe for interiors.
Tiles 14, 42, 44, 45, 48, 50, and 51 do not, and will show seams or a grass fringe if used to fill a region.

### Save schema and migration

Saves live under the `ptd.save` localStorage key at `CURRENT_VERSION = 3`.
`migrate()` in `src/meta/save.ts` transforms v(n) to v(n+1) in steps and defaults any new field from `freshSave()`.
Adding a persisted field means bumping the version, extending `freshSave`, and adding a migration step plus coverage in `tests/save.test.ts`.

## Testing conventions

Vitest runs in the default node environment; there is no jsdom.
DOM-rendering code is therefore not unit tested directly.
The pattern is to export a pure view-model function next to the renderer and test that: see `routeCardView` in `homeScreen.ts`, and the whole of `statusPresentation.ts`, `redeployment.ts`, and `mapThumbnail.ts`.
When adding UI logic, push the decisions into a pure function so it stays testable.

Coverage thresholds apply to `src/data`, `src/engine`, `src/meta`, and `src/waves` only.
`src/ui`, `src/main.ts`, `src/types.ts`, `src/engine/loop.ts`, `src/engine/render/`, and generated or authored data are excluded, so new engine and meta logic needs tests to keep the gate green.

## Constraints

TypeScript is strict, including `noUncheckedIndexedAccess`, so indexed access needs a `!` or a guard.
The production build is fully static and must never call PokeAPI at runtime; sprites and dex data are served locally.
This is a non-commercial fan project. Do not add monetization, and do not copy mainline Pokemon map assets into the route atlas.

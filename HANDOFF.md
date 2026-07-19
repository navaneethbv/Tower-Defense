# Pokemon Route Defense Handoff

This file describes the current Vite and TypeScript implementation.
The implementation plan is in `docs/superpowers/plans/2026-07-18-gen-1-3-overhaul.md`.
The legacy `gen-1-3` filename is retained for history, but the implemented scope covers Generations I through IX.
Commit and push each completed implementation stage as requested by the user.

## Current state

The planned gameplay phases are code-complete locally.
The roster contains exactly 1,025 unique default-form National Dex species.
All sprites are served locally from `public/sprites/`.
The runtime makes no PokeAPI requests.
The modern 18-type chart includes Dark, Steel, and Fairy.

Implemented systems include egg purchasing and hatching, IVs, milestone captures and drops, collection XP, loadouts, slot unlocks, branching evolution, reusable active abilities, expanded enemies, nine route pools, save migration, achievements, audio, battle effects, persisted speed, and auto-wave.
Every route has 100 deterministic waves and authored habitat art.
Only sparse authored pads can be populated, and each Pokemon is restricted to compatible terrain.
Waves 25, 50, 75, and 100 use deterministic special encounter pools, culminating in a legendary battle.
First clears guarantee the encountered Pokemon, while repeat clears roll an independent 20 percent capture chance and generate new IVs.
Combat and wave generation are deterministic for a given run seed.
The headless simulator activates abilities and verifies early, developed, and endgame balance bands on every map.

## Verification commands

```bash
npm test
npx tsc --noEmit
npm run build
npm run preview -- --host 127.0.0.1
```

The current automated gate contains 139 passing tests across 21 files.
The browser flow has been inspected at 1440 by 900 and 390 by 844.
The verified flow covers home settings, reload persistence, route selection, loadout selection, mouse and keyboard deployment, milestone presentation, capture reveal, auto-wave start, and 3x speed.
Earlier Phase 4 browser verification also covered starter selection, egg purchase, hatch reveal, collection display, and loadout use.

## Data maintenance

Regenerate the canonical Pokemon snapshot with `npm run data:generate`.
Refresh local sprites with `npm run sprites:download`.
Run `npm run data:check` after either operation.
The generator fetches only during development, uses bounded concurrency and retries, validates all 1,025 dex records, and replaces output atomically.
Do not manually edit `src/data/generated/pokemon.ts` or generated reports.

Regenerate the nine authored route maps and the shared original atlas with `node tools/generate-route-maps.mjs`.
The checked-in Tiled-compatible map JSON lives under `src/data/maps/authored/`.
The shared SVG, PNG, and TSX atlas lives under `public/maps/`.
PokeAPI supplies Pokemon data and battle sprites, but it does not supply the complete route-map tileset used by the game.

## Balance notes

A lone starter averages wave 14.8 on Verdant Route across the fixed balance seeds.
Broader and more developed teams progress farther.
A developed six-member team reaches at least wave 35 on every route across the fixed balance seeds.
A six-member status-specialist team also reaches at least wave 35 on every route across the fixed balance seeds.

Status specialists take a 20 percent direct-damage cut through `SPECIALIST_DAMAGE_MULTIPLIER` in `src/data/speciesDerivation.ts`.
Tuning settled on `0.80` rather than `0.75` because a specialist team could not hold Ember Caldera at the deeper cut.

Two structural constraints shape any status-specialist team and are worth knowing before retuning.
Water-typed Pokemon attack as water, and water has no status kit, so only poison/water, ice/water, and fire/water duals can hold a water pad at all; there are eight such specialists in the entire roster.
Shadow Marsh's spectral enemies are only hittable by ghost, psychic, or super-effective attacks, so a specialist team needs three spectral-capable attackers there rather than two.
A type-diverse team of ten max-IV, level-20 final-stage Pokemon clears all 100 waves on every route across the fixed test seeds.
The act pressure term in `src/waves/scaling.ts` keeps early waves approachable while preserving meaningful pressure across the full route.
Persistent collection levels grant up to a 100 percent in-run damage bonus.

## Deployment state

Vercel CLI was upgraded from 54.21.0 to 56.3.1.
The local checkout is linked to `navaneethbv/tower-defense`.
The production deployment is live at `https://tower-defense-navy.vercel.app`.
Production boot, local starter sprites, starter persistence, desktop layout, mobile layout, root delivery, and immutable sprite caching were smoke-tested successfully.

## Repository controls

The `Quality` GitHub Actions workflow runs independent Lint, Test, Build, and SonarCloud jobs.
Tests enforce the existing 95 percent coverage thresholds and upload LCOV for SonarQube Cloud analysis.
The SonarQube Cloud project key is `navaneethbv_Tower-Defense`, and analysis requires a repository `SONAR_TOKEN` secret that is not currently configured.
The SonarCloud job remains non-blocking and writes a setup notice until that secret exists.
Dependabot checks npm and GitHub Actions weekly, and `CODEOWNERS` assigns the repository to `@navaneethbv`.
The `main` branch is protected by required pull requests, Lint, Test, and Build checks, resolved conversations, linear history, and force-push and deletion prevention.

## Working tree

The gameplay work is split into stage commits and pushed after every completed stage.
The current stage adds full-route balance validation, production browser verification, documentation, and deployment.

## Redeployment, starters, and status specialists

The suite is 186 tests across 25 files.
Coverage is 99.88 percent statements, 97.82 percent branches, 100 percent functions, and 99.88 percent lines, all above the 95 percent thresholds.

Stage 1 shipped state-preserving redeployment in `a4ce7fc` and `f825df9`.
Stage 2 shipped the generation-grouped starter picker in `a615657` and `7ae3399`.
Stage 3 shipped the status engine, roster profiles, presentation, and balance in `8700c1b`, `49e64db`, `3ac4cfb`, `cac7113`, `93629de`, and `a60a915`.
The production deployment for this work is `dpl_745MFqb9EE5rTM3m2uakN8JS6YGa`, aliased to `https://tower-defense-navy.vercel.app`.
A preceding fix in `dfcd5b4` cleared nine pre-existing `no-explicit-any` lint errors in `tests/tiled.test.ts` that were already failing the `Quality` workflow's Lint job before this work began.

The `Quality` workflow then failed once with `[vitest-worker]: Timeout calling "onTaskUpdate"` while all 186 tests passed and coverage held.
`simulateRun` is synchronous and CPU-bound, so chaining thirty runs inside one test starved the worker's reporter RPC on a two-core runner.
The balance helpers now yield to the macrotask queue between runs, which left every seed, assertion, and reported balance number unchanged.
Keep that yield in place when adding further simulation-heavy tests.

Browser verification ran at 1440 by 900 and 390 by 844 on Chrome.
It covered mid-wave redeployment by mouse and by `Q`, `E`, and `Enter`, `Escape` cancellation, the 5-second cooldown veil and attack and ability lockout, all nine starter generation tabs with keyboard navigation, Generation 9 starter selection on a fresh profile, the two-column mobile starter grid, status chips on live enemies, and the selected-tower status description.
The browser console reported no warnings or errors from the application.

Pikachu is deliberately offered as a Generation 1 starter even though Pichu evolves into it, so `tests/starters.test.ts` records it as the single allowed exception to the base-stage invariant.

## Full authored map density overhaul

The suite is 207 tests across 28 files.
Coverage is 99.7 percent statements, 97.16 percent branches, 99.47 percent functions, and 99.7 percent lines, all above the 95 percent thresholds.

The nine battlefields are now fully authored from the checked-in pixel-art atlas.
The map contract gained a `pathTiles` layer, semantic `landmarks` with validated roles, and a per-pad `tile`, all enforced by the Tiled loader.

Stage commits: `1992b26` map contract, `b6774f8` composition validation, `7daff10` renderer layers, `67b5af4` atlas restore and first three routes, `e308bdb` river and cave corrections, `5e541cb` volcanic frozen and marsh routes, `77c4afc` endgame routes, `6673a7c` route thumbnails.

`7daff10` was a wrong turn worth recording.
It replaced the authored GBA pixel-art tileset with a generated flat-vector SVG on a 12-by-12 grid, because the repository contained both a stale minimalist SVG and the real PNG that `87d1501` had introduced.
`67b5af4` restored the PNG as the runtime atlas and returned the catalog to its real 8-by-8 layout.
Treat `public/maps/route-tileset.png` as the authored art.

Several atlas tiles bake their edges into all four sides and must not be used as interior fill.
Tiles 3, 4, 20, 21, 31, and 32 tile seamlessly; 14, 42, 44, 45, 48, 50, and 51 do not.
Tile 51 punched dark banks through the river, tile 42 drew a green grid across the cave floor, and tile 2 outlined cave corridors in grass green because it is a path-on-grass tile.
Tiling a candidate three-by-three and looking at it settles this in seconds.

Deployment-pad geometry drives the difficulty bands, which the plan did not mention.
`headlessSim` always deploys onto the highest-coverage pad, so one pocket where the route wraps a cell lets a lone starter hold an entire map.
Pad slots are therefore derived from the route and capped by path coverage, and each route's cap and front-line ratio were fitted against the real bands.
Verdant Route sits at 19.2 waves against a ceiling of 20, so re-check that route first when pad placement changes.

`tests/abilities.test.ts` previously hard-coded a path distance of 432 that happened to sit beside the tower on the old Verdant geometry; re-authoring moved it out of range.
It now derives that distance from the map, so future route changes cannot silently void the assertion.

The plan called for DOM tests covering the route cards and the gallery, but this project has no DOM test environment and excludes `src/ui` from coverage.
The pure renderer is unit tested and both surfaces were verified in the browser instead.

Browser verification ran at 1440 by 900 and 390 by 844 on Chrome.
It covered the route selector with nine real map thumbnails, the development gallery at `?__qaMaps=1` showing all nine battlefields, and a live Verdant Route wave confirming enemies follow the authored corridor and that compatible and incompatible pad states stay legible over the terrain.
The browser console reported no warnings or errors from the application.

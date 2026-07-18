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

The current automated gate contains 138 passing tests across 21 files.
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

A lone starter averages wave 12.2 on Verdant Route across the fixed balance seeds.
Broader and more developed teams progress farther.
A developed six-member team reaches at least wave 35 on every route across the fixed balance seeds.
A type-diverse team of ten max-IV, level-20 final-stage Pokemon clears all 100 waves on every route across the fixed test seeds.
The act pressure term in `src/waves/scaling.ts` keeps early waves approachable while preserving meaningful pressure across the full route.
Persistent collection levels grant up to a 100 percent in-run damage bonus.

## Deployment state

Vercel CLI was upgraded from 54.21.0 to 56.3.1.
The local checkout is linked to `navaneethbv/tower-defense`.
The production deployment is live at `https://tower-defense-navy.vercel.app`.
Production boot, local starter sprites, starter persistence, desktop layout, mobile layout, root delivery, and immutable sprite caching were smoke-tested successfully.

## Working tree

The gameplay work is split into stage commits and pushed after every completed stage.
The current stage adds full-route balance validation, production browser verification, documentation, and deployment.

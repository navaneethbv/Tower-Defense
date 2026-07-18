# Pokemon Route Defense Handoff

This file describes the current Vite and TypeScript implementation.
The implementation plan is in `docs/superpowers/plans/2026-07-18-gen-1-3-overhaul.md`.
The legacy `gen-1-3` filename is retained for history, but the implemented scope covers Generations I through IX.
Do not commit unless the user explicitly asks.

## Current state

Phases 4 through 7 are code-complete locally.
The roster contains exactly 1,025 unique default-form National Dex species.
All sprites are served locally from `public/sprites/`.
The runtime makes no PokeAPI requests.
The modern 18-type chart includes Dark, Steel, and Fairy.

Implemented systems include egg purchasing and hatching, IVs, milestone drops, collection XP, loadouts, slot unlocks, branching evolution, reusable active abilities, expanded enemies, four route pools, save migration, achievements, audio, battle effects, persisted speed, and auto-wave.
Combat and wave generation are deterministic for a given run seed.
The headless simulator activates abilities and verifies early, developed, and endgame balance bands on every map.

## Verification commands

```bash
npm test
npx tsc --noEmit
npm run build
npm run preview -- --host 127.0.0.1
```

The current automated gate contains 66 passing tests across 14 files.
The browser flow has been inspected at 1440 by 900 and 390 by 844.
The verified flow covers home settings, reload persistence, loadout selection, deployment, auto-wave start, and 3x speed.
Earlier Phase 4 browser verification also covered starter selection, egg purchase, hatch reveal, collection display, and loadout use.

## Data maintenance

Regenerate the canonical Pokemon snapshot with `npm run data:generate`.
Refresh local sprites with `npm run sprites:download`.
Run `npm run data:check` after either operation.
The generator fetches only during development, uses bounded concurrency and retries, validates all 1,025 dex records, and replaces output atomically.
Do not manually edit `src/data/generated/pokemon.ts` or generated reports.

## Balance notes

A lone starter fails near wave 8 on Verdant Route.
Broader and more developed teams progress farther.
A type-diverse team of ten max-IV, level-20 final-stage Pokemon clears all 50 waves on every route across the fixed test seeds.
The late-game relief term in `src/waves/scaling.ts` keeps the first ten waves demanding while preventing exponential HP from making route completion impossible.
Persistent collection levels grant up to a 100 percent in-run damage bonus.

## Deployment state

Vercel CLI was upgraded from 54.21.0 to 56.3.1.
The local checkout is linked to `navaneethbv/tower-defense`.
The production deployment is live at `https://tower-defense-navy.vercel.app`.
Production boot, local starter sprites, starter persistence, desktop layout, mobile layout, root delivery, and immutable sprite caching were smoke-tested successfully.

## Working tree

No commit has been created for this implementation pass.
The removed `web/` directory was the superseded prototype.
Obsolete one-off sprite processing scripts were removed, while the maintained generator, downloader, typings, and generated audit report were preserved.

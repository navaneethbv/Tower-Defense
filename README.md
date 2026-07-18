# Pokemon Route Defense

Pokemon Route Defense is a browser tower-defense game built with Vite, TypeScript, the Canvas API, and native DOM controls.
It includes all 1,025 National Dex species from Generations I through IX as playable default-form Pokemon.
The deployed game is fully static and never calls PokeAPI at runtime.

Play the production build at [tower-defense-navy.vercel.app](https://tower-defense-navy.vercel.app).

## Features

- Four 50-wave routes with distinct terrain, enemy pools, unlock requirements, and bosses.
- All 1,025 default-form National Dex species with modern Generation IX types.
- Local Pokemon sprites for deterministic loading and offline-friendly production builds.
- Egg purchasing, rarity pools, hatching, IVs, a persistent collection, and team loadouts.
- In-run deployment, targeting modes, upgrades, evolution, selling, statuses, and active abilities.
- Persistent speed, auto-wave, audio mute, and battle-effect preferences.
- Seven progress achievements, route records, milestone egg drops, collection XP, and Pokecoin rewards.
- Deterministic wave generation and headless balance simulation across every route.

## Requirements

- Node.js 20 or newer.
- npm 10 or newer.

## Local development

Install dependencies and start the Vite development server.

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Verification

Run the complete automated test suite.

```bash
npm test
```

Run the TypeScript check and production build.

```bash
npx tsc --noEmit
npm run build
```

Preview the exact production output locally.

```bash
npm run preview -- --host 127.0.0.1
```

The balance suite can also be run independently.

```bash
npx vitest run tests/balance.test.ts
```

## Controls

- Select a team member, then click a legal terrain tile to deploy it.
- Select a deployed tower to change targeting, upgrade it, sell it, or inspect its active ability.
- Press `A` to activate the selected tower's ready ability.
- Use the topbar to start a wave, set 1x to 3x simulation speed, or enable auto-wave.
- Configure sound, battle effects, and the default auto-wave state from the home screen.

## Pokemon data pipeline

The checked-in runtime snapshot and sprites are generated during development, not fetched by the application.
Generation uses PokeAPI species, Pokemon, and evolution-chain resources for National Dex entries 1 through 1025.
The generator validates continuous and unique dex coverage before replacing the TypeScript snapshot.
Network results are cached under `.cache/` to make repeated generation safer and faster.

Regenerate the canonical snapshot.

```bash
npm run data:generate
```

Download or validate local default sprites.

```bash
npm run sprites:download
npm run data:check
```

Do not manually edit `src/data/generated/pokemon.ts`.

## Architecture

- `src/data/` contains generated records, curated species overrides, maps, enemies, constants, and the type chart.
- `src/engine/` contains deterministic combat, towers, enemies, abilities, rendering, and the headless simulator.
- `src/waves/` contains seeded wave generation and shared scaling rules.
- `src/meta/` contains saves, achievements, eggs, economy, collection progression, and run-result coordination.
- `src/ui/` contains the application screens, battle HUD, components, and resilient browser audio.
- `tools/` contains the maintained Pokemon data and sprite generation utilities.
- `tests/` contains unit, invariant, migration, economy, and deterministic balance coverage.

The engine does not access browser storage.
The UI and top-level application flow bridge persisted meta progression to isolated game sessions.

## Save data

Progress is stored locally under the `ptd.save` localStorage key.
The current schema is version 2 and migrates older partial saves while preserving nested settings, collections, and teams.
Clearing browser site data resets progress.

## Deployment

The project builds to a static `dist/` directory and includes Vercel configuration for asset caching.
The production project is linked as `navaneethbv/tower-defense`.

```bash
vercel --prod
```

## Fan project notice

This is a free, non-commercial fan project created for educational and entertainment purposes.
Pokemon and all related names, characters, artwork, and trademarks are owned by Nintendo, The Pokemon Company, Game Freak, and their respective rights holders.
This project is not affiliated with, endorsed by, sponsored by, or approved by those rights holders.
Do not monetize or sell this project or its included Pokemon assets.

# Pokemon Route Defense

Pokemon Route Defense is a browser tower-defense game built with Vite, TypeScript, the Canvas API, and native DOM controls.
It includes all 1,025 National Dex species from Generations I through IX as playable default-form Pokemon.
The deployed game is fully static and never calls PokeAPI at runtime.

Play the production build at [tower-defense-navy.vercel.app](https://tower-defense-navy.vercel.app).

## Features

- Nine authored 100-wave routes with distinct habitats, enemy pools, unlock requirements, and bosses.
- Sparse deployment pads and species-specific terrain compatibility make placement part of the strategy.
- All 1,025 default-form National Dex species with modern Generation IX types.
- Local Pokemon sprites for deterministic loading and offline-friendly production builds.
- Egg purchasing, rarity pools, hatching, IVs, a persistent collection, and team loadouts.
- In-run deployment, targeting modes, upgrades, evolution, selling, statuses, and active abilities.
- Free mid-wave redeployment: a deployed Pokemon keeps its level, XP, evolution, targeting, and investment, and pays only a 5-second cooldown during which it cannot attack or use its ability.
- Twenty-eight starter choices grouped by generation: the traditional Grass, Fire, and Water trio from Generations 1 through 9, plus Pikachu.
- Eleven status effects: burn, poison, toxic, paralysis, freeze, sleep, confusion, slow, stun, armor break, and curse.
- Status specialists trade roughly 20 percent direct damage for stronger status chance, duration, and magnitude, derived across the full roster from canonical types and stats.
- Bosses and milestone enemies remain susceptible to every status, but freeze, sleep, stun, and paralysis interruptions last half as long against them and toxic growth uses a lower cap, so control never becomes permanent.
- All status timing is deterministic for a fixed run seed, including paralysis and confusion interruptions, so runs replay identically.
- Persistent speed, auto-wave, audio mute, and battle-effect preferences.
- Seven progress achievements, route records, milestone captures, milestone egg drops, collection XP, and Pokecoin rewards.
- Rare encounters appear at wave 25, powerful encounters at wave 50, mythical encounters at wave 75, and legendary encounters at wave 100.
- A milestone Pokemon is guaranteed on its first clear, while repeat clears have an independent 20 percent capture chance with fresh IVs.
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
- Press `Q` or `E` to cycle legal deployment pads, then press `Enter` to deploy the selected Pokemon.
- Select a deployed tower to change targeting, upgrade it, sell it, redeploy it, or inspect its active ability.
- Press `Redeploy` on a selected tower to move it, including during an active wave.
- While moving, click a highlighted pad, or press `Q` and `E` to cycle destinations and `Enter` to confirm.
- Press `Escape`, or select the moving tower again, to cancel a redeployment.
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

## Route map pipeline

The nine 18-by-12 battlefields are fully authored Tiled-compatible maps under `src/data/maps/authored/`.
Each route carries original ground, path, landmark, decor, habitat, and deployment-pad layers, all rendered from the shared 8-by-8 pixel atlas.
Route cards render miniature versions of the same authored map data used by combat, so a card shows the battlefield the player will actually fight on.
The atlas is stored as `public/maps/route-tileset.png`, described to Tiled by `public/maps/route-tileset.tsx`.
The route art is inspired by classic handheld route readability, but it does not copy PokePath or mainline Pokemon map assets.

Several atlas tiles bake their edges into all four sides, so they only work as objects or borders and will show seams or a grass fringe if used to fill a region.
Tiles 3, 4, 20, 21, 31, and 32 tile seamlessly and are the safe choice for interiors; 14, 42, 44, 45, 48, 50, and 51 do not.
Tile 2 is a path-on-grass tile, which is why cave corridors use the seamless brick instead.

The authored JSON is the source of truth and is no longer generated.
This command validates that every committed export still satisfies the loader contract:

```bash
node tools/generate-route-maps.mjs
```

Set `?__qaMaps=1` on the dev server to open a development-only gallery rendering all nine battlefields at full board size for side-by-side review.

Pokemon battle sprites are downloaded from the PokeAPI sprite repository during development and served locally in production.
PokeAPI does not provide complete route-map tilesets, buildings, paths, fences, or other world art, so the route atlas is maintained by this project.

## Architecture

- `src/data/` contains generated records, curated species overrides, authored maps, enemies, constants, and the type chart.
- `src/engine/` contains deterministic combat, towers, enemies, abilities, rendering, and the headless simulator.
- `src/waves/` contains seeded wave generation and shared scaling rules.
- `src/meta/` contains saves, achievements, eggs, economy, collection progression, and run-result coordination.
- `src/ui/` contains the application screens, battle HUD, components, and resilient browser audio.
- `tools/` contains the maintained Pokemon data, sprite, and route generation utilities.
- `tests/` contains unit, invariant, migration, economy, and deterministic balance coverage.

The engine does not access browser storage.
The UI and top-level application flow bridge persisted meta progression to isolated game sessions.

## Save data

Progress is stored locally under the `ptd.save` localStorage key.
The current schema is version 3 and migrates older partial saves while preserving nested settings, collections, teams, and milestone progress.
Clearing browser site data resets progress.

## Deployment

The project builds to a static `dist/` directory and includes Vercel configuration for asset caching.
The production project is linked as `navaneethbv/tower-defense`.

```bash
vercel --prod
```

## Repository quality controls

GitHub Actions runs lint, 95 percent coverage-gated tests, and a production build on every push and pull request.
The workflow also uploads the coverage report and passes it to SonarQube Cloud when the `SONAR_TOKEN` repository secret is configured.
The SonarQube Cloud project uses the key `navaneethbv_Tower-Defense` and the organization `navaneethbv`.
Until that project and secret are created in SonarQube Cloud, the Sonar job reports the missing setup in its job summary and remains non-blocking.
Dependabot checks npm and GitHub Actions dependencies weekly, and `CODEOWNERS` assigns repository-wide ownership to `@navaneethbv`.
The protected `main` branch requires pull requests, green Lint, Test, and Build checks, resolved conversations, and linear history.

## Fan project notice

This is a free, non-commercial fan project created for educational and entertainment purposes.
Pokemon and all related names, characters, artwork, and trademarks are owned by Nintendo, The Pokemon Company, Game Freak, and their respective rights holders.
This project is not affiliated with, endorsed by, sponsored by, or approved by those rights holders.
Do not monetize or sell this project or its included Pokemon assets.

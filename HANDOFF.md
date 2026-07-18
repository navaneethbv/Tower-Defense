# Pokémon Tower Defense Rebuild: Handoff

Continuation notes for the Vite + TypeScript rebuild.
Plan file: `/Users/navaneethbv/.claude/plans/let-us-work-on-lazy-squirrel.md`.
Do NOT commit unless the user asks. Old `web/` prototype is kept as a porting reference until Phase 7.

## How to run / verify

- Dev: `npm run dev` (http://localhost:5173).
- Tests: `npm test` (vitest). Typecheck: `npx tsc --noEmit`. Build: `npm run build`.
- Balance harness: `npx vitest run tests/balance.test.ts` (prints a `BALANCE ...` line).

## Status

Done and verified: Phase 0 (scaffold, 151 PokeAPI sprites in `public/sprites/`), Phase 1 (engine), Phase 2 (procedural 50-wave generator + 4 maps + bosses), Phase 3 (save/starter/home/loadout/payout), and the balance rework (power-law HP, capped gold upgrades, grind economy). 27 tests pass.

Balance model (see the `balance-finding` memory): a lone starter fails ~wave 7; the run extends monotonically with team size and levels. Knobs: power-law `waveHpMultiplier` in `src/waves/scaling.ts` (`hpGrowth` is the exponent, ~1.12-1.17 per map), `GameSession.MAX_GOLD_LEVELS = 4`, `STARTING_GOLD = 360`, `RANGE_SCALE = 0.78` in `src/data/constants.ts`, boss HP 4.5x in `src/waves/generator.ts`.

## Phase 4 (IN PROGRESS) — eggs, IVs, shop, collection, milestone drops, slot unlocks

Built and wired, NOT yet verified in browser and NO tests yet:
- `src/meta/eggs.ts` — `ROLL_TABLE`, `rollHatch`, `buyEgg`, `hatchEgg`, `claimMilestoneDrops` (milestones 10/20/30/40/50, once per map via `save.eggDropsClaimedByMap`).
- `src/data/species.ts` — added `isBaseSpecies`, `baseSpeciesByRarity` (only base stages hatch).
- `src/ui/screens/shopScreen.ts`, `src/ui/screens/collectionScreen.ts`, `src/ui/components.ts` (`ivBarsHtml`, `rarityColor`).
- `src/main.ts` — shop/collection nav now route to the real screens (edit already applied).

### Remaining to finish Phase 4
1. **Wire milestone drops into `main.ts`**: after `applyRunResult(...)`, if it returned `newBest`, call `claimMilestoneDrops(save, map, result.wavesCleared)` before `saveSave`. (Not yet added — the run-result block in `main.ts` still only applies coins + XP.)
2. **Add CSS** to `src/styles.css` for the new classes: `.egg-grid`, `.egg-card` (+`.small`), `.egg-emoji`, `.egg-inventory`, `.home-top-right`, `.reveal`, `.reveal-card`, `.box-card`, and the IV bar classes `.iv-bars`, `.iv-row`, `.iv-label`, `.iv-track`, `.iv-fill`, `.iv-val`. None of these exist yet — screens will render unstyled until added.
3. **Slot unlocks are already implemented and tested** (`src/meta/progression.ts`, `unlockedSlots`); loadout already caps team by it. Just confirm the home hint shows after unlocks.
4. **Tests** (`tests/eggs.test.ts`): roll-distribution sanity over ~10k `rollHatch` calls per egg rarity, IV bounds 0..15, `claimMilestoneDrops` idempotency (calling twice grants nothing the second time), `buyEgg` deducts coins / rejects when broke.
5. **Browser verify**: buy an egg in the shop, hatch it in the collection (reveal shows species + IV bars), confirm it appears in loadout, run a map to a milestone and confirm an egg is granted once.

## Phase 5 — full 151 species + abilities + statuses

- `src/data/species.ts` currently has ~18 species (starter lines + Pidgey/Geodude lines). Fill all 151 via ~10 role stat templates + per-species overrides; the existing kits are the tuned exemplars. Only ~25 final stages/legendaries get abilities. Add legendary base species (Articuno/Zapdos/Moltres/Mewtwo/Mew) so the legendary egg pool is non-empty (currently empty → `pickTier` falls back).
- `src/engine/abilities.ts` does NOT exist yet — active abilities (`SpeciesDef.ability`) are defined in data but not executed by the engine. Add the ability system (solar_beam/inferno/surf/etc.) and an ability button in the HUD.
- `src/engine/status.ts` exists and works (slow/poison/burn/stun/armorBreak/curse); `onHitStatus` is applied in `game.ts`. Expand enemy archetypes in `src/data/enemies.ts` (currently ~14).
- Add dataset invariant tests: every dex 1-151 present once, every evolution edge resolves, every rarity pool non-empty, every sprite file exists.
- After Phase 5, re-run the balance sim with a legendary/ability team; if it still can't clear 50, soften the late curve or buff abilities (see `balance-finding` memory).

## Phase 6 — polish

Auto-wave toggle (idle farming), SFX + mute (save has `settings.muted`), more particles/juice, achievements. Final balance pass per-map using the sim harness.

## Phase 7 — ship

Delete `web/`, tidy `tools/` (keep sprite scripts), rewrite `README.md` with new run instructions + a fan-project / non-affiliation notice (Nintendo IP — never monetize). Deploy to Vercel (static Vite build; `vercel.json` already has the sprite cache header). Verify a full playthrough on a fresh profile on the prod URL.

## Architecture reminders

Layering: `data` imports nothing; `engine`/`waves`/`meta` import only `data`; `ui` bridges everything; engine never touches `localStorage`. Save key `ptd.save`, versioned, `migrate()` in `src/meta/save.ts`.
